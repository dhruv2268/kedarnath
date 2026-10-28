/* Day-by-day plan: route of the day, stay, booking references */
(function () {
  const { esc, icon, fmtDate } = App;

  function editDay(date, p) {
    p = p || { date };
    const d = App.tripDays().find(x => x.date === date);
    if (!d) return;
    const f = (id, label, val, ph, type) => `<label class="field"><span>${label}</span><input class="input" id="${id}" type="${type || "text"}" value="${esc(val == null ? "" : val)}" placeholder="${esc(ph || "")}"></label>`;
    App.sheet({
      title: `Day ${d.n} · ${fmtDate(date)}`,
      html: `
        ${f("pTitle", "Day title", p.title, "e.g. Trek to Kedarnath")}
        <div class="grid2">${f("pFrom", "From", p.from, "Haridwar")}${f("pTo", "To", p.to, "Sonprayag")}</div>
        <div class="grid2">${f("pKm", "Distance (km)", p.km, "235", "number")}${f("pHrs", "Drive time (hrs)", p.hrs, "8", "number")}</div>
        <label class="field"><span>Stops / what to see</span><textarea class="input" id="pStops" placeholder="Rishikesh, Devprayag…">${esc(p.stops || "")}</textarea></label>
        <div class="divider"></div>
        <div class="card-label" style="margin-bottom:10px">Night stay</div>
        ${f("pHotel", "Hotel / stay name", p.hotel, "e.g. GMVN Guest House")}
        ${f("pPhone", "Hotel phone", p.hotelPhone, "+91 98xxxxxxxx", "tel")}
        ${f("pAddr", "Hotel address (for navigation)", p.hotelAddress, "Full address or Google Maps name")}
        ${f("pCheckin", "Check-in time / notes", p.checkin, "2:00 PM · paid in advance")}
        <label class="field"><span>Booking references (one per line)</span><textarea class="input num" id="pBook" placeholder="Hotel: MMT123456&#10;Helicopter: IRCTC HY12345&#10;Yatra registration: UK-xxxx">${esc(p.bookings || "")}</textarea></label>
        <label class="field"><span>Other notes for this day</span><textarea class="input" id="pNotes" placeholder="Start by 5 AM, buy shuttle tokens at Sonprayag…">${esc(p.notes || "")}</textarea></label>
        <button class="btn saffron block" id="pSave">Save day</button>`,
      onMount(el, api) {
        App.$("#pSave", el).onclick = async () => {
          const v = id => App.$("#" + id, el).value.trim();
          await DB.put("plan", Object.assign({}, p, {
            v: 2, date, title: v("pTitle"), from: v("pFrom"), to: v("pTo"), km: v("pKm") ? Number(v("pKm")) : "", hrs: v("pHrs") ? Number(v("pHrs")) : "",
            stops: v("pStops"), hotel: v("pHotel"), hotelPhone: v("pPhone"), hotelAddress: v("pAddr"), checkin: v("pCheckin"),
            bookings: App.$("#pBook", el).value.trim(), notes: v("pNotes")
          }), "plan-" + date);
          api.close(); App.toast("Day " + d.n + " saved");
        };
      }
    });
  }

  async function render() {
    const plans = await Routes.plans();
    const t = App.today();
    const totalKm = App.tripDays().reduce((s, d) => s + (Number(plans[d.date] && plans[d.date].km) || 0), 0);
    App.$("#main").innerHTML = `
      <div class="page-head"><h1 class="display">Day-by-day plan</h1><p>Tap a day to add the hotel, phone number and booking references.</p></div>
      <div class="card flat row between" style="margin-bottom:14px"><div class="grow"><div class="card-label">Our route</div>
        <div style="font-weight:700;font-size:14px">${ROUTE.stops.map(esc).join(" → ")}</div>
        ${totalKm ? `<div class="tiny">~${totalKm.toLocaleString("en-IN")} km over 12 days</div>` : ""}</div>
        <a class="btn sm" href="route.html">View</a></div>
      <div class="stack">${App.tripDays().map(d => {
        const p = plans[d.date] || {};
        return `<button class="card tight day ${d.date === t ? "today" : ""}" data-date="${d.date}" style="width:100%;text-align:left;cursor:pointer">
          <div class="date"><span>${d.dow}</span><b>${d.dd}</b><span>${d.mon}</span></div>
          <div class="grow" style="min-width:0">
            <div class="row between"><span class="tiny" style="font-weight:700;color:var(--saffron-ink)">DAY ${d.n}${d.date === t ? " · TODAY" : ""}</span>${p.km ? `<span class="tiny num">~${p.km} km${p.hrs ? " · " + p.hrs + " h" : ""}</span>` : ""}</div>
            <div style="font-weight:700;margin-top:2px">${esc(p.title || "Tap to plan this day")}</div>
            ${p.from ? `<div class="small muted">${esc(p.from)} → ${esc(p.to)}</div>` : ""}
            <div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">
              ${p.hotel ? `<span class="tag">${icon("bed", 13)} ${esc(p.hotel)}</span>` : `<span class="tag saffron">No stay added</span>`}
              ${p.bookings ? `<span class="tag ok">${p.bookings.split("\n").filter(Boolean).length} booking ref</span>` : ""}
            </div>
          </div></button>`;
      }).join("")}</div>`;
    App.$$("[data-date]").forEach(b => b.onclick = () => editDay(b.dataset.date, plans[b.dataset.date]));
    const q = new URLSearchParams(location.search).get("edit");
    if (q && !render._opened) { render._opened = true; editDay(q === "today" ? t : q, plans[q]); }
  }

  App.init("plan", render).then(() => { if (!App.$(".gate")) App.fab(() => ExpenseForm.open()); });
})();
