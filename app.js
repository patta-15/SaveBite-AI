
// ===================================
// SAVEBITE AI - APPLICATION
// ===================================

const $ = id => document.getElementById(id);

const KEY = "savebite_demo_v1";

let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
  sales: [],
  waste: [],
  consentLog: [],
  profile: null
};

function saveDB() {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function money(n) {
  return Number(n || 0).toLocaleString("th-TH", {
    maximumFractionDigits: 2
  });
}

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// ===================================
// LOGIN (DEMO ONLY)
// ===================================

function login() {
  const name = $("username").value.trim();
  const role = $("role").value;

  if (!name) {
    alert("กรุณากรอกชื่อผู้ใช้งาน");
    return;
  }

  db.profile = { name, role };
  saveDB();

  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("userLabel").textContent =
    name + " (" + (role === "owner" ? "เจ้าของร้าน" : "พนักงาน") + ")";

  document.querySelectorAll(".owner-only").forEach(el => {
    el.classList.toggle("hidden", role !== "owner");
  });

  if (role === "staff" && $("reports")) {
    $("reports").classList.add("hidden");
  }

  renderAll();

  if (!localStorage.getItem("savebite_cookie")) {
    $("cookieBox").classList.remove("hidden");
  }
}

function logout() {
  db.profile = null;
  saveDB();
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("username").value = "";
}

// ===================================
// NAVIGATION
// ===================================

const titles = {
  dashboard: "ภาพรวมร้านอาหาร",
  sales: "บันทึกยอดขาย",
  waste: "จัดการอาหารเหลือทิ้ง",
  menu: "วิเคราะห์เมนู",
  forecast: "AI Forecast",
  reports: "รายงานยอดขาย",
  privacy: "Privacy Center"
};

document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("hidden")) return;

    document.querySelectorAll(".nav").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    document.querySelectorAll(".page").forEach(p =>
      p.classList.add("hidden")
    );

    const page = btn.dataset.page;
    $(page).classList.remove("hidden");
    $("pageTitle").textContent = titles[page];

    renderAll();
  });
});

// ===================================
// SALES
// ===================================

$("salesForm").addEventListener("submit", e => {
  e.preventDefault();

  const qty = Number($("saleQty").value);
  const price = Number($("salePrice").value);
  const cost = Number($("saleCost").value);

  db.sales.push({
    id: crypto.randomUUID(),
    date: today(),
    name: $("saleName").value.trim(),
    qty,
    price,
    cost,
    revenue: qty * price,
    profit: qty * (price - cost)
  });

  saveDB();
  e.target.reset();
  renderAll();
  toast("บันทึกยอดขายสำเร็จ ✓");
});

// ===================================
// FOOD WASTE
// ===================================

$("wasteForm").addEventListener("submit", e => {
  e.preventDefault();

  db.waste.push({
    id: crypto.randomUUID(),
    date: today(),
    name: $("wasteName").value.trim(),
    qty: Number($("wasteQty").value),
    cost: Number($("wasteCost").value)
  });

  saveDB();
  e.target.reset();
  renderAll();
  toast("บันทึกอาหารเหลือเรียบร้อย ♻");
});

// ===================================
// DASHBOARD
// ===================================

function renderDashboard() {
  const revenue = db.sales.reduce((s,x) => s+x.revenue,0);
  const profit = db.sales.reduce((s,x) => s+x.profit,0);
  const waste = db.waste.reduce((s,x) => s+x.qty,0);
  const orders = db.sales.reduce((s,x) => s+x.qty,0);

  $("totalSales").textContent = "฿"+money(revenue);
  $("totalProfit").textContent = "฿"+money(profit);
  $("totalWaste").textContent = money(waste)+" kg";
  $("totalOrders").textContent = money(orders);

  const months = Array.from({length:6},(_,i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth()-5+i);
    return {
      label: d.toLocaleDateString("th-TH",{month:"short"}),
      key: d.toLocaleDateString("en-CA").slice(0,7)
    };
  });

  const values = months.map(m =>
    db.sales.filter(s => s.date.startsWith(m.key))
      .reduce((sum,s) => sum+s.revenue,0)
  );

  const max = Math.max(...values,1);

  $("monthlyChart").innerHTML = months.map((m,i) => `
    <div class="bar-group">
      <span>${money(values[i])}</span>
      <div class="bar" style="height:${Math.max(4,values[i]/max*70)}%"></div>
      <span>${m.label}</span>
    </div>
  `).join("");

  $("recommendations").innerHTML = `
    <div class="tip">🌱 อาหารเหลือสะสม ${money(waste)} กิโลกรัม</div>
    <div class="tip">💰 กำไรสะสม ฿${money(profit)}</div>
    <div class="tip">📊 บันทึกยอดขายแล้ว ${orders} จาน</div>
    <div class="tip">💡 ตรวจสอบเมนูที่มีกำไรต่ำเพื่อวางแผนปรับปรุง</div>
  `;
}

