function loadData() {
  const wilayah = document.getElementById("selectWilayah").value;
  const tbody = document.getElementById("tableData");
  const thead = document.querySelector("table thead tr");

  // === HEADER DINAMIS ===
  if (wilayah === "1") {
    thead.innerHTML = `
      <th class="p-3 text-left">Timestamp</th>
      <th class="p-3 text-left">Getaran</th>
      <th class="p-3 text-left">Suhu</th>
      <th class="p-3 text-left">Gas</th>
    `;
  } else {
    thead.innerHTML = `
      <th class="p-3 text-left">Timestamp</th>
      <th class="p-3 text-left">Getaran</th>
      <th class="p-3 text-left">Tekanan</th>
    `;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="p-4 text-center">Loading...</td>
    </tr>
  `;

  fetch(`/api/data/region${wilayah}`)
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="p-4 text-center">Data kosong</td>
          </tr>
        `;
        return;
      }

      data.forEach(row => {
        if (wilayah === "1") {
          tbody.innerHTML += `
            <tr>
              <td class="p-3">${row.timestamp}</td>
              <td class="p-3">${row.getaran ?? "-"}</td>
              <td class="p-3">${row.suhu ?? "-"}</td>
              <td class="p-3">${row.gas ?? "-"}</td>
            </tr>
          `;
        } else {
          tbody.innerHTML += `
            <tr>
              <td class="p-3">${row.timestamp}</td>
              <td class="p-3">${row.getaran ?? "-"}</td>
              <td class="p-3">${row.tekanan ?? "-"}</td>
            </tr>
          `;
        }
      });
    })
    .catch(() => {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center text-red-500">
            Gagal mengambil data
          </td>
        </tr>
      `;
    });
}

/* ================= CSV ================= */
function downloadCSV() {
  const wilayah = document.getElementById("selectWilayah").value;
  let csv = "";

  if (wilayah === "1") {
    csv = "Timestamp,Getaran,Suhu,Gas\n";
  } else {
    csv = "Timestamp,Getaran,Tekanan\n";
  }

  document.querySelectorAll("#tableData tr").forEach(row => {
    const cols = row.querySelectorAll("td");
    if (cols.length > 1) {
      csv += [...cols].map(c => c.innerText).join(",") + "\n";
    }
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `data_wilayah_${wilayah}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= PDF ================= */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const wilayah = document.getElementById("selectWilayah").value;

  doc.text(`Data Sensor Wilayah ${wilayah}`, 14, 15);

  const rows = [];
  document.querySelectorAll("#tableData tr").forEach(tr => {
    const cols = tr.querySelectorAll("td");
    if (cols.length > 1) {
      rows.push([...cols].map(c => c.innerText));
    }
  });

  const head =
    wilayah === "1"
      ? [["Timestamp", "Getaran", "Suhu", "Gas"]]
      : [["Timestamp", "Getaran", "Tekanan"]];

  doc.autoTable({
    head,
    body: rows,
    startY: 20
  });

  doc.save(`data_wilayah_${wilayah}.pdf`);
}

/* ================= INIT ================= */
loadData();
setInterval(loadData, 5000);
