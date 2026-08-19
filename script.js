const KEY="jee370rTrackerV3";
const LEGACY_V2="jee370rTrackerV2";
const LEGACY_V1="jee370rTrackerV1";

// HW + Class Illustration are intentionally ONE field per subject.
const fields=["date","lec","phyWork","chemWork","mathWork","phyDpp","chemDpp","mathDpp","phyPyq","chemPyq","mathPyq","pyq"];
const tbody=document.querySelector("#tracker tbody");

function makeRows(){
  tbody.innerHTML="";
  for(let i=0;i<15;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''} inputmode="numeric"></td>`).join("");
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("input").forEach(x=>x.addEventListener("input",()=>{
    updateStats();
    autoExtendRows();
  }));
}

function rowsData(){
  return [...tbody.querySelectorAll("tr")].map(tr=>{
    const o={};
    tr.querySelectorAll("input").forEach(i=>o[i.dataset.f]=i.value);
    o.pyq=num(o.phyPyq)+num(o.chemPyq)+num(o.mathPyq);
    return o;
  });
}

function calcTotals(data){
  const t={lec:0,phyWork:0,chemWork:0,mathWork:0,phyDpp:0,chemDpp:0,mathDpp:0,phyPyq:0,chemPyq:0,mathPyq:0,pyq:0};
  data.forEach(r=>{
    ["lec","phyWork","chemWork","mathWork","phyDpp","chemDpp","mathDpp","phyPyq","chemPyq","mathPyq"].forEach(k=>t[k]+=num(r[k]));
  });
  t.pyq=t.phyPyq+t.chemPyq+t.mathPyq;
  t.hw=t.phyWork+t.chemWork+t.mathWork;
  t.dpp=t.phyDpp+t.chemDpp+t.mathDpp;
  t.questions=t.hw+t.dpp+t.pyq;
  return t;
}

function setData(data){
  makeRows();
  (data||[]).forEach((o,i)=>{
    while(i>=tbody.children.length) addRows(15);
    const tr=tbody.children[i];
    fields.forEach(f=>{if(o[f]!=null)tr.querySelector(`[data-f="${f}"]`).value=o[f]});
  });
  updateStats();
}

function migrateData(){
  const v3=JSON.parse(localStorage.getItem(KEY)||"null");
  if(v3 && Array.isArray(v3.rows)) return v3;

  // Convert the previous V2 format where HW and ILLU were separate.
  const v2=JSON.parse(localStorage.getItem(LEGACY_V2)||"null");
  if(v2 && Array.isArray(v2.rows)){
    return {
      startDate:v2.startDate||"",
      rows:v2.rows.map(r=>({
        date:r.date||"", lec:r.lec||"",
        phyWork:combine(r.phyHw,r.phyIllu),
        chemWork:combine(r.chemHw,r.chemIllu),
        mathWork:combine(r.mathHw,r.mathIllu),
        chemDpp:r.chemDpp||"", mathDpp:r.mathDpp||"",
        phyPyq:r.phyPyq||"", chemPyq:r.chemPyq||"", mathPyq:r.mathPyq||""
      }))
    };
  }

  // Convert the original V1 format. Its single PYQ total is kept as Physics PYQ
  // because the old file had no subject-wise PYQ information.
  const v1=JSON.parse(localStorage.getItem(LEGACY_V1)||"null");
  if(v1 && Array.isArray(v1.rows)){
    return {
      startDate:v1.startDate||"",
      rows:v1.rows.map(r=>({
        date:r.date||"", lec:r.lec||"",
        phyWork:r.phy||"", chemWork:r.chem||"", mathWork:r.math||"",
        chemDpp:r.chemDpp||"", mathDpp:r.mathDpp||"",
        phyPyq:r.pyq||"", chemPyq:"", mathPyq:""
      }))
    };
  }
  return null;
}

function combine(a,b){
  const x=String(a||"").trim(), y=String(b||"").trim();
  if(x && y) return `${x} + ${y}`;
  return x||y;
}

function save(){
  localStorage.setItem(KEY,JSON.stringify({startDate:document.querySelector("#startDate").value,examDate:document.querySelector("#examDate").value,rows:rowsData()}));
  alert("Progress saved on this device.");
}

function load(){
  const x=migrateData();
  if(!x){alert("No saved tracker found.");return}
  document.querySelector("#startDate").value=x.startDate||"";
  document.querySelector("#examDate").value=x.examDate||document.querySelector("#examDate").value;
  setData(x.rows);
  localStorage.setItem(KEY,JSON.stringify(x));
}

function clearAll(){
  if(!confirm("Clear all study data?"))return;
  localStorage.removeItem(KEY);
  document.querySelector("#startDate").value="";
  setData([]);
}

function addRows(count=15){
  const start=tbody.children.length;
  for(let i=0;i<count;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=start+i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''} inputmode="numeric"></td>`).join("");
    tbody.appendChild(tr);
    tr.querySelectorAll("input").forEach(x=>x.addEventListener("input",()=>{updateStats();autoExtendRows();}));
  }
}

