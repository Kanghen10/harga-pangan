// tariftol.js — final (fetch CSV publik, parse aman, preload + cache)
const SOURCE_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMTel_ab26ik6uA9qqg1qbU1OQ0AWsgorhjrgvLONrSNDTJaZC3v13b26Nm25Wg/pub?gid=560628054&single=true&output=csv";
const CACHE_KEY = "tariftol_cache_v1";
let tolData = [];

/* -------------------------
   util: parse CSV robust (handles quoted commas)
   returns array of rows (each row is array of fields)
   -------------------------*/
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' ) {
      // handle double quote escape
      if (inQuotes && text[i+1] === '"') {
        cur += '"'; i++; continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // handle CRLF
      if (ch === '\r' && text[i+1] === '\n') { /* skip, handled by \n next */ }
      row.push(cur);
      cur = '';
      // only push non-empty row if not a trailing empty line
      // but keep rows so we maintain indices
      rows.push(row);
      row = [];
      // skip following \n in CRLF
      continue;
    }
    cur += ch;
  }
  // leftover
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

/* -------------------------
   util: toNumber from Indonesian formatted strings
   input examples: "Rp 7,500", "7,500", "7500", "12.000" etc.
   return Number (or NaN if not possible)
   -------------------------*/
function toNumber(s){
  if (s === null || s === undefined) return NaN;
  // keep digits only
  const digits = String(s).replace(/[^0-9\-]/g, '');
  if (digits === '') return NaN;
  return Number(digits);
}

/* -------------------------
   Build structured data from CSV rows
   We try to detect header mapping; fallback to earlier index mapping.
   -------------------------*/
