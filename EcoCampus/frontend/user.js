const API = window.ECOCAMPUS_API_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "https://ecocampus-api.onrender.com/api"
);
const token=localStorage.getItem("ecoCampusToken");
const user=JSON.parse(localStorage.getItem("ecoCampusUser")||"null");
if(!token||!user||user.role!=="user") location.replace("index.html");

const headers=()=>({Authorization:"Bearer "+token,"Content-Type":"application/json"});
const $=id=>document.getElementById(id);
let bins=[],history=[],issues=[];

function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2500)}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));renderPage(id)}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
document.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));
$("logout").onclick=()=>{localStorage.removeItem("ecoCampusToken");localStorage.removeItem("ecoCampusUser");location.replace("login.html")};
$("profileName").textContent=user.name;$("avatar").textContent=user.name[0].toUpperCase();$("welcome").textContent=`Good day, ${user.name.split(" ")[0]}!`;$("profileFullName").textContent=user.name;$("profileEmail").textContent=user.email;$("bigAvatar").textContent=user.name[0].toUpperCase();

async function api(url,options={}){const r=await fetch(API+url,{...options,headers:{...headers(),...(options.headers||{})}});if(r.status===401){localStorage.clear();location.replace("login.html")}const d=await r.json();if(!r.ok)throw new Error(d.message||"Request failed");return d}
async function loadAll(){try{[bins,history,issues]=await Promise.all([api("/bins"),api("/reports/collections"),api("/reports/issues")]);renderDashboard();renderCollections();renderNearby();renderHistory();fillIssueBins()}catch(e){toast(e.message)}}
function renderDashboard(){
 const pending=bins.filter(b=>b.fill_level>=50).sort((a,b)=>b.fill_level-a.fill_level);
 $("pending").textContent=pending.length;$("completed").textContent=history.length;$("issues").textContent=issues.length;$("nearbyCount").textContent=bins.length;
 const next=pending[0];
 $("nextCollection").innerHTML=next?`<div class="next-item"><h3>${next.location}</h3><p>${next.bin_code} · ${next.waste_type}</p><div class="fill-number">${next.fill_level}%</div><div class="bar"><i style="width:${next.fill_level}%"></i></div><button class="primary" onclick="completeCollection(${next.id})">✓ Complete Collection</button></div>`:"<div class='next-item'><h3>All clear 🎉</h3><p>No bins currently need collection.</p></div>";
 $("todayList").innerHTML=pending.slice(0,5).map(b=>`<div class="task"><div><b>${b.bin_code}</b><small>${b.location} · ${b.waste_type}</small></div><span class="status ${b.status}">${b.fill_level}%</span><button class="collect-btn" onclick="completeCollection(${b.id})">Collect</button></div>`).join("")||"<p>No pending tasks.</p>";
}
function renderCollections(){
 const pending=bins.filter(b=>b.fill_level>=50).sort((a,b)=>b.fill_level-a.fill_level);
 $("collectionCards").innerHTML=pending.map(b=>`<div class="collection-card"><h3>${b.bin_code}</h3><p>${b.location}</p><small>${b.waste_type}</small><div class="fill-number">${b.fill_level}%</div><div class="bar"><i style="width:${b.fill_level}%"></i></div><span class="status ${b.status}">${b.status}</span><button class="collect-btn" style="float:right" onclick="completeCollection(${b.id})">Complete</button></div>`).join("")||"<div class='card'><h2>No pending collections</h2><p>Everything is currently under the collection threshold.</p></div>";
}
function renderNearby(){
 $("nearbyGrid").innerHTML=bins.map(b=>`<div class="nearby-card"><h3>${b.location}</h3><small>${b.bin_code} · ${b.waste_type}</small><div class="fill-number">${b.fill_level}%</div><div class="bar"><i style="width:${b.fill_level}%"></i></div><span class="status ${b.status}">${b.status}</span></div>`).join("");
}
function renderHistory(){
 $("historyTable").innerHTML=history.map(x=>`<tr><td>${x.bin_code}</td><td>${x.location}</td><td>${new Date(x.collected_at).toLocaleString()}</td></tr>`).join("")||"<tr><td colspan='3'>No collection history yet.</td></tr>";
}
function fillIssueBins(){$("issueBin").innerHTML='<option value="">General campus issue</option>'+bins.map(b=>`<option value="${b.id}">${b.bin_code} – ${b.location}</option>`).join("")}
function renderPage(id){if(id==="dashboard")renderDashboard();if(id==="collections")renderCollections();if(id==="nearby")renderNearby();if(id==="history")renderHistory()}

async function completeCollection(id){try{await api(`/bins/${id}/collect`,{method:"POST"});toast("Collection completed successfully");await loadAll()}catch(e){toast(e.message)}}
window.completeCollection=completeCollection;
$("refreshBtn").onclick=()=>{loadAll();toast("Data refreshed")};

$("issueForm").onsubmit=async e=>{e.preventDefault();try{await api("/reports/issues",{method:"POST",body:JSON.stringify({bin_id:$("issueBin").value||null,issue_type:$("issueType").value,description:$("description").value})});$("issueForm").reset();toast("Issue reported to admin");await loadAll()}catch(err){toast(err.message)}};

loadAll();
