
const key="cloudnestData";
const data=JSON.parse(localStorage.getItem(key)||'{"balance":0,"orders":[],"invoices":[],"payments":[],"domains":[]}');
function save(){localStorage.setItem(key,JSON.stringify(data))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN")}
function toast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>toast(b.dataset.action)));
document.querySelectorAll(".order-btn").forEach(b=>b.addEventListener("click",()=>location.href="order.html?plan="+encodeURIComponent(b.dataset.plan||"Starter Panel")+"&price="+(b.dataset.price||149)));
const fundForm=document.getElementById("fundForm");
if(fundForm) fundForm.addEventListener("submit",e=>{e.preventDefault();let a=+document.getElementById("fundAmount").value;if(a<1)return toast("Enter a valid amount");data.balance+=a;data.payments.unshift({id:"PAY-"+Date.now().toString().slice(-6),amount:a,status:"Paid",date:new Date().toLocaleDateString("en-IN")});save();toast("Funds added successfully");setTimeout(()=>location.href="payments.html",500)});
document.querySelectorAll("[data-amount]").forEach(b=>b.addEventListener("click",()=>{const i=document.getElementById("fundAmount");if(i)i.value=b.dataset.amount}));
const orderForm=document.getElementById("orderForm");
if(orderForm){
 const p=new URLSearchParams(location.search);document.getElementById("plan").value=p.get("plan")||"Starter Panel";document.getElementById("price").value=p.get("price")||149;
 const update=()=>{let base=+document.getElementById("price").value,cycle=+document.getElementById("billing").value;document.getElementById("total").textContent=money(base*cycle*.9);};
 document.getElementById("billing").addEventListener("change",update);update();
 orderForm.addEventListener("submit",e=>{e.preventDefault();const domain=document.getElementById("domain").value.trim();if(!domain)return toast("Enter your domain");const plan=document.getElementById("plan").value,base=+document.getElementById("price").value,cycle=+document.getElementById("billing").value,total=Math.round(base*cycle*.9);if(data.balance<total)return toast("Insufficient wallet balance");data.balance-=total;const id="ORD-"+Date.now().toString().slice(-6);data.orders.unshift({id,plan,domain,status:"Active",date:new Date().toLocaleDateString("en-IN")});data.invoices.unshift({id:"INV-"+Date.now().toString().slice(-6),order:id,amount:total,status:"Paid",date:new Date().toLocaleDateString("en-IN")});save();toast("Order placed successfully");setTimeout(()=>location.href="dashboard.html",700)})
}
function fillCommon(){document.querySelectorAll("[data-balance]").forEach(x=>x.textContent=money(data.balance));document.querySelectorAll("[data-order-count]").forEach(x=>x.textContent=data.orders.length)}
fillCommon();
const ordersList=document.getElementById("ordersList");
if(ordersList){ordersList.innerHTML=data.orders.length?data.orders.map(o=>`<tr><td><b>${o.id}</b></td><td>${o.plan}</td><td>${o.domain}</td><td><span class="status">${o.status}</span></td><td>${o.date}</td></tr>`).join(""):`<tr><td colspan="5"><div class="empty"><div class="empty-icon">☁</div><b>No orders yet</b><span>Place your first hosting order to see it here.</span></div></td></tr>`}
const invoiceList=document.getElementById("invoiceList");
if(invoiceList){invoiceList.innerHTML=data.invoices.length?data.invoices.map(i=>`<tr><td><b>${i.id}</b></td><td>${i.order}</td><td>${money(i.amount)}</td><td><span class="status">${i.status}</span></td><td>${i.date}</td><td><button class="btn" onclick="toast('Invoice downloaded in demo mode')">View</button></td></tr>`).join(""):`<tr><td colspan="6"><div class="empty"><div class="empty-icon">▥</div><b>No invoices</b><span>Invoices generated from orders will appear here.</span></div></td></tr>`}
const paymentList=document.getElementById("paymentList");
if(paymentList){paymentList.innerHTML=data.payments.length?data.payments.map(p=>`<tr><td><b>${p.id}</b></td><td>Wallet top-up</td><td>${money(p.amount)}</td><td><span class="status">${p.status}</span></td><td>${p.date}</td></tr>`).join(""):`<tr><td colspan="5"><div class="empty"><div class="empty-icon">₹</div><b>No payments</b><span>Your wallet payment history will appear here.</span></div></td></tr>`}
const domainList=document.getElementById("domainList");
if(domainList){domainList.innerHTML=data.domains.length?data.domains.map(d=>`<article class="domain"><div class="domain-head"><div><div class="domain-name">${d.name}</div><div class="domain-meta">${d.status} · ${d.panel||"Not connected"}</div></div><span class="status">${d.status}</span></div><div class="domain-actions"><button class="btn">Manage</button><button class="btn">DNS</button></div></article>`).join(""):`<div class="card" style="grid-column:1/-1"><div class="empty"><div class="empty-icon">◎</div><b>No domains connected</b><span>Add your domain when placing a hosting order.</span></div></div>`}
document.querySelectorAll("[data-count]").forEach(x=>{const k=x.dataset.count;x.textContent=k==="orders"?data.orders.length:k==="invoices"?data.invoices.length:k==="payments"?data.payments.length:0});
