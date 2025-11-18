// tariftol.js — versi final, deteksi kolom otomatis + fallback ke tariftol.json jika tersedia
const CSV_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMTel_ab26ik6uA9qqg1qbU1OQ0AWsgorhjrgvLONrSNDTJaZC3v13b26Nm25Wg/pub?gid=560628054&single=true&output=csv";
const STATIC_JSON = "tariftol.json"; // jika kamu upload file statik, script akan pakai ini (lebih cepat)
let tolData = [];        // array of objects {trans,ruas,panjang,asal,tujuan,gol1,gol23,gol45,sistem,atl,perkm}
let debugMode = false;

// robust CSV parser (handles quoted fields and commas)
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') { cur += '"'; i++; continue; }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i+1] === '\n') { /* will be handled by \n */ }
      row.push(cur);
      cur = '';
      rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

// helper: remove whitespace, normalize dashes
function normalizeText(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/\u2013|\u2014/g, "-").trim();
}

// helper: numeric parsing Indonesian style "7,500" => 7500
function toNumber(s) {
  if (s === undefined || s === null) return NaN;
  const digits = String(s).replace(/[^0-9\-]/g, '');
  return digits === '' ? NaN : Number(digits);
}

// heuristics: detect which column is which
function detectColumns(rows) {
  // We'll inspect first 30 non-empty rows to gather stats per column
  const sampleRows = rows.slice(0, 80);
  const colCount = Math.max(...sampleRows.map(r => r.length));
  const stats = Array.from({length: colCount}, () => ({textCount:0, numCount:0, dashCount:0, avgLen:0, values:[]}));

  sampleRows.forEach(r => {
    for (let c=0;c<colCount;c++){
      const v = r[c] !== undefined ? r[c].trim() : "";
      const s = normalizeText(v);
      const isNum = /^[-]?[0-9\s\.,]+$/.test(s) && s.length <= 12; // likely numeric
      if (s.length > 0) stats[c].values.push(s);
      if (isNum) stats[c].numCount++;
      else if (s.length>0) stats[c].textCount++;
      if (s.includes("-")) stats[c].dashCount++;
      stats[c].avgLen += s.length;
    }
  });
  stats.forEach(s => { if (s.values.length>0) s.avgLen = Math.round(s.avgLen / s.values.length); });

  // score columns:
  // trans: column with many textual values and small unique set containing known groups
  const knownTrans = ["jabodetabek","trans jawa","non trans","sumatera","kalimantan","jatim","jateng","sulawesi","bali","java"];
  function scoreTrans(idx) {
    const vals = stats[idx].values.map(v=>v.toLowerCase());
    let score = stats[idx].textCount * 2 - stats[idx].numCount;
    // bonus if contains known
    knownTrans.forEach(k => { if (vals.some(v => v.includes(k))) score += 20; });
    // penalize if too long avgLen (ruas likely longer)
    if (stats[idx].avgLen > 30) score -= 5;
    return score;
  }

  // ruas: column likely to contain hyphens and longer text
  function scoreRuas(idx) {
    let score = stats[idx].dashCount * 5 + stats[idx].textCount - stats[idx].numCount;
    if (stats[idx].avgLen > 20) score += 3;
    return score;
  }

  // asal/tujuan: columns with many short text pieces (names) and not numeric
  function scorePlace(idx) {
    let score = stats[idx].textCount - stats[idx].numCount;
    if (stats[idx].avgLen <= 18) score += 2;
    return score;
  }

  // find best candidates
  let bestTrans = 0, bestRuas = 0, bestPlace1 = 0, bestPlace2 = 0;
  for (let c=0;c<colCount;c++){
    const sTrans = scoreTrans(c);
    if (sTrans > bestTrans) { bestTrans = sTrans; }
    const sRuas = scoreRuas(c);
    if (sRuas > bestRuas) { bestRuas = sRuas; }
  }

  // pick indices
  let transIdx = -1, ruasIdx = -1, asalIdx = -1, tujuanIdx = -1;
  // choose transIdx as argmax scoreTrans
  let maxT = -Infinity;
  for (let c=0;c<colCount;c++){ const sc = scoreTrans(c); if (sc > maxT) { maxT = sc; transIdx = c; } }
  // choose ruasIdx as argmax scoreRuas
  let maxR = -Infinity;
  for (let c=0;c<colCount;c++){ const sc = scoreRuas(c); if (sc > maxR) { maxR = sc; ruasIdx = c; } }
  // choose asal/tujuan: find a column with many dashCounts? else choose columns with high place score
  const placeScores = [];
  for (let c=0;c<colCount;c++) placeScores.push({c,score: scorePlace(c)});
  placeScores.sort((a,b)=>b.score-a.score);
  // pick top two that are not transIdx/ruasIdx
  for (let i=0;i<placeScores.length;i++){
    const c = placeScores[i].c;
    if (c===transIdx || c===ruasIdx) continue;
    if (asalIdx===-1) { asalIdx = c; continue; }
    if (tujuanIdx===-1) { tujuanIdx = c; break; }
  }

  // fallback heuristics:
  // Often Asal-Tujuan combined in one column (with dash). If so, prefer that for asal/tujuan extraction.
  let combinedAtIdx = -1;
  for (let c=0;c<colCount;c++){
    if (stats[c].dashCount > 0 && stats[c].textCount > stats[c].numCount) { combinedAtIdx = c; break; }
  }
  if (combinedAtIdx !== -1 && (asalIdx===-1 || tujuanIdx===-1)) {
    asalIdx = combinedAtIdx;
    tujuanIdx = combinedAtIdx;
  }

  // also detect tarif columns (gol1/gol23/gol45) by numeric-heavy columns with values like "7,500" or "Rp 7,500"
  const numericCols = [];
  for (let c=0;c<colCount;c++){
    numericCols.push({c, numCount: stats[c].numCount, textCount: stats[c].textCount});
  }
  numericCols.sort((a,b)=>b.numCount - a.numCount);
  // pick top numeric columns for gol1/gol23/gol45
  const golCandidates = numericCols.slice(0,4).map(x=>x.c);

  // return detection
  return {
    transIdx, ruasIdx, asalIdx, tujuanIdx, combinedAtIdx, golCandidates, stats
  };
}

