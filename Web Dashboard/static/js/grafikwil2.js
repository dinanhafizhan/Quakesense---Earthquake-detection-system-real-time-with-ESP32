// =======================
// SETUP CHART FUNCTION
// =======================
function createChart(canvasId, labelName, borderColor) {
    return new Chart(document.getElementById(canvasId).getContext("2d"), {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: labelName,
                data: [],
                borderColor: borderColor,
                backgroundColor: borderColor + '33',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            animation: false,
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
// BUAT 2 CHART UNTUK W2
// =======================
const chartGetaranW2 = createChart("chartGetaranW2", "Getaran W2", "#ef4444");
const chartTekananW2 = createChart("chartTekananW2", "Tekanan W2", "#3b82f6");
// =======================
// FUNGSI UPDATE REALTIME W2
// =======================
function updateChartsW2() {
    fetch("/api/grafik/2")  
        .then(res => res.json())
        .then(rows => {

            if (!Array.isArray(rows)) return;

            // Urutkan ASC (lama → baru)
            rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Ambil 15 data terakhir saja untuk grafik mini
            const limitedRows = rows.slice(-15);

            let labels = limitedRows.map(r => {
                if (!r.timestamp) return "-";
                return new Date(r.timestamp).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
            });

            chartGetaranW2.data.labels = labels;
            chartTekananW2.data.labels = labels;

            chartGetaranW2.data.datasets[0].data = limitedRows.map(r => r.getaran || 0);
            chartTekananW2.data.datasets[0].data = limitedRows.map(r => r.tekanan || 0);

            chartGetaranW2.update();
            chartTekananW2.update();
        })
        .catch(err => console.error("Error grafik W2:", err));
}

// Update tiap detik
setInterval(updateChartsW2, 1000);
updateChartsW2();
