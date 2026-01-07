
 // --- AYARLAR ---
const SHEET_ID = "1Nc2616kCclHxdIBfxSdcL9XOGXF1vRG_JEtwNqQHkvw";

// --- ZAMAN ÇİZELGESİ ---
const schedule = [];
shludeVerisiGeldi = function (json) {
  const rows = json.table.rows.slice(1); // Başlıkları at
  const veriler = rows.map((row) => ({
    no: row.c[0] ? row.c[0].v : "",
    start: row.c[1] ? row.c[1].v : "",
    end: row.c[2] ? row.c[2].v : "",
  }));
  schedule.length = 0;
  veriler.forEach((item) => {
    if (item.no && item.start && item.end) {
      schedule.push({ no: item.no, start: item.start, end: item.end });
    }
  });
  renderTable();
};

renderTable();
function renderTable() {
  const tbody = document.getElementById("scheduleBody");
  if (!tbody) return; // Hata önleyici
  let html = "";
  schedule.forEach((item) => {
    html += `<tr id="row-${item.no}">
                        <td>${item.no}. Ders</td>
                        <td>${item.start}</td>
                        <td>${item.end}</td>
                        <td>40dk</td>
                      </tr>`;
  });
  tbody.innerHTML = html;
}

// --- CANLI SAAT VE DERS DURUMU ---

function updateClock() {
  const now = new Date();
  const dateEl = document.getElementById("dateTime");
  const clockEl = document.getElementById("liveClock");

  if (dateEl)
    dateEl.innerText = now.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  if (clockEl)
    clockEl.innerText = now.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
}

function updateSystem() {
  updateClock();
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const seconds = now.getSeconds();

  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("active-slot"));

  let activeFound = false;
  const statusEl = document.getElementById("bellStatus");
  const countEl = document.getElementById("countdown");

  if (!statusEl || !countEl) return;

  for (let i = 0; i < schedule.length; i++) {
    const lesson = schedule[i];

    const [sh, sm] = lesson.start.split(":").map(Number);
    const [eh, em] = lesson.end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (currentMin >= startMin && currentMin < endMin) {
      const diffMin = endMin - currentMin - 1;
      const diffSec = 60 - seconds;
      statusEl.innerText = `${lesson.no}. DERSİN BİTİMİNE:`;
      countEl.innerText = `${diffMin}:${
        diffSec < 10 ? "0" + diffSec : diffSec
      }`;

      const row = document.getElementById(`row-${lesson.no}`);
      if (row) row.classList.add("active-slot");

      countEl.style.color = "#dc3545"; // Kırmızı (Ders)
      activeFound = true;
      break;
    }

    if (i < schedule.length - 1) {
      const nextLessonStart = schedule[i + 1].start.split(":");
      const nextStartMin =
        parseInt(nextLessonStart[0]) * 60 + parseInt(nextLessonStart[1]);

      if (currentMin >= endMin && currentMin < nextStartMin) {
        const diffMin = nextStartMin - currentMin - 1;
        const diffSec = 60 - seconds;
        statusEl.innerText = `TENEFFÜS`;
        countEl.innerText = `${diffMin}:${
          diffSec < 10 ? "0" + diffSec : diffSec
        }`;
        countEl.style.color = "#198754"; // Yeşil (Teneffüs)
        activeFound = true;
        break;
      }
    }
  }
  if (!activeFound) {
    statusEl.innerText = "GİRİŞ / ÇIKIŞ";
    countEl.innerText = "--:--";
    countEl.style.color = "#333"; // Beyaz (Boş)
  }
}
setInterval(updateSystem, 1000);

// --- HAVA DURUMU ---
const LAT = 40.77; // Adapazarı koordinatı
const LON = 30.4;

