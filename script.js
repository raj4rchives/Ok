const KEY = "jee370rTrackerV3";
const LEGACY_V2 = "jee370rTrackerV2";
const LEGACY_V1 = "jee370rTrackerV1";

// Tere naye HTML <thead> order ke exact same mapping:
const fields = [
  "date",      // 1. DATE
  "lec",       // 2. LEC TOTAL
  "phyWork",   // 3. PHY HW / CLASS ILLU
  "chemWork",  // 4. CHEM HW / CLASS ILLU
  "mathWork",  // 5. MATH HW / CLASS ILLU
  "phyDpp",    // 6. PHY DPP (Naya order)
  "chemDpp",   // 7. CHEM DPP
  "mathDpp",   // 8. MATH DPP
  "phyPyq",    // 9. PHY PYQ
  "chemPyq",   // 10. CHEM PYQ
  "mathPyq"    // 11. MATH PYQ
];


const tbody = document.querySelector("#tracker tbody");

// 1. Helper Functions
function num(v) {
  const m = String(v || "").match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function sumField(data, field) {
  return data.reduce((s, r) => s + num(r[field]), 0);
}

function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function combine(a, b) {
  const x = String(a || "").trim(), y = String(b || "").trim();
  if (x && y) return `${x} + ${y}`;
  return x || y;
}

// 2. Table Rows Manager
function makeRows() {
  if (!tbody) return;
  tbody.innerHTML = "";
  addRows(15);
}

function addRows(count = 15) {
  if (!tbody) return;
  const start = tbody.children.length;
  for (let i = 0; i < count; i++) {
    const tr = document.createElement("tr");
    tr.dataset.i = start + i;
    tr.innerHTML = fields.map((f, j) => 
      `<td><input data-f="${f}" ${j === 0 ? 'type="date"' : ''} inputmode="numeric"></td>`
    ).join("");
    tbody.appendChild(tr);
    
    tr.querySelectorAll("input").forEach(x => {
      x.addEventListener("input", () => {
        updateStats();
        autoExtendRows();
      });
    });
  }
}

function rowsData() {
  if (!tbody) return [];
  return [...tbody.querySelectorAll("tr")].map(tr => {
    const o = {};
    tr.querySelectorAll("input").forEach(i => o[i.dataset.f] = i.value);
    return o;
  });
}

function setData(data) {
  makeRows();
  (data || []).forEach((o, i) => {
    while (i >= tbody.children.length) addRows(15);
    const tr = tbody.children[i];
    fields.forEach(f => {
      if (o[f] != null) {
        const input = tr.querySelector(`[data-f="${f}"]`);
        if (input) input.value = o[f];
      }
    });
  });
  updateStats();
}

function autoExtendRows() {
  if (!tbody) return;
  const rows = [...tbody.children];
  const last = rows.slice(-3);
  if (last.some(tr => [...tr.querySelectorAll("input")].some(i => i.value.trim() !== ""))) {
    addRows(15);
  }
}

// 3. Migration & LocalStorage Logic
function migrateData() {
  const v3 = JSON.parse(localStorage.getItem(KEY) || "null");
  if (v3 && Array.isArray(v3.rows)) return v3;

  const v2 = JSON.parse(localStorage.getItem(LEGACY_V2) || "null");
  if (v2 && Array.isArray(v2.rows)) {
    return {
      startDate: v2.startDate || "",
      examDate: v2.examDate || "",
      rows: v2.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: combine(r.phyHw, r.phyIllu),
        chemWork: combine(r.chemHw, r.chemIllu),
        mathWork: combine(r.mathHw, r.mathIllu),
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.phyPyq || "", chemPyq: r.chemPyq || "", mathPyq: r.mathPyq || ""
      }))
    };
  }

  const v1 = JSON.parse(localStorage.getItem(LEGACY_V1) || "null");
  if (v1 && Array.isArray(v1.rows)) {
    return {
      startDate: v1.startDate || "",
      examDate: v1.examDate || "",
      rows: v1.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: r.phy || "", chemWork: r.chem || "", mathWork: r.math || "",
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.pyq || "", chemPyq: "", mathPyq: ""
      }))
    };
  }
  return null;
}

