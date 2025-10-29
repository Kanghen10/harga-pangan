// ✅ script.js — versi final dengan pagination 9 item per halaman

const apiURL = "https://data.jabarprov.go.id/api-dashboard-jabar/public/pangan/list-komoditas?search=&page=1&limit=62&order=asc&order_by=name";

// cari elemen utama
const container = document.getElementById("commodity-container") || document.getElementById("data-container");
const lastUpdateEl = document.getElementById("last-update") || null;

// pagination
let currentPage = 1;
const perPage = 9;
let allData = [];

/** utils */
function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("id-ID");
}
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

/** buat html indikator naik/turun/stabil */
function buildIndicatorHTML(kondisi_raw, diff_raw, diffPercent_raw) {
  const kondisi = String(kondisi_raw || "").toLowerCase();
  const diff = Number(diff_raw) || 0;
  const diffPercent = (diffPercent_raw === null || diffPercent_raw === undefined) ? null : Number(diffPercent_raw);
  let icon = "", cls = "", color = "";

  if (kondisi === "naik") {
    icon = "▲"; color = "#028a0f"; cls = "up";
  } else if (kondisi === "turun") {
    icon = "▼"; color = "#d32f2f"; cls = "down";
  } else {
    icon = "⭮"; color = "#777"; cls = "same";
  }

  const pctText = (diffPercent === null || isNaN(diffPercent)) ? "-" : `${(diffPercent > 0 ? "+" : "")}${Number(diffPercent).toFixed(2)}%`;
  const diffText = `${diff > 0 ? "+" : ""}${formatNumber(diff)}`;

  return `
    <div class="kondisi-harga ${cls}">
      <span style="color:${color};font-weight:600;">${icon} ${esc(kondisi.toUpperCase())}</span><br>
      <small style="color:${color};opacity:0.8;">${esc(pctText)} (${esc(diffText)})</small>
    </div>
  `;
}

/** render 9 item sesuai halaman */
function renderPage(page) {
  if (!container) return;
  container.innerHTML = "";

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = allData.slice(start, end);

  items.forEach(item => {
    const imageUrl = item.url || "https://via.placeholder.com/80";
    const name = item.name || "-";
    const price = Number(item.price || 0);
    const unit = item.unit || "";
    const kondisi = item.kondisi_harga || "";
    const diff = item.diff ?? 0;
    const diffPercent = item.diff_percent ?? null;

    const card = document.createElement("div");
    card.className = "commodity-card";

    card.innerHTML = `
      <img src="${esc(imageUrl)}" alt="${esc(name)}" onerror="this.src='https://via.placeholder.com/80';">
      <div class="commodity-info">
        <h3>${esc(name)}</h3>
        <p class="commodity-price">Rp ${formatNumber(price)}</p>
        ${buildIndicatorHTML(kondisi, diff, diffPercent)}
      </div>
    `;
    container.appendChild(card);
  });

  renderPaginationControls();
}

/** render tombol berikutnya & sebelumnya */
function renderPaginationControls() {
  let controls = document.getElementById("pagination-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "pagination-controls";
    controls.style.textAlign = "center";
    controls.style.margin = "14px 0 30px";
    document.body.appendChild(controls);
  }

  const totalPages = Math.ceil(allData.length / perPage);
  controls.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Sebelumnya";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderPage(currentPage); };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Berikutnya";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderPage(currentPage); };

  const info = document.createElement("span");
  info.textContent = ` Halaman ${currentPage} dari ${totalPages} `;
  info.style.margin = "0 8px";
  info.style.fontSize = "0.9rem";

  controls.appendChild(prevBtn);
  controls.appendChild(info);
  controls.appendChild(nextBtn);
}

/** ambil data dari API */
async function loadData() {
  if (!container) return;
  try {
    container.innerHTML = "<p style='text-align:center;color:#555;'>Memuat data...</p>";
    const resp = await fetch(apiURL);
    const json = await resp.json();
    if (!json || !Array.isArray(json.data)) throw new Error("Format data tidak sesuai");

    allData = json.data;
    currentPage = 1;
    renderPage(currentPage);

    // update waktu terakhir
    if (lastUpdateEl) {
      if (json.metadata?.last_update) {
        lastUpdateEl.textContent = `Terakhir: ${json.metadata.last_update}`;
      } else {
        lastUpdateEl.textContent = "Terakhir diperbarui";
      }
    }
  } catch (err) {
    console.error("Gagal memuat data:", err);
    container.innerHTML = `<div style="color:#b91c1c;text-align:center;padding:16px;">Gagal memuat data: ${esc(err.message)}</div>`;
  }
}

loadData();