function havaDurumunuGetir() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&timezone=auto&_=${Date.now()}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const weather = data.current_weather;
      const temp = Math.round(weather.temperature);
      const code = weather.weathercode;

      const tempEl = document.getElementById("js-weather-temp");
      const descEl = document.getElementById("js-weather-desc");
      const iconEl = document.getElementById("js-weather-icon");

      if (tempEl) tempEl.innerText = `${temp}°`;

      let durumText = "Bilinmiyor";
      let iconCode = "01d";

      if (code === 0) {
        durumText = "Açık";
        iconCode = "01d";
      } else if (code >= 1 && code <= 3) {
        durumText = "Bulutlu";
        iconCode = "02d";
      } else if (code >= 45 && code <= 48) {
        durumText = "Sisli";
        iconCode = "50d";
      } else if (code >= 51 && code <= 67) {
        durumText = "Yağmurlu";
        iconCode = "10d";
      } else if (code >= 71 && code <= 77) {
        durumText = "Karlı";
        iconCode = "13d";
      } else if (code >= 80 && code <= 82) {
        durumText = "Sağanak";
        iconCode = "09d";
      } else if (code >= 95) {
        durumText = "Fırtına";
        iconCode = "11d";
      }

      if (descEl) descEl.innerText = durumText;
      if (iconEl)
        iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    })
    .catch((err) => console.error("Hava hatası:", err));
}
havaDurumunuGetir();
setInterval(havaDurumunuGetir, 1800000);

// --- GOOGLE SHEETS ENTEGRASYONU ---

// 1. NÖBETÇİLER
// function nobetciVerisiGeldi(json) {
//   try {
//     const rows = json.table.rows;
//     const veriler = rows.map((row) => ({
//       gun: (row.c[0] ? row.c[0].v : "").trim(),
//       kat5: row.c[1] ? row.c[1].v : "",
//       kat4: row.c[2] ? row.c[2].v : "-",
//       kat3: row.c[3] ? row.c[3].v : "-",
//       kat2: row.c[4] ? row.c[4].v : "-",
//       zemin: row.c[5] ? row.c[5].v : "-",
//       bahce1: row.c[6] ? row.c[6].v : "-",
//       bahce2: row.c[7] ? row.c[7].v : "-",
//       atolye: row.c[8] ? row.c[8].v : "-",
//       amir: row.c[9] ? row.c[9].v : "-",
//     }));

//     const gunler = [
//       "Pazar",
//       "Pazartesi",
//       "Salı",
//       "Çarşamba",
//       "Perşembe",
//       "Cuma",
//       "Cumartesi",
//     ];
//     const bugun = gunler[new Date().getDay()];

//     console.log(veriler[5].gun);
//     const kayit = veriler.find((x) => x.gun === bugun);

//     const amirBox = document.getElementById("amir-box");
//     const tbody = document.getElementById("duty-body");

