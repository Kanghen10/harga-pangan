let tolData = [];

// Load data
async function loadTolData() {
  try {
    const res = await fetch("tariftol.json", { cache: "no-store" });
    tolData = await res.json();
    if (!Array.isArray(tolData)) tolData = [];
    initDropdown();
  } catch (err) {
    console.error("Gagal memuat:", err);
    const out = document.getElementById("output");
    if (out) {
      out.style.display = "block";
      out.innerHTML = `<p style="color:red">Gagal memuat data tarif.</p>`;
    }
  }
}

function initDropdown() {
  const transEl = document.getElementById("toltrans");
  const ruasEl = document.getElementById("ruas");
  const asalEl = document.getElementById("asal");
  const tujuanEl = document.getElementById("tujuan");

  transEl.innerHTML = `<option value="">Pilih Tol Trans</option>`;
  ruasEl.innerHTML = `<option value="">Pilih Ruas</option>`;
  asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
  tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;

  // Dropdown TOL TRANS
  const transList = [...new Set(tolData.map(d => d.trans || "").filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "id"));

  transList.forEach(t => transEl.innerHTML += `<option value="${t}">${t}</option>`);

  // RUAS
  transEl.onchange = () => {
    const v = transEl.value;
    ruasEl.innerHTML = `<option value="">Pilih Ruas</option>`;
    asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;

    if (!v) return;

    const list = tolData
      .filter(d => (d.trans || "").toLowerCase() === v.toLowerCase())
      .map(d => d.ruas);

    [...new Set(list)]
      .sort((a, b) => a.localeCompare(b, "id"))
      .forEach(r => ruasEl.innerHTML += `<option value="${r}">${r}</option>`);
  };

  // ASAL
  ruasEl.onchange = () => {
    const v = ruasEl.value;
    asalEl.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;
    if (!v) return;

    const list = tolData
      .filter(d => (d.ruas || "").toLowerCase() === v.toLowerCase())
      .map(d => d.asal);

    [...new Set(list)]
      .sort((a, b) => a.localeCompare(b, "id"))
      .forEach(a => asalEl.innerHTML += `<option value="${a}">${a}</option>`);
  };

  // TUJUAN
  asalEl.onchange = () => {
    const v = asalEl.value;
    const ruas = ruasEl.value;
    tujuanEl.innerHTML = `<option value="">Pilih Tujuan</option>`;
    if (!v) return;

    const list = tolData
      .filter(
        d =>
          (d.asal || "").toLowerCase() === v.toLowerCase() &&
          (!ruas || (d.ruas || "").toLowerCase() === ruas.toLowerCase())
      )
      .map(d => d.tujuan);

    [...new Set(list)]
      .sort((a, b) => a.localeCompare(b, "id"))
      .forEach(t => tujuanEl.innerHTML += `<option value="${t}">${t}</option>`);
  };
}

// ==== CEK TARIF ====
function cekTarif() {
  const trans = document.getElementById("toltrans").value;
  const ruas = document.getElementById("ruas").value;
  const asal = document.getElementById("asal").value;
  const tujuan = document.getElementById("tujuan").value;

  const out = document.getElementById("output");

  if (!trans || !ruas || !asal || !tujuan) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Lengkapi semua pilihan.</p>";
    return;
  }

  const d = tolData.find(
    x =>
      x.trans.toLowerCase() === trans.toLowerCase() &&
      x.ruas.toLowerCase() === ruas.toLowerCase() &&
      x.asal.toLowerCase() === asal.toLowerCase() &&
      x.tujuan.toLowerCase() === tujuan.toLowerCase()
  );

  if (!d) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
    return;
  }

  out.style.display = "block";

  // ==== HASIL TAMPILAN BARU ====

out.innerHTML = `
    <div class="result-card" style="
      background:#ffffff;
      padding:20px;
      border-radius:14px;
      box-shadow:0 4px 14px rgba(0,0,0,0.08);
      margin-bottom:28px;
    ">
      <h3 style="margin:0 0 12px 0; font-size:20px; font-weight:600; color:#003f7f;">
        Hasil Tarif Tol
      </h3>

      <p><b>Rute:</b> ${d.asal} → ${d.tujuan}</p>
      <p><b>Ruas:</b> ${d.ruas}</p>
      <p><b>Panjang:</b> ${d.panjang} km</p>

      <p><b>SK Tarif Terakhir:</b> ${d["SK Tarif Terakhir"] || "-"}</p>
      <p><b>Tanggal SK Terakhir:</b> ${d["Tanggal SK Terakhir"] || "-"}</p>

      <!-- CARD KHUSUS TARIF GOLONGAN -->
      <div style="
        background:#eef5ff;
        border-left:6px solid #3b7ddd;
        padding:16px;
        border-radius:12px;
        margin:16px 0;
        box-shadow:0 2px 8px rgba(0,0,0,0.06);
      ">
        <p style="margin:0 0 6px 0; font-size:18px; font-weight:600; color:#003e7f;">
          Tarif Berdasarkan Golongan
        </p>

        <p style="font-size:17px; margin:4px 0;">
          <b>Gol I:</b> <span style="color:#0a2c5f;">Rp ${d.gol1}</span>
        </p>

        <p style="font-size:17px; margin:4px 0;">
          <b>Gol II–III:</b> <span style="color:#0a2c5f;">Rp ${d.gol23}</span>
        </p>

        <p style="font-size:17px; margin:4px 0;">
          <b>Gol IV–V:</b> <span style="color:#0a2c5f;">Rp ${d.gol45}</span>
        </p>
      </div>

      <p><b>Sistem Transaksi:</b> ${d.sistem}</p>
      <p><b>Tarif per Km:</b> ${d.perkm || "-"}</p>
      <p><b>ATL:</b> ${d.atl || "-"}</p>
    </div>

    <div class="info-card" style="
      background:#f7f9fc;
      padding:16px;
      border-radius:12px;
      font-size:13px;
      line-height:1.45;
      margin-bottom:22px;
      color:#444;
    ">
      <b style="font-weight:600; font-size:14px;">Keterangan Golongan Kendaraan:</b><br><br>
      • Golongan I – Sedan, jip, pick-up/truk kecil, bus.<br>
      • Golongan II – Truk besar 2 gandar.<br>
      • Golongan III – Truk besar 3 gandar.<br>
      • Golongan IV – Truk besar 4 gandar.<br>
      • Golongan V – Truk besar 5 gandar.<br>
      • Golongan VI – Kendaraan roda dua (khusus beberapa ruas).
    </div>

    <div class="info-card" style="
      background:#f7f9fc;
      padding:16px;
      border-radius:12px;
      font-size:13px;
      line-height:1.45;
      color:#444;
    ">
      <b style="font-weight:600; font-size:14px;">Sistem Tol Terbuka & Tertutup:</b><br><br>

      <b>Sistem Terbuka:</b><br>
      Tarif tetap di pintu masuk/keluar (1x transaksi).<br>
      <i>Contoh: Tol Dalam Kota Jakarta.</i><br><br>

      <b>Sistem Tertutup:</b><br>
      Tarif berdasarkan jarak — tap-in & tap-out.<br>
      <i>Contoh: Tol Trans Jawa (Jakarta–Cikampek, Cipali).</i>
    </div>
  `;

}

loadTolData();
