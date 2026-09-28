const API = window.ECOCAMPUS_API_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "https://ecocampus-api.onrender.com/api"
);
const token=localStorage.getItem("ecoCampusToken");
const user=JSON.parse(localStorage.getItem("ecoCampusUser")||"null");
if(!token||!user||user.role!=="admin") location.replace("index.html");

const headers=()=>({Authorization:"Bearer "+token,"Content-Type":"application/json"});
let bins=[];

const $=id=>document.getElementById(id);
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2500)}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id)); if(id==="bins")renderBinTable(); if(id==="alerts")renderAlertsPage(); if(id==="routes")renderRoute(); if(id==="users")loadUsers(); if(id==="reports")loadReports()}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
document.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));
$("logout").onclick=()=>{localStorage.removeItem("ecoCampusToken");localStorage.removeItem("ecoCampusUser");location.replace("login.html")};
$("profileName").textContent=user.name; $("avatar").textContent=user.name[0].toUpperCase();

async function api(url,options={}){const r=await fetch(API+url,{...options,headers:{...headers(),...(options.headers||{})}});if(r.status===401){localStorage.clear();location.replace("login.html")}const d=await r.json();if(!r.ok)throw new Error(d.message||"Request failed");return d}

async function loadBins(){try{bins=await api("/bins");renderOverview();renderBinTable();renderAlertsPage();renderRoute()}catch(e){toast(e.message)}}
function statusClass(s){return s.toLowerCase()}
function renderOverview(){
 $("totalBins").textContent=bins.length;$("fullBins").textContent=bins.filter(b=>b.status==="FULL").length;$("pendingBins").textContent=bins.filter(b=>b.fill_level>=50).length;$("sustainBins").textContent=bins.length;
 $("binGrid").innerHTML=bins.slice(0,8).map(b=>`<div class="bin"><div class="bin-head"><span>${b.bin_code}</span><span class="status ${b.status}">${b.status}</span></div><small>${b.location}</small><div class="bar"><i class="${statusClass(b.status)}" style="width:${b.fill_level}%"></i></div><small>${b.fill_level}% full</small></div>`).join("");
 const alerts=bins.filter(b=>b.fill_level>=80).slice(0,5);
 $("alertList").innerHTML=alerts.length?alerts.map(b=>`<div class="alert-item"><div class="alert-icon">⚠</div><div><b>${b.bin_code} – ${b.location}</b><small>${b.fill_level}% full · Priority collection</small></div></div>`).join(""):"<p>No priority alerts.</p>";
}
function renderBinTable(){
 const q=($("binSearch")?.value||"").toLowerCase(),f=$("binFilter")?.value||"all";
 const list=bins.filter(b=>(f==="all"||b.status===f)&&(`${b.bin_code} ${b.location}`.toLowerCase().includes(q)));
 $("binTable").innerHTML=list.map(b=>`<tr><td><b>${b.bin_code}</b></td><td>${b.location}</td><td>${b.waste_type}</td><td>${b.fill_level}%</td><td><span class="pill ${statusClass(b.status)}">${b.status}</span></td><td><button class="action-btn" onclick="collectBin(${b.id})">Collect</button><button class="action-btn" onclick="raiseFill(${b.id})">+10%</button></td></tr>`).join("");
}
async function collectBin(id){try{await api(`/bins/${id}/collect`,{method:"POST"});toast("Collection completed");loadBins()}catch(e){toast(e.message)}}
async function raiseFill(id){const b=bins.find(x=>x.id===id);try{await api(`/bins/${id}`,{method:"PATCH",body:JSON.stringify({fill_level:Math.min(100,b.fill_level+10)})});toast("Bin fill updated");loadBins()}catch(e){toast(e.message)}}
window.collectBin=collectBin;window.raiseFill=raiseFill;
$("binSearch").oninput=renderBinTable;$("binFilter").onchange=renderBinTable;

