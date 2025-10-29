const apiURL = "https://data.jabarprov.go.id/api-dashboard-jabar/public/pangan/list-komoditas?search=&page=1&limit=62&order=asc&order_by=name";

async function fetchCommodities() {
  try {
    const response = await fetch(apiURL);
    const data = await response.json();

    const container = document.getElementById("commodity-container");
    container.innerHTML = "";

    data.data.forEach(item => {
      const card = document.createElement("div");
      card.className = "commodity-card";

      // Gambar komoditas dari URL API
      const img = document.createElement("img");
      img.src = item.url || "https://via.placeholder.com/80";
      img.alt = item.name;

      const info = document.createElement("div");
      info.className = "commodity-info";

      const name = document.createElement("h3");
      name.textContent = item.name;

      // Format harga
      const price = document.createElement("p");
      price.className = "commodity-price";
      const hargaNow = item.harga_saat_ini || 0;
      price.textContent = `Rp ${hargaNow.toLocaleString("id-ID")}`;

      // Hitung selisih dan kondisi harga
      const hargaSebelum = item.harga_kemarin || 0;
      const selisih = hargaNow - hargaSebelum;
      const persen = hargaSebelum ? ((selisih / hargaSebelum) * 100).toFixed(1) : 0;
      const kondisi = selisih > 0 ? "naik" : (selisih < 0 ? "turun" : "tetap");

      // Label kondisi harga + panah
      const kondisiLabel = document.createElement("div");
      kondisiLabel.className = `kondisi-harga ${kondisi}`;
      let icon = "", color = "";
      if (kondisi === "naik") {
        icon = "▲"; color = "green";
      } else if (kondisi === "turun") {
        icon = "▼"; color = "red";
      } else {
        icon = "⭮"; color = "gray";
      }

      kondisiLabel.innerHTML = `
        <span style="color:${color}; font-weight:600;">${icon} ${kondisi.toUpperCase()}</span><br>
        <small style="color:${color}; opacity:0.8;">${Math.abs(persen)}% (${Math.abs(selisih).toLocaleString("id-ID")})</small>
      `;

      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(kondisiLabel);

      card.appendChild(img);
      card.appendChild(info);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Gagal memuat data:", error);
  }
}

fetchCommodities();