function autoExtendRows(){
  const rows=[...tbody.children];
  const last=rows.slice(-3);
  if(last.some(tr=>[...tr.querySelectorAll("input")].some(i=>i.value.trim()!==""))){
    addRows(15);
  }
}

function fillDates(){
  const s=document.querySelector("#startDate").value;
  if(!s){alert("Select a start date first.");return}
  const d=new Date(s+"T00:00:00");
  [...tbody.children].forEach((tr,i)=>{
    const x=new Date(d);x.setDate(d.getDate()+i);
    tr.querySelector('[data-f="date"]').value=x.toISOString().slice(0,10);
  });
  updateStats();
}

function num(v){
  const m=String(v||"").match(/\d+/);
  return m?Number(m[0]):0;
}

function sumField(data,field){
  return data.reduce((s,r)=>s+num(r[field]),0);
}

function put(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=value;
}

function updateStats(){
  const data=rowsData(), t=calcTotals(data);
  const done=data.filter(r=>Object.entries(r).some(([k,v])=>k!=="pyq" && String(v).trim()!=="")).length;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set("daysDone",done);
  set("lecSum",t.lec);
  set("questionSum",t.questions);
  set("pyqSum",t.pyq);
  set("avgQ",done?Math.round(t.questions/done):0);
  set("qTarget",Math.min(100,Math.round(t.questions/(Math.max(1,done)*70)*100))+"%");
  set("phyWorkSum",t.phyWork); set("chemWorkSum",t.chemWork); set("mathWorkSum",t.mathWork); set("workSum",t.hw);
  set("phyDppSum",t.phyDpp); set("chemDppSum",t.chemDpp); set("mathDppSum",t.mathDpp); set("dppSum",t.dpp);
  set("phyPyqSum",t.phyPyq); set("chemPyqSum",t.chemPyq); set("mathPyqSum",t.mathPyq); set("pyqDetailSum",t.pyq);
  set("phyTotal",t.phyWork+t.phyDpp+t.phyPyq);
  set("chemTotal",t.chemWork+t.chemDpp+t.chemPyq);
  set("mathTotal",t.mathWork+t.mathDpp+t.mathPyq);
  set("overallTotal",t.questions);
}

