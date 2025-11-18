// tariftol.js — menggunakan tariftol.json statik sebagai data
const JSON_URL = "tariftol.json";
let tolData = [];

async function loadTolData() {
  try {
    const resp = await fetch(JSON_URL);
    tolData = await resp.json();
    initDropdowns();
  } catch (error) {
    console.error("Gagal memuat data tol:", error);
  }
}

function initDropdowns() {
  const selTrans = document.getElementById("toltrans");
  const selRuas = document.getElementById("ruas");
  const selAsal = document.getElementById("asal");
  const selTujuan = document.getElementById("tujuan");

  // isi Tol Trans unik
  const transList = Array.from(new Set(tolData.map(d => d.trans))).sort();
  selTrans.innerHTML = `<option value="">Pilih TOL TRANS</option>` +
    transList.map(t => `<option value="${t}">${t}</option>`).join("");

  selTrans.addEventListener("change", () => {
    const v = selTrans.value;
    // isi ruas sesuai trans
    const ruasList = Array.from(new Set(tolData
      .filter(d => d.trans === v)
      .map(d => d.ruas))).sort();
    selRuas.innerHTML = `<option value="">Pilih RUAS</option>` +
      ruasList.map(r => `<option value="${r}">${r}</option>`).join("");

    // reset asal & tujuan
    selAsal.innerHTML = `<option value="">Pilih ASAL</option>`;
    selTujuan.innerHTML = `<option value="">Pilih TUJUAN</option>`;
  });

  selRuas.addEventListener("change", () => {
    const v = selRuas.value;
    const asalList = Array.from(new Set(tolData
      .filter(d => d.ruas === v)
      .map(d => d.asal))).sort();
    document.getElementById("asal").innerHTML = `<option value="">Pilih ASAL</option>` +
      asalList.map(a => `<option value="${a}">${a}</option>`).join("");

    // clear tujuan
    selTujuan.innerHTML = `<option value="">Pilih TUJUAN</option>`;
  });

  selAsal.addEventListener("change", () => {
    const asal = selAsal.value;
    const ruas = selRuas.value;
    const tujuanList = Array.from(new Set(tolData
      .filter(d => d.asal === asal && d.ruas === ruas)
      .map(d => d.tujuan))).sort();
    selTujuan.innerHTML = `<option value="">Pilih TUJUAN</option>` +
      tujuanList.map(t => `<option value="${t}">${t}</option>`).join("");
  });

  document.getElementById("cekBtn").addEventListener("click", showResult);
}

function showResult() {
  const trans = document.getElementById("toltrans").value;
  const ruas = document.getElementById("ruas").value;
  const asal = document.getElementById("asal").value;
  const tujuan = document.getElementById("tujuan").value;
  const output = document.getElementById("output");

  if (!trans || !ruas || !asal || !tujuan) {
    output.style.display = "block";
    output.innerHTML = `<div class="row"><div class="label">Pesan:</div><div class="value">Lengkapi semua pilihan.</div></div>`;
    return;
  }

  const item = tolData.find(d =>
    d.trans === trans && d.ruas === ruas && d.asal === asal && d.tujuan === tujuan
  );

  if (!item) {
    output.style.display = "block";
    output.innerHTML = `<div class="row"><div class="label">Pesan:</div><div class="value">Data tidak ditemukan.</div></div>`;
    return;
  }

  // hitung perkm atau ATL jika kosong
  let perkm = item.perkm;
  if ((!perkm || perkm === "") && item.gol1 && item.panjang) {
    perkm = Math.round(item.gol1 / item.panjang);
  }
  let atl = item.atl;
  if ((!atl || atl === "") && item.gol1) {
    atl = Math.round(item.gol1 * 1.05);
  }

  output.style.display = "block";
  output.innerHTML = `
    <div class="row"><div class="label">Rute:</div><div class="value">${item.asal} → ${item.tujuan}</div></div>
    <div class="row"><div class="label">Ruas:</div><div class="value">${item.ruas}</div></div>
    <div class="row"><div class="label">Panjang:</div><div class="value">${item.panjang} km</div></div>
    <div class="row"><div class="label">Tarif Gol I:</div><div class="value">Rp ${item.gol1.toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif Gol II & III:</div><div class="value">Rp ${item.gol23.toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Tarif Gol IV & V:</div><div class="value">Rp ${item.gol45.toLocaleString('id-ID')}</div></div>
    <div class="row"><div class="label">Sistem Transaksi:</div><div class="value">${item.sistem || '-'}</div></div>
    <div class="row"><div class="label">ATL (estimasi):</div><div class="value">${atl ? 'Rp ' + atl.toLocaleString('id-ID') : '-'}</div></div>
    <div class="row"><div class="label">Tarif / Km:</div><div class="value">${perkm ? 'Rp ' + perkm.toLocaleString('id-ID') : '-'}</div></div>
  `;
}

document.addEventListener("DOMContentLoaded", loadTolData);
