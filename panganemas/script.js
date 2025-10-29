document.addEventListener("DOMContentLoaded", async () => {
  const emasUrl = "https://harga-emas.net/api/?v_tipe=emas-terakhir-widget";

  const kursList = [
    { code: "HKD", label: "Dollar Hongkong (HKD)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=3&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "SGD", label: "Dollar Singapura (SGD)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=4&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "AUD", label: "Dollar Australia (AUD)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=2&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "EUR", label: "Euro (EUR)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=6&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "JPY", label: "Yen Jepang (JPY)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=5&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "SAR", label: "Riyal Arab Saudi (SAR)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=7&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "CNY", label: "Yuan China (CNY)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=13&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "MYR", label: "Ringgit Malaysia (MYR)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=9&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "THB", label: "Baht Thailand (THB)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=10&v_bank_id=1&v_bank_name=Bank%20Indonesia" },
    { code: "GBP", label: "Poundsterling (GBP)", url: "https://kursdollar.org/data.php?v_range=0&v_currency_id=8&v_bank_id=1&v_bank_name=Bank%20Indonesia" }
  ];

  const formatRupiah = (num) => {
    if (!num) return "-";
    return "Rp " + num.toString().replace(/[^0-9.,]/g, "");
  };

  // ==== FETCH HARGA EMAS DAN USD ====
  try {
    const res = await fetch(emasUrl);
    const data = await res.json();

    const tanggal = data?.tanggal || "-";
    const hargaEmas = data?.se_gr_kurs ? `Rp ${data.se_gr_kurs}` : "-";
    const usd = data?.kurs_global?.USD ? `Rp ${data.kurs_global.USD}` : "-";

    document.getElementById("harga-emas").textContent = hargaEmas;
    document.getElementById("kurs-usd").textContent = usd;
    document.getElementById("tanggal-update").textContent = tanggal;
  } catch (err) {
    console.error("Gagal mengambil data emas:", err);
  }

  // ==== FETCH KURS MATA UANG LAIN ====
  const tbody = document.querySelector("#kurs-lainnya tbody");
  tbody.innerHTML = "";

  for (const item of kursList) {
    let nominal = "-";
    try {
      const res = await fetch(item.url);
      const text = await res.text();
      const match = text.match(/YAxisMaxValue="([\d.]+)"/);
      if (match && match[1]) {
        nominal = "Rp " + match[1];
      }
    } catch (e) {
      console.warn("Gagal ambil kurs:", item.code, e);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.label}</td>
      <td>${nominal}</td>
    `;
    tbody.appendChild(tr);
  }
});
