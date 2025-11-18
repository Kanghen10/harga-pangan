let tolData = [];

// Preload data with cache
async function preloadData() {
  const cached = localStorage.getItem("tarifTolCache");

  if (cached) {
    tolData = JSON.parse(cached);
    initDropdown();
    console.log("Loaded from cache");
  }

  try {
    const res = await fetch("tariftol.json", { cache: "no-store" });
    const data = await res.json();
    tolData = data;
    localStorage.setItem("tarifTolCache", JSON.stringify(data));

    initDropdown();
    console.log("Updated from network");
  } catch (e) {
    console.warn("Tidak dapat memuat data terbaru");
  }
}

function initDropdown() {
  const trans = document.getElementById("toltrans");
  const ruas = document.getElementById("ruas");
  const asal = document.getElementById("asal");
  const tujuan = document.getElementById("tujuan");

  trans.innerHTML = `<option value="">Pilih Tol Trans</option>`;
  ruas.innerHTML = `<option value="">Pilih Ruas</option>`;
  asal.innerHTML = `<option value="">Pilih Asal</option>`;
  tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

  const transList = [...new Set(tolData.map(x => x.trans))];
  transList.forEach(x => trans.innerHTML += `<option value="${x}">${x}</option>`);

  trans.onchange = function () {
    ruas.innerHTML = `<option value="">Pilih Ruas</option>`;
    asal.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listRuas = [...new Set(tolData.filter(x => x.trans === this.value).map(x => x.ruas))];
    listRuas.forEach(r => ruas.innerHTML += `<option value="${r}">${r}</option>`);
  };

  ruas.onchange = function () {
    asal.innerHTML = `<option value="">Pilih Asal</option>`;
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listAsal = [...new Set(tolData.filter(x => x.ruas === this.value).map(x => x.asal))];
    listAsal.forEach(a => asal.innerHTML += `<option value="${a}">${a}</option>`);
  };

  asal.onchange = function () {
    tujuan.innerHTML = `<option value="">Pilih Tujuan</option>`;

    const listTujuan = [...new Set(tolData.filter(x => x.asal === this.value).map(x => x.tujuan))];
    listTujuan.forEach(t => tujuan.innerHTML += `<option value="${t}">${t}</option>`);
  };
}

function cekTarif() {
  const trans = document.getElementById("toltrans").value;
  const ruas = document.getElementById("ruas").value;
  const asal = document.getElementById("asal").value;
  const tujuan = document.getElementById("tujuan").value;

  const out = document.getElementById("output");

  if (!trans || !ruas || !asal || !tujuan) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Lengkapi semua pilihan terlebih dahulu.</p>";
    return;
  }

  const d = tolData.find(x => x.trans === trans && x.ruas === ruas && x.asal === asal && x.tujuan === tujuan);

  if (!d) {
    out.style.display = "block";
    out.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
    return;
  }

  out.style.display = "block";
  out.innerHTML = `
    <h3>Hasil Tarif Tol</h3>
    <p><b>Rute:</b> ${d.asal} → ${d.tujuan}</p>
    <p><b>Ruas:</b> ${d.ruas}</p>
    <p><b>Panjang:</b> ${d.panjang}</p>
    <p><b>Tarif Gol I:</b> Rp ${Number(d.gol1).toLocaleString()}</p>
    <p><b>Tarif Gol II–III:</b> Rp ${Number(d.gol23).toLocaleString()}</p>
    <p><b>Tarif Gol IV–V:</b> Rp ${Number(d.gol45).toLocaleString()}</p>
    <p><b>Sistem Transaksi:</b> ${d.sistem}</p>
    <p><b>ATL:</b> ${d.atl}</p>
    <p><b>Tarif per Kilometer:</b> Rp ${Number(d.perkm).toLocaleString()}</p>
  `;
}

preloadData();
