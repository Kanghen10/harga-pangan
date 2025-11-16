async function fetchEmasUsd() {
  const url = "https://kanghen10.github.io/harga-pangan/panganemas/emaskurs.txt";

  try {
    const res = await fetch(url);
    const text = await res.text();

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    // --- USD ---
    const usdLine = lines[0];
    const usdValue = usdLine.match(/Rp([\d.]+)/)[1].replace(/\./g, "");
    const usd = parseInt(usdValue);

    document.getElementById("kurs-usd").textContent =
      "Rp " + usd.toLocaleString("id-ID");

    // --- Harga Emas ---
    const emasLine = lines[1];
    const emasValue = emasLine.match(/Rp([\d.]+)/)[1].replace(/\./g, "");
    const emas = parseInt(emasValue);

    document.getElementById("harga-emas").textContent =
      "Rp " + emas.toLocaleString("id-ID");

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

    for (let code in kursTable) {
      const row = lines.find(l => l.startsWith(code));
      if (!row) continue;

      const parts = row.split(/\s+/);
      const beli = parts[1].replace(/\./g, "").replace(/,/g, "");
      const beliNumber = parseFloat(beli);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${kursTable[code]}</td>
        <td>Rp ${beliNumber.toLocaleString("id-ID")}</td>
      `;
      tbodyKurs.appendChild(tr);
    }

    // --- Tanggal update otomatis ---
    const today = new Date();
    const tgl = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    document.getElementById("update-info").textContent =
      "Update terakhir: " + tgl;

  } catch (e) {
    console.error("Gagal ambil data:", e);
    document.getElementById("update-info").textContent = "Gagal memuat data.";
  }
}

fetchEmasUsd();
