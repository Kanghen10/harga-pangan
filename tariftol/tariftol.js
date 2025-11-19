let tolData = [];

// Load data from static JSON file
async function loadTolData() {
  try {
    const res = await fetch("tariftol.json", { cache: "no-store" });
    tolData = await res.json();
    initDropdown();
  } catch (err) {
    console.error("Gagal memuat data tol:", err);
  }
}

function initDropdown() {
  const trans = document.getElementById("trans");
  const ruas = document.getElementById("ruas");
  const asal = document.getElementById("asal");
  const tujuan = document.getElementById("tujuan");

  // Reset dropdown
  trans.innerHTML = `<option value="">Pilih Tol Trans</option>`;
  ruas.innerHTML = `<option value="">Pilih Ruas</option>`;
  asal.innerHTML = `<option value="">Pilih Asal</option>`;
  tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

  // Dropdown 1 — Tol Trans
  const transList = [...new Set(tolData.map(d => d.trans))];
  transList.forEach(t => trans.innerHTML += `<option value="${t}">${t}</option>`);

  // Dropdown 2 — Ruas
  trans.onchange = () => {
    ruas.innerHTML = `<option value="">Pilih Ruas</option>`;
    asal.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listRuas = tolData
      .filter(d => d.trans.toLowerCase() === trans.value.toLowerCase())
      .map(d => d.ruas);

    [...new Set(listRuas)].forEach(r =>
      ruas.innerHTML += `<option value="${r}">${r}</option>`
    );
  };

  // Dropdown 3 — Asal
  ruas.onchange = () => {
    asal.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listAsal = tolData
      .filter(d => d.ruas.toLowerCase() === ruas.value.toLowerCase())
      .map(d => d.asal);

    [...new Set(listAsal)].forEach(a =>
      asal.innerHTML += `<option value="${a}">${a}</option>`
    );
  };

  // Dropdown 4 — Tujuan
  asal.onchange = () => {
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listTujuan = tolData
      .filter(d => d.asal.toLowerCase() === asal.value.toLowerCase())
      .map(d => d.tujuan);

    [...new Set(listTujuan)].forEach(t =>
      tujuan.innerHTML += `<option value="${t}">${t}</option>`
    );
  };
}

// Button action
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

  const d = tolData.find(x =>
    x.trans.toLowerCase() === trans.toLowerCase() &&
    x.ruas.toLowerCase() === ruas.toLowerCase() &&
    x.asal.toLowerCase() === asal.toLowerCase() &&
    x.tujuan.toLowerCase() === tujuan.toLowerCase()
  );

  if (!d) {
    out.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
    return;
  }

  out.style.display = "block";
  out.innerHTML = `
    <div class="result-card">
      <h3>Hasil Tarif Tol</h3>

      <p><b>Rute:</b> ${d.asal} → ${d.tujuan}</p>
      <p><b>Ruas:</b> ${d.ruas}</p>
      <p><b>Panjang:</b> ${d.panjang} km</p>

      <p><b>SK Tarif Terakhir:</b> ${d["SK Tarif Terakhir"] || "-"}</p>
      <p><b>Tanggal SK Terakhir:</b> ${d["Tanggal SK Terakhir"] || "-"}</p>

      <p><b>Tarif Gol I:</b> Rp ${d.gol1}</p>
      <p><b>Tarif Gol II–III:</b> Rp ${d.gol23}</p>
      <p><b>Tarif Gol IV–V:</b> Rp ${d.gol45}</p>

      <p><b>Sistem Transaksi:</b> ${d.sistem}</p>
      <p><b>ATL:</b> ${d.atl}</p>
    </div>

    <!-- Keterangan Golongan -->
    <div class="info-card">
      <b>Keterangan Golongan Kendaraan:</b><br>
      • <b>Golongan I</b> – Sedan, jip, pick-up/truk kecil, bus.<br>
      • <b>Golongan II</b> – Truk besar 2 gandar.<br>
      • <b>Golongan III</b> – Truk besar 3 gandar.<br>
      • <b>Golongan IV</b> – Truk besar 4 gandar.<br>
      • <b>Golongan V</b> – Truk besar 5 gandar.<br>
      • <b>Golongan VI</b> – Kendaraan roda dua (khusus beberapa ruas, contoh: Tol Bali Mandara).
    </div>

    <!-- Keterangan Sistem Tol -->
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

loadTolData();
