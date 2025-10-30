// ===== Ambil dan tampilkan harga emas & kurs USD =====
async function fetchEmasUsd() {
  const url = 'https://harga-emas.net/api/?v_tipe=emas-terakhir-widget';
  try {
    const res = await fetch(url);
    const data = await res.json();

    // Hapus tag HTML jika ada
    const clean = (html) => html.replace(/<\/?[^>]+(>|$)/g, '').trim();

    const hargaEmasRaw = clean(data.se_gr_kurs).replace(/\./g, '');
    const kursUsdRaw = clean(data.kurs_global).replace(/\./g, '');
    const update = clean(data.se_update).replace('*US Dollar', '').trim();

    const hargaEmas = parseFloat(hargaEmasRaw);
    const kursUsd = parseFloat(kursUsdRaw);

    // Format angka tanpa desimal
    const format = (n) => 'Rp ' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 });

    document.getElementById('harga-emas').textContent = format(hargaEmas);
    document.getElementById('kurs-usd').textContent = format(kursUsd);
    document.getElementById('update-info').textContent = '📅 Update terakhir: ' + update;

  } catch (e) {
    console.error('Gagal ambil data emas/usd:', e);
    document.getElementById('update-info').textContent = 'Gagal memuat data.';
  }
}

// ===== Jalankan =====
fetchEmasUsd();
