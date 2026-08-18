import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,useNavigate,useParams,Routes,Route,Link} from 'react-router-dom';
import {Search,Video,Calendar,Clock,Star,ArrowRight,CheckCircle2,MessageSquare,LayoutDashboard,Code2,ShieldCheck} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function api(path, options={}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}});
  const data = await res.json();
  if(!res.ok) throw new Error(data.error||'Request failed');
  return data;
}

function App(){
  return <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/developers" element={<Developers/>}/>
    <Route path="/developer/:id" element={<Developer/>}/>
    <Route path="/booking/:id" element={<Booking/>}/>
    <Route path="/session/:id" element={<Session/>}/>
    <Route path="/dashboard" element={<Dashboard/>}/>
  </Routes>
}

function Nav(){
 return <nav className="nav"><Link className="brand" to="/"><span className="brandmark">D</span> DevSession</Link><div className="navlinks"><Link to="/developers">Find Developers</Link><Link to="/dashboard">Dashboard</Link><button className="btn ghost" onClick={async()=>{const d=await api('/auth/demo-login',{method:'POST',body:JSON.stringify({email:'client@example.com'})});localStorage.setItem('token',d.token);location.href='/dashboard'}}>Demo Login</button></div></nav>
}

function Home(){
 return <><Nav/><main>
  <section className="hero"><div className="hero-copy"><div className="eyebrow"><span>●</span> Live collaboration for modern teams</div><h1>Build with a<br/><em>developer. Live.</em></h1><p>Book a live session with the right developer and turn your idea into reality — together, in real time.</p><div className="actions"><Link className="btn primary" to="/developers">Find a Developer <ArrowRight size={17}/></Link><Link className="btn secondary" to="/developers">Become a Developer</Link></div><div className="trust"><span><CheckCircle2 size={16}/> Verified developers</span><span><CheckCircle2 size={16}/> Secure booking</span><span><CheckCircle2 size={16}/> Live workspace</span></div></div><div className="hero-card"><div className="livebar"><span className="live-dot"/> LIVE SESSION <span>52:18</span></div><div className="mock-video"><div className="avatar big">AM</div><div className="video-name">Aarav Mehta <small>Senior Full-Stack Developer</small></div><div className="video-actions"><button>🎙</button><button>▣</button><button>⌁</button></div></div><div className="mock-chat"><b>Project chat</b><p><strong>You:</strong> Can we make the hero section more minimal?</p><p><strong>Aarav:</strong> Absolutely — I'll update it now.</p></div></div></section>
  <section className="section"><div className="section-head"><div><span className="eyebrow">HOW IT WORKS</span><h2>From idea to execution, together.</h2></div></div><div className="steps">{[['01','Find','Browse verified developers by skill, rating and price.'],['02','Book','Choose a time and book a focused live session.'],['03','Build','Meet in a shared workspace and solve it together.']].map(x=><div className="step" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></section>
  <section className="section dark"><div className="center"><span className="eyebrow">BUILT FOR REAL WORK</span><h2>Not another freelance marketplace.</h2><p>DevSession is designed around the moment when client and developer actually sit down and build.</p></div><div className="feature-grid">{[['Live sessions',Video],['Shared workspace',LayoutDashboard],['Clear requirements',Code2],['Trusted experts',ShieldCheck]].map(([t,I])=><div className="feature" key={t}><I/><h3>{t}</h3><p>Everything needed to keep the project moving without endless back-and-forth.</p></div>)}</div></section>
 </main></>
}

function Developers(){
 const [data,setData]=useState([]),[q,setQ]=useState('');
 useEffect(()=>{api('/developers').then(setData).catch(console.error)},[]);
 const search=()=>api('/developers?q='+encodeURIComponent(q)).then(setData);
 return <><Nav/><main className="page"><div className="pagehead"><div><span className="eyebrow">MARKETPLACE</span><h1>Find your developer.</h1><p>Book focused live sessions with verified specialists.</p></div></div><div className="search"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search React, Node.js, Figma, Shopify..."/><button className="btn primary" onClick={search}>Search</button></div><div className="devgrid">{data.map(d=><Link className="devcard" to={'/developer/'+d.id} key={d.id}><div className="devtop"><div className="avatar">{d.name.split(' ').map(x=>x[0]).join('')}</div><span className="verified"><ShieldCheck size={15}/> Verified</span></div><h3>{d.name}</h3><b>{d.headline}</b><p>{d.bio}</p><div className="tags">{(d.skills||[]).map(s=><span key={s}>{s}</span>)}</div><div className="devbottom"><span><Star size={15} fill="currentColor"/> {d.rating} ({d.review_count})</span><strong>₹{d.hourly_rate}/hr</strong></div></Link>)}</div></main></>
}

function Developer(){
 const {id}=useParams(),[d,setD]=useState(null),nav=useNavigate();
 useEffect(()=>{api('/developers/'+id).then(setD)},[id]);
 if(!d)return <><Nav/><div className="loading">Loading developer...</div></>;
 return <><Nav/><main className="page profile"><div className="profiletop"><div className="avatar xl">{d.name.split(' ').map(x=>x[0]).join('')}</div><div><span className="verified"><ShieldCheck size={15}/> Verified developer</span><h1>{d.name}</h1><h2>{d.headline}</h2><p>{d.bio}</p><div className="tags">{d.skills.map(s=><span key={s}>{s}</span>)}</div></div><aside><strong>₹{d.hourly_rate}</strong><small>per hour</small><button className="btn primary full" onClick={async()=>{const l=await api('/auth/demo-login',{method:'POST',body:JSON.stringify({email:'client@example.com'})});localStorage.setItem('token',l.token);const b=await api('/bookings',{method:'POST',body:JSON.stringify({developerId:id,startsAt:new Date(Date.now()+86400000).toISOString(),durationMinutes:60,projectTitle:'Website consultation',requirements:'Discuss website idea and implementation.'})});nav('/booking/'+b.id)}}>Book a session</button></aside></div><div className="stats"><div><b>{d.rating}</b><span>Rating</span></div><div><b>{d.review_count}+</b><span>Reviews</span></div><div><b>{d.experience_years} yrs</b><span>Experience</span></div></div></main></>
}

function Booking(){
 const {id}=useParams(),[paid,setPaid]=useState(false),nav=useNavigate();
 const pay=async()=>{await api('/bookings/'+id+'/payment',{method:'POST'});setPaid(true)};
 return <><Nav/><main className="page narrow"><span className="eyebrow">CHECKOUT</span><h1>Confirm your session</h1><div className="checkout"><div><h3>Website consultation</h3><p>60-minute live session</p><div className="summary"><span>Session</span><b>₹1,200</b></div><div className="summary"><span>Platform fee</span><span>Included</span></div><hr/><div className="summary total"><span>Total</span><b>₹1,200</b></div>{!paid?<button className="btn primary full" onClick={pay}>Pay & confirm</button>:<button className="btn primary full" onClick={()=>nav('/session/'+id)}>Enter live session <Video size={17}/></button>}</div><div className="secure"><ShieldCheck/><h3>Secure booking</h3><p>Your payment is recorded against the session. Payment providers can be connected through the backend service layer.</p></div></div></main></>
}

function Session(){
 const {id}=useParams(),[notes,setNotes]=useState(''),[messages,setMessages]=useState([]),[msg,setMsg]=useState(''),[seconds,setSeconds]=useState(3600);
 useEffect(()=>{api('/bookings/'+id+'/messages').then(setMessages);api('/bookings/'+id+'/notes').then(n=>setNotes(n.notes||''));const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t)},[id]);
 const send=async()=>{if(!msg.trim())return;const m=await api('/bookings/'+id+'/messages',{method:'POST',body:JSON.stringify({body:msg})});setMessages(x=>[...x,m]);setMsg('')};
 const save=()=>api('/bookings/'+id+'/notes',{method:'PUT',body:JSON.stringify({notes})});
 return <><Nav/><main className="session-page"><div className="sessionbar"><div><b>Website consultation</b><span>Client × Aarav Mehta</span></div><div className="timer"><Clock size={16}/> {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</div><button className="btn danger">End session</button></div><div className="workspace"><div className="video-stage"><div className="video-placeholder"><Video size={42}/><h2>Live workspace</h2><p>Connect your WebRTC/LiveKit provider here for production video.</p><button className="btn primary">Start camera</button></div></div><aside className="session-side"><div className="tabs"><b>Chat</b><span>Files</span><span>Tasks</span></div><div className="messages">{messages.map((m,i)=><div className="message" key={m.id||i}><b>{m.name||'You'}</b><p>{m.body}</p></div>)}{!messages.length&&<p className="muted">No messages yet. Start the conversation.</p>}</div><div className="chatinput"><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Message..."/><button onClick={send}>Send</button></div></aside></div><div className="notes"><div><h3>Session notes</h3><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Capture requirements, decisions and next steps..."/><button className="btn secondary" onClick={save}>Save notes</button></div><div><h3>Project tasks</h3><label><input type="checkbox"/> Finalize homepage layout</label><label><input type="checkbox"/> Connect contact form</label><label><input type="checkbox"/> Deploy staging build</label></div></div></main></>
}

function Dashboard(){
 const [items,setItems]=useState([]);
 useEffect(()=>{api('/auth/demo-login',{method:'POST',body:JSON.stringify({email:'client@example.com'})}).then(x=>{localStorage.setItem('token',x.token);return api('/bookings')}).then(setItems)},[]);
 return <><Nav/><main className="page"><span className="eyebrow">CLIENT DASHBOARD</span><h1>Your workspace.</h1><div className="dashgrid"><div className="dashcard"><Calendar/><b>Upcoming session</b><h2>{items[0]?'Tomorrow · 60 min':'No upcoming sessions'}</h2><p>{items[0]?.project_title||'Book a developer to get started.'}</p>{items[0]&&<Link className="btn primary" to={'/session/'+items[0].id}>Open session</Link>}</div><div className="dashcard"><Clock/><b>Quick action</b><h2>Need help now?</h2><p>Find a specialist and book a focused live session.</p><Link className="btn secondary" to="/developers">Browse developers</Link></div></div></main></>
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
