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
    version: 6,
    syllabus: syllabusSafe(),
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
      if (x.syllabus && Array.isArray(x.syllabus.chapters)) saveSyllabus({version:1,chapters:x.syllabus.chapters.map(normalizeChapter)});
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



/* =========================================================
   MENU + 29 THEMES + DAILY TODO + FOCUS MODE
   These features use separate localStorage keys and do not
   alter the existing tracker data.
   ========================================================= */

const THEME_KEY = "jee370rThemeV2";
const TODO_KEY = "jee370rDailyTodoV1";
const FOCUS_KEY = "jee370rFocusLogsV1";

function localISODate(d = new Date()) {
  const x = new Date(d);
  const offset = x.getTimezoneOffset();
  return new Date(x.getTime() - offset * 60000).toISOString().slice(0,10);
}
function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
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

/* ---------- Syllabus Tracker ---------- */
const SYLLABUS_KEY = "370R_JEE_SYLLABUS_V2";
const SYLLABUS_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const SYLLABUS_TASKS = ["jm", "adv", "mbbs", "opp", "hw", "module", "pyq", "advProb", "r1", "r2", "r3"];
const SYLLABUS_TASK_LABELS = {jm:"JM Lec",adv:"Adv Lec",mbbs:"MBBS",opp:"OPP",hw:"HW",module:"Module",pyq:"PYQ",advProb:"Adv Prob",r1:"R1",r2:"R2",r3:"R3"};

function normalizeChapter(c){
  const total=Math.max(1,Math.min(100,parseInt(c.total,10)||1));
  return {id:String(c.id||("ch_"+Date.now()+"_"+Math.random().toString(36).slice(2))),subject:c.subject,name:String(c.name||"").trim(),total};
}
function syllabusSafe(){
  const fallback={version:2,chapters:[]};
  try{
    let x=JSON.parse(localStorage.getItem(SYLLABUS_KEY)||"null");
    // Keep compatibility with the previous syllabus tracker data.
    if(!x){
      x=JSON.parse(localStorage.getItem("370R_JEE_SYLLABUS_V1")||"null");
    }
    if(!x || !Array.isArray(x.chapters)) return fallback;
    x.chapters=x.chapters.map(normalizeChapter).filter(c=>SYLLABUS_SUBJECTS.includes(c.subject)&&c.name);
    return {version:2,chapters:x.chapters};
  }catch(e){return fallback;}
}
function saveSyllabus(data){localStorage.setItem(SYLLABUS_KEY,JSON.stringify(data));}
function syllabusEsc(v){return escapeFeatureText(v);}

function renderSyllabus(){
  const list=document.getElementById("syllabusList"); if(!list)return;
  const d=syllabusSafe();
  if(!d.chapters.length){
    list.innerHTML='<div class="sy-empty">No chapters yet. Add your first chapter above.</div>';
    return;
  }
  const groups=SYLLABUS_SUBJECTS.map(s=>[s,d.chapters.filter(c=>c.subject===s)]).filter(([,cs])=>cs.length);
  list.innerHTML=groups.map(([subject,chapters])=>`
    <section class="sy-subject">
      <div class="sy-subject-head"><h3>${syllabusEsc(subject).toUpperCase()}</h3><span>${chapters.length} chapter${chapters.length>1?'s':''}</span></div>
      <div class="sy-simple-table-wrap"><table class="sy-simple-table"><thead><tr><th>#</th><th>Chapter Name</th><th>Total Lectures</th><th>PDF</th></tr></thead><tbody>
      ${chapters.map((c,i)=>`<tr><td>${i+1}</td><td>${syllabusEsc(c.name)}</td><td>${c.total}</td><td><button class="sy-delete" type="button" data-sy-action="delete" data-id="${c.id}" title="Delete chapter">🗑️</button></td></tr>`).join('')}
      </tbody></table></div>
    </section>`).join('');
}

function addSyllabusChapter(){
  const subject=document.getElementById('syllabusSubject')?.value;
  const name=document.getElementById('syllabusChapterName')?.value.trim();
  const total=Math.floor(Number(document.getElementById('syllabusTotalLectures')?.value));
  if(!SYLLABUS_SUBJECTS.includes(subject)||!name||!Number.isFinite(total)||total<1||total>100){
    alert('Subject, Chapter Name aur Total Lectures (1–100) sahi se bharo.');
    return;
  }
  const d=syllabusSafe();
  d.chapters.push(normalizeChapter({subject,name,total}));
  saveSyllabus(d);
  document.getElementById('syllabusChapterName').value='';
  document.getElementById('syllabusTotalLectures').value='';
  renderSyllabus();
}
function syllabusAction(e){
  const input=e.target.closest('[data-sy-action]'); if(!input)return;
  if(input.dataset.syAction==='delete'){
    const d=syllabusSafe(), id=input.dataset.id, c=d.chapters.find(x=>x.id===id);
    if(!c)return;
    if(!confirm(`Delete “${c.name}”?`))return;
    d.chapters=d.chapters.filter(x=>x.id!==id);
    saveSyllabus(d); renderSyllabus();
  }
}
function clearSyllabus(){
  const d=syllabusSafe();
  if(!d.chapters.length){alert('Syllabus already empty.');return;}
  if(confirm('Clear the complete syllabus?')){saveSyllabus({version:2,chapters:[]});renderSyllabus();}
}