// ===================================
// TABLES
// ===================================

function renderTables() {
  $("salesTable").innerHTML = db.sales.slice().reverse().map(s => `
    <tr>
      <td>${s.date}</td>
      <td>${escapeHTML(s.name)}</td>
      <td>${s.qty}</td>
      <td>฿${money(s.revenue)}</td>
      <td class="${s.profit>=0?"positive":"negative"}">฿${money(s.profit)}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">ยังไม่มีข้อมูล</td></tr>`;

  $("wasteTable").innerHTML = db.waste.slice().reverse().map(w => `
    <tr>
      <td>${w.date}</td>
      <td>${escapeHTML(w.name)}</td>
      <td>${money(w.qty)} kg</td>
      <td>฿${money(w.cost)}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">ยังไม่มีข้อมูล</td></tr>`;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  })[c]);
}

// ===================================
// MENU PROFIT ANALYSIS
// ===================================

function renderMenu() {
  const menus = {};

  db.sales.forEach(s => {
    if (!menus[s.name]) {
      menus[s.name] = { revenue:0, profit:0, qty:0 };
    }
    menus[s.name].revenue += s.revenue;
    menus[s.name].profit += s.profit;
    menus[s.name].qty += s.qty;
  });

  const sorted = Object.entries(menus)
    .sort((a,b) => b[1].profit-a[1].profit);

  if (!sorted.length) {
    $("menuAnalysis").innerHTML = "ยังไม่มีข้อมูลยอดขาย";
    return;
  }

  $("menuAnalysis").innerHTML = sorted.map((item,i) => `
    <div class="profit-item">
      <span>${i===0?"🏆":i===sorted.length-1?"⚠":"🍽"}
        ${escapeHTML(item[0])}
      </span>
      <span class="${item[1].profit>=0?"positive":"negative"}">
        ฿${money(item[1].profit)}
      </span>
    </div>
  `).join("");
}

// ===================================
// AI FORECAST (STATISTICAL DEMO)
// ===================================

function renderForecast() {
  const lastDays = Array.from({length:7},(_,i) => {
    const d = new Date();
    d.setDate(d.getDate()-6+i);
    return d.toLocaleDateString("en-CA");
  });

  const daily = lastDays.map(day =>
    db.sales.filter(s => s.date===day)
      .reduce((sum,s) => sum+s.qty,0)
  );

  const avg = daily.reduce((a,b)=>a+b,0)/7;

  const result = avg > 0 ? Math.ceil(avg) : 0;

  const menus = {};

  db.sales.forEach(s => {
    menus[s.name] = (menus[s.name]||0)+s.qty;
  });

  const ranked = Object.entries(menus)
    .sort((a,b)=>b[1]-a[1]);

  $("forecastResult").innerHTML = `
    <div class="stat-card">
      <span>ปริมาณที่แนะนำสำหรับวันพรุ่งนี้</span>
      <h2>${result} จาน</h2>
      <small>ค่าเฉลี่ยจำนวนขายย้อนหลัง 7 วัน</small>
    </div>
    <h3 style="margin-top:20px">เมนูที่ขายบ่อย</h3>
    ${ranked.slice(0,5).map(m=>`
      <div class="profit-item">
        <span>${escapeHTML(m[0])}</span>
        <b>${m[1]} จาน</b>
      </div>
    `).join("") || "ยังไม่มีข้อมูลเพียงพอ"}
    <p class="muted">หมายเหตุ: เป็นการพยากรณ์เบื้องต้น ไม่ใช่โมเดล AI ที่ผ่านการฝึก</p>
  `;
}

// ===================================
// REPORTS
// ===================================

