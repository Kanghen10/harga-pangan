// Fungsi bantu untuk format angka ke “Rp …” dengan pemisah ribuan dan dua desimal
function formatRp(value) {
  // asumsi value adalah string atau number seperti “2135673” atau “2.135.673”
  let num = typeof value === 'string' ? value.replace(/[^0-9,\.]/g, '') : value;
  num = parseFloat(num.toString().replace(/./g, ','));
  if (isNaN(num)) return '-';
  return 'Rp ' + num.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

async function fetchEmasUsd() {
  const url = 'https://harga-emas.net/api/?v_tipe=emas-terakhir-widget';
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    // Ambil harga emas per gram
    const rawEmas = data.se_gr_kurs; // contoh: "2.135.673<\/font><\/b>( +25.378<\/font> )<\/span>"
    // ambil kurs USD
    const rawUsd = data.kurs_global; // contoh: "16.623,50<\/font><\/b>( +40,16<\/font> )<\/span>"
    // tanggal update
    const rawDate = data.se_update; // contoh: "*US Dollar<\/span>29 Okt, 14:18:35<\/span>"
    // Bersihkan html tags & teks
    const cleanEmas = rawEmas.replace(/<\/?[^>]+(>|$)/g, '');
    const cleanUsd = rawUsd.replace(/<\/?[^>]+(>|$)/g, '');
    const cleanDate = rawDate.replace(/<\/?[^>]+(>|$)/g, '').replace('*US Dollar','').trim();

    document.getElementById('harga-emas').textContent = formatRp(cleanEmas);
    document.getElementById('kurs-usd').textContent = formatRp(cleanUsd);
    document.getElementById('update-info').textContent = 'Update terakhir: ' + cleanDate;
  } catch (err) {
    console.error('Error fetch emas/usd:', err);
    document.getElementById('update-info').textContent = 'Gagal memuat data emas/usd';
  }
}

async function fetchKursLain(kode, label) {
  const url = `https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=${kode}&v_d=${kode}`;
  try {
    const resp = await fetch(url);
    const xmlText = await resp.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    // ambil semua <set> paling akhir dalam <dataset> (nilai terakhir hari ini)
    const sets = xmlDoc.getElementsByTagName('set');
    const lastValue = sets.length > 0
      ? sets[sets.length-1].getAttribute('value')
      : null;
    return { label, value: lastValue };
  } catch (err) {
    console.error(`Error fetch kurs ${label}:`, err);
    return { label, value: null };
  }
}

async function loadKursLain() {
  const list = [
    { code: 'HKD', label: 'Dollar Hongkong (HKD)', c: 3 },
    { code: 'SGD', label: 'Dollar Singapura (SGD)', c: 2 },
    { code: 'AUD', label: 'Dollar Australia (AUD)', c: 6 },
    { code: 'EUR', label: 'Euro (EUR)', c: 11 },
    { code: 'CNY', label: 'Yuan China (CNY)', c: 14 },
    { code: 'GBP', label: 'Pound Sterling (GBP)', c: 5 },
    { code: 'JPY', label: 'YEN Jepang (JPY)', c: 7 },
    { code: 'CAD', label: 'Dollar Canada (CAD)', c: 10 },
    { code: 'NZD', label: 'Dollar New Zealand (NZD)', c: 13 },
    { code: 'MYR', label: 'Ringgit Malaysia (MYR)', c: 19 },
    { code: 'THB', label: 'BAHT Thailand (THB)', c: 21 },
    { code: 'SAR', label: 'Riyal Saudi Arabia (SAR)', c: 12 },
    { code: 'PHP', label: 'Peso Filipina (PHP)', c: 16 },
    { code: 'KRW', label: 'Won Korea Selatan (KRW)', c: 17 },
    { code: 'VND', label: 'Dong Vietnam (VND)', c: 153 },
    { code: 'PGK', label: 'Kina Papua New Guinea (PGK)', c: 20 },
    { code: 'LAK', label: 'Kip Laos (LAK)', c: 91 },
    { code: 'KWD', label: 'Dinar Kuwait (KWD)', c: 18 },
    { code: 'BND', label: 'Dollar Brunei Darussalam (BND)', c: 38 },
  ];

  const tbody = document.getElementById('kurs-lain').querySelector('tbody');
  for (const item of list) {
    const result = await fetchKursLain(item.code, item.label);
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.textContent = result.label;
    const tdValue = document.createElement('td');
    tdValue.textContent = result.value
      ? formatRp(result.value)
      : '-';
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  }
}

(async function init() {
  await fetchEmasUsd();
  await loadKursLain();
})();
