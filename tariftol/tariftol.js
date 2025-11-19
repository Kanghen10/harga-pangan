let tolData = [];

// Load data from static JSON file
async function loadTolData() {
  try {
    const res = await fetch("tariftol.json", { cache: "no-store" });
    tolData = await res.json();
    // defensive: ensure tolData is array
    if (!Array.isArray(tolData)) tolData = [];
    initDropdown();
  } catch (err) {
    console.error("Gagal memuat data tol:", err);
    // show message in UI so user sees failure
    const out = document.getElementById("output");
    if (out) {
      out.style.display = "block";
      out.innerHTML = `<p style="color:red">Gagal memuat data tarif (cek tariftol.json). Console: ${String(err).replace(/</g,'&lt;')}</p>`;
    }
  }
}

function initDropdown() {
  // NOTE: ensure IDs match HTML: "toltrans", "ruas", "asal", "tujuan"
  const transEl = document.getElementById("toltrans");
  const ruasEl = document.getElementById("ruas");
  const asalEl = document.getElementById("asal");
  const tujuanEl = document.getElementById("tujuan");

  if (!transEl || !ruasEl || !asalEl || !tujuanEl) {
    console.error("Elemen dropdown tidak ditemukan. Pastikan id='toltrans','ruas','asal','tujuan' ada pada HTML.");
    return;
  }

  // Reset dropdown
  transEl.innerHTML = `<option value="">Pilih Tol Trans</option>`;
  ruasEl.innerHTML = `<option value="">Pilih Ruas</option>`;
  asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
  tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;

  // Dropdown 1 — Tol Trans (unique, preserve original capitalization)
  const transList = [...new Set(tolData.map(d => d.trans || "").filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  transList.forEach(t => transEl.innerHTML += `<option value="${t}">${t}</option>`);

  // Dropdown 2 — Ruas (case-insensitive matching)
  transEl.onchange = () => {
    const selTrans = transEl.value || "";
    ruasEl.innerHTML = `<option value="">Pilih Ruas</option>`;
    asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;

    if (!selTrans) return;

    const listRuas = tolData
      .filter(d => (d.trans || "").toString().toLowerCase() === selTrans.toLowerCase())
      .map(d => d.ruas || "");
    [...new Set(listRuas)].sort((a,b)=>a.localeCompare(b,'id')).forEach(r =>
      ruasEl.innerHTML += `<option value="${r}">${r}</option>`
    );
  };

  // Dropdown 3 — Asal
  ruasEl.onchange = () => {
    const selRuas = ruasEl.value || "";
    asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;
    if (!selRuas) return;

    const listAsal = tolData
      .filter(d => (d.ruas || "").toString().toLowerCase() === selRuas.toLowerCase())
      .map(d => d.asal || "");
    [...new Set(listAsal)].sort((a,b)=>a.localeCompare(b,'id')).forEach(a =>
      asalEl.innerHTML += `<option value="${a}">${a}</option>`
    );
  };

  // Dropdown 4 — Tujuan
  asalEl.onchange = () => {
    const selAsal = asalEl.value || "";
    const selRuas = ruasEl.value || "";
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;
    if (!selAsal) return;

    const listTujuan = tolData
      .filter(d => (d.asal || "").toString().toLowerCase() === selAsal.toLowerCase() &&
                   (!selRuas || (d.ruas||"").toString().toLowerCase() === selRuas.toLowerCase()))
      .map(d => d.tujuan || "");
    [...new Set(listTujuan)].sort((a,b)=>a.localeCompare(b,'id')).forEach(t =>
      tujuanEl.innerHTML += `<option value="${t}">${t}</option>`
    );
  };
}

// Button action (kept behavior; case-insensitive search)
function cekTarif() {
  const trans = document.getElementById("toltrans").value || "";
  const ruas = document.getElementById("ruas").value || "";
  const asal = document.getElementById("asal").value || "";
  const tujuan = document.getElementById("tujuan").value || "";

  const out = document.getElementById("output");
  if (!out) return;

  if (!trans || !ruas || !asal || !tujuan) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Lengkapi semua pilihan.</p>";
    return;
  }

  const d = tolData.find(x =>
    (x.trans || "").toString().toLowerCase() === trans.toLowerCase() &&
    (x.ruas || "").toString().toLowerCase() === ruas.toLowerCase() &&
    (x.asal || "").toString().toLowerCase() === asal.toLowerCase() &&
    (x.tujuan || "").toString().toLowerCase() === tujuan.toLowerCase()
  );

  if (!d) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
    return;
  }

  out.style.display = "block";
  out.innerHTML = `
    <div class="result-card">
      <h3>Hasil Tarif Tol</h3>

      <p><b>Rute:</b> ${escapeHtml(d.asal)} → ${escapeHtml(d.tujuan)}</p>
      <p><b>Ruas:</b> ${escapeHtml(d.ruas)}</p>
      <p><b>Panjang:</b> ${escapeHtml(d.panjang)} km</p>

      <p><b>SK Tarif Terakhir:</b> ${escapeHtml(d["SK Tarif Terakhir"] || "-")}</p>
      <p><b>Tanggal SK Terakhir:</b> ${escapeHtml(d["Tanggal SK Terakhir"] || "-")}</p>

      <p><b>Tarif Gol I:</b> Rp ${escapeHtml(String(d.gol1 || "-"))}</p>
      <p><b>Tarif Gol II–III:</b> Rp ${escapeHtml(String(d.gol23 || "-"))}</p>
      <p><b>Tarif Gol IV–V:</b> Rp ${escapeHtml(String(d.gol45 || "-"))}</p>

      <p><b>Sistem Transaksi:</b> ${escapeHtml(d.sistem || "-")}</p>
      <p><b>ATL:</b> ${escapeHtml(String(d.atl || "-"))}</p>
    </div>

    <div class="info-card">
      <b>Keterangan Golongan Kendaraan:</b><br>
      • <b>Golongan I</b> – Sedan, jip, pick-up/truk kecil, bus.<br>
      • <b>Golongan II</b> – Truk besar 2 gandar.<br>
      • <b>Golongan III</b> – Truk besar 3 gandar.<br>
      • <b>Golongan IV</b> – Truk besar 4 gandar.<br>
      • <b>Golongan V</b> – Truk besar 5 gandar.<br>
      • <b>Golongan VI</b> – Kendaraan roda dua (khusus beberapa ruas, contoh: Tol Bali Mandara).
    </div>

    <div class="info-card">
      <b>Sistem Tol Terbuka & Tertutup:</b><br><br>
      <b>Sistem Terbuka:</b><br>
      Pengguna membayar tarif tetap (merata) di pintu masuk/keluar tanpa memperhitungkan jarak.<br>
      Transaksi hanya sekali (tap-in atau tap-out saja).<br>
      <i>Contoh: beberapa ruas tol dalam kota Jakarta.</i><br><br>

      <b>Sistem Tertutup:</b><br>
      Tarif dihitung berdasarkan jarak dari gerbang masuk ke gerbang keluar.<br>
      Pengguna wajib tap-in saat masuk dan tap-out saat keluar.<br>
      <i>Contoh: Mayoritas Tol Trans Jawa (Jakarta–Cikampek, Cipali, dst).</i>
    </div>
  `;
}

// small helper to avoid XSS in output
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadTolData();
