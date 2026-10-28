/* =============================================================
   Shared app shell, constants and helpers
   ============================================================= */
(function () {
  // ---------- Trip constants ----------
  const TRIP = {
    name: "Travellers Family Annual Trip 2",
    start: "2026-11-04",
    end: "2026-11-15",
    startAt: "2026-11-04T05:00:00+05:30",       // departure from Gandhinagar (edit in Settings)
    kedarClose: "2026-11-11T08:30:00+05:30"     // Kedarnath doors close for winter (Bhai Dooj)
  };
  const DEFAULT_MEMBERS = [
    { id: "atish", name: "Atish", color: "#1E3A6B" },
    { id: "niti", name: "Niti", color: "#E07B1A" },
    { id: "dhruv", name: "Dhruv", color: "#1E9A68" }
  ];
  const CATEGORIES = [
    { id: "fuel", name: "Fuel", ic: "fuel" },
    { id: "food", name: "Food", ic: "food" },
    { id: "stay", name: "Stay", ic: "bed" },
    { id: "travel", name: "Tolls/Taxi", ic: "road" },
    { id: "darshan", name: "Darshan/Puja", ic: "temple" },
    { id: "donation", name: "Dakshina", ic: "diya" },
    { id: "trek", name: "Pony/Heli", ic: "trek" },
    { id: "parking", name: "Parking", ic: "parking" },
    { id: "shopping", name: "Shopping", ic: "bag" },
    { id: "snacks", name: "Tea/Snacks", ic: "cup" },
    { id: "medical", name: "Medical", ic: "pill" },
    { id: "other", name: "Other", ic: "receipt" }
  ];
  const PAY_MODES = ["Cash", "UPI", "Card"];

  // ---------- Icons (inline SVG, stroke-based) ----------
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    plan: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h3M8 17h6"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h12v4"/><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M16 13.5h2"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/><path d="M9 7h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    nav: '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    om: '<path d="M4 9c1.5-2 5-2 5.5.5S7 13 6 13c2 0 4 1 4 3.5S8 20 6 20s-3-1-3-1"/><path d="M10 13c1.5 0 2.5-1 4-1 2.5 0 3 2.5 3 4.5S16 20 14 20"/><path d="M14 6c1 .8 2.5.8 3.5 0"/><circle cx="18.5" cy="3.5" r=".9" fill="currentColor"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3Z"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M3 21h13"/><path d="M4 10h11"/><path d="M15 8h2a2 2 0 0 1 2 2v7a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    food: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 21h10"/><path d="M12 3c-1 1.5 1 2.5 0 4M8 4c-1 1.5 1 2.5 0 4M16 4c-1 1.5 1 2.5 0 4"/>',
    bed: '<path d="M2 20V6"/><path d="M2 16h20v4"/><path d="M22 16v-4a3 3 0 0 0-3-3h-8v7"/><circle cx="6.5" cy="11.5" r="2"/>',
    road: '<path d="M8 3 4 21M16 3l4 18"/><path d="M12 4v2M12 10v3M12 17v3"/>',
    temple: '<path d="M12 2v3"/><path d="M8 9l4-4 4 4"/><path d="M6 13l6-4 6 4"/><path d="M5 13h14v8H5z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
    diya: '<path d="M12 3c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6Z"/><path d="M3 13c2 4 5 6 9 6s7-2 9-6Z"/><path d="M3 13h18"/>',
    trek: '<path d="m3 20 6-10 4 6 2-3 6 7Z"/><path d="M9 10V4l4 2-4 2"/>',
    parking: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    bag: '<path d="M5 8h14l-1 13H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    cup: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2v3M12 2v3"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    receipt: '<path d="M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    car: '<path d="M5 17h14v-5l-2-5H7l-2 5Z"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
    snow: '<path d="M12 2v20M4 6l16 12M20 6 4 18"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/>'
  };
  function icon(name, size, color) {
    return `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  }
  // category icons (drawn, not emoji)
  CATEGORIES.forEach(c => { c.e = icon(c.ic, 20); });
  const brandMark = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 19 9 7l3 5 3-3 7 10H2Z" fill="#fff"/><path d="M9 7l-2 3.4 2 .8 1.4-1.2L9 7Z" fill="#cfe0ff"/><circle cx="18" cy="5" r="2.4" fill="#F5A04B"/></svg>`;

  function mountainSVG() {
    return `<svg class="mtn" viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="sunG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE2B0"/><stop offset=".55" stop-color="#FFB867"/><stop offset="1" stop-color="#FF9A45" stop-opacity="0"/></radialGradient>
        <linearGradient id="mBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9B9DE"/><stop offset="1" stop-color="#6E7FB0"/></linearGradient>
        <linearGradient id="mMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D5592"/><stop offset="1" stop-color="#22366A"/></linearGradient>
        <linearGradient id="mFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#142650"/><stop offset="1" stop-color="#0A1430"/></linearGradient>
      </defs>
      <g class="sun"><circle cx="300" cy="64" r="34" fill="url(#sunG)"/><circle cx="300" cy="64" r="15" fill="#FFD9A0"/></g>
      <g class="l-back" opacity=".85">
        <path d="M-20 118 L40 70 L80 92 L150 26 L200 74 L240 50 L300 100 L350 58 L420 96 V150 H-20Z" fill="url(#mBack)"/>
        <path d="M150 26 L167 43 L158 41 L150 50 L142 41 L133 44Z" fill="#fff" opacity=".95"/>
        <path d="M350 58 L362 70 L355 69 L350 74 L345 68 L338 70Z" fill="#fff" opacity=".85"/>
      </g>
      <g class="l-mid">
        <path d="M-20 130 L35 96 L90 116 L140 74 L205 112 L255 84 L315 120 L365 92 L420 110 V150 H-20Z" fill="url(#mMid)"/>
        <path d="M140 74 L155 87 L147 86 L140 92 L133 85 L126 87Z" fill="#E6ECF8" opacity=".9"/>
        <path d="M255 84 L267 94 L260 93 L255 98 L249 92 L243 94Z" fill="#E6ECF8" opacity=".9"/>
      </g>
      <g class="l-front"><path d="M-20 150 L-20 134 Q60 120 130 132 T260 128 T420 126 V150Z" fill="url(#mFront)"/></g>
    </svg>`;
  }

  // ---------- Dates ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseYMD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); }
  function now() {
    const p = localStorage.getItem("yatra.previewDate");
    if (p) { const d = parseYMD(p); d.setHours(10, 0, 0, 0); return d; }
    return new Date();
  }
  function today() { return ymd(now()); }
  function tripDays() {
    const out = []; let d = parseYMD(TRIP.start); const end = parseYMD(TRIP.end); let n = 1;
    while (d <= end) {
      out.push({ date: ymd(d), n, dow: d.toLocaleDateString("en-IN", { weekday: "short" }), dd: d.getDate(),
        mon: d.toLocaleDateString("en-IN", { month: "short" }), label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) });
      d = new Date(d.getTime() + 86400000); n++;
    }
    return out;
  }
  function tripState() {
    const t = today();
    if (t < TRIP.start) return "before";
    if (t > TRIP.end) return "after";
    return "during";
  }
  function dayNumber(date) { const d = tripDays().find(x => x.date === date); return d ? d.n : null; }
  function fmtDate(s, opts) { return parseYMD(s).toLocaleDateString("en-IN", opts || { weekday: "short", day: "numeric", month: "short" }); }

  // ---------- Money ----------
  function money(n, cur) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    const s = v.toLocaleString("en-IN", { maximumFractionDigits: v % 1 ? 2 : 0 });
    return "₹" + s;
  }
  function toINR(amount) { return Number(amount) || 0; }   // all amounts are in ₹

  // ---------- Misc helpers ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function member(id) { return App.members().find(m => m.id === id) || { id, name: id || "—", color: "#7C89A3" }; }
  function avatar(id, lg) { const m = member(id); return `<span class="av${lg ? " lg" : ""}" style="background:${m.color}" title="${esc(m.name)}">${esc((m.name || "?")[0].toUpperCase())}</span>`; }
  function category(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]; }
  function telLink(p) { return "tel:" + String(p || "").replace(/[^\d+]/g, ""); }
  function mapsLink(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q || ""); }
  function mapsDir(dest) { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest || ""); }
  function nowTime() { const d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function defaultDate() { const t = today(); return t; }

  function toast(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ---------- Bottom sheet ----------
  function sheet({ title, html, onMount, wide }) {
    const bd = document.createElement("div"); bd.className = "sheet-backdrop";
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true");
    sh.innerHTML = `<div class="grab"></div><div class="sheet-head"><h2>${esc(title)}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div><div class="sheet-body">${html}</div>`;
    document.body.append(bd, sh);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => { bd.classList.add("show"); sh.classList.add("show"); });
    const close = () => {
      bd.classList.remove("show"); sh.classList.remove("show");
      document.body.style.overflow = "";
      setTimeout(() => { bd.remove(); sh.remove(); }, 260);
    };
    bd.addEventListener("click", close);
    sh.querySelector("[data-close]").addEventListener("click", close);
    const api = { el: sh, close };
    if (onMount) onMount(sh, api);
    return api;
  }
  function confirmBox(msg, okLabel) {
    return new Promise(res => {
      const s = sheet({
        title: "Please confirm", html: `<p>${esc(msg)}</p><div class="btn-row" style="margin-top:16px">
        <button class="btn" data-no>Cancel</button><button class="btn danger" data-yes>${esc(okLabel || "Delete")}</button></div>`,
        onMount(el, api) {
          el.querySelector("[data-no]").onclick = () => { api.close(); res(false); };
          el.querySelector("[data-yes]").onclick = () => { api.close(); res(true); };
        }
      });
    });
  }

  // ---------- Image compression ----------
  function compressImage(file, maxSide, quality) {
    maxSide = maxSide || 1400; quality = quality || 0.72;
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width: w, height: h } = img;
          const k = Math.min(1, maxSide / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          res({ src: c.toDataURL("image/jpeg", quality), w, h });
        };
        img.onerror = rej; img.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }

  const _scripts = {};
  function loadScript(src) {
    if (!_scripts[src]) _scripts[src] = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => { delete _scripts[src]; rej(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
    return _scripts[src];
  }

  function download(filename, blobOrText, mime) {
    const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: mime || "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  // ---------- Shell ----------
  const TABS = [
    { id: "home", href: "index.html", label: "Today", ic: "home" },
    { id: "plan", href: "plan.html", label: "Plan", ic: "plan" },
    { id: "expenses", href: "expenses.html", label: "Expenses", ic: "wallet" },
    { id: "route", href: "route.html", label: "Route", ic: "route" },
    { id: "journal", href: "journal.html", label: "Journal", ic: "book" }
  ];
  function syncLabel(state) {
    return { local: "This phone", ok: "Synced", pending: "Syncing…", offline: "Offline · saved", error: "Sync issue" }[state] || "This phone";
  }
  function shell(active) {
    const head = document.createElement("header"); head.className = "appbar";
    head.innerHTML = `<div class="appbar-inner">
      <a class="brand" href="index.html"><span class="brand-mark">${brandMark}</span>
        <span class="brand-text"><div class="brand-title">Travellers Family</div><div class="brand-sub">Annual Trip 2 · ‘O’ Trip</div></span></a>
      <button class="sync-chip" id="syncChip" title="Sync status"><span class="dot"></span><span class="lbl">This phone</span></button>
      <a class="icon-btn" href="settings.html" aria-label="Settings">${icon("gear")}</a></div>`;
    document.body.prepend(head);
    const nav = document.createElement("nav"); nav.className = "tabbar";
    const ai = TABS.findIndex(t => t.id === active);
    nav.innerHTML = `<div class="tabbar-inner"><span class="tab-ind${ai < 0 ? " none" : ""}" style="--i:${Math.max(0, ai)}"></span>${TABS.map(t => `<a href="${t.href}" class="${t.id === active ? "on" : ""}">${icon(t.ic, 23)}<span>${t.label}</span></a>`).join("")}</div>`;
    document.body.appendChild(nav);
    const chip = $("#syncChip");
    const upd = (s) => { chip.className = "sync-chip " + s; chip.querySelector(".lbl").textContent = syncLabel(s); };
    window.addEventListener("yatra:sync", e => upd(e.detail.state));
    chip.onclick = () => {
      const s = Sync.state;
      const msg = s === "local" ? "Saving on this phone only. Set up family sync in Settings." :
        s === "error" ? "Sync issue: " + (Sync.lastError || "unknown") : s === "offline" ? "No network — everything is saved and will sync later." : "All changes synced with family.";
      toast(msg); Sync.run();
    };
    upd(Sync.cfg().ready ? (navigator.onLine ? "pending" : "offline") : "local");
    if (localStorage.getItem("yatra.previewDate")) {
      const b = document.createElement("div");
      b.className = "callout"; b.style.cssText = "max-width:600px;margin:10px auto 0;border-radius:0;text-align:center;font-size:13px";
      b.innerHTML = `Preview mode: pretending today is <b>${fmtDate(localStorage.getItem("yatra.previewDate"))}</b> · <a href="settings.html#preview">change</a>`;
      head.after(b);
    }
  }

  function fab(onClick, label) {
    const b = document.createElement("button"); b.className = "fab"; b.setAttribute("aria-label", label || "Add expense");
    b.innerHTML = icon("plus", 28, "#fff"); b.onclick = onClick; document.body.appendChild(b); return b;
  }

  // ---------- Trip-key gate (first open on a phone) ----------
  function gateIfNeeded() {
    const c = Sync.cfg();
    if (!c.configured || c.trip || sessionStorage.getItem("yatra.skipGate") || localStorage.getItem("yatra.localOnly")) return false;
    const main = $("main"); main.classList.add("hidden");
    const g = document.createElement("div"); g.className = "gate";
    g.innerHTML = `<div class="card">
      <div class="row" style="margin-bottom:12px"><span class="brand-mark" style="width:44px;height:44px">${brandMark}</span>
      <div><h2 class="display" style="font-size:30px">Har Har Mahadev</h2><div class="muted small">Travellers Family Annual Trip 2</div></div></div>
      <p class="muted">Enter the family trip key so this phone shares expenses, drive log and journal with the others.</p>
      <label class="field"><span>Family trip key</span><input class="input" id="gk" autocomplete="off" autocapitalize="off" placeholder="e.g. kedar-2026-xxxx"></label>
      <div class="field"><span>Who is using this phone?</span><div class="who" id="gw"></div></div>
      <div id="gerr" class="callout warn hidden" style="margin-bottom:12px"></div>
      <button class="btn primary block" id="gok">Continue</button>
      <button class="btn ghost block" id="gskip" style="margin-top:8px">Skip for now (save on this phone only)</button></div>`;
    main.after(g);
    let me = App.me();
    const renderWho = () => { $("#gw").innerHTML = App.members().map(m => `<button data-id="${m.id}" class="${m.id === me ? "on" : ""}">${avatar(m.id)} ${esc(m.name)}</button>`).join(""); };
    renderWho();
    $("#gw").onclick = e => { const b = e.target.closest("button"); if (b) { me = b.dataset.id; renderWho(); } };
    $("#gok").onclick = async () => {
      const k = $("#gk").value.trim(); if (!k) return;
      $("#gok").disabled = true; $("#gok").textContent = "Checking…";
      try {
        const ok = await Sync.checkKey(c.url, c.key, k);
        if (!ok) throw new Error("That trip key is not correct.");
        localStorage.setItem("yatra.tripKey", k); localStorage.setItem("yatra.me", me);
        location.reload();
      } catch (e) {
        if (!navigator.onLine) { localStorage.setItem("yatra.tripKey", k); localStorage.setItem("yatra.me", me); location.reload(); return; }
        $("#gerr").textContent = e.message; $("#gerr").classList.remove("hidden");
        $("#gok").disabled = false; $("#gok").textContent = "Continue";
      }
    };
    $("#gskip").onclick = () => { sessionStorage.setItem("yatra.skipGate", "1"); localStorage.setItem("yatra.me", me); location.reload(); };
    return true;
  }

  // ---------- Shared settings ----------
  const App = {
    TRIP, CATEGORIES, PAY_MODES, icon, mountainSVG, brandMark,
    today, now, tripDays, tripState, dayNumber, fmtDate, parseYMD, ymd, pad, nowTime, defaultDate,
    money, toINR, esc, $, $$, member, avatar, category, telLink, mapsLink, mapsDir,
    toast, sheet, confirmBox, compressImage, download, fab, loadScript,
    shared: {},
    members() { return (App.shared.members && App.shared.members.length === 3) ? App.shared.members : DEFAULT_MEMBERS; },
    me() { return localStorage.getItem("yatra.me") || "atish"; },
    async loadShared() { App.shared = (await DB.get("settings-shared")) || {}; return App.shared; },
    async saveShared(patch) { App.shared = Object.assign({}, App.shared, patch); await DB.put("settings", App.shared, "settings-shared"); },
    async init(active, render) {
      const t = localStorage.getItem("yatra.theme"); if (t) document.documentElement.setAttribute("data-theme", t);
      // One-tap family setup link: index.html#setup=<code>
      if (location.hash.startsWith("#setup=")) {
        try {
          const j = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(7).replace(/-/g, "+").replace(/_/g, "/")))));
          if (j.u) localStorage.setItem("yatra.url", j.u);
          if (j.k) localStorage.setItem("yatra.key", j.k);
          if (j.t) localStorage.setItem("yatra.tripKey", j.t);
          localStorage.removeItem("yatra.localOnly");
          history.replaceState(null, "", location.pathname);
          sessionStorage.setItem("yatra.justLinked", "1");
        } catch (e) { console.warn("bad setup link", e); }
      }
      shell(active);
      if (sessionStorage.getItem("yatra.justLinked")) { sessionStorage.removeItem("yatra.justLinked"); setTimeout(() => App.toast("Family sync connected ✓ Set who you are in Settings"), 600); }
      await App.loadShared();
      if (gateIfNeeded()) return;
      const go = async () => { try { await App.loadShared(); await render(); } catch (e) { console.error(e); } };
      await go();
      // Re-render when data changes (local or synced from family) — but never while someone is typing
      let t2, waiting = false;
      const typing = () => { const a = document.activeElement; return a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest("main"); };
      const schedule = () => { clearTimeout(t2); t2 = setTimeout(() => { if (typing()) { waiting = true; return; } go(); }, 200); };
      window.addEventListener("yatra:change", schedule);
      document.addEventListener("focusout", () => { if (waiting) { waiting = false; setTimeout(schedule, 50); } });
      Sync.run();
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  };
  window.App = App;
})();
