// ---------- Utility ----------
function stripHtml(s){ return s ? s.replace(/<\/?[^>]+(>|$)/g,'').trim() : s; }

// Format "2139.82" -> "Rp. 2.139,82"
function formatToRpFromDotDecimal(strVal){
  if (strVal === null || strVal === undefined) return '-';
  const clean = String(strVal).trim();
  if (clean === '') return '-';
  // parseFloat menganggap '.' sebagai desimal
  const num = parseFloat(clean.replace(/[^0-9\.\-]/g,''));
  if (isNaN(num)) return '-';
  return 'Rp. ' + num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format "2140" -> "Rp 2.140" (no decimals, rounded)
function formatToRpNoDecimals(value){
  if (value === null || value === undefined || value === '') return '-';
  const n = Math.round(parseFloat(String(value).replace(/[^0-9\.\-]/g,'')));
  if (isNaN(n)) return '-';
  return 'Rp ' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

// Ambil nilai terakhir dari dataset terakhir (set terakhir non-empty)
function extractLastSetValueFromXmlText(xmlText){
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const datasets = doc.getElementsByTagName('dataset');
    if (!datasets || datasets.length === 0) return null;
    const lastDataset = datasets[datasets.length - 1];
    const sets = lastDataset.getElementsByTagName('set');
    if (!sets || sets.length === 0) return null;
    for (let i = sets.length - 1; i >= 0; i--) {
      const v = sets[i].getAttribute('value');
      if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
    }
    return null;
  } catch (e) {
    console.error('XML parse error (sets)', e);
    return null;
  }
}

// Ambil YAxisMaxValue dari <chart ... YAxisMaxValue="...">
function extractYAxisMaxFromXmlText(xmlText){
  try {
    const m = xmlText.match(/YAxisMaxValue="([^"]+)"/i);
    if (m && m[1]) return m[1].trim();
    return null;
  } catch (e) {
    console.error('Failed extract YAxisMaxValue', e);
    return null;
  }
}

// ---------- Harga Emas & Kurs USD (KEEP AS-IS / robust) ----------
async function fetchEmasUsd() {
  const url = 'https://harga-emas.net/api/?v_tipe=emas-terakhir-widget';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // robust access: beberapa respons pakai data.data, beberapa pakai object/array
    const payload = data?.data ? data.data : (Array.isArray(data) ? data[0] : data);

    const clean = (html) => stripHtml(html);
    const hargaEmasRaw = payload && payload.se_gr_kurs ? clean(payload.se_gr_kurs) : null;
    const kursUsdRaw = payload && payload.kurs_global ? clean(payload.kurs_global) : null;
    const updateRaw = payload && payload.se_update ? clean(payload.se_update).replace('*US Dollar','').trim() : '';

    // tampilkan sesuai format yang sudah benar: prefix "Rp. " + string dari sumber
    const elHarga = document.getElementById('harga-emas');
    const elKursUsd = document.getElementById('kurs-usd');
    const elUpdateInfo = document.getElementById('update-info');
    const elHargaUpdate = document.getElementById('harga-emas-update');
    const elUsdUpdate = document.getElementById('kurs-usd-update');

    if (elHarga) elHarga.textContent = hargaEmasRaw ? ('Rp. ' + hargaEmasRaw) : '-';
    if (elKursUsd) elKursUsd.textContent = kursUsdRaw ? ('Rp. ' + kursUsdRaw) : '-';
    if (elUpdateInfo) elUpdateInfo.textContent = updateRaw ? ('📅 Update terakhir: ' + updateRaw) : 'Memuat data...';
    if (elHargaUpdate) elHargaUpdate.textContent = updateRaw ? ('Update: ' + updateRaw) : '';
    if (elUsdUpdate) elUsdUpdate.textContent = '';
  } catch (e) {
    console.error('Gagal ambil data emas/usd:', e);
    const elUpdateInfo = document.getElementById('update-info');
    if (elUpdateInfo) elUpdateInfo.textContent = 'Gagal memuat data.';
    const elHarga = document.getElementById('harga-emas');
    const elKursUsd = document.getElementById('kurs-usd');
    if (elHarga) elHarga.textContent = 'Gagal memuat';
    if (elKursUsd) elKursUsd.textContent = 'Gagal memuat';
  }
}

// ---------- Kurs mata uang lain (dari data.php dengan fallback YAxisMaxValue) ----------
const kursList = [
  { code:'HKD', label:'Dollar Hongkong (HKD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=3&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'SGD', label:'Dollar Singapura (SGD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=2&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'AUD', label:'Dollar Australia (AUD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=6&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'EUR', label:'Euro (EUR)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=11&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'CNY', label:'Yuan China (CNY)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=14&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'GBP', label:'Pound Sterling (GBP)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=5&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'JPY', label:'YEN Jepang (JPY)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=7&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'CAD', label:'Dollar Kanada (CAD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=10&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'NZD', label:'Dollar New Zealand (NZD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=13&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'MYR', label:'Ringgit Malaysia (MYR)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=19&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'THB', label:'Baht Thailand (THB)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=21&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'SAR', label:'Riyal Saudi Arabia (SAR)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=12&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'PHP', label:'Peso Filipina (PHP)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=16&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'KRW', label:'Won Korea Selatan (KRW)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=17&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'VND', label:'Dong Vietnam (VND)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=153&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'PGK', label:'Kina Papua New Guinea (PGK)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=20&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'LAK', label:'Kip Laos (LAK)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=91&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'KWD', label:'Dinar Kuwait (KWD)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=18&v_bank_id=1&v_bank_name=Bank%20Indonesia' },
  { code:'BND', label:'Dollar Brunei Darussalam (BND)', url:'https://kursdollar.org/data.php?v_range=0&v_currency_id=38&v_bank_id=1&v_bank_name=Bank%20Indonesia' }
];

async function loadKursLain() {
  const tbody = document.querySelector('#kurs-lain tbody');
  if (!tbody) return;
  tbody.innerHTML = ''; // kosongkan

  for (const item of kursList) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();

      // 1) coba ambil dari <set> terakhir non-empty
      let setVal = extractLastSetValueFromXmlText(txt); // contoh "2139.82"
      if (setVal) {
        const display = formatToRpFromDotDecimal(setVal);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.label}</td><td>${display}</td>`;
        tbody.appendChild(tr);
        continue;
      }

      // 2) fallback ke YAxisMaxValue
      const yMax = extractYAxisMaxFromXmlText(txt); // contoh "2140"
      if (yMax) {
        const display = formatToRpNoDecimals(yMax);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.label}</td><td>${display}</td>`;
        tbody.appendChild(tr);
        continue;
      }

      // 3) keduanya gagal -> tampilkan '-'
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.label}</td><td>-</td>`;
      tbody.appendChild(tr);

    } catch (e) {
      console.error('Gagal ambil kurs', item.code, e);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.label}</td><td>-</td>`;
      tbody.appendChild(tr);
    }
  }
}

// ---------- Inisiasi (protected) ----------
(async function init(){
  try {
    await fetchEmasUsd();   // Harga Emas + Kurs USD (tetap)
  } catch(e){
    console.error('fetchEmasUsd unexpected error', e);
  }

  try {
    await loadKursLain();   // Kurs lainnya
  } catch(e){
    console.error('loadKursLain unexpected error', e);
  }

  const ui = document.getElementById('update-info');
  if (ui) ui.textContent = 'Terakhir dimuat: ' + (new Date()).toLocaleString('id-ID');
})();
