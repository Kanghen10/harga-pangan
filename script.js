// script.js
const apiURL = "https://data.jabarprov.go.id/api-dashboard-jabar/public/pangan/list-komoditas?search=&page=1&limit=9&order=asc&order_by=name";
const container = document.getElementById("data-container");
const lastUpdateEl = document.getElementById("last-update");

function formatRupiah(num) {
  // ensure number
  const n = Number(num) || 0;
  // Indonesian thousands separator = dot
  return n.toLocaleString('id-ID');
}

function getIndicatorHTML(kondisi, diff) {
  // kondisi biasanya "naik", "turun" atau other
  if (kondisi === "naik") {
    return `<span class="indicator arrow-up" title="Naik ${diff ?? ''}">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5l7 8H5l7-8z" fill="currentColor"/>
      </svg>
    </span>`;
  } else if (kondisi === "turun") {
    return `<span class="indicator arrow-down" title="Turun ${diff ?? ''}">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19l-7-8h14l-7 8z" fill="currentColor"/>
      </svg>
    </span>`;
  } else {
    return `<span class="indicator arrow-same" title="Tidak berubah">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12h12v1H6z" fill="currentColor"/>
      </svg>
    </span>`;
  }
}

async function loadData(){
  try {
    const resp = await fetch(apiURL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    if (!json || json.success !== 1 || !Array.isArray(json.data)) {
      throw new Error("Format data tidak sesuai");
    }

    // clear
    container.innerHTML = "";

    // render each item
    json.data.forEach(item => {
      const imageUrl = item.url || "";
      const name = item.name || "-";
      const price = item.price ?? 0;
      const unit = item.unit || "";
      const kondisi = (item.kondisi_harga || "").toLowerCase();
      const diff = item.diff ?? "";

      // card element
      const card = document.createElement("div");
      card.className = "card";

      // Build inner html
      card.innerHTML = `
        <div class="imgwrap">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=No+Image';">
        </div>
        <div class="card-body">
          <h3 class="title">${escapeHtml(name)}</h3>
          <div class="price-row">
            <div style="display:flex;align-items:baseline;gap:8px">
              <div class="price">Rp ${formatRupiah(price)}</div>
              <div class="unit">/ ${escapeHtml(unit)}</div>
            </div>
            <div style="margin-left:auto">${getIndicatorHTML(kondisi, diff)}</div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // last update text
    if (json.metadata && json.metadata.last_update) {
      lastUpdateEl.textContent = `Terakhir: ${json.metadata.last_update}`;
    } else if (json.data.length && json.data[0].date) {
      lastUpdateEl.textContent = `Terakhir: ${json.data[0].date}`;
    } else {
      lastUpdateEl.textContent = `Terakhir diperbarui: -`;
    }

  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#b91c1c;text-align:center">Gagal memuat data: ${escapeHtml(err.message)}</div>`;
    lastUpdateEl.textContent = "Gagal memperbarui";
    console.error("LoadDataError:", err);
  }
}

// small utility to avoid injection in attribute text (basic)
function escapeHtml(s){
  if (typeof s !== "string") return s;
  return s.replace(/[&<>"']/g, function(m){
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

// initial load
loadData();

// optional: auto-refresh setiap X menit (uncomment jika mau)
// setInterval(loadData, 1000 * 60 * 10); // setiap 10 menit
