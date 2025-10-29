// ---------- UTIL ----------
function stripHtml(s){ return s ? s.replace(/<\/?[^>]+(>|$)/g,'').trim() : s; }

// Ambil nilai terakhir dari <dataset> terakhir, set terakhir dengan value tidak kosong
function extractLastSetValueFromXmlText(xmlText){
  try{
    const p = new DOMParser();
    const doc = p.parseFromString(xmlText, 'text/xml');
    const datasets = doc.getElementsByTagName('dataset');
    if(!datasets || datasets.length === 0) return null;
    const lastDs = datasets[datasets.length - 1];
    const sets = lastDs.getElementsByTagName('set');
    if(!sets || sets.length === 0) return null;
    // cari dari akhir untuk menemukan set dengan value non-empty
    for(let i = sets.length - 1; i >= 0; i--){
      const v = sets[i].getAttribute('value');
      if(v !== null && v !== undefined && v.toString().trim() !== ''){
        return v.toString().trim();
      }
    }
    return null;
  }catch(e){
    console.error('XML parse error', e);
    return null;
  }
}

// ---------- DATA SOURCES ----------
const currencySources = [
  { code:'HKD', label:'Dollar Hongkong (HKD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=3&v_d=HKD' },
  { code:'SGD', label:'Dollar Singapura (SGD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=2&v_d=SGD' },
  { code:'AUD', label:'Dollar Australia (AUD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=6&v_d=AUD' },
  { code:'EUR', label:'Euro (EUR)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=11&v_d=EUR' },
  { code:'CNY', label:'Yuan China (CNY)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=14&v_d=CNY' },
  { code:'GBP', label:'Pound Sterling (GBP)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=5&v_d=GBP' },
  { code:'JPY', label:'YEN Jepang (JPY)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=7&v_d=JPY' },
  { code:'CAD', label:'Dollar Canada (CAD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=10&v_d=CAD' },
  { code:'NZD', label:'Dollar New Zealand (NZD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=13&v_d=NZD' },
  { code:'MYR', label:'Ringgit Malaysia (MYR)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=19&v_d=MYR' },
  { code:'THB', label:'BAHT Thailand (THB)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=21&v_d=THB' },
  { code:'SAR', label:'Riyal Saudi Arabia (SAR)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=12&v_d=SAR' },
  { code:'PHP', label:'Peso Filipina (PHP)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=16&v_d=PHP' },
  { code:'KRW', label:'Won Korea Selatan (KRW)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=17&v_d=KRW' },
  { code:'VND', label:'Dong Vietnam (VND)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=153&v_d=VND' },
  { code:'PGK', label:'Kina Papua New Guinea (PGK)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=20&v_d=PGK' },
  { code:'LAK', label:'Kip Laos (LAK)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=91&v_d=LAK' },
  { code:'KWD', label:'Dinar Kuwait (KWD)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=18&v_d=KWD' },
  { code:'BND', label:'Dollar Brunei Darussalam (BND)', url:'https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=38&v_d=BND' }
];

// ---------- MAIN ----------
async function loadAll() {
  // set main update status
  const mainUpdate = document.getElementById('mainUpdate');
  mainUpdate.textContent = 'Memuat data...';

  // 1) Harga Emas
  try{
    const r = await fetch('https://harga-emas.net/api/?v_tipe=emas-terakhir-widget');
    const j = await r.json();
    // API kadang mengembalikan object atau array; coba akses robust
    const payload = j?.data ? j.data : (Array.isArray(j) ? j[0] : j);
    const se_gr_kurs = payload?.se_gr_kurs ? stripHtml(payload.se_gr_kurs) : null;
    const se_update = payload?.se_update ? stripHtml(payload.se_update) : '';
    // tampilkan persis string dari sumber (prefix Rp.)
    document.getElementById('goldPrice').textContent = se_gr_kurs ? ('Rp. ' + se_gr_kurs) : '—';
    document.getElementById('goldUpdate').textContent = se_update ? ('Update: ' + se_update) : '';
  }catch(e){
    console.error('error gold', e);
    document.getElementById('goldPrice').textContent = 'Gagal memuat';
  }

  // 2) Kurs USD (ambil dari data-real-time.php v_c=1 v_d=USD)
  try{
    const r2 = await fetch('https://kursdollar.org/data-real-time.php?v_type=details&v_date=1761721200&v_c=1&v_d=USD');
    const txt = await r2.text();
    const usdVal = extractLastSetValueFromXmlText(txt);
    document.getElementById('usdPrice').textContent = usdVal ? ('Rp. ' + usdVal) : '—';
    // cari tanggal update di halaman (kondisional)
    const dateMatch = txt.match(/Update\s+Terakhir\s*:\s*([^\n<]+)/i);
    if(dateMatch) document.getElementById('usdUpdate').textContent = 'Update: ' + dateMatch[1].trim();
  }catch(e){
    console.error('error usd', e);
    document.getElementById('usdPrice').textContent = 'Gagal memuat';
  }

  // 3) Kurs lainnya
  const grid = document.getElementById('ratesGrid');
  grid.innerHTML = ''; // kosongkan dulu
  for(const src of currencySources){
    try{
      const r = await fetch(src.url);
      const txt = await r.text();
      const val = extractLastSetValueFromXmlText(txt);
      const display = val ? ('Rp. ' + val) : '-';
      const el = document.createElement('div');
      el.className = 'rate';
      el.innerHTML = `<div class="code">${src.label}</div><div class="val">${display}</div>`;
      grid.appendChild(el);
    }catch(e){
      console.error('error fetch', src.code, e);
      const el = document.createElement('div');
      el.className = 'rate';
      el.innerHTML = `<div class="code">${src.label}</div><div class="val">-</div>`;
      grid.appendChild(el);
    }
  }

  // selesai
  mainUpdate.textContent = 'Terakhir dimuat: ' + (new Date()).toLocaleString('id-ID');
}

// inisiasi
loadAll();