//     if (kayit) {
//       if (amirBox) amirBox.innerText = kayit.amir;
//       if (tbody) {
//         tbody.innerHTML = `
//             <tr><td class="duty-place">4. Kat Sol</td><td>${kayit.kat5}</td></tr>
//             <tr><td class="duty-place">4. Kat Sağ</td><td>${kayit.kat4}</td></tr>
//             <tr><td class="duty-place">3. Kat</td><td>${kayit.kat3}</td></tr>
//             <tr><td class="duty-place">2. Kat</td><td>${kayit.kat2}</td></tr>
//             <tr><td class="duty-place">Zemin</td><td>${kayit.zemin}</td></tr>
//             <tr><td class="duty-place">Bahçe 1</td><td>${kayit.bahce1}</td></tr>
//             <tr><td class="duty-place">Bahçe 2</td><td>${kayit.bahce2}</td></tr>
//             <tr><td class="duty-place">Atölye</td><td>${kayit.atolye}</td></tr>
//         `;
//       }
//     } else {
//       if (amirBox) amirBox.innerText = "-";
//       if (tbody)
//         tbody.innerHTML = `<tr><td colspan="2" class="text-center py-3 text-muted">Bugün için nöbet kaydı yok.</td></tr>`;
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }
function nobetciVerisiGeldi(json) {
  try {
    const rows = json.table.rows;

    const veriler = rows.map((row) => {
      // 1. ADIM: Google Sheets'ten gelen "Date(Y,M,D)" stringini gerçek tarihe çevirelim
      let tarihObjesi = null;
      if (row.c[0] && row.c[0].v) {
        // "Date(2026,0,4)" içindeki sayıları ayıklıyoruz (2026, 0, 4)
        const tarihDegerleri = row.c[0].v.toString().match(/\d+/g);
        if (tarihDegerleri) {
          // new Date(Yıl, Ay, Gün) formatında oluşturuyoruz
          tarihObjesi = new Date(
            tarihDegerleri[0], // Yıl
            tarihDegerleri[1], // Ay
            tarihDegerleri[2] // Gün
          );
        }
      }

      return {
        gun: tarihObjesi, // Artık burada "Pazartesi" yazısı değil, Tarih objesi var
        kat5: row.c[1] ? row.c[1].v : "",
        kat4: row.c[2] ? row.c[2].v : "-",
        kat3: row.c[3] ? row.c[3].v : "-",
        kat2: row.c[4] ? row.c[4].v : "-",
        zemin: row.c[5] ? row.c[5].v : "-",
        bahce1: row.c[6] ? row.c[6].v : "-",
        bahce2: row.c[7] ? row.c[7].v : "-",
        atolye: row.c[8] ? row.c[8].v : "-",
        amir: row.c[9] ? row.c[9].v : "-",
      };
    });

    // 2. ADIM: Bugünün tarihini sadece "Gün Ay Yıl" içerecek temiz bir formata (String) çeviriyoruz
    const bugunString = new Date().toDateString(); // Örnek: "Sun Jan 04 2026"

    // 3. ADIM: Listeyi tararken her satırın tarihini de stringe çevirip kıyaslıyoruz
    const kayit = veriler.find(
      (x) => x.gun && x.gun.toDateString() === bugunString
    );

    const amirBox = document.getElementById("amir-box");
    const tbody = document.getElementById("duty-body");

    if (kayit) {
      if (amirBox) amirBox.innerText = kayit.amir;
      if (tbody) {
        tbody.innerHTML = `
            <tr><td class="duty-place">4. Kat Sol</td><td>${kayit.kat5}</td></tr>
            <tr><td class="duty-place">4. Kat Sağ</td><td>${kayit.kat4}</td></tr>
            <tr><td class="duty-place">3. Kat</td><td>${kayit.kat3}</td></tr>
            <tr><td class="duty-place">2. Kat</td><td>${kayit.kat2}</td></tr>
            <tr><td class="duty-place">Zemin</td><td>${kayit.zemin}</td></tr>
            <tr><td class="duty-place">Bahçe 1</td><td>${kayit.bahce1}</td></tr>
            <tr><td class="duty-place">Bahçe 2</td><td>${kayit.bahce2}</td></tr>
            <tr><td class="duty-place">Atölye</td><td>${kayit.atolye}</td></tr>
        `;
      }
    } else {
      if (amirBox) amirBox.innerText = "-";
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-3 text-muted">Bugün için nöbet kaydı yok.</td></tr>`;
    }
  } catch (e) {
    console.log(e);
  }
}
// 2. HABERLER (Slider)
function haberVerisiGeldi(json) {
  const rows = json.table.rows;
  let sliderHTML = "";
  let first = true;

  rows.forEach((row) => {
    // const tarih = row.c[0] ? row.c[0].v : "";
    const baslik = row.c[1] ? row.c[1].v : "";
    // const icerik = row.c[2] ? row.c[2].v : "";
    const foto = row.c[3] ? row.c[3].v : "";

    if (foto && baslik) {
      sliderHTML += `
          <div class="carousel-item ${first ? "active" : ""} h-100">
              <img src="${foto}" class="slider-img" style="object-fit:cover; width:100%; height:100%;">
              <div class="carousel-caption d-none d-md-block" style="background: rgba(0,0,0,0.6); border-radius: 10px;">
                  <h5>${baslik}</h5>
              </div>
          </div>`;
      first = false;
    }
  });

  const carouselInner = document.querySelector(".carousel-inner");
  if (sliderHTML && carouselInner) carouselInner.innerHTML = sliderHTML;
}