function renderAlertsPage(){const a=bins.filter(b=>b.fill_level>=80);$("alertsPage").innerHTML=a.length?a.map(b=>`<div class="alert-card"><h3>⚠ ${b.bin_code} – ${b.location}</h3><p>Fill level: <b>${b.fill_level}%</b></p><p>Waste type: ${b.waste_type}</p><button class="primary" onclick="collectBin(${b.id})">Complete Collection</button></div>`).join(""):"<div class='card'><h2>All clear</h2><p>No bins currently require priority collection.</p></div>"}
function renderRoute(){const a=bins.filter(b=>b.fill_level>=50).sort((x,y)=>y.fill_level-x.fill_level);$("routeList").innerHTML=a.length?a.map((b,i)=>`<div class="route-stop"><div class="route-no">${i+1}</div><div><b>${b.location}</b><small>${b.bin_code} · ${b.fill_level}% full · ${b.waste_type}</small></div><span class="pill ${statusClass(b.status)}">${b.status}</span></div>`).join(""):"<p>No collection stops required.</p>"}
$("optimizeBtn").onclick=()=>{renderRoute();toast("Priority route optimized")};

function openModal(type){
 const modal=$("modal"),form=$("modalForm");modal.classList.add("open");
 if(type==="bin"){ $("modalTitle").textContent="Add New Bin";form.innerHTML=`<label>Bin Code</label><input name="bin_code" placeholder="B009" required><label>Location</label><input name="location" placeholder="Science Block" required><label>Waste Type</label><select name="waste_type"><option>General</option><option>Recyclable</option><option>Organic</option><option>E-Waste</option></select><label>Initial Fill %</label><input name="fill_level" type="number" min="0" max="100" value="0"><button class="primary">Create Bin</button>`}
 if(type==="user"){ $("modalTitle").textContent="Add User";form.innerHTML=`<label>Name</label><input name="name" required><label>Email</label><input name="email" type="email" required><label>Password</label><input name="password" type="password" required><label>Role</label><select name="role"><option value="user">Waste Collector/User</option><option value="admin">Administrator</option></select><button class="primary">Create User</button>`}
 form.onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));try{if(type==="bin"){data.fill_level=Number(data.fill_level);await api("/bins",{method:"POST",body:JSON.stringify(data)});toast("Bin added");loadBins()}else{await api("/users",{method:"POST",body:JSON.stringify(data)});toast("User created");loadUsers()}modal.classList.remove("open")}catch(err){toast(err.message)}}
}
$("addBinBtn").onclick=()=>openModal("bin");$("addUserBtn").onclick=()=>openModal("user");$("closeModal").onclick=()=>$("modal").classList.remove("open");$("refreshBtn").onclick=()=>{loadBins();toast("Dashboard refreshed")};

async function loadUsers(){try{const u=await api("/users");$("userTable").innerHTML=u.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.email}</td><td><span class="pill ${x.role==="admin"?"full":"low"}">${x.role}</span></td><td>${new Date(x.created_at).toLocaleDateString()}</td></tr>`).join("")}catch(e){toast(e.message)}}
async function loadReports(){try{const c=await api("/reports/collections");$("collectionTable").innerHTML=c.slice(0,15).map(x=>`<tr><td>${x.bin_code}</td><td>${x.location}</td><td>${x.collector||"—"}</td><td>${new Date(x.collected_at).toLocaleString()}</td></tr>`).join("")}catch(e){toast(e.message)}}
async function exportData(endpoint,filename){try{const data=await api(endpoint);if(!data.length){toast("No data to export");return}const keys=Object.keys(data[0]);const csv=[keys.join(","),...data.map(r=>keys.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\\n");const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}catch(e){toast(e.message)}}
$("exportCollections").onclick=()=>exportData("/reports/collections","ecocampus-collections.csv");$("exportIssues").onclick=()=>exportData("/reports/issues","ecocampus-issues.csv");
$("saveSettings").onclick=()=>{localStorage.setItem("ecoAutoRefresh",$("autoRefresh").checked);localStorage.setItem("ecoNotifications",$("notifications").checked);toast("Settings saved")};
$("autoRefresh").checked=localStorage.getItem("ecoAutoRefresh")==="true";$("notifications").checked=localStorage.getItem("ecoNotifications")!=="false";
if($("autoRefresh").checked)setInterval(loadBins,30000);
loadBins();loadUsers();loadReports();
