/* Our route · Drive log (odometer + fuel) */
(function () {
  const { esc, icon, money, toINR, fmtDate } = App;
  const qs = new URLSearchParams(location.search);
  let tab = qs.get("tab") || "route";
  let openedAdd = false;

  // ---------- Our route ----------
  function editLeg(route, idx) {
    const leg = route.legs[idx]; const d = App.tripDays()[idx];
    const f = (id, label, val, type) => `<label class="field"><span>${label}</span><input class="input" id="${id}" type="${type || "text"}" value="${esc(val == null ? "" : val)}"></label>`;
    App.sheet({
      title: `Day ${d.n} · ${fmtDate(d.date)}`,
      html: `${f("lT", "Title", leg.title)}<div class="grid2">${f("lF", "From", leg.from)}${f("lTo", "To", leg.to)}</div>
        <div class="grid2">${f("lK", "Km (approx)", leg.km, "number")}${f("lH", "Hours (approx)", leg.hrs, "number")}</div>
        <label class="field"><span>Stops / notes</span><textarea class="input" id="lS">${esc(leg.stops || "")}</textarea></label>
        <button class="btn saffron block" id="lSave">Save</button>
        <div class="tiny" style="text-align:center;margin-top:8px">If this day was already edited on the Plan page, that version is shown in the plan.</div>`,
      onMount(el, api) {
        App.$("#lSave", el).onclick = async () => {
          const v = id => App.$("#" + id, el).value.trim();
          const legs = route.legs.slice();
          legs[idx] = { title: v("lT"), from: v("lF"), to: v("lTo"), km: Number(v("lK")) || 0, hrs: Number(v("lH")) || 0, stops: v("lS") };
          await Routes.saveLegs(legs);
          api.close(); App.toast("Saved");
        };
      }
    });
  }

  async function renderRoute() {
    const r = await Routes.get();
    const days = App.tripDays();
    const km = r.legs.reduce((s, l) => s + (Number(l.km) || 0), 0);
    const hrs = r.legs.reduce((s, l) => s + (Number(l.hrs) || 0), 0);
    const ked = days[r.legs.findIndex(l => /kedarnath/i.test(l.to))];
    return `
      <div class="card">
        <div class="card-label">Our route · by car</div>
        <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${r.stops.map((s, i) => `<span class="tag ${i === 2 || i === 3 ? "saffron" : ""}">${esc(s)}</span>${i < r.stops.length - 1 ? '<span class="tiny">→</span>' : ""}`).join("")}</div>
        <div class="grid3" style="margin-top:14px">
          <div><div class="tiny">Google Maps</div><b class="num">${r.googleKm.toLocaleString("en-IN")} km</b></div>
          <div><div class="tiny">Driving</div><b class="num">~${r.googleHrs} hrs</b></div>
          <div><div class="tiny">Our plan</div><b class="num">~${km.toLocaleString("en-IN")} km</b></div>
        </div>
        <a class="btn primary block" style="margin-top:14px" href="${r.mapsUrl}" target="_blank" rel="noopener">${icon("nav", 18, "#fff")} Open full route in Google Maps</a>
      </div>
      <div class="stack" style="margin-top:12px">
        <div class="callout small"><b>Kedarnath doors close Wed 11 Nov</b> (Bhai Dooj). Our trek is on ${ked ? "<b>" + esc(fmtDate(ked.date)) + "</b>" : "Day 4"}, with <b>one night at Kedarnath</b> and darshan the next morning ✓</div>
        <div class="callout warn small"><b>Tungnath temple doors close on 6 Nov</b>, before we reach Chopta. The trek to Tungnath and Chandrashila stays open, but the temple will be shut; Tungnath ji's winter darshan is at Markandeya temple, Makkumath.</div>
        <div class="callout info small">Diwali is on <b>Sun 8 Nov</b> (we'll be at Ukhimath). Nights at Kedarnath and Chopta go below 0°C. Distances and times are approximate; check Google Maps each morning.</div>
      </div>
      <div class="section-title"><h2>Day by day</h2><span class="tiny">~${Math.round(hrs)} h driving · tap a day to edit</span></div>
      <div class="card tight"><table class="legs" style="margin-top:0"><thead><tr><th>Day</th><th>Route</th><th style="text-align:right">km</th><th style="text-align:right">h</th></tr></thead><tbody>
        ${r.legs.map((l, i) => `<tr data-leg="${i}" style="cursor:pointer"><td><b>${i + 1}</b><div class="tiny">${days[i] ? days[i].dd + " " + days[i].mon : ""}</div></td>
          <td><b>${esc(l.from)} → ${esc(l.to)}</b><div class="tiny">${esc(l.title)}</div></td><td class="n">${l.km || "—"}</td><td class="n">${l.hrs || "—"}</td></tr>`).join("")}
      </tbody></table></div>
      <button class="btn ghost block small" id="resetRoute" style="margin-top:8px">Reset day splits to the original</button>`;
  }

  // ---------- Drive log ----------
  function driveForm(existing) {
    const e = Object.assign({ date: App.today(), time: App.nowTime(), type: "odo", odo: "", litres: "", amount: "", currency: "INR", place: "", paidBy: App.me(), mode: "UPI", note: "" }, existing || {});
    App.sheet({
      title: existing ? "Edit drive entry" : "Log drive",
      html: `<div class="seg" id="dType" style="margin-bottom:14px"><button data-v="odo">Odometer reading</button><button data-v="fuel">Fuel stop</button></div>
        <label class="field"><span>Odometer (km)</span><input class="input num" id="dOdo" type="number" inputmode="numeric" value="${esc(e.odo)}" placeholder="e.g. 45210" style="font-size:24px;font-weight:700"></label>
        <div id="fuelBox">
          <div class="grid2"><label class="field"><span>Litres</span><input class="input num" id="dLit" type="number" inputmode="decimal" step="any" value="${esc(e.litres)}"></label>
          <label class="field"><span>Amount paid</span><input class="input num" id="dAmt" type="number" inputmode="decimal" step="any" value="${esc(e.amount)}"></label></div>
          <div class="field"><span>Paid by</span><div class="who" id="dWho"></div></div>
          <div class="field"><span>Paid with</span><div class="seg" id="dMode">${App.PAY_MODES.map(m => `<button data-v="${m}">${m}</button>`).join("")}</div></div>
          <div class="tiny" style="margin:-6px 0 14px">Fuel cost is added to Expenses automatically.</div>
        </div>
        <div class="grid2"><label class="field"><span>Date</span><input class="input" id="dDate" type="date" value="${esc(e.date)}"></label>
          <label class="field"><span>Time</span><input class="input" id="dTime" type="time" value="${esc(e.time)}"></label></div>
        <label class="field"><span>Place</span><input class="input" id="dPlace" value="${esc(e.place)}" placeholder="e.g. HP pump, Rudraprayag"></label>
        <label class="field"><span>Note (optional)</span><input class="input" id="dNote" value="${esc(e.note)}" placeholder="Start of day / end of day / toll…"></label>
        <div class="btn-row">${existing ? `<button class="btn danger" id="dDel" style="flex:0 0 auto">${icon("trash", 18)}</button>` : ""}<button class="btn saffron" id="dSave">Save</button></div>`,
      onMount(el, api) {
        const seg = (w, v, cb) => { const set = x => { App.$$("button", w).forEach(b => b.classList.toggle("on", b.dataset.v === x)); v = x; cb && cb(x); };
          w.addEventListener("click", ev => { const b = ev.target.closest("button"); if (b) set(b.dataset.v); }); set(v); return () => v; };
        const getType = seg(App.$("#dType", el), e.type, x => App.$("#fuelBox", el).classList.toggle("hidden", x !== "fuel"));
        const getCur = () => "INR";
        const getMode = seg(App.$("#dMode", el), e.mode);
        let who = e.paidBy;
        const rw = () => App.$("#dWho", el).innerHTML = App.members().map(m => `<button data-id="${m.id}" class="${m.id === who ? "on" : ""}">${App.avatar(m.id)} ${esc(m.name)}</button>`).join("");
        rw(); App.$("#dWho", el).onclick = ev => { const b = ev.target.closest("button"); if (b) { who = b.dataset.id; rw(); } };
        App.$("#dSave", el).onclick = async () => {
          const v = id => App.$("#" + id, el).value.trim();
          const type = getType();
          if (type === "odo" && !v("dOdo")) { App.toast("Enter the odometer reading"); return; }
          if (type === "fuel" && !Number(v("dAmt"))) { App.toast("Enter the fuel amount"); return; }
          const rec = { date: v("dDate") || App.today(), time: v("dTime"), type, odo: v("dOdo") ? Number(v("dOdo")) : "", place: v("dPlace"), note: v("dNote") };
          if (type === "fuel") Object.assign(rec, { litres: Number(v("dLit")) || "", amount: Number(v("dAmt")), currency: getCur(), paidBy: who, mode: getMode() });
          const id = existing ? existing.id : DB.uid("drive");
          await DB.put("drive", rec, id);
          const expId = "exp-fuel-" + id;
          if (type === "fuel") {
            await DB.put("expense", { date: rec.date, time: rec.time, amount: rec.amount, currency: rec.currency, category: "fuel", mode: rec.mode, paidBy: who,
              note: "Fuel" + (rec.litres ? " · " + rec.litres + " L" : ""), place: rec.place, source: "drive", driveId: id, by: App.me() }, expId);
          } else if (existing && existing.type === "fuel") await DB.remove(expId);
          api.close(); App.toast("Drive log saved");
        };
        const del = App.$("#dDel", el);
        if (del) del.onclick = async () => {
          if (!(await App.confirmBox("Delete this drive entry?"))) return;
          await DB.remove(existing.id); if (existing.type === "fuel") await DB.remove("exp-fuel-" + existing.id);
          api.close(); App.toast("Deleted");
        };
      }
    });
  }

  async function renderLog() {
    const entries = (await DB.all("drive")).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    const odos = entries.filter(e => Number(e.odo));
    const km = odos.length > 1 ? Math.max(...odos.map(e => e.odo)) - Math.min(...odos.map(e => e.odo)) : 0;
    const fuel = entries.filter(e => e.type === "fuel");
    const litres = fuel.reduce((s, e) => s + (Number(e.litres) || 0), 0);
    const fuelCost = fuel.reduce((s, e) => s + toINR(e.amount, e.currency), 0);
    // mileage: km driven ÷ litres used (excludes the last fill, which hasn't been used yet)
    const usedLitres = litres - (fuel.length ? Number(fuel[fuel.length - 1].litres) || 0 : 0);
    const kmpl = km && usedLitres > 0 ? (km / usedLitres).toFixed(1) : "—";

    // per-day km
    let prevMax = null; const dayKm = {};
    const dates = [...new Set(entries.map(e => e.date))].sort();
    dates.forEach(dt => {
      const o = entries.filter(e => e.date === dt && Number(e.odo)).map(e => e.odo);
      if (!o.length) return;
      const mx = Math.max(...o), mn = Math.min(...o);
      dayKm[dt] = prevMax != null ? mx - prevMax : mx - mn;
      prevMax = mx;
    });
    const groups = {}; entries.forEach(e => (groups[e.date] = groups[e.date] || []).push(e));

    return `<div class="grid2">
        <div class="card stat"><div class="l">Km driven</div><div class="v">${km ? km.toLocaleString("en-IN") : "—"}</div></div>
        <div class="card stat"><div class="l">Mileage</div><div class="v">${kmpl}${kmpl !== "—" ? '<span class="small"> km/L</span>' : ""}</div></div>
        <div class="card stat"><div class="l">Fuel</div><div class="v">${litres ? litres.toFixed(1) + '<span class="small"> L</span>' : "—"}</div></div>
        <div class="card stat"><div class="l">Fuel cost</div><div class="v">${money(fuelCost)}</div></div></div>
      <button class="btn saffron block" id="addDrive" style="margin-top:12px">${icon("gauge", 18, "#fff")} Log odometer / fuel</button>
      <div class="tiny" style="margin-top:8px;text-align:center">Tip: note the odometer every morning and evening for accurate daily km.</div>
      ${dates.length ? dates.slice().reverse().map(dt => {
        const n = App.dayNumber(dt);
        return `<div class="section-title" style="margin-top:18px"><h2 style="font-size:15px">${n ? "Day " + n + " · " : ""}${fmtDate(dt)}</h2>${dayKm[dt] != null ? `<span class="tag saffron num">${dayKm[dt].toLocaleString("en-IN")} km</span>` : ""}</div>
          <div class="list">${groups[dt].slice().reverse().map(e => `<button class="item" data-drive="${e.id}"><div class="ic">${e.type === "fuel" ? icon("fuel", 19) : icon("gauge", 19)}</div>
            <div class="grow"><div class="t num">${e.odo ? e.odo.toLocaleString("en-IN") + " km" : "Fuel stop"}${e.type === "fuel" && e.litres ? " · " + e.litres + " L" : ""}</div>
            <div class="s">${esc(e.time || "")}${e.place ? " · " + esc(e.place) : ""}${e.note ? " · " + esc(e.note) : ""}</div></div>
            ${e.type === "fuel" ? `<div class="amt">${money(e.amount, e.currency)}</div>` : ""}</button>`).join("")}</div>`;
      }).join("") : `<div class="card empty" style="margin-top:16px"><div class="e-ic">${icon("car", 24)}</div>No drive entries yet. Log the odometer when you leave Ahmedabad.</div>`}`;
  }

  async function render() {
    if (tab !== "log") tab = "route";
    const body = tab === "log" ? await renderLog() : await renderRoute();
    App.$("#main").innerHTML = `<div class="page-head"><h1 class="display">Route</h1><p>Our route day by day, and the daily drive log.</p></div>
      <div class="seg" id="tabs" style="margin-bottom:16px"><button data-t="route" class="${tab === "route" ? "on" : ""}">Our route</button>
        <button data-t="log" class="${tab === "log" ? "on" : ""}">Drive log</button></div>
      ${body}`;
    App.$("#tabs").onclick = e => { const b = e.target.closest("button"); if (!b) return; tab = b.dataset.t; history.replaceState(null, "", "?tab=" + tab); render(); };

    if (tab === "route") {
      const r = await Routes.get();
      App.$$("[data-leg]").forEach(tr => tr.onclick = () => editLeg(r, Number(tr.dataset.leg)));
      App.$("#resetRoute").onclick = async () => {
        if (!(await App.confirmBox("Reset all 12 day splits to the original route? Hotels and bookings in the Plan are not affected.", "Reset"))) return;
        await DB.remove("route-main"); App.toast("Route reset");
      };
    }
    if (tab === "log") {
      App.$("#addDrive").onclick = () => driveForm();
      const entries = await DB.all("drive");
      App.$$("[data-drive]").forEach(b => b.onclick = () => driveForm(entries.find(e => e.id === b.dataset.drive)));
      if (qs.get("add") && !openedAdd) { openedAdd = true; driveForm(); }
    }
  }

  App.init("route", render).then(() => { if (!App.$(".gate")) App.fab(() => ExpenseForm.open()); });
})();
