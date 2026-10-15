const $=id=>document.getElementById(id);
const settings=['days','lectures','hw','dpp','pyq','questions','rev'];
const storeKey='examytrack-v1';
let state=JSON.parse(localStorage.getItem(storeKey)||'null')||{
  settings:{days:20,lectures:4,hw:1,dpp:1,pyq:1,questions:30,rev:1},checks:{},theme:'dark'
};
settings.forEach(k=>$(k).value=state.settings[k]);
document.body.dataset.theme=state.theme;

function save(){localStorage.setItem(storeKey,JSON.stringify(state));}
function countBlocks(n){return Math.ceil(Number(n||0)/10)}
function boxes(day,type,count){
  const wrap=document.createElement('div'); wrap.className='checks';
  for(let i=0;i<count;i++){
    const b=document.createElement('button'); b.className='box';
    const key=`${day}-${type}-${i}`;
    if(state.checks[key]) b.classList.add('checked');
    b.onclick=()=>{state.checks[key]=!state.checks[key];b.classList.toggle('checked');save();updateProgress()};
    wrap.appendChild(b);
  }
  return wrap;
}
function render(){
  const s=state.settings, t=$('tracker'); t.innerHTML='';
  const head=t.insertRow(); ['DAY','LECTURES','HW / MODULE','DPP','PYQ','QUESTIONS (10 = 1 □)','REV'].forEach(x=>{const c=head.insertCell();c.outerHTML=`<th>${x}</th>`});
  for(let d=1;d<=s.days;d++){
    const r=t.insertRow(), c=r.insertCell();
    c.innerHTML=`<span class="dayNum">DAY ${d}</span><span class="sub">JEE TRACK</span>`;
    const vals=[['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]];
    vals.forEach(([type,n])=>r.insertCell().appendChild(boxes(d,type,n)));
  }
  updateProgress();
}
function buildPrintPages(){
  const root=document.getElementById('printPages');
  root.innerHTML='';
  const s=state.settings;
  const pages=Math.ceil(s.days/20);

  function makeTable(start,end){
    const table=document.createElement('table');
    const head=table.insertRow();
    ['DAY','LECTURES','HW / MODULE','DPP','PYQ','QUESTIONS (10 = 1 □)','REV'].forEach(x=>{
      const c=head.insertCell();
      c.outerHTML=`<th>${x}</th>`;
    });

    for(let d=start;d<=end;d++){
      const r=table.insertRow();
      const c=r.insertCell();
      c.innerHTML=`<span class="dayNum">DAY ${d}</span><span class="sub">JEE TRACK</span>`;
      const vals=[['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]];
      vals.forEach(([type,n])=>r.insertCell().appendChild(boxes(d,type,n)));
    }
    return table;
  }

  for(let p=0;p<pages;p++){
    const start=p*20+1;
    const end=Math.min((p+1)*20,s.days);
    const page=document.createElement('div');
    page.className='printPage';

    const panel=document.createElement('section');
    panel.className='panel';

    const head=document.createElement('div');
    head.className='trackerHead';
    head.innerHTML=`
      <div>
        <div class="eyebrow">YOUR DAILY PLAN · EXAMYTRACK</div>
        <h2>Days ${start}–${end} Checklist</h2>
        <div class="pageLabel">Page ${p+1} of ${pages} · 15 days per A4 page</div>
      </div>
      <div class="progress">${document.getElementById('progress').textContent}</div>`;
    panel.appendChild(head);

    const wrap=document.createElement('div');
    wrap.className='tableWrap';
    wrap.appendChild(makeTable(start,end));
    panel.appendChild(wrap);
    page.appendChild(panel);
    root.appendChild(page);
  }
}

function updateProgress(){
  const s=state.settings;
  let total=s.days*(s.lectures+s.hw+s.dpp+s.pyq+countBlocks(s.questions)+s.rev), done=0;
  for(let d=1;d<=s.days;d++){
    for(const [type,n] of [['lec',s.lectures],['hw',s.hw],['dpp',s.dpp],['pyq',s.pyq],['q',countBlocks(s.questions)],['rev',s.rev]])
      for(let i=0;i<n;i++) if(state.checks[`${d}-${type}-${i}`]) done++;
  }
  $('progress').textContent=(total?Math.round(done/total*100):0)+'%';
  if(document.getElementById('printPages')) buildPrintPages();
}
$('generate').onclick=()=>{
  settings.forEach(k=>state.settings[k]=Math.max(0,Number($(k).value)||0));
  state.settings.days=Math.min(365,Math.max(1,state.settings.days));
  save();render();
};
$('clear').onclick=()=>{
  if(confirm('Clear all ticks?')){state.checks={};save();render();}
};
$('print').onclick=()=>{buildPrintPages();window.print();};
$('themeBtn').onclick=()=>$('themeMenu').classList.toggle('open');
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{
  state.theme=b.dataset.theme;document.body.dataset.theme=state.theme;save();$('themeMenu').classList.remove('open');
});
render();
/* =========================
   SYLLABUS TRACKER MODULE
   ========================= */
const syllabusKey='examytrack-syllabus-v1';
let syllabusData=JSON.parse(localStorage.getItem(syllabusKey)||'null')||[];

const physicsExample=[
  ['Physics','Motion in 1D',6],
  ['Physics','Motion in 2D',6],
  ['Physics','NLM',7],
  ['Physics','Work energy power',5],
  ['Physics','Circular motion',4],
  ['Physics','Centre of mass',7],
  ['Physics','Rotational motion',10],
  ['Physics','Mechanical prop of solid',1],
  ['Physics','Mechanical prop of fluids',6],
  ['Physics','Thermal prop of matters',4],
  ['Physics','KTG',2],
  ['Physics','Oscillation',5],
  ['Physics','Electric charges and field',6],
  ['Physics','Electrostatic potential',4],
  ['Physics','Gravitation',2],
  ['Physics','Current Electricity',6],
  ['Physics','Capacitance',4],
  ['Physics','Moving charges and Magnetism',4],
  ['Physics','Electromagnetic induc',5],
  ['Physics','AC',4],
  ['Physics','EM waves',1],
  ['Physics','Ray optics',9]
];

function saveSyllabus(){localStorage.setItem(syllabusKey,JSON.stringify(syllabusData));}
function esc(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function renderSyllabusPreview(){
  const root=$('syllabusPreview');
  if(!syllabusData.length){
    root.innerHTML='<div style="padding:30px;text-align:center;color:var(--muted)">No chapters added yet. Add chapters above or load the Physics example.</div>';
    return;
  }
  const groups={};
  syllabusData.forEach((x,i)=>{(groups[x.subject]??=[]).push({...x,index:i});});
  root.innerHTML='';
  Object.entries(groups).forEach(([subject,items])=>{
    const block=document.createElement('div');block.className='sySubjectBlock';
    block.innerHTML=`<div class="sySubjectTitle"><span>${esc(subject)}</span><span>${items.length} chapter${items.length===1?'':'s'}</span></div>`;
    const table=document.createElement('table');
    table.innerHTML='<thead><tr><th>#</th><th>Chapter Name</th><th>Lecture Tracker</th><th>Total Lec</th><th>Main</th><th>Adv</th><th>Short Notes</th><th>DPP</th><th>HW</th><th>Module</th><th>PYQ</th><th>Test</th><th>R1</th><th>R2</th><th>R3</th><th>Action</th></tr></thead>';
    const body=document.createElement('tbody');
    items.forEach((item,n)=>{
      const tr=document.createElement('tr');
      let lec='';for(let i=1;i<=item.lectures;i++)lec+=`<span>L${i}</span>`;
      tr.innerHTML=`<td>${n+1}</td><td>${esc(item.chapter)}</td><td><div class="lectureMini">${lec||'<span>—</span>'}</div></td><td>${item.lectures}</td>`+
        '<td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td><td>□</td>'+
        `<td><button class="deleteChapter" data-delete="${item.index}">Delete</button></td>`;
      body.appendChild(tr);
    });
    table.appendChild(body);block.appendChild(table);root.appendChild(block);
  });
  root.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>{
    const idx=Number(btn.dataset.delete);syllabusData.splice(idx,1);saveSyllabus();renderSyllabusPreview();
  });
}

function openSyllabus(){
  $('syllabusModal').classList.add('open');
  $('syllabusModal').setAttribute('aria-hidden','false');
  renderSyllabusPreview();
}
function closeSyllabus(){
  $('syllabusModal').classList.remove('open');
  $('syllabusModal').setAttribute('aria-hidden','true');
}

$('syllabusBtn').onclick=openSyllabus;
$('closeSyllabus').onclick=closeSyllabus;
$('syllabusModal').addEventListener('click',e=>{if(e.target===$('syllabusModal'))closeSyllabus();});

document.addEventListener('keydown',e=>{if(e.key==='Escape' && $('syllabusModal').classList.contains('open'))closeSyllabus();});

$('addChapter').onclick=()=>{
  const subject=$('sySubject').value.trim();
  const chapter=$('syChapter').value.trim();
  const lectures=Math.max(0,Math.min(99,Number($('syLectures').value)||0));
  if(!chapter){alert('Enter a chapter name.');$('syChapter').focus();return;}
  syllabusData.push({subject,chapter,lectures});
  saveSyllabus();renderSyllabusPreview();
  $('syChapter').value='';$('syLectures').value='';$('syChapter').focus();
};

$('syChapter').addEventListener('keydown',e=>{if(e.key==='Enter')$('addChapter').click();});
$('syLectures').addEventListener('keydown',e=>{if(e.key==='Enter')$('addChapter').click();});

$('loadPhysicsExample').onclick=()=>{
  syllabusData=physicsExample.map(([subject,chapter,lectures])=>({subject,chapter,lectures}));
  saveSyllabus();renderSyllabusPreview();
};
$('clearSyllabus').onclick=()=>{
  if(confirm('Clear the complete syllabus?')){syllabusData=[];saveSyllabus();renderSyllabusPreview();}
};

function syllabusPrintHTML(){
  const perPage=15;
  let pages='';
  const groups={};
  syllabusData.forEach(x=>(groups[x.subject]??=[]).push(x));
  const chunks=[];
  Object.entries(groups).forEach(([subject,items])=>{
    for(let i=0;i<items.length;i+=perPage)chunks.push({subject,items:items.slice(i,i+perPage),offset:i});
  });
  if(!chunks.length)return '';
  chunks.forEach((chunk,pi)=>{
    const rows=chunk.items.map((item,i)=>{
      const lec=[];for(let j=1;j<=item.lectures;j++)lec.push(`<span class="lectureItem"><i class="sq"></i>L${j}</span>`);
      return `<tr><td>${chunk.offset+i+1}</td><td>${esc(item.chapter)}</td><td><div class="lectureBoxes">${lec.join('')}</div></td><td>${item.lectures}</td>`+
        '<td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td><td><i class="tinySq"></i></td></tr>';
    }).join('');
    pages+=`<section class="syPage"><div class="syPageHeader"><div><h1>JEE SYLLABUS TRACKER</h1><div class="sySub">Offline Printable • Tick everything by hand</div></div><div class="sySub">${pi+1} / ${chunks.length}</div></div><div class="sySubject">${esc(chunk.subject)}</div><table><thead><tr><th>#</th><th>Chapter Name</th><th>Lecture Tracker</th><th>Total<br>Lec</th><th>Main<br>Level</th><th>Adv<br>Level</th><th>Short<br>Notes</th><th>DPP</th><th>HW</th><th>Module</th><th>PYQ</th><th>Test</th><th>R1</th><th>R2</th><th>R3</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  });
  return pages;
}

$('downloadSyllabus').onclick=()=>{
  if(!syllabusData.length){
    alert('Add at least one chapter first, or load the Physics example.');
    return;
  }

  // Build a completely standalone print document. This avoids CSS/modal
  // visibility issues that can make Chrome's PDF preview appear blank,
  // especially on Android.
  const content=syllabusPrintHTML();
  const css=`
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#fff;color:#111}
    body{font-family:Arial,Helvetica,sans-serif}
    .syPage{width:100%;page-break-after:always;break-after:page;padding:0
    .syPage:last-child{page-break-after:auto;break-after:auto}
    .syPageHeader{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm}
    h1{font-size:19pt;margin:0 0 1mm;color:#111}
    .sySub{font-size:9pt;color:#333}
    .sySubject{font-size:14pt;font-weight:900;margin:2.5mm 0 1.5mm;text-transform:uppercase}
    table{width:100%;border-collapse:collapse;table-layout:fixed;color:#111}
    th,td{border:1px solid #111;text-align:center;vertical-align:middle}
    th{font-size:8pt;height:9mm;background:#e9e9e9!important;padding:1mm .7mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    td{font-size:9pt;height:11mm;padding:1mm .6mm}
    td:nth-child(1),th:nth-child(1){width:4%}
    td:nth-child(2),th:nth-child(2){width:17%;text-align:left}
    td:nth-child(3),th:nth-child(3){width:22%}
    td:nth-child(4),th:nth-child(4){width:5%}
    td:nth-child(n+5),th:nth-child(n+5){width:4.7%}
    td:nth-child(2){font-weight:700}
    .lectureBoxes{display:flex;flex-wrap:wrap;gap:1mm;justify-content:flex-start;align-items:center}
    .lectureItem{display:flex;align-items:center;gap:.7mm;white-space:nowrap;font-size:8.5pt}
    .sq{width:4mm;height:4mm;border:1px solid #111;display:inline-block;box-sizing:border-box}
    .tinySq{width:4.2mm;height:4.2mm;border:1px solid #111;display:inline-block}
    @page{size:A4 landscape;margin:5mm}
  `;

  const w=window.open('', '_blank');
  if(!w){
    alert('Please allow pop-ups for EXAMYTRACK, then try again.');
    return;
  }
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JEE Syllabus Tracker</title><style>${css}</style></head><body>${content}</body></html>`);
  w.document.close();

  // Wait until the standalone document has been laid out before opening
  // Android/Chrome's print-to-PDF screen.
  w.onload=()=>setTimeout(()=>{
    w.focus();
    w.print();
  },300);
};

renderSyllabusPreview();