// Build structured dataset from rows using detected mapping
function buildStructured(rows, mapInfo) {
  const out = [];
  const {transIdx, ruasIdx, asalIdx, tujuanIdx, combinedAtIdx, golCandidates} = mapInfo;
  // Start from row 0, but skip blank rows. We will accept rows that have at least one tariff numeric value.
  for (let i=0;i<rows.length;i++){
    const r = rows[i];
    if (!r || r.length === 0) continue;
    // normalize fields
    const trans = normalizeText(r[transIdx] || r[ruasIdx] || "");
    const ruas = normalizeText(r[ruasIdx] || r[transIdx] || "");
    const panjangRaw = (r.find((c, idx) => idx !== undefined && /km|km\)/i.test(String(c))) || "");
    let panjang = NaN;
    // try to find a column that looks like length (a small numeric with decimal)
    for (let j=0;j<r.length;j++){
      const s = (r[j]||"").replace(/\s/g,"");
      if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 0 && Number(s) < 1000) { panjang = Number(s); break; }
    }
    // Asal/Tujuan
    let asal = normalizeText(r[asalIdx] || "");
    let tujuan = normalizeText(r[tujuanIdx] || "");
    if (asal === "" && tujuan === "" && combinedAtIdx !== -1) {
      const at = normalizeText(r[combinedAtIdx] || "");
      if (at.includes("-")) {
        const parts = at.split("-");
        asal = parts[0].trim();
        tujuan = parts.slice(1).join("-").trim();
      } else if (at.includes("–") || at.includes("—")) {
        const parts = at.split(/–|—/);
        asal = parts[0].trim();
        tujuan = parts[1] ? parts[1].trim() : "";
      }
    }
    // try to identify gol1/gol23/gol45 values by scanning numeric-like columns in the row
    const nums = [];
    for (let j=0;j<r.length;j++){
      const v = r[j] || "";
      const n = toNumber(v);
      if (!isNaN(n) && n > 0 && n < 10000000) nums.push({idx:j,val:n,raw:v});
    }
    // heuristics assign:
    let gol1 = nums.length>=1 ? nums[0].val : 0;
    let gol23 = nums.length>=2 ? nums[1].val : 0;
    let gol45 = nums.length>=3 ? nums[2].val : 0;

    // system field try detect text 'Terbuka' or 'Tertutup' in row
    let sistem = "";
    for (let j=0;j<r.length;j++){
      const s = (r[j]||"").toString().toLowerCase();
      if (s.includes("terbuka") || s.includes("tertutup") || s.includes("zonasi")) { sistem = (r[j]||"").toString().trim(); break; }
    }

    // skip rows that don't have any tarif numbers
    if (gol1 === 0 && gol23 === 0 && gol45 === 0) continue;

    out.push({
      trans: trans || "",
      ruas: ruas || "",
      panjang: isNaN(panjang) ? "" : panjang,
      asal: asal || "",
      tujuan: tujuan || "",
      gol1: gol1 || 0,
      gol23: gol23 || 0,
      gol45: gol45 || 0,
      sistem: sistem || ""
    });
  }
  return out;
}

