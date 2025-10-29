// ===== Format angka Rupiah singkat =====
function formatRupiah(value) {
  if (!value) return '-';
  // Hapus semua karakter kecuali angka dan koma
  const numStr = value.toString().replace(/[^\d,]/g, '');
  const num = parseFloat(numStr.replace(',', '.'));
  if (isNaN(num)) return '-';
  // Tampilkan dengan format ribuan tanpa desimal
  return 'Rp ' + num.toLocaleString('id-ID');
}

// ===== Ambil harga emas & kurs USD =====
async function fetchEmasUsd() {
  const url = 'https://harga-emas.net/api/?v_tipe=emas-terakhir-widget';
  try {
    const res = await fetch(url);
    const data = await res.json();

    const clean = (html) => html.replace(/<\/?[^>]+(>|$)/g, '').trim();

    // Hapus titik pemisah ribuan → ubah ke angka asli
    const hargaEmasRaw = clean(data.se_gr_kurs).replace(/\./g, '');
    const kursUsdRaw = clean(data.kurs_global).replace(/\./g, '');
    const update = clean(data.se_update).replace('*US Dollar', '').trim();

    const hargaEmas = parseFloat(hargaEmasRaw);
    const kursUsd = parseFloat(kursUsdRaw);

    document.getElementById('harga-emas').textContent = 'Rp ' + hargaEmas.toLocaleString('id-ID');
    document.getElementById('kurs-usd').textContent = 'Rp ' + kursUsd.toLocaleString('id-ID');
    document.getElementById('update-info').textContent = '📅 Update terakhir: ' + update;
  } catch (e) {
    console.error('Gagal ambil data emas/usd:', e);
    document.getElementById('update-info').textContent = 'Gagal memuat data.';
  }
}

// ===== Ambil kurs negara lain (via XML dari kursdollar.org) =====
async function fetchKurs(code, v_c, label) {
  const url = `https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=${v_c}&v_d=${code}`;
  try {
    const res = await fetch(url);
    const xml = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // Ambil dataset terakhir (biasanya hari ini)
    const datasets = doc.getElementsByTagName('dataset');
    if (datasets.length === 0) return { label, value: null };

    const lastDataset = datasets[datasets.length - 1];
    const sets = lastDataset.getElementsByTagName('set');
    if (sets.length === 0) return { label, value: null };

    const lastValue = sets[sets.length - 1].getAttribute('value');
    return { label, value: lastValue };
  } catch (e) {
    console.error('Gagal ambil kurs', code, e);
    return { label, value: null };
  }
}

async function loadKursLain() {
  const list = [
    { code: 'HKD', v_c: 3, label: 'Dollar Hongkong (HKD)' },
    { code: 'SGD', v_c: 2, label: 'Dollar Singapura (SGD)' },
    { code: 'AUD', v_c: 6, label: 'Dollar Australia (AUD)' },
    { code: 'EUR', v_c: 11, label: 'Euro (EUR)' },
    { code: 'CNY', v_c: 14, label: 'Yuan China (CNY)' },
    { code: 'GBP', v_c: 5, label: 'Pound Sterling (GBP)' },
    { code: 'JPY', v_c: 7, label: 'YEN Jepang (JPY)' },
    { code: 'CAD', v_c: 10, label: 'Dollar Kanada (CAD)' },
    { code: 'NZD', v_c: 13, label: 'Dollar New Zealand (NZD)' },
    { code: 'MYR', v_c: 19, label: 'Ringgit Malaysia (MYR)' },
    { code: 'THB', v_c: 21, label: 'Baht Thailand (THB)' },
    { code: 'SAR', v_c: 12, label: 'Riyal Saudi Arabia (SAR)' },
    { code: 'PHP', v_c: 16, label: 'Peso Filipina (PHP)' },
    { code: 'KRW', v_c: 17, label: 'Won Korea Selatan (KRW)' },
    { code: 'VND', v_c: 153, label: 'Dong Vietnam (VND)' },
    { code: 'PGK', v_c: 20, label: 'Kina Papua New Guinea (PGK)' },
    { code: 'LAK', v_c: 91, label: 'Kip Laos (LAK)' },
    { code: 'KWD', v_c: 18, label: 'Dinar Kuwait (KWD)' },
    { code: 'BND', v_c: 38, label: 'Dollar Brunei Darussalam (BND)' },
  ];

  const tbody = document.querySelector('#kurs-lain tbody');
  tbody.innerHTML = '';

  for (const item of list) {
    const kurs = await fetchKurs(item.code, item.v_c, item.label);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${kurs.label}</td>
      <td>${kurs.value ? formatRupiah(kurs.value) : '-'}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ===== Jalankan semua =====
(async function init() {
  await fetchEmasUsd();
  await loadKursLain();
})();
