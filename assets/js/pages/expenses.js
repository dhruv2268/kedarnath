/* Expenses — date-wise, with downloadable reports */
(function () {
  const { esc, icon, money, toINR, fmtDate } = App;
  let filter = new URLSearchParams(location.search).get("day") || "all";
  if (filter === "today") filter = App.today();

  function bucket(e) {
    if (e.date < App.TRIP.start) return "pre";
    if (e.date > App.TRIP.end) return "post";
    return e.date;
  }

  async function render() {
    const all = (await DB.all("expense")).sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));
    const days = App.tripDays();
    const sumINR = list => list.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
    const by = {}; all.forEach(e => { const k = bucket(e); (by[k] = by[k] || []).push(e); });
    const list = filter === "all" ? all : (by[filter] || []);
    const modes = {}; list.forEach(e => modes[e.mode || "Other"] = (modes[e.mode || "Other"] || 0) + toINR(e.amount, e.currency));
    const total = sumINR(list);

    // category + payer breakdown
    const cats = {}; list.forEach(e => cats[e.category] = (cats[e.category] || 0) + toINR(e.amount, e.currency));
    const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const max = catRows.length ? catRows[0][1] : 1;
    const payers = {}; list.forEach(e => payers[e.paidBy] = (payers[e.paidBy] || 0) + toINR(e.amount, e.currency));

    const chip = (key, top, bottom) => `<button class="chip ${filter === key ? "on" : ""}" data-f="${key}">${top}<b class="num">${bottom}</b></button>`;
    const label = filter === "all" ? "Whole trip" : filter === "pre" ? "Pre-trip bookings" : filter === "post" ? "After the trip" :
      "Day " + App.dayNumber(filter) + " · " + fmtDate(filter, { weekday: "long", day: "numeric", month: "short" });

    // group list by date
    const groups = {}; list.forEach(e => (groups[e.date] = groups[e.date] || []).push(e));
    const groupHTML = Object.keys(groups).sort().reverse().map(date => {
      const g = groups[date]; const n = App.dayNumber(date);
      return `<div class="section-title" style="margin-top:18px"><h2 style="font-size:15px">${n ? "Day " + n + " · " : date < App.TRIP.start ? "Pre-trip · " : ""}${fmtDate(date)}</h2>
        <span class="small num" style="font-weight:700">${money(sumINR(g))}</span></div>
        <div class="list">${g.map(e => { const c = App.category(e.category);
          return `<button class="item" data-id="${e.id}"><div class="ic">${c.e}</div>
          <div class="grow"><div class="t">${esc(e.note || c.name)}</div>
          <div class="s">${esc(e.time || "")}${e.place ? " · " + esc(e.place) : ""} · ${esc(App.member(e.paidBy).name)} · ${esc(e.mode || "")}</div></div>
          <div class="amt">${money(e.amount, e.currency)}</div></button>`; }).join("")}</div>`;
    }).join("");

    App.$("#main").innerHTML = `
      <div class="page-head"><h1 class="display">Expenses</h1><p>Every rupee, day by day. Tap + to add.</p></div>
      <div class="chips" id="chips">
        ${chip("all", "All", money(sumINR(all)).replace("₹", "₹"))}
        ${by.pre ? chip("pre", "Pre-trip", money(sumINR(by.pre))) : ""}
        ${days.map(d => chip(d.date, "D" + d.n + " · " + d.dd + " " + d.mon, by[d.date] ? money(sumINR(by[d.date])) : "—")).join("")}
        ${by.post ? chip("post", "After", money(sumINR(by.post))) : ""}
      </div>
      <div class="card">
        <div class="card-label">${esc(label)}</div>
        <div class="row between" style="align-items:flex-end;margin-top:4px">
          <div><div class="num big-total">${money(total)}</div><div class="tiny">${list.length} entries</div></div>
        </div>
        <div class="grid3" style="margin-top:12px">${["Cash", "UPI", "Card"].map(m => `<div class="card flat tight"><div class="tiny">${m}</div><div style="font-weight:700;margin-top:2px" class="num">${money(modes[m] || 0)}</div></div>`).join("")}</div>
        ${Object.keys(payers).length ? `<div class="divider"></div><div class="row" style="flex-wrap:wrap;gap:12px">${Object.entries(payers).map(([id, v]) =>
          `<div class="row" style="gap:6px">${App.avatar(id)}<span class="small"><b>${esc(App.member(id).name)}</b> ${money(v)}</span></div>`).join("")}</div>` : ""}
      </div>
      ${catRows.length ? `<details class="card" style="margin-top:12px"><summary class="row between"><span>By category</span><span class="tiny">tap to open</span></summary>
        <div class="stack" style="margin-top:12px">${catRows.map(([id, v]) => { const c = App.category(id);
          return `<div><div class="row between small"><span>${c.e} ${esc(c.name)}</span><b class="num">${money(v)}</b></div><div class="bar" style="margin-top:4px"><i style="width:${(v / max * 100).toFixed(1)}%"></i></div></div>`; }).join("")}</div></details>` : ""}
      ${list.length ? groupHTML : `<div class="card empty" style="margin-top:16px"><div class="e-ic">${icon("receipt", 24)}</div>No expenses here yet.<div style="margin-top:12px"><button class="btn sm saffron" id="addFirst">${icon("plus", 16, "#fff")} Add expense</button></div></div>`}
      <div class="section-title"><h2>Download report</h2></div>
      <div class="card flat"><p class="small muted" style="margin:0 0 12px">Full trip report with day-wise, category and paid-by summaries.</p>
        <div class="btn-row"><button class="btn primary" id="dlPdf">${icon("download", 18, "#fff")} PDF</button><button class="btn" id="dlXls">${icon("download", 18)} Excel</button></div></div>`;

    App.$("#chips").onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; filter = b.dataset.f; render(); };
    const on = App.$("#chips .on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
    App.$$("[data-id]").forEach(b => b.onclick = () => ExpenseForm.open(all.find(e => e.id === b.dataset.id)));
    const af = App.$("#addFirst"); if (af) af.onclick = () => ExpenseForm.open(null, { date: /^\d{4}/.test(filter) ? filter : App.today() });
    App.$("#dlPdf").onclick = () => Reports.expensePDF(App.$("#dlPdf"));
    App.$("#dlXls").onclick = () => Reports.expenseExcel(App.$("#dlXls"));
  }

  App.init("expenses", render).then(() => { if (!App.$(".gate")) App.fab(() => ExpenseForm.open(null, { date: /^\d{4}/.test(filter) ? filter : App.today() })); });
})();
