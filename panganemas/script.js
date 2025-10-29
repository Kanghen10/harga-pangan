// ===== Format angka Rupiah singkat =====
function formatRupiah(value) {
  if (!value) return '-';
  // Hapus semua karakter kecuali angka dan koma
  const numStr = value.toString().replace(/[^\d,]/g, '');
  const num = parseFloat(numStr.replace(',', '.'));
  if (isNaN(num)) return '-';
  // Tampilkan tanpa desimal (biar rapi)
  return 'Rp ' + num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

// ===== Ambil harga emas & kurs USD (tidak diubah) =====
async function fetchEmasUsd() {
  const url = 'https://harga-emas.net/api/?v_tipe=emas-terakhir-widget';
  try {
    const res = await fetch(url);
    const data = await res.json();

    const clean = (html) => html.replace(/<\/?[^>]+(>|$)/g, '').trim();

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

// ===== Ambil kurs negara lain (via XML dari kursdollar.org/data.php) =====
async function fetchKursXML(label, url) {
  try {
    const res = await fetch(url);
    const xmlText = await res.text();

    // Ambil langsung dari YAxisMaxValue
    const match = xmlText.match(/YAxisMaxValue="([\d.]+)"/);
    if (match && match[1]) {
      const nilai = match[1];
      return { label, value: nilai };
    } else {
      return { label, value: null };
    }
  } catch (e) {
    console.error('Gagal ambil kurs untuk', label, e);
    return { label, value: null };
  }
}

async function loadKursLain() {
  const list = [
    { label: 'Dollar Hongkong (HKD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=3&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dollar Singapura (SGD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=2&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dollar Australia (AUD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=6&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Euro (EUR)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=11&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Yuan China (CNY)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=14&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Pound Sterling (GBP)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=5&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'YEN Jepang (JPY)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=7&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dollar Kanada (CAD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=10&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dollar New Zealand (NZD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=13&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Ringgit Malaysia (MYR)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=19&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Baht Thailand (THB)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=21&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Riyal Saudi Arabia (SAR)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=12&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Peso Filipina (PHP)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=16&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Won Korea Selatan (KRW)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=17&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dong Vietnam (VND)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=153&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Kina Papua New Guinea (PGK)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=20&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Kip Laos (LAK)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=91&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dinar Kuwait (KWD)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=18&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
    { label: 'Dollar Brunei Darussalam (BND)', url: 'https://kursdollar.org/data.php?v_range=0&v_currency_id=38&v_bank_id=1&v_bank_name=Bank%20Indonesia' }
  ];

  const tbody = document.querySelector('#kurs-lain tbody');
  tbody.innerHTML = '';

  for (const item of list) {
    const kurs = await fetchKursXML(item.label, item.url);
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