function save() {
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  localStorage.setItem(KEY, JSON.stringify({
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData()
  }));
  alert("Progress saved on this device.");
}

function load() {
  const x = migrateData();
  if (!x) { alert("No saved tracker found."); return; }
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  if (startEl) startEl.value = x.startDate || "";
  if (examEl) examEl.value = x.examDate || examEl.value;
  setData(x.rows);
  save();
}

function clearAll() {
  if (!confirm("Clear all study data?")) return;
  localStorage.removeItem(KEY);
  const startEl = document.querySelector("#startDate");
  if (startEl) startEl.value = "";
  setData([]);
}

function fillDates() {
  const startEl = document.querySelector("#startDate");
  const s = startEl ? startEl.value : "";
  if (!s) { alert("Select a start date first."); return; }
  const d = new Date(s + "T00:00:00");
  [...tbody.children].forEach((tr, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const dateInput = tr.querySelector('[data-f="date"]');
    if (dateInput) dateInput.value = x.toISOString().slice(0, 10);
  });
  updateStats();
}

// 4. Statistics Calculation
function updateStats() {
  const data = rowsData();
  const done = data.filter(r => Object.values(r).some(v => String(v || "").trim() !== "")).length;
  const lec = sumField(data, "lec");

  const phyWork = sumField(data, "phyWork");
  const chemWork = sumField(data, "chemWork");
  const mathWork = sumField(data, "mathWork");
  const chemDpp = sumField(data, "chemDpp");
  const mathDpp = sumField(data, "mathDpp");
  const phyPyq = sumField(data, "phyPyq");
  const chemPyq = sumField(data, "chemPyq");
  const mathPyq = sumField(data, "mathPyq");

  const phy = phyWork + phyPyq;
  const chem = chemWork + chemDpp + chemPyq;
  const math = mathWork + mathDpp + mathPyq;
  const overall = phy + chem + math;
  const pyq = phyPyq + chemPyq + mathPyq;
  const dpp = chemDpp + mathDpp;
  const avg = done ? Math.round(overall / done) : 0;
  const target = done ? Math.min(100, Math.round(overall / (done * 70) * 100)) : 0;

  put("daysDone", done);
  put("lecSum", lec);
  put("questionSum", overall);
  put("pyqSum", pyq);
  put("avgQ", avg);
  put("qTarget", target + "%");

  put("phyWorkSum", phyWork); put("chemWorkSum", chemWork); put("mathWorkSum", mathWork); put("workSum", phyWork + chemWork + mathWork);
  put("phyDppSum", 0); put("chemDppSum", chemDpp); put("mathDppSum", mathDpp); put("dppSum", dpp);
  put("phyPyqSum", phyPyq); put("chemPyqSum", chemPyq); put("mathPyqSum", mathPyq); put("pyqDetailSum", pyq);
  put("phyTotal", phy); put("chemTotal", chem); put("mathTotal", math); put("overallTotal", overall);
}

// 5. Monthly Reporting Helpers
function monthKey(date) { return String(date || '').slice(0, 7); }
function getMonths() { return [...new Set(rowsData().map(r => monthKey(r.date)).filter(Boolean))].sort(); }
function phaseNumber(key) { const keys = getMonths(); const i = keys.indexOf(key); return i < 0 ? '—' : i + 1; }
function monthRows(key) { return rowsData().filter(r => monthKey(r.date) === key); }

function monthSummary(key) {
  const d = monthRows(key);
  const done = d.filter(r => Object.values(r).some(v => String(v || '').trim() !== '')).length;
  const sum = f => d.reduce((a, r) => a + num(r[f]), 0);
  const phyWork = sum('phyWork'), chemWork = sum('chemWork'), mathWork = sum('mathWork');
  const chemDpp = sum('chemDpp'), mathDpp = sum('mathDpp');
  const phyPyq = sum('phyPyq'), chemPyq = sum('chemPyq'), mathPyq = sum('mathPyq');
  const phy = phyWork + phyPyq, chem = chemWork + chemDpp + chemPyq, math = mathWork + mathDpp + mathPyq;
  return { days: done, lec: sum('lec'), phyWork, chemWork, mathWork, chemDpp, mathDpp, phyPyq, chemPyq, mathPyq, phy, chem, math, total: phy + chem + math, pyq: phyPyq + chemPyq + mathPyq };
}

