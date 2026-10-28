/* Settings — who am I, family sync, names, trip settings, preview, backup */
(function () {
  const { esc, icon } = App;

  function setupLink() {
    const c = Sync.cfg();
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({ u: c.url, k: c.key, t: c.trip })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.origin + location.pathname.replace(/[^/]*$/, "") + "index.html#setup=" + code;
  }

  async function render() {
    const c = Sync.cfg();
    const pend = await DB.pendingCount();
    const last = Number(localStorage.getItem("yatra.lastSync")) || 0;
    const me = App.me();
    const theme = localStorage.getItem("yatra.theme") || "auto";
    const preview = localStorage.getItem("yatra.previewDate") || "";
    const startAt = (App.shared.startAt || App.TRIP.startAt).slice(0, 16);
    const fromConfig = !!((window.YATRA_CONFIG || {}).SUPABASE_URL && (window.YATRA_CONFIG || {}).SUPABASE_KEY);

    App.$("#main").innerHTML = `
      <div class="page-head"><h1 class="display">Settings</h1></div>

      <div class="section-title" style="margin-top:0"><h2>This phone</h2></div>
      <div class="card">
        <div class="field"><span>Who is using this phone?</span><div class="who" id="who">${App.members().map(m => `<button data-id="${m.id}" class="${m.id === me ? "on" : ""}">${App.avatar(m.id)} ${esc(m.name)}</button>`).join("")}</div>
          <div class="tiny" style="margin-top:6px">Used as the default “Paid by” and photo author.</div></div>
        <div class="field" style="margin-bottom:0"><span>Appearance</span><div class="seg" id="theme"><button data-v="auto" class="${theme === "auto" ? "on" : ""}">Auto</button><button data-v="light" class="${theme === "light" ? "on" : ""}">Light</button><button data-v="dark" class="${theme === "dark" ? "on" : ""}">Dark</button></div></div>
      </div>

      <div class="section-title"><h2>Family sync</h2>${c.ready ? '<span class="tag ok">Connected</span>' : '<span class="tag saffron">This phone only</span>'}</div>
      <div class="card">
        ${c.ready ? `
          <div class="kv"><dt>Status</dt><dd>${esc({ ok: "All synced", pending: "Syncing…", offline: "Offline — will sync later", error: "Problem: " + Sync.lastError, local: "—" }[Sync.state] || Sync.state)}</dd>
          <dt>Waiting to upload</dt><dd>${pend} item${pend === 1 ? "" : "s"}</dd>
          <dt>Last synced</dt><dd>${last ? new Date(last).toLocaleString("en-IN") : "Never"}</dd></div>
          <div class="btn-row" style="margin-top:14px"><button class="btn primary" id="syncNow">Sync now</button><button class="btn" id="share">Share with family</button></div>
          <p class="tiny" style="margin:10px 0 0">“Share with family” sends a private link. Opening it on another phone connects that phone to the same trip data. Share only in your family chat.</p>
          <details style="margin-top:12px"><summary class="small" style="cursor:pointer">Change or disconnect</summary>
            <div class="btn-row" style="margin-top:10px"><button class="btn sm" id="changeKey">Change trip key</button><button class="btn sm danger" id="disconnect">Disconnect this phone</button></div></details>`
        : `
          <p class="small muted" style="margin-top:0">Connect a free Supabase database so all three phones share the same expenses, drive log and journal. Follow <b>README.md → Step 2</b> (about 10 minutes, one time only).</p>
          ${fromConfig ? "" : `<label class="field"><span>Supabase Project URL</span><input class="input" id="sUrl" placeholder="https://xxxx.supabase.co" value="${esc(c.url)}"></label>
          <label class="field"><span>Publishable (anon) key</span><input class="input" id="sKey" placeholder="sb_publishable_…" value="${esc(c.key)}"></label>`}
          <label class="field"><span>Family trip key</span><input class="input" id="sTrip" placeholder="the secret you set in setup.sql" autocapitalize="off"></label>
          <div id="sErr" class="callout warn small hidden" style="margin-bottom:12px"></div>
          <button class="btn primary block" id="connect">Connect</button>`}
      </div>

      <div class="section-title"><h2>Family names</h2></div>
      <div class="card">
        ${App.members().map((m, i) => `<div class="row" style="margin-bottom:10px"><input type="color" value="${m.color}" data-mc="${i}" style="width:44px;height:44px;border:0;background:none;padding:0">
          <input class="input" data-mn="${i}" value="${esc(m.name)}"></div>`).join("")}
        <button class="btn sm" id="saveNames">Save names</button>
      </div>

      <div class="section-title"><h2>Trip settings</h2></div>
      <div class="card">
        <label class="field"><span>Departure from Gandhinagar (for the countdown)</span><input class="input" id="startAt" type="datetime-local" value="${esc(startAt)}"></label>
        <button class="btn sm" id="saveTrip">Save</button>
      </div>

      <div class="section-title" id="preview"><h2>Preview mode</h2></div>
      <div class="card">
        <p class="small muted" style="margin-top:0">See how the home screen looks before, during and after the trip. Only affects this phone.</p>
        <div class="btn-row"><button class="btn sm" data-pv="2026-11-01">Before</button><button class="btn sm" data-pv="2026-11-06">During (Day 3)</button><button class="btn sm" data-pv="2026-11-20">After</button></div>
        <label class="field" style="margin-top:12px"><span>Or pick a date</span><input class="input" type="date" id="pvDate" value="${esc(preview)}"></label>
        ${preview ? `<button class="btn block saffron" id="pvOff">Back to real date</button>` : ""}
      </div>

      <div class="section-title"><h2>Backup</h2></div>
      <div class="card">
        <p class="small muted" style="margin-top:0">Download everything (expenses, plan, journal, photos) as one file. Keep it after the trip; you can restore it on any phone.</p>
        <div class="btn-row"><button class="btn" id="exp">${icon("download", 18)} Export backup</button>
        <label class="btn">Restore backup<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
      </div>
      <p class="tiny" style="text-align:center;margin:24px 0">Travellers Family Annual Trip 2 · part of the ‘O’ Trip · Har Har Mahadev 🙏</p>`;

    // handlers
    App.$("#who").onclick = e => { const b = e.target.closest("button"); if (!b) return; localStorage.setItem("yatra.me", b.dataset.id); App.toast("This phone is now " + App.member(b.dataset.id).name + "'s"); render(); };
    App.$("#theme").onclick = e => {
      const b = e.target.closest("button"); if (!b) return; const v = b.dataset.v;
      if (v === "auto") { localStorage.removeItem("yatra.theme"); document.documentElement.removeAttribute("data-theme"); }
      else { localStorage.setItem("yatra.theme", v); document.documentElement.setAttribute("data-theme", v); }
      render();
    };
    const q = id => App.$("#" + id);
    if (q("syncNow")) q("syncNow").onclick = async () => { q("syncNow").textContent = "Syncing…"; await Sync.run(); render(); App.toast(Sync.state === "ok" ? "All synced ✓" : Sync.lastError || "Saved, will sync later"); };
    if (q("share")) q("share").onclick = async () => {
      const link = setupLink();
      const text = "Open this on your phone to join our Family Trip 2 app 🙏\n" + link;
      if (navigator.share) { try { await navigator.share({ title: "Travellers Family Annual Trip 2", text }); return; } catch (e) { } }
      try { await navigator.clipboard.writeText(link); App.toast("Link copied — paste it in the family chat"); }
      catch (e) { window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank"); }
    };
    if (q("changeKey")) q("changeKey").onclick = () => { localStorage.removeItem("yatra.tripKey"); Sync.resetCursor(); location.href = "index.html"; };
    if (q("disconnect")) q("disconnect").onclick = async () => {
      if (!(await App.confirmBox("Stop syncing on this phone? Data already on the phone stays here.", "Disconnect"))) return;
      ["yatra.tripKey", "yatra.url", "yatra.key", "yatra.cursor"].forEach(k => localStorage.removeItem(k)); localStorage.setItem("yatra.localOnly", "1"); location.reload();
    };
    if (q("connect")) q("connect").onclick = async () => {
      const url = (q("sUrl") ? q("sUrl").value : c.url).trim(), key = (q("sKey") ? q("sKey").value : c.key).trim(), trip = q("sTrip").value.trim();
      const err = m => { q("sErr").textContent = m; q("sErr").classList.remove("hidden"); };
      if (!url || !key || !trip) return err("Please fill all fields.");
      q("connect").disabled = true; q("connect").textContent = "Checking…";
      try {
        if (!(await Sync.checkKey(url, key, trip))) throw new Error("Connected, but the trip key does not match the one in setup.sql.");
        if (q("sUrl")) { localStorage.setItem("yatra.url", url); localStorage.setItem("yatra.key", key); }
        localStorage.setItem("yatra.tripKey", trip); localStorage.removeItem("yatra.localOnly"); Sync.resetCursor();
        App.toast("Connected ✓ Uploading your data…"); await Sync.run(); render();
      } catch (e) { err(e.message); q("connect").disabled = false; q("connect").textContent = "Connect"; }
    };
    q("saveNames").onclick = async () => {
      const members = App.members().map((m, i) => ({ id: m.id, name: App.$(`[data-mn="${i}"]`).value.trim() || m.name, color: App.$(`[data-mc="${i}"]`).value }));
      await App.saveShared({ members }); App.toast("Names saved");
    };
    q("saveTrip").onclick = async () => {
      const v = q("startAt").value;
      await App.saveShared({ startAt: v ? v + ":00+05:30" : App.TRIP.startAt }); App.toast("Trip settings saved");
    };
    App.$$("[data-pv]").forEach(b => b.onclick = () => { localStorage.setItem("yatra.previewDate", b.dataset.pv); location.href = "index.html"; });
    q("pvDate").onchange = () => { if (q("pvDate").value) { localStorage.setItem("yatra.previewDate", q("pvDate").value); location.href = "index.html"; } };
    if (q("pvOff")) q("pvOff").onclick = () => { localStorage.removeItem("yatra.previewDate"); location.href = "index.html"; };
    q("exp").onclick = async () => {
      const data = await DB.exportAll();
      App.download("Family-Trip-2-backup-" + App.ymd(new Date()) + ".json", JSON.stringify({ app: "travellers-family-trip-2", exported: new Date().toISOString(), records: data }), "application/json");
    };
    q("imp").onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try { const j = JSON.parse(await f.text()); const n = await DB.importAll(j.records || []); App.toast(n + " items restored"); }
      catch (e) { App.toast("That file is not a valid backup"); }
    };
  }

  App.init("settings", render);
})();
