// ✅ script.js — final fix compatible with your index.html

const apiURL = "https://data.jabarprov.go.id/api-dashboard-jabar/public/pangan/list-komoditas?search=&page=1&limit=62&order=asc&order_by=name";

const container = document.getElementById("data-container");
const lastUpdateEl = document.getElementById("last-update");

let allData = [];
let currentPage = 1;
const perPage = 9;

// format angka ke format Indonesia
function formatNumber(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("id-ID");
}

// buat label kondisi harga (naik/turun)
function buildIndicatorHTML(kondisi_raw, diff_raw, diffPercent_raw) {
  const kondisi = (kondisi_raw || "").toLowerCase();
  const diff = Number(diff_raw) || 0;
  const diffPercent = (diffPercent_raw === null || diffPercent_raw === undefined) ? null : Number(diffPercent_raw);
  let icon = "", color = "";

  if (kondisi === "naik") {
    icon = "▲"; color = "#e11d48"; // Merah
  } else if (kondisi === "turun") {
    icon = "▼"; color = "#059669"; // Hijau
  } else {
    icon = "⭮"; color = "#9ca3af"; // abu
  }

  const pctText = diffPercent !== null && !isNaN(diffPercent)
    ? `${diffPercent > 0 ? "+" : ""}${diffPercent.toFixed(2)}%`
    : "-";
  const diffText = `${diff > 0 ? "+" : ""}${formatNumber(diff)}`;

  return `
    <div class="indicator" style="color:${color}">
      ${icon} ${kondisi.toUpperCase()} (${pctText}, ${diffText})
    </div>
  `;
}

// render halaman
function renderPage(page) {
  container.innerHTML = "";

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = allData.slice(start, end);

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="imgwrap">
        <img src="${item.url || "https://via.placeholder.com/300x150?text=No+Image"}" 
             alt="${item.name || "-"}" 
             onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'">
      </div>
      <div class="card-body">
        <h2 class="title">${item.name || "-"}</h2>
        <div class="price-row">
          <div class="price">Rp ${formatNumber(item.price)}</div>
          <div class="unit">/ ${item.unit || ""}</div>
        </div>
        ${buildIndicatorHTML(item.kondisi_harga, item.diff, item.diff_percent)}
      </div>
    `;
    container.appendChild(card);
  });

  renderPaginationControls();
}

// tombol pagination
function renderPaginationControls() {
  let controls = document.getElementById("pagination-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "pagination-controls";
    controls.style.textAlign = "center";
    controls.style.margin = "20px 0";
    container.parentElement.appendChild(controls);
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
  info.style.margin = "0 10px";
  info.style.fontSize = "14px";
  info.style.color = "#555";

  controls.appendChild(prevBtn);
  controls.appendChild(info);
  controls.appendChild(nextBtn);
}

// ambil data
async function loadData() {
  try {
    container.innerHTML = "<p style='text-align:center;color:#666;'>Memuat data...</p>";
    const response = await fetch(apiURL);
    const json = await response.json();

    if (!json || !Array.isArray(json.data)) throw new Error("Data tidak sesuai");

    allData = json.data;
    currentPage = 1;
    renderPage(currentPage);

    if (lastUpdateEl && json.metadata?.last_update) {
      lastUpdateEl.textContent = "Terakhir diperbarui: " + json.metadata.last_update;
    }
  } catch (err) {
    console.error("Gagal memuat:", err);
    container.innerHTML = `<p style="color:red;text-align:center;">Gagal memuat data: ${err.message}</p>`;
  }
}

loadData();
