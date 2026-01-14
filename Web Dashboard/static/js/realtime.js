
// =======================
// VARIABEL TREND SEBELUMNYA
// =======================
let prevGetaranW1 = null;
let prevSuhuW1 = null;
let prevGasW1 = null;

let prevGetaranW2 = null;
let prevTekananW2 = null;

// =======================
// FORMAT WAKTU UPDATE
// =======================
function getTimeNow() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// =======================
// TREND PANAH + WARNA
// =======================
function updateTrend(trendEl, current, previous) {
  if (!trendEl || previous === null || current === null) return;

  trendEl.className = "text-sm";

  if (current > previous) {
    trendEl.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    trendEl.classList.add("text-red-500");
  } else if (current < previous) {
    trendEl.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
    trendEl.classList.add("text-green-500");
  } else {
    trendEl.innerHTML = '<i class="fa-solid fa-minus"></i>';
    trendEl.classList.add("text-gray-400");
  }
}

// =======================
// LOAD SENSOR REALTIME
// =======================
function loadRealtime() {
  // ==== WILAYAH 1 ====
  fetch("/api/sensor/1")
    .then(res => res.json())
    .then(w1 => {
      document.getElementById("valGetaranW1").innerText = w1.getaran ?? "-";
      document.getElementById("valSuhuW1").innerText    = w1.suhu ?? "-";
      document.getElementById("valGasW1").innerText     = w1.gas ?? "-";

      updateTrend(trendGetaranW1, w1.getaran, prevGetaranW1);
      updateTrend(trendSuhuW1, w1.suhu, prevSuhuW1);
      updateTrend(trendGasW1, w1.gas, prevGasW1);

      prevGetaranW1 = w1.getaran;
      prevSuhuW1    = w1.suhu;
      prevGasW1     = w1.gas;

      timeGetaranW1.innerText = "Update: " + getTimeNow();
      timeSuhuW1.innerText    = "Update: " + getTimeNow();
      timeGasW1.innerText     = "Update: " + getTimeNow();
    });

  // ==== WILAYAH 2 ====
  fetch("/api/sensor/2")
    .then(res => res.json())
    .then(w2 => {
      document.getElementById("valGetaranW2").innerText = w2.getaran ?? "-";
      document.getElementById("valTekananW2").innerText = w2.tekanan ?? "-";

      updateTrend(trendGetaranW2, w2.getaran, prevGetaranW2);
      updateTrend(trendTekananW2, w2.tekanan, prevTekananW2);

      prevGetaranW2 = w2.getaran;
      prevTekananW2 = w2.tekanan;

      timeGetaranW2.innerText = "Update: " + getTimeNow();
      timeTekananW2.innerText = "Update: " + getTimeNow();
    });
}

// =======================
// JAM & TANGGAL REALTIME
// =======================
function updateClock() {
  const now = new Date();

  document.getElementById("jamRealtime").innerText =
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  document.getElementById("tanggalRealtime").innerText =
    now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
}

// =======================
// STATUS GEMPA
// =======================
function loadStatus(wilayah) {
  fetch(`/api/status/${wilayah}`)
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById(
        wilayah === 1 ? "statusW1" : "statusW2"
      );

      // reset class
      el.className = "px-4 py-1 rounded-full font-semibold";

      const status = data.status;

      // Helper: update buzzer UI based on alert status
      const updateBuzzerUI = (wil, isOn) => {
        const buzzerEl = document.getElementById(
          wil === 1 ? "statusBuzzerW1" : "statusBuzzerW2"
        );
        if (!buzzerEl) return; // halaman grafik tidak punya buzzer

        // Reset dasar
        buzzerEl.className = "px-4 py-1 rounded-full text-xs font-semibold";

        if (isOn) {
          buzzerEl.innerText = "ON";
          buzzerEl.classList.add("bg-green-100", "text-green-600");
        } else {
          buzzerEl.innerText = "OFF";
          buzzerEl.classList.add("bg-red-100", "text-red-600");
        }
      };

      // === PRIORITAS STATUS ===
      if (status.includes("GEMPA") && status.includes("WASPADA")) {
        el.innerText = "⚠ WASPADA + GEMPA TERDETEKSI";
        el.classList.add(
          "bg-red-700",
          "text-white",
          "animate-pulse"
        );
        updateBuzzerUI(wilayah, true);

      } else if (status.includes("GEMPA")) {
        el.innerText = "⚠ GEMPA TERDETEKSI";
        el.classList.add(
          "bg-red-600",
          "text-white",
          "animate-pulse"
        );
        updateBuzzerUI(wilayah, true);

      } else if (status.includes("WASPADA")) {
        el.innerText = "⚠ WASPADA";
        el.classList.add(
          "bg-yellow-400",
          "text-black"
        );
        updateBuzzerUI(wilayah, true);

      } else {
        el.innerText = "✔ AMAN";
        el.classList.add(
          "bg-green-500",
          "text-white"
        );
        updateBuzzerUI(wilayah, false);
      }
    });
}

function servoOpen(region) {
  fetch(`/api/servo/${region}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      angle: 90   
    })
  })
  .then(res => res.json())
  .then(data => console.log("Servo OPEN:", data));
}

function servoClose(region) {
  fetch(`/api/servo/${region}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      angle: 0
    })
  })
  .then(res => res.json())
  .then(data => console.log("Servo CLOSE:", data));
}


function loadStats() {
  fetch("/api/data/stats")
    .then(res => res.json())
    .then(data => {

      /* ================= WILAYAH 1 ================= */
      if (data.region1) {
        document.getElementById("avgGetaranW1").innerText =
          data.region1.avg_getaran?.toFixed(2) ?? "-";

        document.getElementById("maxGetaranW1").innerText =
          data.region1.max_getaran ?? "-";

        document.getElementById("avgSuhuW1").innerText =
          data.region1.avg_suhu?.toFixed(1) ?? "-";

        document.getElementById("maxSuhuW1").innerText =
          data.region1.max_suhu ?? "-";

        document.getElementById("avgGasW1").innerText =
          data.region1.avg_gas?.toFixed(3) ?? "-";

        document.getElementById("maxGasW1").innerText =
          data.region1.max_gas ?? "-";
      }

      /* ================= WILAYAH 2 ================= */
      if (data.region2) {
        document.getElementById("avgGetaranW2").innerText =
          data.region2.avg_getaran?.toFixed(2) ?? "-";

        document.getElementById("maxGetaranW2").innerText =
          data.region2.max_getaran ?? "-";

        document.getElementById("avgTekananW2").innerText =
          data.region2.avg_tekanan?.toFixed(2) ?? "-";

        document.getElementById("maxTekananW2").innerText =
          data.region2.max_tekanan ?? "-";
      }
    })
    .catch(err => console.error("Gagal ambil stats:", err));
}

/* load awal */
loadStats();

/* refresh tiap 15 detik */
setInterval(loadStats, 15000);


// load pertama
loadStats();

// auto refresh tiap 10 detik
setInterval(loadStats, 10000);



// auto refresh tiap 10 detik
setInterval(loadStats, 10000);


// =======================
// INTERVAL (BERSIH & RAPIH)
// =======================
updateClock();
loadRealtime();
loadStatus(1);
loadStatus(2);

setInterval(updateClock, 1000);      // Jam
setInterval(loadRealtime, 1000);     // Sensor
setInterval(() => {                  // Status
  loadStatus(1);
  loadStatus(2);
}, 3000);