function buildDataFromRows(rows){
  if (!rows || rows.length === 0) return [];

  // find header row by detection
  let headerIndex = 0;
  let header = rows[0].map(c => (c||'').toString().toLowerCase());
  const headerKeywords = ["tol","ruas","panjang","tarif","asal","tujuan","sistem"];
  let foundHeader = header.some(h => headerKeywords.some(k => h.includes(k)));
  if (!foundHeader) {
    // search first 6 rows for header
    for (let i=0;i<6 && i<rows.length;i++){
      const r = rows[i].map(c => (c||'').toString().toLowerCase());
      if (r.some(h => headerKeywords.some(k => h.includes(k)))) { headerIndex = i; header = r; foundHeader=true; break; }
    }
  } else {
    headerIndex = 0;
  }

  // build mapping if header detected
  const map = {};
  if (foundHeader){
    header.forEach((h, idx) => {
      if (/tol|trans/i.test(h)) map.trans = idx;
      if (/ruas/i.test(h)) map.ruas = idx;
      if (/panjang|length|km/i.test(h)) map.panjang = idx;
      if (/asal/i.test(h)) map.asal = idx;
      if (/tujuan|tuju/i.test(h)) map.tujuan = idx;
      if (/gol.*i|gol i|golongan i|tarif.*i/i.test(h)) map.gol1 = idx;
      if (/gol.*ii|gol.*iii|gol ii|gol iii|tarif.*ii/i.test(h)) {
        // try to match, but we'll fallback below
        if (!map.gol23) map.gol23 = idx;
      }
      if (/tarif.*iv|gol.*iv|gol iv|gol v/i.test(h)) map.gol45 = idx;
      if (/sistem|transaksi/i.test(h)) map.sistem = idx;
      if (/atl/i.test(h)) map.atl = idx;
      if (/per.km|per km|\/km|per kilometer/i.test(h)) map.perkm = idx;
      // sometimes Asal-Tujuan in one column:
      if (/asal.*-.*tujuan|asal.*tujuan|asal.*tuju|rute/i.test(h)) map.asalTujuan = idx;
      if (/tarif.*|harga/i.test(h) && !map.gol1) map.anyTarif = idx;
    });
  }

  // fallback indices (based on earlier assumptions)
  const fallback = {
    trans: 1,
    ruas: 1,
    panjang: 2,
    asalTujuan: 5,
    gol1: 6,
    gol23: 7,
    gol45: 8,
    sistem: 9,
  };

  // merge map with fallback: use map if present else fallback
  const idx = {
    trans: (map.trans !== undefined) ? map.trans : fallback.trans,
    ruas: (map.ruas !== undefined) ? map.ruas : fallback.ruas,
    panjang: (map.panjang !== undefined) ? map.panjang : fallback.panjang,
    asal: (map.asal !== undefined) ? map.asal : undefined,
    tujuan: (map.tujuan !== undefined) ? map.tujuan : undefined,
    asalTujuan: (map.asalTujuan !== undefined) ? map.asalTujuan : fallback.asalTujuan,
    gol1: (map.gol1 !== undefined) ? map.gol1 : fallback.gol1,
    gol23: (map.gol23 !== undefined) ? map.gol23 : fallback.gol23,
    gol45: (map.gol45 !== undefined) ? map.gol45 : fallback.gol45,
    sistem: (map.sistem !== undefined) ? map.sistem : fallback.sistem,
    atl: (map.atl !== undefined) ? map.atl : undefined,
    perkm: (map.perkm !== undefined) ? map.perkm : undefined,
    anyTarif: (map.anyTarif !== undefined) ? map.anyTarif : undefined
  };

  const out = [];
  for (let i = headerIndex + 1; i < rows.length; i++){
    const r = rows[i];
    if (!r || r.length === 0) continue;

    // find a representative 'trans' or 'ruas' value
    const trans = (r[idx.trans] || r[idx.ruas] || "").toString().trim();
    const ruas = (r[idx.ruas] || r[idx.trans] || "").toString().trim();
    const panjangRaw = (r[idx.panjang] || "").toString().trim();
    const panjang = isNaN(Number(panjangRaw)) ? toNumber(panjangRaw) : Number(panjangRaw);

    // Asal & Tujuan: prefer separate columns, otherwise parse combined column
    let asal = (idx.asal !== undefined && r[idx.asal]) ? r[idx.asal].toString().trim() : "";
    let tujuan = (idx.tujuan !== undefined && r[idx.tujuan]) ? r[idx.tujuan].toString().trim() : "";
    if ((!asal || !tujuan) && idx.asalTujuan !== undefined) {
      const at = (r[idx.asalTujuan] || "").toString().trim();
      if (at.includes("-")) {
        let parts = at.split("-");
        if (parts.length >= 2) {
          asal = asal || parts[0].trim();
          tujuan = tujuan || parts.slice(1).join("-").trim();
        }
      } else if (at.includes("–")) { // en dash
        let parts = at.split("–");
        if (parts.length >= 2) { asal = asal || parts[0].trim(); tujuan = tujuan || parts[1].trim(); }
      } else {
        // if it's single string like "Jakarta — Ciawi", we still try
        const parts = at.split(/\s+to\s+|→|—|–/i);
        if (parts.length >= 2) { asal = asal || parts[0].trim(); tujuan = tujuan || parts[1].trim(); }
      }
    }

    // tarif fields: try explicit columns; fallback to 'anyTarif' if necessary
    const gol1 = toNumber(r[idx.gol1] || r[idx.anyTarif] || "");
    const gol23 = toNumber(r[idx.gol23] || "");
    const gol45 = toNumber(r[idx.gol45] || "");
    const sistem = (r[idx.sistem] || "").toString().trim();
    const atl = (idx.atl !== undefined && r[idx.atl]) ? r[idx.atl].toString().trim() : "";
    let perkm = "";
    if (idx.perkm !== undefined && r[idx.perkm]) perkm = r[idx.perkm].toString().trim();
    else if (gol1 && panjang) perkm = Math.round(gol1 / (Number(panjang) || 1));

    // normalize: ignore rows without asal or tujuan or without gol1
    if ((!asal || !tujuan) && !trans && !ruas) continue;
    if (!gol1 && !gol23 && !gol45) {
      // skip rows that don't look like tarif rows
      continue;
    }

    out.push({
      trans: trans || ruas || "",
      ruas: ruas || trans || "",
      panjang: (isNaN(panjang) ? "" : Number(panjang)),
      asal: asal || "",
      tujuan: tujuan || "",
      gol1: isNaN(gol1) ? 0 : gol1,
      gol23: isNaN(gol23) ? 0 : gol23,
      gol45: isNaN(gol45) ? 0 : gol45,
      sistem: sistem || "",
      atl: atl || "",
      perkm: perkm || ""
    });
  }

  return out;
}

/* -------------------------
   load CSV (with cache) and populate tolData
   Preload: use localStorage if exists, but always try network update
   -------------------------*/
async function loadAndPrepare(){
  // try load from cache first for instant UI
  const cache = localStorage.getItem(CACHE_KEY);
  if (cache) {
    try {
      tolData = JSON.parse(cache);
      fillInitialPlaceholders();
      populateTolTrans();
      console.log("Loaded data from cache");
    } catch(e) {
      console.warn("Cache parse error", e);
    }
  } else {
    fillInitialPlaceholders();
  }

  // fetch CSV from Google Sheets
  try {
    const r = await fetch(SOURCE_CSV, {cache: "no-store"});
    if (!r.ok) throw new Error("Fetch failed "+r.status);
    const text = await r.text();
    const rows = parseCSV(text);
    const built = buildDataFromRows(rows);
    if (built && built.length>0) {
      tolData = built;
      localStorage.setItem(CACHE_KEY, JSON.stringify(tolData));
      populateTolTrans();
      console.log("Data updated from network. Records:", tolData.length);
    } else {
      console.warn("Parsed data empty");
    }
  } catch (err) {
    console.warn("Tidak dapat memuat data dari jaringan:", err);
  }
}

/* -------------------------
   UI helpers: fill placeholders while loading
   -------------------------*/
function fillInitialPlaceholders(){
  const ids = ["toltrans","ruas","asal","tujuan"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "<option value=''>— memuat —</option>";
  });
}

/* -------------------------
   Populate TOL TRANS dropdown (unique)
   -------------------------*/