// UI population
function populateDropdowns(data) {
  const selTrans = document.getElementById("toltrans");
  const selRuas = document.getElementById("ruas");
  const selAsal = document.getElementById("asal");
  const selTujuan = document.getElementById("tujuan");

  // build sets
  const transSet = new Set();
  data.forEach(d => { if (d.trans) transSet.add(d.trans); });
  const transList = Array.from(transSet).sort();
  selTrans.innerHTML = "<option value=''>Pilih Tol Trans</option>" + transList.map(t => `<option value="${escapeHtml(t)}">${t}</option>`).join("");

  // hooks
  selTrans.addEventListener("change", () => {
    const t = selTrans.value;
    selRuas.innerHTML = "<option value=''>Pilih Ruas</option>";
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!t) return;
    const ruasList = Array.from(new Set(data.filter(x => x.trans === t).map(x => x.ruas))).sort();
    selRuas.innerHTML = "<option value=''>Pilih Ruas</option>" + ruasList.map(r => `<option value="${escapeHtml(r)}">${r}</option>`).join("");
  });

  selRuas.addEventListener("change", () => {
    const r = selRuas.value;
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!r) return;
    const asalList = Array.from(new Set(data.filter(x => x.ruas === r).map(x => x.asal))).sort();
    selAsal.innerHTML = "<option value=''>Pilih Asal</option>" + asalList.map(a => `<option value="${escapeHtml(a)}">${a}</option>`).join("");
  });

  selAsal.addEventListener("change", () => {
    const a = selAsal.value;
    const r = selRuas.value;
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>";
    if (!a) return;
    const tujuanList = Array.from(new Set(data.filter(x => x.asal === a && (r?x.ruas===r:true)).map(x => x.tujuan))).sort();
    selTujuan.innerHTML = "<option value=''>Pilih Tujuan</option>" + tujuanList.map(t => `<option value="${escapeHtml(t)}">${t}</option>`).join("");
  });

  document.getElementById("cekBtn").addEventListener("click", () => {
    showResult(data);
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
}

function showResult(data) {
  const t = document.getElementById("toltrans").value;
  const r = document.getElementById("ruas").value;
  const a = document.getElementById("asal").value;
  const u = document.getElementById("tujuan").value;
  const out = document.getElementById("output");
  if (!t || !r || !a || !u) {
    out.style.display = "block";
    out.innerHTML = `<div class="row"><div class="label">Pesan</div><div class="value">Lengkapi semua pilihan terlebih dahulu.</div></div>`;
    return;
  }
  const item = data.find(x => x.trans===t && x.ruas===r && x.asal===a && x.tujuan===u);
  if (!item) {
    out.style.display = "block";
    out.innerHTML = `<div class="row"><div class="label">Pesan</div><div class="value">Data tidak ditemukan untuk kombinasi ini.</div></div>`;
    return;
  }
  // compute perkm if possible
  let perkm = item.perkm || "";
  if ((!perkm || perkm==="") && item.gol1 && item.panjang) perkm = Math.round(item.gol1 / (Number(item.panjang) || 1));
  let atl = item.atl || "";
  if ((!atl || atl==="") && item.gol1) atl = Math.round(item.gol1 * 1.05);

  out.style.display = "block";
  out.innerHTML = `
    <div class="row"><div class="label">Rute</div><div class="value">${escapeHtml(item.asal)} → ${escapeHtml(item.tujuan)}</div></div>
    <div class="row"><div class="label">Ruas</div><div class="value">${escapeHtml(item.ruas)}</div></div>
    <div class="row"><div class="label">Panjang Jalan Tol</div><div class="value">${item.panjang ? item.panjang + ' km' : '-'}</div></div>
    <div class="row"><div class="label">Tarif - Gol I</div><div class="value">Rp ${Number(item.gol1).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif - Gol II & III</div><div class="value">Rp ${Number(item.gol23).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif - Gol IV & V</div><div class="value">Rp ${Number(item.gol45).toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Sistem Transaksi</div><div class="value">${escapeHtml(item.sistem || '-')}</div></div>
    <div class="row"><div class="label">ATL (estimasi)</div><div class="value">${atl ? 'Rp ' + Number(atl).toLocaleString('id-ID') : '-'}</div></div>
    <div class="row"><div class="label">Tarif per Kilometer</div><div class="value">${perkm ? 'Rp ' + Number(perkm).toLocaleString('id-ID') : '-'}</div></div>
  `;
}

// main loader: if tariftol.json exists, use it; else fetch CSV and auto-detect
async function load() {
  // first try static JSON (fast & recommended)
  try {
    const respJson = await fetch(STATIC_JSON, {cache:'no-store'});
    if (respJson.ok) {
      const jsonData = await respJson.json();
      if (Array.isArray(jsonData) && jsonData.length>0) {
        tolData = jsonData;
        populateDropdowns(tolData);
        return;
      }
    }
  } catch(e){
    // ignore, fallback to CSV
  }

  // fallback: fetch CSV and parse & detect
  try {
    const r = await fetch(CSV_SOURCE, {cache:'no-store'});
    if (!r.ok) throw new Error("CSV fetch failed: "+r.status);
    const txt = await r.text();
    const rows = parseCSV(txt).filter(r=> r && r.some(c => (c||"").toString().trim() !== ""));
    if (rows.length === 0) throw new Error("CSV parsed 0 rows");

    // detect columns
    const mapInfo = detectColumns(rows);
    // for debugging, show detection results
    const debugEl = document.getElementById("debug");
    if (debugEl) {
      debugEl.style.display = "none"; // keep hidden unless debugMode true
      if (debugMode) {
        debugEl.style.display = "block";
        debugEl.textContent = "Detect info:\n" + JSON.stringify({
          transIdx: mapInfo.transIdx,
          ruasIdx: mapInfo.ruasIdx,
          asalIdx: mapInfo.asalIdx,
          tujuanIdx: mapInfo.tujuanIdx,
          combinedAtIdx: mapInfo.combinedAtIdx,
          golCandidates: mapInfo.golCandidates
        }, null, 2) + "\n\nSample rows:\n" + rows.slice(0,15).map(r => JSON.stringify(r)).join("\n");
      }
    }

    const built = buildStructured(rows, mapInfo);
    if (built.length === 0) throw new Error("No tarif rows found after buildStructured");

    tolData = built;
    // cache basic processed data to localStorage for speed
    try { localStorage.setItem("tariftol_processed_v1", JSON.stringify(tolData)); } catch(e){}
    populateDropdowns(tolData);
  } catch (err) {
    console.error("Gagal memuat/parse data:", err);
    // show errors in debug panel
    const dbg = document.getElementById("debug");
    if (dbg) { dbg.style.display = "block"; dbg.textContent = "Error: " + String(err) + "\nCoba upload tariftol.json statik ke folder yang sama."; }
  }
}

// allow turning on debug via URL query ?debug=1
(function(){
  if (location.search.includes("debug=1")) debugMode = true;
})();

document.addEventListener("DOMContentLoaded", load);
