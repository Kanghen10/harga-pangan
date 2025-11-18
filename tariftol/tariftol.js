// tariftol.js — versi final dengan JSON statik sebagai database
const JSON_PATH = "tariftol.json";
let tolData = [];

// Load JSON data, then init dropdowns
async function loadData() {
  try {
    const resp = await fetch(JSON_PATH);
    tolData = await resp.json();
    initDropdowns();
  } catch (err) {
    console.error("Gagal memuat data tarif tol:", err);
  }
}

function initDropdowns() {
  const selTrans = document.getElementById("toltrans");
  const selRuas = document.getElementById("ruas");
  const selAsal = document.getElementById("asal");
  const selTujuan = document.getElementById("tujuan");

  // Unique lists
  const listTrans = [...new Set(tolData.map(d => d.trans))].sort();
  selTrans.innerHTML = "<option value=\"\">Pilih Tol Trans</option>" + listTrans.map(v => `<option value="${v}">${v}</option>`).join("");

  selTrans.addEventListener("change", () => {
    const val = selTrans.value;
    selRuas.innerHTML = "<option value=\"\">Pilih Ruas</option>";
    selAsal.innerHTML = "<option value=\"\">Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=\"\">Pilih Tujuan</option>";
    if (!val) return;
    const listR = [...new Set(tolData.filter(d => d.trans === val).map(d => d.ruas))].sort();
    selRuas.innerHTML += listR.map(r => `<option value="${r}">${r}</option>`).join("");
  });

  selRuas.addEventListener("change", () => {
    const val = selRuas.value;
    selAsal.innerHTML = "<option value=\"\">Pilih Asal</option>";
    selTujuan.innerHTML = "<option value=\"\">Pilih Tujuan</option>";
    if (!val) return;
    const listA = [...new Set(tolData.filter(d => d.ruas === val).map(d => d.asal))].sort();
    selAsal.innerHTML += listA.map(a => `<option value="${a}">${a}</option>`).join("");
  });

  selAsal.addEventListener("change", () => {
    const val = selAsal.value;
    selTujuan.innerHTML = "<option value=\"\">Pilih Tujuan</option>";
    if (!val) return;
    const ru = selRuas.value;
    const listT = [...new Set(tolData.filter(d => d.asal === val && d.ruas === ru).map(d => d.tujuan))].sort();
    selTujuan.innerHTML += listT.map(t => `<option value="${t}">${t}</option>`).join("");
  });

  document.getElementById("cekBtn").addEventListener("click", showResult);
}

function showResult() {
  const t = document.getElementById("toltrans").value;
  const r = document.getElementById("ruas").value;
  const a = document.getElementById("asal").value;
  const u = document.getElementById("tujuan").value;
  const out = document.getElementById("output");

  if (!t || !r || !a || !u) {
    out.style.display = "block";
    out.innerHTML = "<p style=\"color:red\">Lengkapi semua pilihan terlebih dahulu.</p>";
    return;
  }

  const item = tolData.find(d => d.trans === t && d.ruas === r && d.asal === a && d.tujuan === u);
  if (!item) {
    out.style.display = "block";
    out.innerHTML = "<p style=\"color:red\">Data tidak ditemukan untuk kombinasi ini.</p>";
    return;
  }

  // compute perkm if missing
  let perkm = item.perkm;
  if ((!perkm || perkm==="") && item.gol1 && item.panjang) {
    perkm = Math.round(item.gol1 / item.panjang);
  }

  // compute atl if missing
  let atl = item.atl;
  if ((!atl || atl==="") && item.gol1) {
    atl = Math.round(item.gol1 * 1.05);
  }

  out.style.display = "block";
  out.innerHTML = `
    <div><b>Rute:</b> ${item.asal} → ${item.tujuan}</div>
    <div><b>Ruas:</b> ${item.ruas}</div>
    <div><b>Panjang Jalan Tol:</b> ${item.panjang} km</div>
    <div><b>Tarif Gol I:</b> Rp ${item.gol1.toLocaleString('id-ID')}</div>
    <div><b>Tarif Gol II & III:</b> Rp ${item.gol23.toLocaleString('id-ID')}</div>
    <div><b>Tarif Gol IV & V:</b> Rp ${item.gol45.toLocaleString('id-ID')}</div>
    <div><b>Sistem Transaksi:</b> ${item.sistem}</div>
    <div><b>ATL (estimasi):</b> ${atl ? 'Rp ' + atl.toLocaleString('id-ID') : '-'}</div>
    <div><b>Tarif per Kilometer:</b> ${perkm ? 'Rp ' + perkm.toLocaleString('id-ID') : '-'}</div>
  `;
}

// kick off
document.addEventListener("DOMContentLoaded", loadData);