// 3. DOĞUM GÜNLERİ
function dogumGunuVerisiGeldi(json) {
  const rows = json.table.rows;
  let html = "";
  rows.forEach((row) => {
    const ad = row.c[0] ? row.c[0].v : "";
    const sinif = row.c[1] ? row.c[1].v : "";
    // const tarih = row.c[2] ? row.c[2].v : "";

    if (ad) {
      html += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
              <div class="fw-bold"><span class="me-2">🎂</span>${ad}</div>
              <span class="badge bg-light text-dark border">${sinif}</span>
          </li>`;
    }
  });
  if (!html)
    html =
      '<li class="list-group-item text-center text-muted">Bugün doğum günü yok.</li>';

  const listEl = document.getElementById("dogum-gunu-listesi");
  if (listEl) listEl.innerHTML = html;
}

// 4. RAPORLULAR
function raporluVerisiGeldi(json) {
  if (!json || !json.table) {
    console.error("Raporlu verisi okunamadı veya boş!");
    return;
  }

  const rows = json.table.rows;

  // Veriyi işleyelim
  const veriler = rows.map((r) => ({
    gun: (r.c[0]?.v || "").trim(), // A Sütunu
    isimler: r.c[1]?.v || "", // B Sütunu
  }));

  const gunler = [
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma", // Bugün (02.01.2026) kod buraya bakacak
    "Cumartesi",
  ];

  const bugunIndex = new Date().getDay();
  const bugunIsmi = gunler[bugunIndex];

  const kayit = veriler.find(
    (x) => x.gun.toLowerCase() === bugunIsmi.toLowerCase()
  );

  let html = "";
  if (kayit && kayit.isimler) {
    const isimler = kayit.isimler.split(",");
    isimler.forEach((isim) => {
      if (isim.trim()) {
        html += `<li class="list-group-item fw-bold text-danger"><i class="bi bi-bandaid me-2"></i>${isim.trim()}</li>`;
      }
    });
  }

  if (!html)
    html = `<li class="list-group-item text-center text-success fw-bold"><i class="bi bi-check-circle me-2"></i>Raporlu öğretmen yok.</li>`;

  const listEl = document.getElementById("raporlu-listesi");
  if (listEl) listEl.innerHTML = html;
}

// 5. ÖZEL GÜNLER
document.addEventListener("DOMContentLoaded", () => {
  const specificDays = [
    { start: "01-01", end: "01-01", title: "Yılbaşı" },
    { start: "03-01", end: "03-07", title: "Yeşilay Haftası" },
    { start: "03-08", end: "03-08", title: "Dünya Kadınlar Günü" },
    { start: "03-12", end: "03-12", title: "İstiklal Marşı'nın Kabulü" },
    { start: "03-18", end: "03-18", title: "Çanakkale Zaferi" },
    {
      start: "04-23",
      end: "04-23",
      title: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
    },
    { start: "05-01", end: "05-07", title: "Bilişim Haftası" },
    {
      start: "05-19",
      end: "05-19",
      title: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    },
    { start: "05-29", end: "05-29", title: "İstanbul'un Fethi" },
    { start: "06-01", end: "06-07", title: "Çevre Haftası" },
    { start: "08-30", end: "08-30", title: "30 Ağustos Zafer Bayramı" },
    { start: "09-15", end: "09-22", title: "İlköğretim Haftası" },
    { start: "10-04", end: "10-04", title: "Hayvanları Koruma Günü" },
    { start: "10-29", end: "10-29", title: "Cumhuriyet Bayramı" },
    { start: "11-10", end: "11-16", title: "Atatürk Haftası" },
    { start: "11-24", end: "11-24", title: "Öğretmenler Günü" },
    { start: "12-27", end: "12-27", title: "Mehmet Akif Ersoy'u Anma Günü" },
  ];

  function updateSpecialDays() {
    const listElement = document.getElementById("ozel-gun-listesi");
    if (!listElement) return;

    listElement.innerHTML = "";

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const currentCode = `${month}-${day}`;

    let activeEvent = specificDays.find(
      (d) => currentCode >= d.start && currentCode <= d.end
    );

    if (activeEvent) {
      const li = document.createElement("li");
      li.className = "list-group-item ozel-gun-item bg-light";
      li.innerHTML = `<span class="badge bg-danger mb-2">BUGÜN</span><br>${activeEvent.title}`;
      listElement.appendChild(li);
    } else {
      let nextEvent = specificDays.find((d) => d.start > currentCode);
      if (!nextEvent) nextEvent = specificDays[0];

      if (nextEvent) {
        const li = document.createElement("li");
        li.className = "list-group-item ozel-gun-item";
        const [m, d] = nextEvent.start.split("-");
        const dateObj = new Date(today.getFullYear(), m - 1, d);
        const dateStr = dateObj.toLocaleDateString("tr-TR", {
          month: "long",
          day: "numeric",
        });

        li.innerHTML = `<span class="tarih-badge">YAKLAŞIYOR (${dateStr})</span>${nextEvent.title}`;
        listElement.appendChild(li);
      }
    }
  }

  updateSpecialDays();
  setInterval(updateSpecialDays, 3600000);
});

// --- 6. DUYURULAR (YENİ EKLENEN KISIM) ---
let duyuruListesi = [];
let duyuruIndex = 0;

function duyuruVerisiGeldi(json) {
  const rows = json.table.rows;
  // Sadece A Sütununu (c[0]) alıyoruz, boş olmayanları filtreliyoruz
  duyuruListesi = rows.map((r) => r.c[0]?.v).filter((v) => v);

  if (duyuruListesi.length === 0) {
    duyuruListesi = ["Aktif duyuru bulunmamaktadır."];
  }

  // Eğer döngü henüz başlamadıysa başlat
  const element = document.getElementById("duyuru-metni");
  if (element && !element.classList.contains("animasyon-basladi")) {
    element.classList.add("animasyon-basladi");
    duyuruDongusu();
    setInterval(duyuruDongusu, 5000); // 5 Saniyede bir değiştir
  }
}

function duyuruDongusu() {
  const element = document.getElementById("duyuru-metni");
  if (!element) return;

  element.classList.remove("aktif"); // Önce silikleştir
  setTimeout(() => {
    element.innerHTML = duyuruListesi[duyuruIndex]; // Yazıyı değiştir
    element.classList.add("aktif"); // Görünür yap
    // Sıradaki duyuruya geç
    duyuruIndex = (duyuruIndex + 1) % duyuruListesi.length;
  }, 500); // CSS transition süresi kadar bekle
}

// --- VERİ ÇEKİCİ (ORTAK) ---
function loadData(sheetName, query, callbackName) {
  const old = document.getElementById("script-" + sheetName);
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "script-" + sheetName;
  // query: select * gibi sorgular, callbackName: veriyi karşılayacak fonksiyon
  script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${sheetName}&tq=${encodeURIComponent(
    query
  )}&tqx=responseHandler:${callbackName}&_=${Date.now()}`;
  document.body.appendChild(script);
}

// --- VERİLERİ YÜKLEME / GÜNCELLEME ---
function refreshAll() {
  // Sheet sekme isimlerinin (Sayfa1, Haberler vs) Excel ile BİREBİR aynı olduğundan emin olun.
  loadData("Sayfa1", "", "nobetciVerisiGeldi");
  loadData("Haberler", "", "haberVerisiGeldi");
  loadData("DogumGunleri", "", "dogumGunuVerisiGeldi");
  loadData("Raporlular", "", "raporluVerisiGeldi");
  loadData("DersProgrami", "", "shludeVerisiGeldi");

  // Düzeltilen Kısım: Sorgu 'select A' (Sadece A sütunu), Fonksiyon 'duyuruVerisiGeldi'
  loadData("Duyurular", "", "duyuruVerisiGeldi");
}

refreshAll();
setInterval(refreshAll, 60000); // 1 Dakikada bir verileri tazele

// 1 Saatte bir sayfayı komple yenile (Bellek temizliği için iyi bir pratik)
setTimeout(() => window.location.reload(), 3600000);
document.addEventListener("DOMContentLoaded", () => {
  author = document.getElementById("author");
  author.innerHTML =
    'Hazırlayan: <i class="bi bi-code-slash"></i> Kadir KAVAL<i class="bi bi-code-slash"></i>';
});
