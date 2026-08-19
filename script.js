const STORAGE_KEY = 'jee_370r_tracker_entries';

let entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  updateDashboard();
  startCountdown();
});

// Countdown Timer
function startCountdown() {
  const targetDate = new Date('May 18, 2026 09:00:00').getTime();
  
  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('countdown').innerText = 'JEE Advanced Exam Today!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown').innerText = 
      `JEE Advanced: ${days}d ${hours}h ${mins}m ${secs}s remaining`;
  }

  update();
  setInterval(update, 1000);
}

// Form Submit Handler
document.getElementById('trackerForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const newEntry = {
    date: document.getElementById('date').value.trim(),
    lecTotal: Number(document.getElementById('lecTotal').value) || 0,
    phyHw: Number(document.getElementById('phyHw').value) || 0,
    chemHw: Number(document.getElementById('chemHw').value) || 0,
    mathHw: Number(document.getElementById('mathHw').value) || 0,
    chemDpp: Number(document.getElementById('chemDpp').value) || 0,
    mathDpp: Number(document.getElementById('mathDpp').value) || 0,
  };

  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  
  renderTable();
  updateDashboard();
  e.target.reset();
});

// Render UI Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  entries.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.lecTotal}</td>
      <td>${item.phyHw}</td>
      <td>${item.chemHw}</td>
      <td>${item.mathHw}</td>
      <td>${item.chemDpp}</td>
      <td>${item.mathDpp}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Update Totals and Metrics
function updateDashboard() {
  let totalQs = 0;
  entries.forEach(e => {
    totalQs += (e.phyHw + e.chemHw + e.mathHw + e.chemDpp + e.mathDpp);
  });

  document.getElementById('totalQuestions').innerText = totalQs;
}

// Reset Local Data
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all logged progress data?')) {
    entries = [];
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
    updateDashboard();
  }
});

// PDF Generation mirroring template output
document.getElementById('downloadPdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('15 DAY 370R JEE ADVANCED TRACKER', 14, 15);

  const headers = [[
    'DATE',
    'LEC TOTAL',
    'PHY HW/\nCLLASS ILLU',
    'CHEM HW/\nCLASS ILLU',
    'MATH HW/\nCLASS ILLU',
    'CHEM DPP',
    'MATH DPP'
  ]];

  // Fill up logged entries into max 15 rows
  const pdfRows = entries.slice(0, 15).map(e => [
    e.date,
    e.lecTotal,
    e.phyHw,
    e.chemHw,
    e.mathHw,
    e.chemDpp,
    e.mathDpp
  ]);

  // Fill empty rows if entries are under 15
  while (pdfRows.length < 15) {
    pdfRows.push(['', '', '', '', '', '', '']);
  }

  doc.autoTable({
    startY: 22,
    head: headers,
    body: pdfRows,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [0, 0, 0], textColor: 255 }
  });

  doc.save('370R-JEE-Advanced-Tracker.pdf');
});