function monthKey(date){ return String(date||'').slice(0,7); }
function getMonths(){
  const keys=[...new Set(rowsData().map(r=>monthKey(r.date)).filter(Boolean))].sort();
  return keys;
}
function phaseNumber(key){ const keys=getMonths(); const i=keys.indexOf(key); return i<0?'—':i+1; }
function monthRows(key){ return rowsData().filter(r=>monthKey(r.date)===key); }
function monthSummary(key){
  const d=monthRows(key), done=d.filter(r=>Object.values(r).some(v=>String(v||'').trim()!=='' )).length;
  const sum=f=>d.reduce((a,r)=>a+num(r[f]),0);
  const phyWork=sum('phyWork'), chemWork=sum('chemWork'), mathWork=sum('mathWork');
  const chemDpp=sum('chemDpp'), mathDpp=sum('mathDpp');
  const phyPyq=sum('phyPyq'), chemPyq=sum('chemPyq'), mathPyq=sum('mathPyq');
  const phy=phyWork+phyPyq, chem=chemWork+chemDpp+chemPyq, math=mathWork+mathDpp+mathPyq;
  return {days:done,lec:sum('lec'),phyWork,chemWork,mathWork,chemDpp,mathDpp,phyPyq,chemPyq,mathPyq,phy,chem,math,total:phy+chem+math,pyq:phyPyq+chemPyq+mathPyq};
}
function updateCountdown(){
  const input=document.querySelector('#examDate'); const out=document.querySelector('#countdown'); const label=document.querySelector('#examDateLabel');
  if(!input||!out)return; const v=input.value; if(!v){out.textContent='—';label.textContent='Set your target exam date above';return;}
  const target=new Date(v+'T00:00:00'); const now=new Date(); target.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const days=Math.ceil((target-now)/86400000);
  out.textContent=days>0?`${days} DAYS LEFT`:days===0?'EXAM DAY':'DATE PASSED';
  label.textContent=target.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
}
function exportJSON(){
  const payload={version:5,exportedAt:new Date().toISOString(),startDate:document.querySelector('#startDate').value,examDate:document.querySelector('#examDate').value,rows:rowsData()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='jee-tracker-backup.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importJSON(file){
  const r=new FileReader(); r.onload=()=>{ try{const x=JSON.parse(r.result); if(!Array.isArray(x.rows)) throw new Error('Invalid backup'); document.querySelector('#startDate').value=x.startDate||''; if(x.examDate)document.querySelector('#examDate').value=x.examDate; setData(x.rows); save(); alert('JSON imported successfully.');}catch(e){alert('Invalid JSON backup.');} }; r.readAsText(file); }
async function makeMonthlyPDF(){
  const key=document.querySelector('#reportMonth').value; if(!key){alert('Select a report month first.');return;}
  const rows=monthRows(key); if(!rows.length){alert('No study data found for this month.');return;}
  const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const m=monthSummary(key);
  const [y,mo]=key.split('-'); const name=new Date(Number(y),Number(mo)-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  pdf.setFont('helvetica','bold'); pdf.setFontSize(18); pdf.text(`370R JEE Tracker — Phase ${phaseNumber(key)} — ${name}`,14,16);
  pdf.setFontSize(10); pdf.text(`Study days: ${m.days}   Lectures: ${m.lec}   Total Questions: ${m.total}   PYQs: ${m.pyq}   Avg Q/day: ${m.days?Math.round(m.total/m.days):0}`,14,24);
  pdf.setFontSize(11); pdf.text('Subject summary',14,34);
  const rowsSummary=[['HW / CLASS ILLU',m.phyWork,m.chemWork,m.mathWork,m.phyWork+m.chemWork+m.mathWork],['DPP',0,m.chemDpp,m.mathDpp,m.chemDpp+m.mathDpp],['PYQ',m.phyPyq,m.chemPyq,m.mathPyq,m.pyq],['TOTAL',m.phy,m.chem,m.math,m.total]];
  pdf.autoTable ? pdf.autoTable({startY:38,head:[['TYPE','PHYSICS','CHEMISTRY','MATHEMATICS','TOTAL']],body:rowsSummary,theme:'grid'}) : null;
  let yy=pdf.lastAutoTable?pdf.lastAutoTable.finalY+10:45;
  pdf.setFontSize(10); pdf.text('Daily log',14,yy); yy+=5;
  const body=rows.map(r=>[r.date,r.lec,r.phyWork,r.chemWork,r.mathWork,r.chemDpp,r.mathDpp,sumText(r.phyPyq)+sumText(r.chemPyq)+sumText(r.mathPyq)]);
  if(pdf.autoTable) pdf.autoTable({startY:yy,head:[['DATE','LEC','PHY HW/ILLU','CHEM HW/ILLU','MATH HW/ILLU','CHEM DPP','MATH DPP','PYQ TOTAL']],body,theme:'grid',styles:{fontSize:7}});
  pdf.save(`JEE-Tracker-Phase-${phaseNumber(key)}-${key}.pdf`);
}

async function makePDF(){
  const {jsPDF}=window.jspdf;
  const img=new Image();
  img.src="tracker-template.png";
  await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.addImage(img,"PNG",0,0,210,297);

  const data=rowsData(), t=calcTotals(data);
  const sx=210/1086, sy=297/1536;
  const edges=[30,99,151,246,356,447,520,598,676,754,832,910,1056];
  const centers=edges.slice(0,-1).map((x,i)=>((x+edges[i+1])/2)*sx);
  const rowTop=186, rowBottom=1083, rowH=(rowBottom-rowTop)/15;

  pdf.setFont("helvetica","bold");
  pdf.setTextColor(15,15,15);
  pdf.setFontSize(8.5);

  data.slice(0,15).forEach((r,i)=>{
    const y=(rowTop+(i+.5)*rowH)*sy+1.8;
    const vals=[r.date,r.lec,r.phyWork,r.chemWork,r.mathWork,r.phyDpp,r.chemDpp,r.mathDpp,r.phyPyq,r.chemPyq,r.mathPyq,r.pyq];
    vals.forEach((v,j)=>{
      if(v==="" || v==null) return;
      let text=String(v);
      if(j===0 && /^\d{4}-\d{2}-\d{2}$/.test(text)){
        const [yy,mm,dd]=text.split("-");
        text=`${dd}/${mm}`;
      }
      if(text.length>10) text=text.slice(0,9)+"…";
      pdf.text(text,centers[j],y,{align:"center"});
    });
  });

  const totalVals=["TOTAL",t.lec,t.phyWork,t.chemWork,t.mathWork,t.phyDpp,t.chemDpp,t.mathDpp,t.phyPyq,t.chemPyq,t.mathPyq,t.pyq];
  const totalY=1121*sy+2;
  totalVals.forEach((v,j)=>pdf.text(String(v),centers[j],totalY,{align:"center"}));

  pdf.setFontSize(10);
  pdf.text(String(t.questions),49.5,239.3,{align:"center"});
  pdf.text(String(t.lec),112,239.3,{align:"center"});
  pdf.text(String(t.pyq),175,239.3,{align:"center"});
  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

function sumText(v){ return num(v); }

document.querySelector("#saveBtn").onclick=save;
document.querySelector("#loadBtn").onclick=load;
document.querySelector("#clearBtn").onclick=clearAll;
document.querySelector("#datesBtn").onclick=fillDates;
document.querySelector("#addBtn").onclick=()=>addRows(15);
document.querySelector("#pdfBtn").onclick=makePDF;
document.querySelector("#monthPdfBtn").onclick=makeMonthlyPDF;
document.querySelector("#jsonExportBtn").onclick=exportJSON;
document.querySelector("#jsonImport").addEventListener("change",e=>{if(e.target.files[0])importJSON(e.target.files[0]);});
document.querySelector("#examDate").addEventListener("change",()=>{updateCountdown();save();});
setInterval(updateCountdown,60000);
updateCountdown();

makeRows();
const saved=migrateData();
if(saved){
  document.querySelector("#startDate").value=saved.startDate||"";
  document.querySelector("#examDate").value=saved.examDate||document.querySelector("#examDate").value;
  setData(saved.rows);
}
updateStats();
