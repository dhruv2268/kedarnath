/* Home — changes with the trip: countdown → Today view → memories */
(function () {
  const { esc, icon, money, toINR, fmtDate } = App;
  let tick;

  function milestones(plans) {
    const days = App.tripDays();
    const find = re => { const d = days.find(x => { const p = plans[x.date]; return p && re.test((p.to || "") + " " + (p.title || "")); }); return d ? d.n : null; };
    return { ked: find(/kedarnath/i) || 4, chopta: find(/chopta|tungnath/i) || 6, muss: find(/mussoorie/i) || 8 };
  }

  function journey(state, dayN, ms) {
    const stops = [
      { name: "Start", day: 1 }, { name: "Kedarnath", day: ms.ked }, { name: "Chopta", day: ms.chopta },
      { name: "Mussoorie", day: ms.muss }, { name: "Home", day: 13 }
    ];
    const cur = state === "before" ? 0 : state === "after" ? 13 : dayN;
    let frac = state === "before" ? 0 : state === "after" ? 1 : Math.min(1, (dayN - 1) / 11);
    const hereIdx = stops.findIndex(s => cur < s.day || (s.name === "Start" && state === "before"));
    return `<div class="journey"><div class="fill" style="width:calc(${(frac * 100).toFixed(1)}% - ${(frac * 24).toFixed(0)}px)"></div>
      ${stops.map((s, i) => `<div class="stop ${state === "after" || cur >= s.day && !(state === "before") ? "done" : i === hereIdx ? "here" : ""}"><div class="pin"></div><span>${s.name}</span></div>`).join("")}</div>`;
  }

  function cdParts(ms) {
    ms = Math.max(0, ms);
    return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
  }
  function startTicker() {
    clearInterval(tick);
    // in Preview mode, count from the pretend date instead of the real clock
    const base = localStorage.getItem("yatra.previewDate") ? App.now().getTime() - Date.now() : 0;
    const nowMs = () => Date.now() + base;
    const run = () => {
      App.$$("[data-cd]").forEach(el => {
        const p = cdParts(new Date(el.dataset.cd) - nowMs());
        ["d", "h", "m", "s"].forEach(k => { const x = el.querySelector("[data-" + k + "]"); if (x) x.textContent = String(p[k]).padStart(k === "d" ? 1 : 2, "0"); });
      });
      App.$$("[data-cdtext]").forEach(el => {
        const p = cdParts(new Date(el.dataset.cdtext) - nowMs());
        el.textContent = p.d + "d " + p.h + "h " + String(p.m).padStart(2, "0") + "m";
      });
    };
    run(); tick = setInterval(run, 1000);
  }

  function kedarCard(plans, ms) {
    const close = new Date(App.TRIP.kedarClose);
    if (App.now() > close) return "";
    const days = App.tripDays();
    const kd = days[ms.ked - 1];
    const ok = kd && kd.date <= "2026-11-10";
    return `<div class="card ${ok ? "" : "opt"}" style="${ok ? "" : "border-color:var(--danger)"}">
      <div class="row" style="align-items:flex-start"><div style="width:44px;height:44px;border-radius:12px;background:var(--saffron-soft);display:grid;place-items:center;flex:none;color:var(--saffron-ink)">${icon("temple", 22)}</div>
      <div class="grow"><div class="card-label">Kedarnath doors close</div>
      <div style="font-weight:700;font-size:18px" class="num" data-cdtext="${App.TRIP.kedarClose}">—</div>
      <div class="small muted">Wed 11 Nov 2026 (Bhai Dooj) · ${kd ? (ok ? "Your darshan is planned for <b>" + esc(fmtDate(kd.date)) + "</b> ✓" : "<b style='color:var(--danger)'>Planned darshan is after closing — check your plan!</b>") : "Add Kedarnath to your plan"}</div></div></div></div>`;
  }

  function stayBlock(p) {
    if (!p || !(p.hotel || p.bookings)) return `<div class="card flat"><div class="card-label">Tonight's stay</div>
      <p class="muted small" style="margin:6px 0 10px">No hotel added yet for this day.</p><a class="btn sm" href="plan.html?edit=${p && p.date ? p.date : App.today()}">${icon("plus", 16)} Add stay & bookings</a></div>`;
    const dest = p.hotelAddress || [p.hotel, p.to].filter(Boolean).join(", ");
    return `<div class="card"><div class="card-label">Tonight's stay</div>
      <h3 style="margin:8px 0 2px;font-family:var(--serif);font-weight:400;font-size:26px">${esc(p.hotel || "—")}</h3>
      ${p.hotelAddress ? `<div class="small muted">${esc(p.hotelAddress)}</div>` : ""}
      ${p.checkin ? `<div class="small" style="margin-top:4px">Check-in: <b>${esc(p.checkin)}</b></div>` : ""}
      <div class="btn-row" style="margin-top:12px">
        ${p.hotelPhone ? `<a class="btn primary" href="${App.telLink(p.hotelPhone)}">${icon("phone", 18)} Call</a>` : ""}
        <a class="btn" href="${App.mapsDir(dest)}" target="_blank" rel="noopener">${icon("nav", 18)} Navigate</a></div>
      ${p.bookings ? `<div class="divider"></div><div class="card-label">Booking references</div><div style="white-space:pre-wrap;margin-top:6px;font-size:14px" class="num">${esc(p.bookings)}</div>` : ""}</div>`;
  }

  function quick(today) {
    return `<div class="quick">
      <button id="qExp"><span class="qi">${icon("wallet")}</span>Add expense</button>
      <a href="route.html?tab=log&add=1"><span class="qi">${icon("gauge")}</span>Log odometer</a>
      <a href="journal.html?day=${today}"><span class="qi">${icon("camera")}</span>Journal</a></div>`;
  }

  async function render() {
    const main = App.$("#main");
    const state = App.tripState();
    const t = App.today();
    const plans = await Routes.plans();
    const ms = milestones(plans);
    const exps = await DB.all("expense");
    const dayN = App.dayNumber(t);
    let html = "";

    if (state === "before") {
      const startAt = App.shared.startAt || App.TRIP.startAt;
      const pre = exps.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
      const hotels = App.tripDays().filter(d => plans[d.date] && plans[d.date].hotel).length;
      const d1 = plans[App.TRIP.start];
      html = `
      <section class="hero">${App.mountainSVG()}<div class="hero-body">
        <div class="eyebrow">Travellers Family · part of the ‘O’ Trip</div>
        <h1 class="display">Annual <i>Trip&nbsp;2</i></h1>
        <p>Kedarnath · Chopta · Mussoorie<br>4 – 15 November 2026 · ${App.members().map(m => esc(m.name)).join(", ")}</p>
        <div class="countdown" data-cd="${startAt}"><div><b data-d>0</b><span>Days</span></div><div><b data-h>00</b><span>Hrs</span></div><div><b data-m>00</b><span>Min</span></div><div><b data-s>00</b><span>Sec</span></div></div>
      </div></section>
      <div class="card" style="margin-top:16px">${journey(state, 0, ms)}</div>
      <div style="margin-top:12px">${kedarCard(plans, ms)}</div>
      <div class="section-title"><h2>Getting ready</h2></div>
      <div class="list">
        <a class="item" href="route.html" style="text-decoration:none;color:inherit"><div class="ic">${icon("compass", 20)}</div><div class="grow"><div class="t">Route</div>
          <div class="s">~${ROUTE.googleKm.toLocaleString("en-IN")} km · 12 days · 1 night at Kedarnath</div></div><span class="tag ok">Ready</span></a>
        <a class="item" href="plan.html" style="text-decoration:none;color:inherit"><div class="ic">${icon("bed", 20)}</div><div class="grow"><div class="t">Stays & bookings</div>
          <div class="s">${hotels} of 12 nights added</div></div>${hotels >= 11 ? '<span class="tag ok">Done</span>' : '<span class="tag saffron">' + hotels + '/12</span>'}</a>
        <a class="item" href="settings.html" style="text-decoration:none;color:inherit"><div class="ic">${icon("sync", 20)}</div><div class="grow"><div class="t">Family sync</div>
          <div class="s">${Sync.cfg().ready ? "All 3 phones share the same data" : "Not set up — data stays on this phone"}</div></div>${Sync.cfg().ready ? '<span class="tag ok">On</span>' : '<span class="tag saffron">Set up</span>'}</a>
        <a class="item" href="expenses.html" style="text-decoration:none;color:inherit"><div class="ic">${icon("receipt", 20)}</div><div class="grow"><div class="t">Pre-trip bookings spent</div>
          <div class="s">Tickets, hotels and advances paid before 4 Nov</div></div><div class="amt">${money(pre)}</div></a>
      </div>
      <div class="section-title"><h2>Day 1 · ${fmtDate(App.TRIP.start)}</h2><a class="small" href="plan.html">Full plan</a></div>
      ${d1 && d1.from ? `<div class="card"><div class="route-line">${esc(d1.from)} <span class="arrow">→</span> ${esc(d1.to)}</div>
        <div class="small muted" style="margin-top:4px">${d1.km ? "~" + d1.km + " km" : ""}${d1.hrs ? " · ~" + d1.hrs + " h" : ""}</div>
        ${d1.stops ? `<p class="small" style="margin:8px 0 0">${esc(d1.stops)}</p>` : ""}</div>`
        : `<div class="card empty"><div class="e-ic">${icon("map", 24)}</div>Pick a route to fill the day-by-day plan.<div style="margin-top:12px"><a class="btn sm primary" href="route.html">Choose route</a></div></div>`}`;
    }

    if (state === "during") {
      const p = plans[t] || { date: t };
      const tomorrow = App.tripDays()[dayN] ? plans[App.tripDays()[dayN].date] : null;
      const todays = exps.filter(e => e.date === t).sort((a, b) => (b.time || "").localeCompare(a.time || ""));
      const todayTotal = todays.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
      const tripTotal = exps.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
      html = `
      <div class="page-head"><div class="card-label" style="color:var(--saffron-ink)">Day ${dayN} of 12</div>
        <h1 class="display">${esc(p.title || fmtDate(t, { weekday: "long", day: "numeric", month: "long" }))}</h1>
        <p>${fmtDate(t, { weekday: "long", day: "numeric", month: "long" })}</p></div>
      <div class="card">${journey(state, dayN, ms)}</div>
      <div class="card" style="margin-top:12px;background:linear-gradient(135deg,var(--navy-2),#2d5296);color:#fff;border:0">
        <div class="card-label" style="color:#c9d7f2">Today's route</div>
        ${p.from ? `<div class="route-line" style="font-size:20px;margin-top:6px">${esc(p.from)} <span style="color:#FFB867">→</span> ${esc(p.to)}</div>
          <div style="opacity:.85;margin-top:4px" class="small">${p.km ? "~" + p.km + " km" : ""}${p.hrs ? " · ~" + p.hrs + " h" : ""}</div>
          ${p.stops ? `<p class="small" style="margin:10px 0 0;opacity:.95">${esc(p.stops)}</p>` : ""}
          ${p.to && p.from !== p.to ? `<a class="btn saffron sm" style="margin-top:12px" href="${App.mapsDir(p.to)}" target="_blank" rel="noopener">${icon("nav", 16, "#fff")} Navigate to ${esc(p.to)}</a>` : ""}`
          : `<p style="margin:8px 0">No route set for today.</p><a class="btn sm" href="plan.html?edit=${t}">Add today's plan</a>`}
        ${p.notes ? `<div style="margin-top:10px;font-size:14px;white-space:pre-wrap;opacity:.95">${esc(p.notes)}</div>` : ""}
      </div>
      <div style="margin-top:12px">${stayBlock(p)}</div>
      ${kedarCard(plans, ms) ? `<div style="margin-top:12px">${kedarCard(plans, ms)}</div>` : ""}
      <div class="section-title"><h2>Quick actions</h2></div>${quick(t)}
      <div class="section-title"><h2>Today's spend</h2><a class="small" href="expenses.html?day=${t}">See all</a></div>
      <div class="grid2"><div class="card stat"><div class="l">Today</div><div class="v">${money(todayTotal)}</div><div class="tiny">${todays.length} entries</div></div>
        <div class="card stat"><div class="l">Trip so far</div><div class="v">${money(tripTotal)}</div><div class="tiny">incl. pre-trip</div></div></div>
      ${todays.length ? `<div class="list" style="margin-top:12px">${todays.slice(0, 4).map(e => { const c = App.category(e.category);
        return `<div class="item"><div class="ic">${c.e}</div><div class="grow"><div class="t">${esc(e.note || c.name)}</div><div class="s">${esc(e.time || "")} · ${esc(App.member(e.paidBy).name)} · ${esc(e.mode)}</div></div>
        <div class="amt">${money(e.amount, e.currency)}</div></div>`; }).join("")}</div>` : ""}
      ${tomorrow ? `<div class="section-title"><h2>Tomorrow</h2></div><div class="card flat"><div class="route-line">${esc(tomorrow.from || "")} <span class="arrow">→</span> ${esc(tomorrow.to || "")}</div>
        <div class="small muted">${esc(tomorrow.title || "")}${tomorrow.km ? " · ~" + tomorrow.km + " km" : ""}${tomorrow.hotel ? " · Stay: " + esc(tomorrow.hotel) : ""}</div></div>` : ""}`;
    }

    if (state === "after") {
      const photos = (await DB.all("photo")).sort((a, b) => (a.at || 0) - (b.at || 0));
      const places = await DB.all("place");
      const drive = await DB.all("drive");
      const odos = drive.map(d => Number(d.odo)).filter(Boolean);
      const km = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0;
      const total = exps.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
      const pick = photos.length > 20 ? photos.filter((_, i) => i % Math.ceil(photos.length / 20) === 0).slice(0, 20) : photos;
      html = `
      <section class="hero hero-done">${App.mountainSVG()}<div class="hero-body">
        <div class="eyebrow">4 – 15 November 2026</div>
        <h1 class="display">Yatra <i>complete</i></h1>
        <p>Kedarnath darshan, Chopta and Mussoorie done. Travellers Family Annual Trip 2 · Har Har Mahadev!</p>
      </div></section>
      <div class="grid2" style="margin-top:16px">
        <div class="card stat"><div class="l">Days</div><div class="v">12</div></div>
        <div class="card stat"><div class="l">Km driven</div><div class="v">${km ? km.toLocaleString("en-IN") : "—"}</div></div>
        <div class="card stat"><div class="l">Total spent</div><div class="v">${money(total)}</div></div>
        <div class="card stat"><div class="l">Photos · places</div><div class="v">${photos.length} · ${places.length}</div></div>
      </div>
      <div class="section-title"><h2>Memories</h2><a class="small" href="journal.html">Open journal</a></div>
      ${pick.length ? `<div class="collage">${pick.map(ph => `<a class="ph" href="journal.html?day=${ph.day}"><img src="${ph.src}" alt="${esc(ph.caption || "")}" loading="lazy"></a>`).join("")}</div>`
        : `<div class="card empty"><div class="e-ic">${icon("image", 24)}</div>No photos yet — add them day by day in the Journal.</div>`}
      <div class="section-title"><h2>Keep forever</h2></div>
      <div class="stack"><button class="btn saffron block" id="dlBook">${icon("download", 18, "#fff")} Download Yatra Book (PDF)</button>
        <div class="btn-row"><button class="btn" id="dlPdf">Expense report PDF</button><button class="btn" id="dlXls">Expenses Excel</button></div></div>`;
    }

    main.innerHTML = html;
    startTicker();
    const q = App.$("#qExp"); if (q) q.onclick = () => ExpenseForm.open();
    const b = App.$("#dlBook"); if (b) b.onclick = () => Reports.yatraBook(b);
    const p1 = App.$("#dlPdf"); if (p1) p1.onclick = () => Reports.expensePDF(p1);
    const x1 = App.$("#dlXls"); if (x1) x1.onclick = () => Reports.expenseExcel(x1);
  }

  App.init("home", render).then(() => { if (!App.$(".gate")) App.fab(() => ExpenseForm.open()); });
})();
