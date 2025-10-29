// === Ambil data harga emas & USD dari harga-emas.net ===
async function loadGoldData() {
  try {
    const res = await fetch('https://harga-emas.net/api/?v_tipe=emas-terakhir-widget');
    const data = await res.json();

    const gold = data[0];
    const tanggal = gold.tanggal;
    const hargaEmas = gold.se_gr_kurs;
    const kursUSD = gold.kurs_global;

    document.getElementById("goldPrice").textContent = `Rp. ${hargaEmas}`;
    document.getElementById("usdRate").textContent = `Rp. ${kursUSD}`;
    document.getElementById("updateDate").textContent = `Diperbarui: ${tanggal}`;
  } catch (err) {
    console.error("Gagal memuat data emas:", err);
    document.getElementById("goldPrice").textContent = "Gagal memuat data.";
    document.getElementById("usdRate").textContent = "Gagal memuat data.";
  }
}

// === Ambil data kurs mata uang lain dari kursdollar.org ===
const currencyList = {
  HKD: "Dollar Hongkong (HKD)",
  SGD: "Dollar Singapura (SGD)",
  AUD: "Dollar Australia (AUD)",
  EUR: "Euro (EUR)",
  CNY: "Yuan China (CNY)",
  GBP: "Pound Sterling (GBP)",
  JPY: "YEN Jepang (JPY)",
  CAD: "Dollar Canada (CAD)",
  NZD: "Dollar New Zealand (NZD)",
  MYR: "Ringgit Malaysia (MYR)",
  THB: "BAHT Thailand (THB)",
  SAR: "Riyal Saudi Arabia (SAR)",
  PHP: "Peso Filipina (PHP)",
  KRW: "Won Korea Selatan (KRW)",
  VND: "Dong Vietnam (VND)",
  PGK: "Kina Papua New Guinea (PGK)",
  LAK: "Kip Laos (LAK)",
  KWD: "Dinar Kuwait (KWD)",
  BND: "Dollar Brunei Darussalam (BND)"
};

async function loadOtherRates() {
  const tbody = document.getElementById("otherRates");
  tbody.innerHTML = "";

  for (const code in currencyList) {
    try {
      const url = `https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_d=${code}`;
      const res = await fetch(url);
      const text = await res.text();

      // Ekstrak angka dari HTML sederhana
      const match = text.match(/<td[^>]*>([\d.,]+)<\/td>/);
      const value = match ? match[1] : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${currencyList[code]}</td><td>Rp. ${value}</td>`;
      tbody.appendChild(tr);
    } catch {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${currencyList[code]}</td><td>-</td>`;
      tbody.appendChild(tr);
    }
  }
}

loadGoldData();
loadOtherRates();
