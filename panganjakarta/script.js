const API_URL = "https://infopangan.jakarta.go.id/api2/v1/public/master-data/commodities?date=";
const listContainer = document.getElementById("commodity-list");
const subtitle = document.getElementById("subtitle");

async function fetchData() {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    if (json.status !== 200) throw new Error("Gagal ambil data");

    const items = json.data.data;
    const date = json.data.selected_price_date;

    subtitle.textContent = `Harga dibandingkan dengan hari sebelumnya ${new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;

    renderItems(items);
  } catch (err) {
    listContainer.innerHTML = `<p class="error">Gagal memuat data (${err.message})</p>`;
  }
}

function renderItems(items) {
  listContainer.innerHTML = "";
  items.forEach(item => {
    const diff = item.newest_price - item.prev_price;
    const diffText = diff > 0 ? `Naik Rp ${diff.toLocaleString("id-ID")}` : `Turun Rp ${Math.abs(diff).toLocaleString("id-ID")}`;
    const isRise = diff > 0;
    const statusColor = isRise ? "rise" : "fall";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.image_path}" alt="${item.name}" loading="lazy" />
      <h3>${item.name}</h3>
      <p class="price">Rp ${item.newest_price.toLocaleString("id-ID")}/${item.unit}</p>
      <div class="status ${statusColor}">
        <span>${isRise ? "↑" : "↓"} ${diffText}</span>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

fetchData();
