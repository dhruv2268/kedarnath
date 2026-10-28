/* =============================================================
   Add / edit expense sheet (used from every page's + button)
   ============================================================= */
(function () {
  const { esc, icon, CATEGORIES, PAY_MODES } = App;

  function openForm(existing, preset) {
    const e = Object.assign({
      date: App.defaultDate(), time: App.nowTime(), amount: "", currency: "INR",
      category: "food", mode: "Cash", paidBy: App.me(), note: "", place: ""
    }, preset || {}, existing || {});
    const linked = e.source === "drive";
    const days = App.tripDays();
    const s = App.sheet({
      title: existing ? "Edit expense" : "Add expense",
      html: `
      <div class="field"><span>Amount</span>
        <div class="amount-input"><span style="font-size:28px;font-weight:700;color:var(--ink-3)">₹</span>
          <input class="input num" id="xAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="${esc(e.amount)}">
        </div>
      </div>
      <div class="field"><span>Category</span><div class="cat-grid" id="xCat">
        ${CATEGORIES.map(c => `<button data-v="${c.id}"><span class="e">${c.e}</span>${esc(c.name)}</button>`).join("")}</div></div>
      <label class="field"><span>What was it for? (optional)</span>
        <input class="input" id="xNote" placeholder="e.g. Lunch at Rudraprayag dhaba" value="${esc(e.note)}"></label>
      <div class="field"><span>Paid by</span><div class="who" id="xWho"></div></div>
      <div class="field"><span>Paid with</span><div class="seg" id="xMode">${PAY_MODES.map(m => `<button data-v="${m}">${m}</button>`).join("")}</div></div>
      <div class="grid2">
        <label class="field"><span>Date</span><input class="input" id="xDate" type="date" value="${esc(e.date)}"></label>
        <label class="field"><span>Time</span><input class="input" id="xTime" type="time" value="${esc(e.time)}"></label>
      </div>
      <label class="field"><span>Place (optional)</span><input class="input" id="xPlace" placeholder="e.g. Sonprayag" value="${esc(e.place)}"></label>
      ${linked ? `<div class="callout info" style="margin-bottom:12px">This fuel expense is linked to the drive log. Edit it there to change litres/odometer.</div>` : ""}
      <div class="btn-row">
        ${existing && !linked ? `<button class="btn danger" id="xDel" style="flex:0 0 auto">${icon("trash", 18)}</button>` : ""}
        <button class="btn saffron" id="xSave">${existing ? "Save changes" : "Add expense"}</button>
      </div>
      <div class="tiny" style="text-align:center;margin-top:10px">Trip days: ${App.fmtDate(days[0].date)} – ${App.fmtDate(days[days.length - 1].date)} · dates before the trip are counted as “Pre-trip bookings”.</div>`,
      onMount(el, api) {
        const segPick = (wrap, val, cb) => {
          const set = v => { App.$$("button", wrap).forEach(b => b.classList.toggle("on", b.dataset.v === v)); val = v; cb && cb(v); };
          wrap.addEventListener("click", ev => { const b = ev.target.closest("button"); if (b) { ev.preventDefault(); set(b.dataset.v); } });
          App.$$("button", wrap).forEach(b => b.classList.toggle("on", b.dataset.v === val));
          return () => val;
        };
        const getCur = () => "INR";
        const getCat = segPick(App.$("#xCat", el), e.category);
        const getMode = segPick(App.$("#xMode", el), e.mode);
        let who = e.paidBy;
        const renderWho = () => { App.$("#xWho", el).innerHTML = App.members().map(m => `<button data-id="${m.id}" class="${m.id === who ? "on" : ""}">${App.avatar(m.id)} ${esc(m.name)}</button>`).join(""); };
        renderWho();
        App.$("#xWho", el).onclick = ev => { const b = ev.target.closest("button"); if (b) { who = b.dataset.id; renderWho(); } };
                if (!existing) setTimeout(() => App.$("#xAmt", el).focus(), 300);
        if (linked) { App.$("#xAmt", el).disabled = true; }
        App.$("#xSave", el).onclick = async () => {
          const amount = Number(App.$("#xAmt", el).value);
          if (!amount || amount <= 0) { App.toast("Enter an amount"); App.$("#xAmt", el).focus(); return; }
          const rec = Object.assign({}, existing || {}, {
            date: App.$("#xDate", el).value || App.today(), time: App.$("#xTime", el).value, amount, currency: getCur(),
            category: getCat(), mode: getMode(), paidBy: who, note: App.$("#xNote", el).value.trim(),
            place: App.$("#xPlace", el).value.trim(), by: App.me()
          });
          await DB.put("expense", rec, existing && existing.id);
          api.close(); App.toast(existing ? "Expense updated" : "Expense added ✓");
        };
        const del = App.$("#xDel", el);
        if (del) del.onclick = async () => {
          if (await App.confirmBox("Delete this expense?")) {
            await DB.remove(existing.id); api.close(); App.toast("Deleted");
          }
        };
      }
    });
    return s;
  }

  window.ExpenseForm = { open: openForm };
})();