function initSyllabus(){
  document.getElementById('syllabusAddBtn')?.addEventListener('click',addSyllabusChapter);
  document.getElementById('syllabusChapterName')?.addEventListener('keydown',e=>{if(e.key==='Enter')addSyllabusChapter();});
  document.getElementById('syllabusList')?.addEventListener('click',syllabusAction);
  document.getElementById('syllabusClearBtn')?.addEventListener('click',clearSyllabus);
  document.getElementById('syllabusBackBtn')?.addEventListener('click',()=>openFeature('menu'));
  document.getElementById('syllabusPdfBtn')?.addEventListener('click',downloadSyllabusPDF);
  renderSyllabus();
}

function drawPdfCheckbox(pdf,x,y,size=4){
  pdf.setDrawColor(85,85,85); pdf.setLineWidth(0.25); pdf.rect(x,y,size,size);
}

function downloadSyllabusPDF(){
  const Lib=window.jspdf?.jsPDF||window.jsPDF;
  if(!Lib){alert('PDF library missing. Internet connection is required for the PDF library.');return;}
  const d=syllabusSafe();
  if(!d.chapters.length){alert('Pehle syllabus me chapters add karo.');return;}

  // A4 landscape: designed specifically for printing and manual offline ticking.
  const pdf=new Lib({orientation:'landscape',unit:'mm',format:'a4'});
  const W=297, M=7;
  const headers=['#','Chapter Name','Lecture Tracker','Total Lec','Lec Comp',...SYLLABUS_TASKS.map(k=>SYLLABUS_TASK_LABELS[k])];
  // Fits A4 landscape without cutting the right-side tracker columns.
  const widths=[7,42,72,10,11,...SYLLABUS_TASKS.map(()=>13)];

  function title(subject){
    pdf.setTextColor(25,25,25);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(15); pdf.text('JEE SYLLABUS TRACKER',M,9);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); pdf.text('Offline Printable • Tick lectures, practice and revision by hand',M,13);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5); pdf.text(subject.toUpperCase(),M,19);
  }

  function drawPdfCheckbox(pdf,x,y,size=3.4){
    pdf.setDrawColor(70,70,70); pdf.setLineWidth(0.25); pdf.rect(x,y,size,size);
  }

  let first=true;
  for(const subject of SYLLABUS_SUBJECTS){
    const chapters=d.chapters.filter(c=>c.subject===subject);
    if(!chapters.length)continue;
    if(!first)pdf.addPage(); first=false;
    title(subject);

    const rows=chapters.map((c,i)=>[
      String(i+1), c.name, '', String(c.total), '', ...SYLLABUS_TASKS.map(()=>'')
    ]);

    pdf.autoTable({
      startY:22,
      margin:{left:M,right:M,top:6,bottom:7},
      tableWidth:W-M*2,
      head:[headers], body:rows, theme:'grid',
      styles:{
        font:'helvetica',fontSize:5.8,cellPadding:1.3,overflow:'linebreak',
        valign:'middle',halign:'center',lineWidth:0.18,lineColor:[145,145,145],
        textColor:[30,30,30]
      },
      headStyles:{fontStyle:'bold',fontSize:5.8,halign:'center',valign:'middle',fillColor:[235,235,235],textColor:[25,25,25],cellPadding:1.4},
      columnStyles:Object.fromEntries(widths.map((w,i)=>[i,{cellWidth:w,halign:i===1?'left':'center'}])),

      // Give the lecture cell enough height for wrapped rows of [box] L1 [box] L2...
      didParseCell:data=>{
        if(data.section==='body' && data.column.index===2){
          const total=chapters[data.row.index]?.total||0;
          const perLine=8;
          const lines=Math.max(1,Math.ceil(total/perLine));
          data.cell.styles.minCellHeight=Math.max(7,lines*6.2);
        }
      },

      didDrawCell:data=>{
        if(data.section!=='body')return;

        // Lecture tracker: [box] L1  [box] L2  [box] L3 ...
        if(data.column.index===2){
          const total=chapters[data.row.index]?.total||0;
          const perLine=8;
          const box=3.1, step=8.5, lineH=6.0;
          for(let n=0;n<total;n++){
            const line=Math.floor(n/perLine), pos=n%perLine;
            const x=data.cell.x+2+pos*step;
            const y=data.cell.y+1.2+line*lineH;
            if(y+box>data.cell.y+data.cell.height-0.4)continue;
            drawPdfCheckbox(pdf,x,y,box);
            pdf.setFont('helvetica','normal');pdf.setFontSize(4.7);pdf.setTextColor(55,55,55);
            pdf.text(`L${n+1}`,x+4.0,y+2.6);
          }
        }

        // Every other tracker column gets a centered empty checkbox.
        if(data.column.index>=5){
          const box=4.1;
          drawPdfCheckbox(pdf,
            data.cell.x+(data.cell.width-box)/2,
            data.cell.y+(data.cell.height-box)/2,
            box
          );
        }
      }
    });
  }

  pdf.save('JEE-Syllabus-Tracker-A4-Landscape.pdf');
}