function updateCountdown() {
  const input = document.querySelector('#examDate');
  const out = document.querySelector('#countdown');
  const label = document.querySelector('#examDateLabel');
  if (!input || !out) return;
  const v = input.value;
  if (!v) { out.textContent = '—'; if (label) label.textContent = 'Set your target exam date above'; return; }
  const target = new Date(v + 'T00:00:00');
  const now = new Date();
  target.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - now) / 86400000);
  out.textContent = days > 0 ? `${days} DAYS LEFT` : days === 0 ? 'EXAM DAY' : 'DATE PASSED';
  if (label) label.textContent = target.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// 6. Exports & Import
function exportJSON() {
  const startEl = document.querySelector('#startDate');
  const examEl = document.querySelector('#examDate');
  const payload = {
    version: 5,
    exportedAt: new Date().toISOString(),
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jee-tracker-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const x = JSON.parse(r.result);
      if (!Array.isArray(x.rows)) throw new Error('Invalid backup');
      const startEl = document.querySelector('#startDate');
      const examEl = document.querySelector('#examDate');
      if (startEl) startEl.value = x.startDate || '';
      if (examEl && x.examDate) examEl.value = x.examDate;
      setData(x.rows);
      save();
      alert('JSON imported successfully.');
    } catch (e) {
      alert('Invalid JSON backup.');
    }
  };
  r.readAsText(file);
}

async function makeMonthlyPDF() {
  const reportEl = document.querySelector('#reportMonth');
  const key = reportEl ? reportEl.value : "";
  if (!key) { alert('Select a report month first.'); return; }
  const rows = monthRows(key);
  if (!rows.length) { alert('No study data found for this month.'); return; }
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const m = monthSummary(key);
  const [y, mo] = key.split('-');
  const name = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
  pdf.text(`370R JEE Tracker — Phase ${phaseNumber(key)} — ${name}`, 14, 16);
  pdf.setFontSize(10);
  pdf.text(`Study days: ${m.days}   Lectures: ${m.lec}   Total Questions: ${m.total}   PYQs: ${m.pyq}   Avg Q/day: ${m.days ? Math.round(m.total / m.days) : 0}`, 14, 24);
  pdf.setFontSize(11);
  pdf.text('Subject summary', 14, 34);
  
  const rowsSummary = [
    ['HW / CLASS ILLU', m.phyWork, m.chemWork, m.mathWork, m.phyWork + m.chemWork + m.mathWork],
    ['DPP', 0, m.chemDpp, m.mathDpp, m.chemDpp + m.mathDpp],
    ['PYQ', m.phyPyq, m.chemPyq, m.mathPyq, m.pyq],
    ['TOTAL', m.phy, m.chem, m.math, m.total]
  ];
  
  if (pdf.autoTable) pdf.autoTable({ startY: 38, head: [['TYPE', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'TOTAL']], body: rowsSummary, theme: 'grid' });
  let yy = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 45;
  pdf.setFontSize(10); pdf.text('Daily log', 14, yy); yy += 5;
  
  const body = rows.map(r => [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq]);
  if (pdf.autoTable) pdf.autoTable({ startY: yy, head: [['DATE', 'LEC', 'PHY HW/ILLU', 'CHEM HW/ILLU', 'MATH HW/ILLU', 'CHEM DPP', 'MATH DPP', 'PHY PYQ', 'CHEM PYQ', 'MATH PYQ']], body, theme: 'grid', styles: { fontSize: 7 } });
  
  pdf.save(`JEE-Tracker-Phase-${phaseNumber(key)}-${key}.pdf`);
}

