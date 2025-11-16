async function fetchEmasUsd() {
  const url = "https://kanghen10.github.io/harga-pangan/panganemas/emaskurs.txt";

  // helper: ubah string angka dari berbagai format menjadi integer sesuai aturan:
  // - jika separator '.' atau ',' diikuti 3 digit -> dianggap pemisah ribuan (hapus separator)
  // - selain itu, parseFloat lalu ambil bagian integer (floor)
  function parseToInt(valueStr) {
    if (!valueStr) return NaN;
    let s = valueStr.toString().trim();

    // keep only digits, dot, comma
    s = s.replace(/[^\d\.,]/g, '');

    // jika tidak ada pemisah, parse langsung
    if (!s.includes('.') && !s.includes(',')) {
      return parseInt(s, 10);
    }

    // Jika ada titik dan bagian setelah titik panjang 3 dan tidak ada koma => titik sebagai ribuan
    if (s.includes('.') && !s.includes(',')) {
      const afterDot = s.split('.').pop();
      if (afterDot.length === 3) {
        return parseInt(s.replace(/\./g, ''), 10);
      } else {
        // titik sebagai desimal
        const f = parseFloat(s);
        return Number.isFinite(f) ? Math.floor(f) : NaN;
      }
    }

    // Jika ada koma dan tidak ada titik
    if (s.includes(',') && !s.includes('.')) {
      const afterComma = s.split(',').pop();
      if (afterComma.length === 3) {
        // koma sebagai ribuan
        return parseInt(s.replace(/,/g, ''), 10);
      } else {
        // koma sebagai desimal
        const f = parseFloat(s.replace(',', '.'));
        return Number.isFinite(f) ? Math.floor(f) : NaN;
      }
    }

    // Jika kedua ada (mis. '1.234,56' atau '1,234.56'), tentukan siapa pemisah ribuan:
    // Umum: jika ada '.' dan ',' serta bagian setelah terakhir separator panjang 2 => koma atau titik sebagai desimal
    // Heuristik: jika ada ',' dan last part length === 2 -> treat ',' as decimal
    const lastComma = s.split(',').pop();
    const lastDot = s.split('.').pop();

    // contoh '1.234,56' -> lastComma.length == 2 -> comma decimal
    if (lastComma.length <= 2 && lastDot.length === 3) {
      // treat dot as thousand, comma as decimal
      const normalized = s.replace(/\./g, '').replace(',', '.');
      const f = parseFloat(normalized);
      return Number.isFinite(f) ? Math.floor(f) : NaN;
    }

    // contoh '1,234.56' -> lastDot length 2 -> dot decimal
    if (lastDot.length <= 2 && lastComma.length === 3) {
      const normalized = s.replace(/,/g, '');
      const f = parseFloat(normalized);
      return Number.isFinite(f) ? Math.floor(f) : NaN;
    }

    // fallback: remove any thousands-like separators (groups of 3) then parse float and floor
    const fallback = s.replace(/(?<=\d)[\.,](?=\d{3}\b)/g, '');
    const f = parseFloat(fallback.replace(',', '.'));
    return Number.isFinite(f) ? Math.floor(f) : NaN;
  }

  try {
    const res = await fetch(url);
    const text = await res.text();

    // pisah baris, trim, filter kosong
    const lines = text.split("\n").map(l => l.trim()).filter(l => l && l !== '==============');

    // --- USD ---
    // Cari baris yang dimulai "USD" (case sensitive sesuai file)
    const usdLine = lines.find(l => /^USD\b/.test(l));
    if (usdLine) {
      // contoh: "USD 16.713" atau "USD Rp16.713,32"
      const matchUsd = usdLine.match(/([\d\.,]+)/);
      if (matchUsd) {
        const usdInt = parseToInt(matchUsd[1]);
        if (!isNaN(usdInt)) {
          document.getElementById("kurs-usd").textContent = "Rp " + usdInt.toLocaleString("id-ID");
        }
      }
    }

    // --- Harga Emas ---
    // cari baris yang mengandung "Harga Emas" (dengan atau tanpa tanda kutip)
    const emasLine = lines.find(l => /harga emas/i.test(l) || /"Harga Emas"/i.test(l));
    if (emasLine) {
      const matchEmas = emasLine.match(/Rp\s*([\d\.,]+)/i);
      if (matchEmas) {
        const emasInt = parseToInt(matchEmas[1]);
        if (!isNaN(emasInt)) {
          document.getElementById("harga-emas").textContent = "Rp " + emasInt.toLocaleString("id-ID");
        }
      }
    }

    // --- Mata Uang Lain ---
    const kursTable = {
      AUD: "Dolar Australia",
      CAD: "Dolar Kanada",
      CHF: "Franc Swiss",
      DKK: "Krona Denmark",
      EUR: "Euro",
      GBP: "Pound Sterling Inggris",
      HKD: "Dolar Hong Kong",
      JPY: "Yen Jepang",
      MYR: "Ringgit Malaysia",
      NZD: "Dolar Selandia Baru",
      SAR: "Riyal Saudi",
      SEK: "Krona Swedia",
      SGD: "Dolar Singapura",
      THB: "Baht Thailand"
    };

    const tbodyKurs = document.getElementById("tbody-kurs");
    tbodyKurs.innerHTML = "";

    for (let code in kursTable) {
      // cari baris yang dimulai dengan kode
      const row = lines.find(l => new RegExp("^" + code + "\\b").test(l));
      if (!row) continue;

      // pecah berdasarkan whitespace (tab/spasi)
      const parts = row.split(/\s+/).filter(p => p);
      // biasanya format: CODE 10914 10941  -> parts[1] = beli
      // tapi juga bisa ada format decimal like 2146.63
      const candidate = parts[1] || parts[0].replace(code, '');
      const beliRaw = candidate || parts.slice(1).join(' ');

      const beliInt = parseToInt(beliRaw);

      const tr = document.createElement("tr");
      const name = `${code} (${kursTable[code]})`;
      const valueText = (!isNaN(beliInt)) ? `Rp ${beliInt.toLocaleString("id-ID")}` : '-';
      tr.innerHTML = `<td>${name}</td><td>${valueText}</td>`;
      tbodyKurs.appendChild(tr);
    }

    // --- Tanggal update otomatis ---
    const today = new Date();
    const tgl = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    document.getElementById("update-info").textContent = "Update terakhir: " + tgl;

  } catch (e) {
    console.error("Gagal ambil data:", e);
    document.getElementById("update-info").textContent = "Gagal memuat data.";
  }
}

fetchEmasUsd();