function populateTolTrans(){
  const sel = document.getElementById("toltrans");
  if (!sel) return;
  const list = [...new Set(tolData.map(x => (x.trans||"").trim()).filter(Boolean))].sort();
  sel.innerHTML = "<option value=''>Pilih Tol Trans</option>" + list.map(v => `<option value="${escapeHtml(v)}">${v}</option>`).join("");
  // reset dependent selects
  document.getElementById("ruas").innerHTML = "<option value=''>Pilih Ruas</option>";
  document.getElementById("asal").innerHTML = "<option value=''>Pilih Asal</option>";
  document.getElementById("tujuan").innerHTML = "<option value=''>Pilih Tujuan</option>";
}

/* -------------------------
   escapeHtml small util
   -------------------------*/
function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
}

/* -------------------------
   Hook events to cascade dropdowns
   -------------------------*/
function hookDropdowns(){
  const selTrans = document.getElementById("toltrans");
  const selRuas = document.getElementById("ruas");
  const selAsal = document.getElementById("asal");
  const selTujuan = document.getElementById("tujuan");
  const btn = document.getElementById("cekBtn");

  selTrans.addEventListener("change", () => {
    const v = selTrans.value;
    selRuas.innerHTML = "<option value=''>Pilih Ruas</option>";
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!v) return;
    const list = [...new Set(tolData.filter(x => x.trans===v).map(x => x.ruas).filter(Boolean))].sort();
    selRuas.innerHTML = "<option value=''>Pilih Ruas</option>" + list.map(r => `<option value="${escapeHtml(r)}">${r}</option>`).join("");
  });

  selRuas.addEventListener("change", () => {
    const v = selRuas.value;
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!v) return;
    const list = [...new Set(tolData.filter(x => x.ruas===v).map(x => x.asal).filter(Boolean))].sort();
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>" + list.map(a => `<option value="${escapeHtml(a)}">${a}</option>`).join("");
  });

  selAsal.addEventListener("change", () => {
    const v = selAsal.value;
    const ru = selRuas.value;
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!v) return;
    const list = [...new Set(tolData.filter(x => x.asal===v && (ru?x.ruas===ru:true)).map(x => x.tujuan).filter(Boolean))].sort();
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>" + list.map(t => `<option value="${escapeHtml(t)}">${t}</option>`).join("");
  });

  btn.addEventListener("click", showResult);
}

/* -------------------------
   showResult: render data in #output
   -------------------------*/
function showResult(){
  const t = document.getElementById("toltrans").value;
  const r = document.getElementById("ruas").value;
  const a = document.getElementById("asal").value;
  const u = document.getElementById("tujuan").value;
  const out = document.getElementById("output");
  if (!t || !r || !a || !u) {
    out.style.display = "block";
    out.innerHTML = "<div class='row'><div class='label'>Pesan</div><div class='value'>Lengkapi semua pilihan terlebih dahulu.</div></div>";
    return;
  }

  const item = tolData.find(x => x.trans===t && x.ruas===r && x.asal===a && x.tujuan===u);
  if (!item) {
    out.style.display = "block";
    out.innerHTML = "<div class='row'><div class='label'>Pesan</div><div class='value'>Data tidak ditemukan untuk kombinasi ini.</div></div>";
    return;
  }

  // compute perkm if numeric
  let perkm = item.perkm;
  if (!perkm && item.gol1 && item.panjang) {
    perkm = Math.round(item.gol1 / (Number(item.panjang) || 1));
  }
  // ATL: if provided keep, else estimate as gol1*1.05 (rounded)
  let atl = item.atl;
  if (!atl && item.gol1) {
    atl = Math.round(item.gol1 * 1.05);
  }

  out.style.display = "block";
  out.innerHTML = `
    <div class="row"><div class="label">Rute</div><div class="value">${escapeHtml(item.asal)} → ${escapeHtml(item.tujuan)}</div></div>
    <div class="row"><div class="label">Ruas</div><div class="value">${escapeHtml(item.ruas)}</div></div>
    <div class="row"><div class="label">Panjang Jalan Tol</div><div class="value">${item.panjang? item.panjang + ' km' : '-'}</div></div>
    <div class="row"><div class="label">Tarif - Gol I</div><div class="value">Rp ${Number(item.gol1).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif - Gol II & III</div><div class="value">Rp ${Number(item.gol23).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif - Gol IV & V</div><div class="value">Rp ${Number(item.gol45).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Sistem Transaksi</div><div class="value">${escapeHtml(item.sistem || '-')}</div></div>
    <div class="row"><div class="label">ATL (estimasi)</div><div class="value">${atl ? 'Rp ' + Number(toNumber(atl)).toLocaleString('id-ID') : '-'}</div></div>
    <div class="row"><div class="label">Tarif per Kilometer</div><div class="value">${perkm ? 'Rp ' + Number(perkm).toLocaleString('id-ID') : '-'}</div></div>
  `;
}

/* -------------------------
   init on load
   -------------------------*/
document.addEventListener("DOMContentLoaded", async () => {
  await loadAndPrepare();
  hookDropdowns();
});