function renderReports() {
  const type = $("reportType").value;
  const groups = {};

  db.sales.forEach(s => {
    const key = type==="month"
      ? s.date.slice(0,7)
      : s.date.slice(0,4);

    groups[key] = (groups[key]||0)+s.revenue;
  });

  const rows = Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0]));

  $("reportResult").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>ช่วงเวลา</th><th>ยอดขายรวม</th></tr></thead>
        <tbody>
          ${rows.map(r=>`
            <tr><td>${r[0]}</td><td>฿${money(r[1])}</td></tr>
          `).join("") || `<tr><td colspan="2">ยังไม่มีข้อมูล</td></tr>`}
        </tbody>
      </table>
    </div>
    <button onclick="exportCSV()">ดาวน์โหลดรายงาน CSV</button>
  `;
}

function exportCSV() {
  const rows = [
    ["วันที่","เมนู","จำนวน","ยอดขาย","กำไร"],
    ...db.sales.map(s=>[s.date,s.name,s.qty,s.revenue,s.profit])
  ];

  const csv = "\uFEFF"+rows.map(r =>
    r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download="SaveBite-Report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================
// PRIVACY & DATA SUBJECT RIGHTS
// ===================================

function privacyLog(action) {
  db.consentLog.push({
    action,
    user:db.profile?.name || "Unknown",
    date:new Date().toISOString()
  });
  saveDB();
}

function viewMyData() {
  $("privacyResult").textContent =
    JSON.stringify(db.profile,null,2);
}

function editMyData() {
  const newName = prompt("กรอกชื่อใหม่",db.profile.name);
  if (newName && newName.trim()) {
    db.profile.name = newName.trim();
    $("userLabel").textContent =
      newName+" ("+(db.profile.role==="owner"?"เจ้าของร้าน":"พนักงาน")+")";
    saveDB();
    privacyLog("แก้ไขข้อมูลส่วนบุคคล");
    toast("แก้ไขข้อมูลสำเร็จ");
  }
}

function requestDelete() {
  if (!confirm("คุณต้องการส่งคำขอลบข้อมูลส่วนบุคคลใช่หรือไม่?")) return;

  privacyLog("คำขอลบข้อมูลส่วนบุคคล (DEMO)");

  $("privacyResult").textContent =
    "บันทึกคำขอลบข้อมูลในระบบทดลองแล้ว ระบบจริงต้องส่งคำขอให้ผู้ดูแลตรวจสอบและดำเนินการตามกฎหมาย";
}

function showConsentLog() {
  $("privacyResult").innerHTML =
    "<h3>ประวัติ Consent Log</h3>" +
    db.consentLog.map(x=>`
      <div class="tip">
        ${escapeHTML(x.action)}<br>
        <small>${escapeHTML(x.date)}</small>
      </div>
    `).join("") || "ยังไม่มีประวัติ";
}

function showPrivacyPolicy() {
  $("privacyResult").innerHTML = `
    <h3>นโยบายความเป็นส่วนตัว</h3>
    <p>SaveBite AI ให้ความสำคัญกับข้อมูลส่วนบุคคล</p>
    <p>1. เก็บข้อมูลเพื่อให้บริการระบบบริหารร้านอาหาร</p>
    <p>2. จำกัดการเข้าถึงข้อมูลตามหน้าที่</p>
    <p>3. ผู้ใช้สามารถขอดู แก้ไข และขอลบข้อมูลได้</p>
    <p>4. การประมวลผลข้อมูลต้องเป็นไปตาม PDPA</p>
    <p>5. ติดต่อผู้ดูแลระบบเพื่อใช้สิทธิ์ตามกฎหมาย</p>
    <p><b>หมายเหตุ:</b> นโยบายนี้เป็นข้อความตัวอย่าง ต้องปรับให้ตรงกับการเก็บและใช้ข้อมูลจริงก่อนเปิดบริการ</p>
  `;
}

// ===================================
// COOKIE CONSENT
// ===================================

function cookieConsent(choice) {
  localStorage.setItem("savebite_cookie",choice);

  db.consentLog.push({
    action:"Cookie consent: "+choice,
    user:db.profile?.name || "Unknown",
    date:new Date().toISOString()
  });

  saveDB();
  $("cookieBox").classList.add("hidden");
  toast("บันทึกการตั้งค่าคุกกี้แล้ว");
}

function showCookieSettings() {
  $("cookieBox").classList.remove("hidden");
}

function renderAll() {
  renderDashboard();
  renderTables();
  renderMenu();
  renderForecast();
  renderReports();
}

// ===================================
// START
// ===================================

$("today").textContent =
  new Date().toLocaleDateString("th-TH",{
    day:"numeric",month:"long",year:"numeric"
  });

if (db.profile) {
  $("username").value = db.profile.name;
  $("role").value = db.profile.role;
  login();
}