async function makePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const img = new Image();
  img.src = "tracker-template.png";
  
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    pdf.addImage(img, "PNG", 0, 0, 210, 297);
  } catch (e) {
    console.warn("Template image not found or blocked. Generating standard PDF layout instead.");
  }

  const sx = 210 / 1086, sy = 297 / 1536;
  const cols = [20, 126, 232, 338, 444, 550, 656, 762, 868, 974, 1080];
  const centers = cols.slice(0, -1).map((x, i) => ((x + cols[i + 1]) / 2) * sx);
  const tableTop = 264, rowH = (1398 - 264) / 15;
  const data = rowsData();

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(12);

  data.forEach((r, i) => {
    if (i >= 15) return;
    const y = (tableTop + (i + .5) * rowH) * sy + 1.7;
    const vals = [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq];
    
    vals.forEach((v, j) => {
      if (v === "" || v == null) return;
      let text = String(v);
      if (j === 0 && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [yy, mm, dd] = text.split("-"); text = `${dd}/${mm}`;
      }
      const maxChars = j === 0 ? 10 : 6;
      if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
      pdf.text(text, centers[j], y, { align: "center", maxWidth: (cols[j + 1] - cols[j]) * sx - 1 });
    });
  });

  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

// 7. Event Listeners Setup
document.addEventListener("DOMContentLoaded", () => {
  const bindClick = (id, fn) => { const el = document.querySelector(id); if (el) el.onclick = fn; };
  
  bindClick("#saveBtn", save);
  bindClick("#loadBtn", load);
  bindClick("#clearBtn", clearAll);
  bindClick("#datesBtn", fillDates);
  bindClick("#addBtn", () => addRows(15));
  bindClick("#pdfBtn", makePDF);
  bindClick("#monthPdfBtn", makeMonthlyPDF);
  bindClick("#jsonExportBtn", exportJSON);
  
  const jsonImport = document.querySelector("#jsonImport");
  if (jsonImport) jsonImport.addEventListener("change", e => { if (e.target.files[0]) importJSON(e.target.files[0]); });
  
  const examDateEl = document.querySelector("#examDate");
  if (examDateEl) examDateEl.addEventListener("change", () => { updateCountdown(); save(); });

  setInterval(updateCountdown, 60000);

  // Initialize
  makeRows();
  const saved = migrateData();
  if (saved) {
    const startEl = document.querySelector("#startDate");
    const examEl = document.querySelector("#examDate");
    if (startEl) startEl.value = saved.startDate || "";
    if (examEl) examEl.value = saved.examDate || examEl.value;
    setData(saved.rows);
  }
  updateCountdown();
  updateStats();
});
    

  async function makePDF() {
  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDFLib) {
    alert("PDF library missing h! Index.html me script tags check kr.");
    return;
  }

  const pdf = new jsPDFLib({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Title Block
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("370R JEE ADVANCED TRACKER", 14, 12);
  pdf.setFontSize(8);
  pdf.text("15-DAY QUESTION & LECTURE LOG", 14, 16);

  // 2. Yellow Headers (14 Columns)
  const headers = [[
    "DATE", "LEC",
    "PHY HW", "PHY ILLU",
    "CHEM HW", "CHEM ILLU",
    "MATH HW", "MATH ILLU",
    "PHY DPP", "CHEM DPP", "MATH DPP",
    "PHY PYQ", "CHEM PYQ", "MATH PYQ"
  ]];

  // 3. Extract 15 Rows
  const rows = [...tbody.children].slice(0, 15).map(tr => {
    const getVal = f => {
      const inp = tr.querySelector(`[data-f="${f}"]`);
      return inp ? inp.value : "";
    };

    return [
      getVal("date"),
      getVal("lec"),
      getVal("phyWork"), "",
      getVal("chemWork"), "",
      getVal("mathWork"), "",
      getVal("phyDpp"),
      getVal("chemDpp"),
      getVal("mathDpp"),
      getVal("phyPyq"),
      getVal("chemPyq"),
      getVal("mathPyq")
    ];
  });

  // 4. Totals Calculation
  const data = rowsData().slice(0, 15);
  const totalLec = sumField(data, "lec");
  const pWork = sumField(data, "phyWork"), cWork = sumField(data, "chemWork"), mWork = sumField(data, "mathWork");
  const pDpp = sumField(data, "phyDpp"), cDpp = sumField(data, "chemDpp"), mDpp = sumField(data, "mathDpp");
  const pPyq = sumField(data, "phyPyq"), cPyq = sumField(data, "chemPyq"), mPyq = sumField(data, "mathPyq");

  const totalPyqs = pPyq + cPyq + mPyq;
  const totalQs = pWork + cWork + mWork + pDpp + cDpp + mDpp + totalPyqs;

  // 5. Single AutoTable (Foot option se exact column width lock ho jayegi)
  pdf.autoTable({
    startY: 19,
    head: headers,
    body: rows,
    foot: [[
      "TOTAL",
      totalLec || "",
      pWork || 0, 0,
      cWork || 0, 0,
      mWork || 0, 0,
      pDpp || 0, cDpp || 0, mDpp || 0,
      pPyq || 0, cPyq || 0, mPyq || 0
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
      textColor: 0,
      lineColor: 150,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [250, 204, 21], // Yellow Header
      textColor: 0,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [255, 255, 255], // White background for TOTAL row
      textColor: 0,
      fontStyle: 'bold',
      lineColor: 150,
      lineWidth: 0.1
    }
  });

  // 6. Footer Text Summary
  const footerY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 6 : 190;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total questions: ${totalQs}`, 14, footerY);
  pdf.text(`Total lectures: ${totalLec}   |   Total PYQs: ${totalPyqs}`, 14, footerY + 4);

  // Download Output
  pdf.save("15DAY-REPORT-JEE-Advanced.pdf");
  }
function updateDashboard(selectedDateData) {
  let questionsToday = 0;
  let lecturesToday = 0;

  if (selectedDateData) {
    // Sum questions for the selected day
    const hw = Number(selectedDateData.hw) || 0;
    const dpp = Number(selectedDateData.dpp) || 0;
    const pyq = Number(selectedDateData.pyq) || 0;
    
    questionsToday = hw + dpp + pyq;

    // Get lectures for the selected day (change .lectures if your key name is different)
    lecturesToday = Number(selectedDateData.lectures) || 0;
  }

  // Render values to the UI
  document.getElementById('questions-today').textContent = questionsToday;
  document.getElementById('lectures-today').textContent = lecturesToday;
}

/* ================= REDESIGNED APP ================= */
(function(){
const $=id=>document.getElementById(id);
const focusKey="jee_focus_v1", todoKey="jee_todos_v1", themeKey="jee_theme_v1";
const themes={
  "Black & Gold":["#070707","#101010","#171717","#f4c542","#ffd86b"],
  "Pink & White":["#fff7fb","#ffffff","#ffe8f2","#e83e8c","#ff76b7"],
  "Bluish White":["#f4f8ff","#ffffff","#e5eefb","#3677ff","#73a1ff"],
  "Midnight Purple":["#0c0817","#151022","#211735","#a66cff","#d2a9ff"],
  "Emerald":["#06120e","#0d1d17","#153127","#20c997","#65e6bd"],
  "Crimson":["#120707","#1d0d0d","#321313","#ff4d5d","#ff8a93"],
  "Ocean":["#041015","#0a1c24","#10303d","#19b5d8","#65dcf3"],
  "Lavender":["#f7f5ff","#ffffff","#ebe6ff","#7c5cff","#a48cff"],
  "Solar":["#fffaf0","#ffffff","#fff0c9","#e89b00","#ffc44d"],
  "Rose Dark":["#160b10","#211018","#351923","#ff5c8a","#ff9fba"]
};
function setTheme(name){
 const t=themes[name]||themes["Black & Gold"]; document.documentElement.style.setProperty("--bg",t[0]);document.documentElement.style.setProperty("--panel",t[1]);document.documentElement.style.setProperty("--panel2",t[2]);document.documentElement.style.setProperty("--accent",t[3]);document.documentElement.style.setProperty("--accent2",t[4]);document.documentElement.style.setProperty("--text",name.includes("White")||name==="Lavender"||name==="Solar"||name==="Pink & White"?"#15151a":"#f8fafc");document.documentElement.style.setProperty("--muted",name.includes("White")||name==="Lavender"||name==="Solar"||name==="Pink & White"?"#667085":"#a4adbb");document.documentElement.style.setProperty("--line",name.includes("White")||name==="Lavender"||name==="Solar"||name==="Pink & White"?"#dfe4ec":"#2a2d34");document.documentElement.style.setProperty("--input",name.includes("White")||name==="Lavender"||name==="Solar"||name==="Pink & White"?"#f8fafc":"#0c0c0c");localStorage.setItem(themeKey,name);
}
function renderThemes(){const g=$("themeGrid"); if(!g)return; g.innerHTML=Object.keys(themes).map(n=>`<button class="theme-swatch" data-theme="${n}"><i style="background:${themes[n][3]}"></i><span>${n}</span></button>`).join("");g.onclick=e=>{let b=e.target.closest("[data-theme]");if(b){setTheme(b.dataset.theme);$("themeDrawer").classList.remove("open")}}}
function nav(page){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.querySelector("#page-"+page)?.classList.add("active");document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));$("sidebar").classList.remove("open"); if(page==="focus")renderFocus();if(page==="planner")renderTodos();}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>nav(b.dataset.page));
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));
 $("mobileMenu").onclick=()=>$("sidebar").classList.toggle("open");
 $("themeBtn").onclick=()=>$("themeDrawer").classList.add("open");$("closeTheme").onclick=()=>$("themeDrawer").classList.remove("open");
 renderThemes();setTheme(localStorage.getItem(themeKey)||"Black & Gold");
 const d=new Date();$("todayLabel").textContent=d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short",year:"numeric"});
 if($("plannerDate")&&!$("plannerDate").value)$("plannerDate").value=iso(d);
 $("plannerDate").onchange=renderTodos;$("addTodo").onclick=addTodo;$("todoInput").onkeydown=e=>{if(e.key==="Enter")addTodo()};
 $("manualFocusBtn").onclick=manualFocus;
 $("timerStart").onclick=startTimer;$("timerPause").onclick=pauseTimer;$("timerReset").onclick=resetTimer;
 setInterval(()=>{if(timerRunning){elapsed=Math.floor((Date.now()-timerStartedAt)/1000)+pausedSeconds;updateTimer()}},1000);
 setInterval(updateMiniDashboard,1000);updateMiniDashboard();renderFocus();renderTodos();
});
function iso(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function readFocus(){try{return JSON.parse(localStorage.getItem(focusKey)||"[]")}catch{return[]}}
function writeFocus(x){localStorage.setItem(focusKey,JSON.stringify(x))}
function fmtMin(m){m=Math.max(0,Math.round(m));return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`}
function todayFocus(){let t=iso(new Date());return readFocus().filter(x=>x.date===t)}
function renderFocus(){
 let logs=readFocus().sort((a,b)=>b.id-a.id), today=todayFocus(), mins=today.reduce((s,x)=>s+x.minutes,0);
 $("focusBig").textContent=fmtMin(mins);$("focusToday").textContent=fmtMin(mins);$("focusSessions").textContent=today.length;$("focusQuestions").textContent=today.reduce((s,x)=>s+(+x.questions||0),0);
 $("focusLogs").innerHTML=logs.length?logs.slice(0,40).map(x=>`<div class="focus-log"><div><b>${esc(x.subject)} · ${esc(x.activity)}</b><small>${x.date}${x.note?" · "+esc(x.note):""}${x.questions?" · "+x.questions+" questions":""}</small></div><strong>${fmtMin(x.minutes)}</strong><button onclick="deleteFocus(${x.id})">×</button></div>`).join(""):`<div class="empty">No focus logs yet. Start your first session.</div>`;
}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
window.deleteFocus=id=>{writeFocus(readFocus().filter(x=>x.id!==id));renderFocus();updateMiniDashboard()}
function manualFocus(){let m=prompt("Focus minutes?");if(!m||isNaN(m)||+m<=0)return;let q=prompt("Questions completed? (optional)","0");let a=readFocus();a.push({id:Date.now(),date:iso(new Date()),minutes:+m,questions:+q||0,subject:$("focusSubject").value,activity:$("focusActivity").value,note:$("focusNote").value});writeFocus(a);$("focusNote").value="";renderFocus();updateMiniDashboard()}
let timerRunning=false,timerStartedAt=0,pausedSeconds=0,elapsed=0;
function updateTimer(){let s=Math.max(0,elapsed),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;$("timerDisplay").textContent=[h,m,sec].map(x=>String(x).padStart(2,"0")).join(":")}
function startTimer(){if(timerRunning)return;timerRunning=true;timerStartedAt=Date.now();$("timerState").textContent="Focused — keep going."; }
function pauseTimer(){if(!timerRunning)return;elapsed=Math.floor((Date.now()-timerStartedAt)/1000)+pausedSeconds;pausedSeconds=elapsed;timerRunning=false;$("timerState").textContent="Paused."; }
function resetTimer(){if(elapsed>=60){let mins=Math.round(elapsed/60);let a=readFocus();a.push({id:Date.now(),date:iso(new Date()),minutes:mins,questions:0,subject:$("focusSubject").value,activity:$("focusActivity").value,note:$("focusNote").value});writeFocus(a);renderFocus();}timerRunning=false;elapsed=0;pausedSeconds=0;$("timerState").textContent="Ready when you are.";updateTimer();$("focusNote").value=""}
function readTodos(){try{return JSON.parse(localStorage.getItem(todoKey)||"[]")}catch{return[]}}
function writeTodos(x){localStorage.setItem(todoKey,JSON.stringify(x))}
function addTodo(){let text=$("todoInput").value.trim();if(!text)return;let a=readTodos();a.push({id:Date.now(),date:$("plannerDate").value||iso(new Date()),text,type:$("todoType").value,done:false});writeTodos(a);$("todoInput").value="";renderTodos()}
window.toggleTodo=id=>{let a=readTodos();let x=a.find(v=>v.id===id);if(x)x.done=!x.done;writeTodos(a);renderTodos()}
window.deleteTodo=id=>{writeTodos(readTodos().filter(x=>x.id!==id));renderTodos()}
function renderTodos(){if(!$("todoList"))return;let date=$("plannerDate").value||iso(new Date()),a=readTodos().filter(x=>x.date===date),done=a.filter(x=>x.done).length, pct=a.length?Math.round(done/a.length*100):0;$("plannerTitle").textContent=new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"});$("todoCount").textContent=a.length;$("plannerRing").textContent=pct+"%";$("plannerProgressText").textContent=`${done} of ${a.length} tasks complete`;$("todoList").innerHTML=a.length?a.map(x=>`<div class="todo ${x.done?"done":""}"><button class="check" onclick="toggleTodo(${x.id})">${x.done?"✓":""}</button><div><b>${esc(x.text)}</b><small>${esc(x.type)}</small></div><button class="todo-del" onclick="deleteTodo(${x.id})">×</button></div>`).join(""):`<div class="empty">No tasks for this date. Add your first task above.</div>`}
function updateMiniDashboard(){
 let f=todayFocus().reduce((s,x)=>s+x.minutes,0);if($("focusToday"))$("focusToday").textContent=fmtMin(f);
 let data=typeof rowsData==="function"?rowsData():[];let phy=data.reduce((s,r)=>s+num(r.phyWork)+num(r.phyDpp)+num(r.phyPyq),0),chem=data.reduce((s,r)=>s+num(r.chemWork)+num(r.chemDpp)+num(r.chemPyq),0),math=data.reduce((s,r)=>s+num(r.mathWork)+num(r.mathDpp)+num(r.mathPyq),0);if($("dashPhy"))$("dashPhy").textContent=phy;if($("dashChem"))$("dashChem").textContent=chem;if($("dashMath"))$("dashMath").textContent=math;if($("questionSum2")&&$("questionSum"))$("questionSum2").textContent=$("questionSum").textContent;let ex=$("examDate")?.value;if(ex){let days=Math.max(0,Math.ceil((new Date(ex+"T23:59:59")-new Date())/86400000));$("dashCountdown").textContent=days;$("dashProgress").style.width=Math.min(100,Math.max(0,100-days/200*100))+"%"}}
})();
