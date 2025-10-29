// script.js (revisi final untuk menampilkan kondisi_harga, diff_percent, diff)
// NOTE: pastikan apiURL sesuai kebutuhan (limit diatur di query param)
const apiURL = "https://data.jabarprov.go.id/api-dashboard-jabar/public/pangan/list-komoditas?search=&page=1&limit=62&order=asc&order_by=name";

// support dua kemungkinan id container agar tidak mengubah struktur HTML
const container = document.getElementById("commodity-container") || document.getElementById("data-container");
const lastUpdateEl = document.getElementById("last-update") || null;

if (!container) {
  console.error("Tidak menemukan elemen container: gunakan id 'commodity-container' atau 'data-container' di HTML.");
}

/** util: format angka ke Rupiah tanpa "Rp" (ribuan pake titik) */
function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("id-ID");
}

/** util: safe text for HTML */
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, function(m){
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

/** buat html indikator naik/turun/stabil menggunakan field dari API */
function buildIndicatorHTML(kondisi_raw, diff_raw, diffPercent_raw) {
  const kondisi = String(kondisi_raw || "").toLowerCase();
  const diff = Number(diff_raw) || 0;
  // diffPercent might already be number or string like "4.04"
  const diffPercent = (diffPercent_raw === null || diffPercent_raw === undefined) ? null : Number(diffPercent_raw);
  let arrowSVG = "";
  let cls = "arrow-same";
  let labelText = esc(kondisi || "-");
  let sign = "";

  if (kondisi === "naik") {
    // arrow up
    arrowSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 5l7 8H5l7-8z"/></svg>`;
    cls = "arrow-up";
    sign = "+";
  } else if (kondisi === "turun") {
    // arrow down
    arrowSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 19l-7-8h14l-7 8z"/></svg>`;
    cls = "arrow-down";
    sign = ""; // show minus automatically by diff number
  } else {
    arrowSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 12h12v1H6z"/></svg>`;
    cls = "arrow-same";
  }

  // format diffPercent like "4.04%" with sign for naik
  const pctText = (diffPercent === null || isNaN(diffPercent)) ? "-" : `${(diffPercent > 0 ? "+" : "")}${Number(diffPercent).toFixed(2)}%`;
  // format diff number with thousand separator, keep sign from value
  const diffText = `${diff > 0 ? "+" : ""}${formatNumber(diff)}`;

  // return combined small label (kondisi + percent + diff)
  return `
    <div class="indicator ${cls}" aria-label="kondisi: ${esc(labelText)}">
      <span class="arrow">${arrowSVG}</span>
      <span class="kondisi-text">${esc(labelText)}</span>
      <div class="kondisi-meta">
        <small class="pct">${esc(pctText)}</small>
        <small class="diff">(${esc(diffText)})</small>
      </div>
    </div>
  `;
}

/** render satu item ke DOM */
function renderItemTo(containerEl, item) {
  const imageUrl = item.url || "";
  const name = item.name || "-";
  const price = (item.price === undefined || item.price === null) ? 0 : Number(item.price);
  const unit = item.unit || "";
  const kondisi = item.kondisi_harga || "";
  const diff = item.diff ?? 0;
  const diffPercent = item.diff_percent ?? null;

  // create card (structure kept minimal so CSS existing tetap work)
  const card = document.createElement("div");
  // adapt class names used before; if you used .card / .commodity-card adjust via CSS
  card.className = "card";

  // inner HTML consistent with previous structure (image on top, body below)
  card.innerHTML = `
    <div class="imgwrap">
      <img src="${esc(imageUrl)}" alt="${esc(name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=No+Image';">
    </div>
    <div class="card-body">
      <h3 class="title">${esc(name)}</h3>
      <div class="price-row">
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="price">Rp ${formatNumber(price)}</div>
          <div class="unit">/ ${esc(unit)}</div>
        </div>
        <div style="margin-left:auto">
          ${buildIndicatorHTML(kondisi, diff, diffPercent)}
        </div>
      </div>
    </div>
  `;

  containerEl.appendChild(card);
}

/** main load */
async function loadData() {
  if (!container) return;
  try {
    container.innerHTML = ""; // clear
    const resp = await fetch(apiURL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    if (!json || !Array.isArray(json.data)) {
      throw new Error("Format data tidak sesuai (tidak ada array data).");
    }

    // render all items returned by API (respect limit)
    json.data.forEach(item => renderItemTo(container, item));

    // update last-update text if ada
    if (lastUpdateEl) {
      if (json.metadata && json.metadata.last_update) {
        lastUpdateEl.textContent = `Terakhir: ${json.metadata.last_update}`;
      } else if (json.data.length && json.data[0].date) {
        lastUpdateEl.textContent = `Terakhir: ${json.data[0].date}`;
      } else {
        lastUpdateEl.textContent = `Terakhir diperbarui`;
      }
    }
  } catch (err) {
    console.error("Gagal memuat data:", err);
    container.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#b91c1c;text-align:center">Gagal memuat data: ${esc(err.message)}</div>`;
    if (lastUpdateEl) lastUpdateEl.textContent = "Gagal memperbarui";
  }
}

// run
loadData();

// optional: auto refresh setiap 10 menit (bisa di-uncomment jika mau)
// setInterval(loadData, 1000 * 60 * 10);
