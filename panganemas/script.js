// ===== Fungsi Format Rupiah =====
function formatRupiah(num) {
  const number = parseFloat(num);
  if (isNaN(number)) return "-";
  return "Rp. " + number.toLocaleString("id-ID", { minimumFractionDigits: 0 });
}

function formatRupiahWithComma(num) {
  const number = parseFloat(num.replace(",", "."));
  if (isNaN(number)) return "-";
  return "Rp. " + number.toLocaleString("id-ID", { minimumFractionDigits: 2 });
}

// ===== 1️⃣ Harga Emas =====
fetch("https://harga-emas.net/data-harga-emas.php")
  .then(res => res.json())
  .then(data => {
    const emas = data?.se_gr_kurs || "0";
    document.getElementById("harga-emas").textContent = formatRupiah(emas);
  })
  .catch(() => document.getElementById("harga-emas").textContent = "Gagal memuat");

// ===== 2️⃣ Kurs Dolar AS =====
fetch("https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=1&v_d=USD")
  .then(res => res.json())
  .then(data => {
    const usd = data?.kurs_global || "0";
    document.getElementById("kurs-usd").textContent = formatRupiahWithComma(usd);
  })
  .catch(() => document.getElementById("kurs-usd").textContent = "Gagal memuat");

// ===== 3️⃣ Kurs Mata Uang Lain =====
const kursList = [
  { name: "Dollar Hongkong (HKD)", v_c: 3, v_d: "HKD" },
  { name: "Dollar Singapura (SGD)", v_c: 2, v_d: "SGD" },
  { name: "Dollar Australia (AUD)", v_c: 6, v_d: "AUD" },
  { name: "Euro (EUR)", v_c: 11, v_d: "EUR" },
  { name: "Yuan China (CNY)", v_c: 14, v_d: "CNY" },
  { name: "Pound Sterling (GBP)", v_c: 5, v_d: "GBP" },
  { name: "YEN Jepang (JPY)", v_c: 7, v_d: "JPY" },
  { name: "Dollar Canada (CAD)", v_c: 10, v_d: "CAD" },
  { name: "Dollar New Zealand (NZD)", v_c: 13, v_d: "NZD" },
  { name: "Ringgit Malaysia (MYR)", v_c: 19, v_d: "MYR" },
  { name: "BAHT Thailand (THB)", v_c: 21, v_d: "THB" },
  { name: "Riyal Saudi Arabia (SAR)", v_c: 12, v_d: "SAR" },
  { name: "Peso Filipina (PHP)", v_c: 16, v_d: "PHP" },
  { name: "Won Korea Selatan (KRW)", v_c: 17, v_d: "KRW" },
  { name: "Dong Vietnam (VND)", v_c: 153, v_d: "VND" },
  { name: "Kina Papua New Guinea (PGK)", v_c: 20, v_d: "PGK" },
  { name: "Kip Laos (LAK)", v_c: 91, v_d: "LAK" },
  { name: "Dinar Kuwait (KWD)", v_c: 18, v_d: "KWD" },
  { name: "Dollar Brunei Darussalam (BND)", v_c: 38, v_d: "BND" }
];

const tbody = document.getElementById("kurs-table-body");

kursList.forEach(async (k) => {
  const row = document.createElement("tr");
  const tdName = document.createElement("td");
  const tdValue = document.createElement("td");

  tdName.textContent = k.name;
  tdValue.textContent = "Loading...";

  row.appendChild(tdName);
  row.appendChild(tdValue);
  tbody.appendChild(row);

  try {
    const res = await fetch(`https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=${k.v_c}&v_d=${k.v_d}`);
    const data = await res.json();
    const value = data?.kurs_global || "-";
    tdValue.textContent = value !== "-" ? formatRupiahWithComma(value) : "-";
  } catch {
    tdValue.textContent = "-";
  }
});
