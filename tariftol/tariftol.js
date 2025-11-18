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
  const trans = document.getElementById("toltrans");
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
      .filter(d => d.trans === trans.value)
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
      .filter(d => d.ruas === ruas.value)
      .map(d => d.asal);

    [...new Set(listAsal)].forEach(a =>
      asal.innerHTML += `<option value="${a}">${a}</option>`
    );
  };

  // Dropdown 4 — Tujuan
  asal.onchange = () => {
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listTujuan = tolData
      .filter(d => d.asal === asal.value)
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
    x.trans === trans &&
    x.ruas === ruas &&
    x.asal === asal &&
    x.tujuan === tujuan
  );

  if (!d) {
    out.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
    return;
  }

  out.style.display = "block";
  out.innerHTML = `
    <h3>Hasil Tarif Tol</h3>
    <p><b>Rute:</b> ${d.asal} → ${d.tujuan}</p>
    <p><b>Ruas:</b> ${d.ruas}</p>
    <p><b>Panjang:</b> ${d.panjang} km</p>
    <p><b>Tarif Gol I:</b> Rp ${Number(d.gol1).toLocaleString()}</p>
    <p><b>Tarif Gol II–III:</b> Rp ${Number(d.gol23).toLocaleString()}</p>
    <p><b>Tarif Gol IV–V:</b> Rp ${Number(d.gol45).toLocaleString()}</p>
    <p><b>Sistem Transaksi:</b> ${d.sistem}</p>
    <p><b>ATL:</b> ${d.atl}</p>
  `;
}

loadTolData();
