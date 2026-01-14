// =======================
// UTILITY FORMAT TIME
// =======================
function formatTime(ts) {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// =======================
// CREATE CHART FUNCTION
// =======================
function createChart(canvasId, labelName, color) {
    let ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: labelName,
                data: [],
                borderColor: color,
                backgroundColor: color + '33',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxTicksLimit: 5,
                        font: { size: 8 }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        maxTicksLimit: 4,
                        font: { size: 8 }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// =======================
// INIT 4 CHART
// =======================
const chartGetaranW1 = createChart("chartGetaranW1", "Getaran", "#ef4444");
const chartSuhuW1    = createChart("chartSuhuW1", "Suhu", "#f97316");
const chartGasW1     = createChart("chartGasW1", "Gas CO₂", "#a855f7");

// =======================
// UPDATE CHART DATA
// =======================
function updateChartsW1() {
    fetch("/api/grafik/1")
        .then(res => res.json())
        .then(rows => {

            if (!Array.isArray(rows)) return;

            // Urutkan ASC (lama → baru)
            rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Ambil 15 data terakhir saja untuk grafik mini
            const limitedRows = rows.slice(-15);

            let labels = limitedRows.map(r => formatTime(r.timestamp));

            chartGetaranW1.data.labels = labels;
            chartSuhuW1.data.labels    = labels;
            chartGasW1.data.labels     = labels;

            chartGetaranW1.data.datasets[0].data = limitedRows.map(r => r.getaran ?? 0);
            chartSuhuW1.data.datasets[0].data    = limitedRows.map(r => r.suhu ?? 0);
            chartGasW1.data.datasets[0].data     = limitedRows.map(r => r.gas ?? 0);

            chartGetaranW1.update();
            chartSuhuW1.update();
            chartGasW1.update();
        })
        .catch(err => console.error("Error grafik W1:", err));
}

setInterval(updateChartsW1, 1000);
updateChartsW1();
