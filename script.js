const KEY = "jee370rTrackerV3";
const LEGACY_V2 = "jee370rTrackerV2";
const LEGACY_V1 = "jee370rTrackerV1";

// Table headers mapping
const fields = [
  "date",      // 1. DATE
  "lec",       // 2. LEC TOTAL
  "phyWork",   // 3. PHY HW / CLASS ILLU
  "chemWork",  // 4. CHEM HW / CLASS ILLU
  "mathWork",  // 5. MATH HW / CLASS ILLU
  "phyDpp",    // 6. PHY DPP
  "chemDpp",   // 7. CHEM DPP
  "mathDpp",   // 8. MATH DPP
  "phyPyq",    // 9. PHY PYQ
  "chemPyq",   // 10. CHEM PYQ
  "mathPyq"    // 11. MATH PYQ
];

const tbody = document.querySelector("#tracker tbody");

// Helper Functions
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

// Table Rows Manager
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

// Migration & LocalStorage Logic
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

// Statistics Calculation
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

// Monthly Reporting Helpers
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

// Exports & Import
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
  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDFLib) {
    alert("PDF library missing!");
    return;
  }

  const pdf = new jsPDFLib({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("370R JEE ADVANCED TRACKER", 14, 12);
  pdf.setFontSize(8);
  pdf.text("15-DAY QUESTION & LECTURE LOG", 14, 16);

  const headers = [[
    "DATE", "LEC",
    "PHY HW", "PHY ILLU",
    "CHEM HW", "CHEM ILLU",
    "MATH HW", "MATH ILLU",
    "PHY DPP", "CHEM DPP", "MATH DPP",
    "PHY PYQ", "CHEM PYQ", "MATH PYQ"
  ]];

  const rows = [...tbody.children].slice(0, 15).map(tr => {
    const getVal = f => {
      const inp = tr.querySelector(`[data-f="${f}"]`);
      return inp ? inp.value : "";
    };

    return [
      getVal("date"), getVal("lec"),
      getVal("phyWork"), "", getVal("chemWork"), "", getVal("mathWork"), "",
      getVal("phyDpp"), getVal("chemDpp"), getVal("mathDpp"),
      getVal("phyPyq"), getVal("chemPyq"), getVal("mathPyq")
    ];
  });

  const data = rowsData().slice(0, 15);
  const totalLec = sumField(data, "lec");
  const pWork = sumField(data, "phyWork"), cWork = sumField(data, "chemWork"), mWork = sumField(data, "mathWork");
  const pDpp = sumField(data, "phyDpp"), cDpp = sumField(data, "chemDpp"), mDpp = sumField(data, "mathDpp");
  const pPyq = sumField(data, "phyPyq"), cPyq = sumField(data, "chemPyq"), mPyq = sumField(data, "mathPyq");

  const totalPyqs = pPyq + cPyq + mPyq;
  const totalQs = pWork + cWork + mWork + pDpp + cDpp + mDpp + totalPyqs;

  pdf.autoTable({
    startY: 19,
    head: headers,
    body: rows,
    foot: [[
      "TOTAL", totalLec || "",
      pWork || 0, 0, cWork || 0, 0, mWork || 0, 0,
      pDpp || 0, cDpp || 0, mDpp || 0,
      pPyq || 0, cPyq || 0, mPyq || 0
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6, cellPadding: 1.5, halign: 'center', valign: 'middle',
      textColor: 0, lineColor: 150, lineWidth: 0.1
    },
    headStyles: { fillColor: [250, 204, 21], textColor: 0, fontStyle: 'bold' },
    footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineColor: 150, lineWidth: 0.1 }
  });

  const footerY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 6 : 190;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total questions: ${totalQs}`, 14, footerY);
  pdf.text(`Total lectures: ${totalLec}   |   Total PYQs: ${totalPyqs}`, 14, footerY + 4);

  pdf.save("15DAY-REPORT-JEE-Advanced.pdf");
}

// Event Listeners Setup
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

/* =========================================================
   MENU + 48 THEMES + DAILY TODO + FOCUS MODE + SYLLABUS
   ========================================================= */

const THEME_KEY = "jee370rThemeV2";
const TODO_KEY = "jee370rDailyTodoV1";
const FOCUS_KEY = "jee370rFocusLogsV1";

function localISODate(d = new Date()) {
  const x = new Date(d);
  const offset = x.getTimezoneOffset();
  return new Date(x.getTime() - offset * 60000).toISOString().slice(0,10);
}
function safeJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch(e) { return fallback; }
}
function escapeFeatureText(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function openFeature(name) {
  const overlay = document.getElementById("featureOverlay");
  const title = document.getElementById("featurePageTitle");
  const views = ["menu","syllabus","themes","todo","focus","weekly","backup"];
  const titles = {menu:"Menu",syllabus:"📚 Syllabus Tracker",themes:"🎨 Themes",todo:"📝 Daily TODO",focus:"⏱️ Focus Mode",weekly:"📊 Weekly Report",backup:"💾 Backup & Import"};
  if (!overlay) return;
  overlay.hidden = false;
  views.forEach(v => {
    const el = document.getElementById(v + "View");
    if (el) el.hidden = v !== name;
  });
  if (title) title.textContent = titles[name] || "Menu";
  if (name === "themes") updateThemeButtons();
  if (name === "todo") renderTodoList();
  if (name === "focus") renderFocus();
  if (name === "weekly") renderWeeklyReport();
}
function closeFeature() {
  const overlay = document.getElementById("featureOverlay");
  if (overlay) overlay.hidden = true;
}
function initFeatureMenu() {
  document.addEventListener("click", e => {
    const themeBtn = e.target.closest("#topThemeBtn");
    const menuBtn = e.target.closest("#topMenuBtn");
    const closeBtn = e.target.closest("#featureClose");
    const featureBtn = e.target.closest("[data-open-feature]");
    if (themeBtn) { e.preventDefault(); e.stopPropagation(); openFeature("themes"); return; }
    if (menuBtn) { e.preventDefault(); e.stopPropagation(); openFeature("menu"); return; }
    if (closeBtn) { e.preventDefault(); e.stopPropagation(); closeFeature(); return; }
    if (featureBtn) { e.preventDefault(); e.stopPropagation(); openFeature(featureBtn.dataset.openFeature); return; }
    if (e.target.id === "featureOverlay") closeFeature();
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeFeature(); });
}

// 48 Themes
const THEMES = [
  "classic","peach","pink","lavender","mint","ocean","rose-dark","forest",
  "sky","sunset","coral","lemon","aqua","teal","indigo","violet","plum",
  "berry","cherry","coffee","sand","slate","midnight","neon","aurora","ember",
  "grape","ice","amoled","dracula","tokyo-night","nord-dark","solar-dark",
  "deep-ocean","cyberpunk","synthwave","matrix","crimson","royal-dark","obsidian",
  "charcoal","cosmic","toxic","blueberry-dark","cocoa-dark","rosewood","teal-night","gold-night"
];

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "royal-dark";
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButtons();
}
function updateThemeButtons() {
  const theme = document.body.dataset.theme || "royal-dark";
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}
function initThemes() {
  applyTheme(localStorage.getItem(THEME_KEY) || "royal-dark");
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });
}

// Daily TODO
function getTodos() { return safeJSON(TODO_KEY, []); }
function saveTodos(data) { localStorage.setItem(TODO_KEY, JSON.stringify(data)); }

function todoStats(date) {
  const all = getTodos();
  const daily = date ? all.filter(t => t.date === date) : all;
  const total = daily.length;
  const completed = daily.filter(t => t.completed).length;
  return {all,daily,total,completed,pending:total-completed,rate:total ? Math.round(completed/total*100) : 0};
}
function renderTodoList() {
  const filter = document.getElementById("todoFilterDate");
  const list = document.getElementById("todoList");
  if (!filter || !list) return;
  const date = f
