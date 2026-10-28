/* Daily memory journal — photos, notes from each of us, darshan moments, places on a map */
(function () {
  const { esc, icon, fmtDate } = App;
  const qs = new URLSearchParams(location.search);
  let day = qs.get("day");
  if (day === "today") day = App.today();
  let maps = [];

  async function ensureLeaflet() { if (!window.L) await App.loadScript("assets/vendor/leaflet.js"); }

  async function drawMap(el, places, onTap) {
    try { await ensureLeaflet(); } catch (e) { el.innerHTML = '<div class="empty small">Map needs internet the first time.</div>'; return null; }
    const pts = places.filter(p => p.lat && p.lng);
    const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([28.5, 81.5], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map);
    const ll = pts.map(p => [p.lat, p.lng]);
    if (ll.length > 1) L.polyline(ll, { color: "#EE8423", weight: 3, opacity: .8, dashArray: "6 6" }).addTo(map);
    pts.forEach((p, i) => {
      L.circleMarker([p.lat, p.lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#1E3A6B", fillOpacity: 1 })
        .addTo(map).bindPopup(`<b>${esc(p.name)}</b><br>${p.day ? "Day " + App.dayNumber(p.day) + " · " : ""}${esc(p.time || "")}`);
    });
    if (ll.length === 1) map.setView(ll[0], 12); else if (ll.length) map.fitBounds(ll, { padding: [24, 24] });
    if (onTap) map.on("click", e => onTap(e.latlng));
    maps.push(map);
    setTimeout(() => map.invalidateSize(), 200);
    return map;
  }

  function placeSheet(lat, lng) {
    App.sheet({
      title: "Add a place",
      html: `<label class="field"><span>Place name</span><input class="input" id="plName" placeholder="e.g. Kedarnath Temple, Bhairavnath Temple"></label>
        ${lat ? `<div class="tiny" style="margin:-6px 0 12px">Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>` : `<div class="tiny" style="margin:-6px 0 12px">No location attached. Use "Where I am now" or tap the map to pin it.</div>`}
        <button class="btn saffron block" id="plSave">Save place</button>`,
      onMount(el, api) {
        setTimeout(() => App.$("#plName", el).focus(), 300);
        App.$("#plSave", el).onclick = async () => {
          const name = App.$("#plName", el).value.trim(); if (!name) return;
          await DB.put("place", { day, name, lat: lat || null, lng: lng || null, time: App.nowTime(), by: App.me(), at: Date.now() });
          api.close(); App.toast("Place added");
        };
      }
    });
  }

  function lightbox(ph) {
    const lb = document.createElement("div"); lb.className = "lightbox";
    lb.innerHTML = `<img src="${ph.src}" alt="">
      <div class="cap" style="width:100%;max-width:520px">
        <input class="input" id="lbCap" placeholder="Add a caption…" value="${esc(ph.caption || "")}" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.25)">
        <div class="tiny" style="color:#cbd5e1;margin-top:6px">Added by ${esc(App.member(ph.by).name)}</div>
        <div class="btn-row" style="margin-top:12px"><button class="btn danger" id="lbDel" style="background:transparent">${icon("trash", 18)}</button>
        <button class="btn" id="lbSave">Save caption</button><button class="btn primary" id="lbClose">Close</button></div></div>`;
    document.body.appendChild(lb);
    const close = () => lb.remove();
    App.$("#lbClose", lb).onclick = close;
    App.$("#lbSave", lb).onclick = async () => { await DB.put("photo", Object.assign({}, ph, { caption: App.$("#lbCap", lb).value.trim() }), ph.id); App.toast("Caption saved"); close(); };
    App.$("#lbDel", lb).onclick = async () => { if (await App.confirmBox("Delete this photo for everyone?")) { await DB.remove(ph.id); close(); } };
  }

  async function renderOverview() {
    const photos = await DB.all("photo"), notes = await DB.all("jnote"), places = (await DB.all("place")).sort((a, b) => (a.at || 0) - (b.at || 0));
    const plans = await Routes.plans();
    const t = App.today();
    App.$("#main").innerHTML = `
      <div class="page-head"><h1 class="display">Yatra journal</h1><p>Photos, notes from all three of us, darshan moments and places — day by day.</p></div>
      <div class="map" id="allMap"></div>
      <div class="tiny" style="margin:6px 0 0">${places.length} places pinned</div>
      <div class="section-title"><h2>12 days</h2></div>
      <div class="jgrid">${App.tripDays().map(d => {
        const ph = photos.filter(p => p.day === d.date).sort((a, b) => (a.at || 0) - (b.at || 0));
        const nn = notes.filter(n => n.day === d.date && n.text).length;
        const p = plans[d.date] || {};
        return `<a class="jcard" href="journal.html?day=${d.date}">${ph[0] ? `<img src="${ph[0].src}" alt="" loading="lazy">` : ""}<div class="ov"></div>
          <span class="badge">Day ${d.n}${d.date === t ? " · Today" : ""}</span>
          <div class="tx"><b>${esc(p.title || d.label)}</b><span>${d.label} · ${ph.length} photos · ${nn} notes</span></div></a>`;
      }).join("")}</div>
      <div class="section-title"><h2>Yatra Book</h2></div>
      <div class="card flat"><p class="small muted" style="margin:0 0 12px">A keepsake PDF with every day's photos, notes, darshan moments and places.</p>
        <button class="btn saffron block" id="book">${icon("download", 18, "#fff")} Download Yatra Book (PDF)</button></div>`;
    App.$("#book").onclick = () => Reports.yatraBook(App.$("#book"));
    drawMap(App.$("#allMap"), places.map(p => Object.assign({}, p)));
  }

  async function renderDay() {
    const d = App.tripDays().find(x => x.date === day);
    if (!d) { day = null; return renderOverview(); }
    const photos = (await DB.all("photo")).filter(p => p.day === day).sort((a, b) => (a.at || 0) - (b.at || 0));
    const notes = (await DB.all("jnote")).filter(n => n.day === day);
    const darshan = (await DB.get("darshan-" + day)) || {};
    const places = (await DB.all("place")).filter(p => p.day === day).sort((a, b) => (a.at || 0) - (b.at || 0));
    const plan = (await Routes.plans())[day] || {};
    const days = App.tripDays(); const prev = days[d.n - 2], next = days[d.n];

    App.$("#main").innerHTML = `
      <div class="row between" style="margin-bottom:6px"><a class="btn sm ghost" href="journal.html" style="padding-left:4px">${icon("back", 18)} All days</a>
        <div class="row" style="gap:6px">${prev ? `<a class="btn sm" href="?day=${prev.date}">‹ D${prev.n}</a>` : ""}${next ? `<a class="btn sm" href="?day=${next.date}">D${next.n} ›</a>` : ""}</div></div>
      <div class="page-head"><div class="card-label" style="color:var(--saffron-ink)">Day ${d.n} · ${fmtDate(day, { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 class="display">${esc(plan.title || "Day " + d.n)}</h1>${plan.from ? `<p>${esc(plan.from)} → ${esc(plan.to)}</p>` : ""}</div>

      <div class="section-title"><h2>Photos</h2><span class="tiny">${photos.length}</span></div>
      ${photos.length ? `<div class="photos">${photos.map(p => `<div class="ph" data-ph="${p.id}"><img src="${p.src}" alt="${esc(p.caption || "")}" loading="lazy"><span class="who-dot">${App.avatar(p.by)}</span></div>`).join("")}</div>` : ""}
      <label class="btn block" style="margin-top:10px">${icon("camera", 18)} Add photos<input type="file" accept="image/*" multiple id="addPh" hidden></label>
      <div class="tiny" style="text-align:center;margin-top:6px">Photos are resized to save data. Keep originals in your phone gallery.</div>

      <div class="section-title"><h2>Darshan <i>moment</i></h2></div>
      <div class="card note-card" style="background:var(--saffron-soft)">
        <textarea class="input" id="darshan" placeholder="What did we feel at the darshan today? Aarti time, the crowd, a special moment…" style="background:var(--surface)">${esc(darshan.text || "")}</textarea>
        <button class="btn sm saffron" id="saveDarshan" style="margin-top:10px">Save</button></div>

      <div class="section-title"><h2>Our notes</h2></div>
      <div class="stack">${App.members().map(m => {
        const n = notes.find(x => x.member === m.id) || {};
        return `<div class="card note-card" style="border-left-color:${m.color}"><div class="row" style="margin-bottom:8px">${App.avatar(m.id, true)}<b>${esc(m.name)}</b>${m.id === App.me() ? '<span class="tag">You</span>' : ""}</div>
          <textarea class="input" data-note="${m.id}" placeholder="${esc(m.name)}'s memory of today…">${esc(n.text || "")}</textarea>
          <button class="btn sm" data-savenote="${m.id}" style="margin-top:10px">Save note</button></div>`;
      }).join("")}</div>

      <div class="section-title"><h2>Places visited</h2><span class="tiny">${places.length}</span></div>
      <div class="map" id="dayMap"></div>
      <div class="tiny" style="margin-top:6px">Tip: tap the map to drop a pin.</div>
      <div class="btn-row" style="margin-top:10px"><button class="btn primary" id="here">${icon("pin", 18, "#fff")} Where I am now</button><button class="btn" id="byName">Add by name</button></div>
      ${places.length ? `<div class="list" style="margin-top:12px">${places.map(p => `<div class="item"><div class="ic">${icon("pin", 19)}</div><div class="grow"><div class="t">${esc(p.name)}</div>
        <div class="s">${esc(p.time || "")} · ${esc(App.member(p.by).name)}${p.lat ? "" : " · no pin"}</div></div>
        ${p.lat ? `<a class="icon-btn" href="${App.mapsLink(p.lat + "," + p.lng)}" target="_blank" rel="noopener">${icon("nav", 18)}</a>` : ""}
        <button class="icon-btn" data-delplace="${p.id}" aria-label="Delete">${icon("trash", 18)}</button></div>`).join("")}</div>` : ""}`;

    App.$("#addPh").onchange = async ev => {
      const files = Array.from(ev.target.files || []); if (!files.length) return;
      App.toast("Adding " + files.length + " photo" + (files.length > 1 ? "s" : "") + "…");
      for (const f of files) {
        try { const c = await App.compressImage(f, 1400, 0.72); await DB.put("photo", { day, src: c.src, w: c.w, h: c.h, by: App.me(), caption: "", at: Date.now() }); }
        catch (e) { App.toast("Could not read one photo"); }
      }
    };
    App.$$("[data-ph]").forEach(el => el.onclick = () => lightbox(photos.find(p => p.id === el.dataset.ph)));
    const saveDarshan = () => DB.put("darshan", { day, text: App.$("#darshan").value.trim(), by: App.me() }, "darshan-" + day);
    const saveNote = m => DB.put("jnote", { day, member: m, text: App.$(`[data-note="${m}"]`).value.trim() }, "jnote-" + day + "-" + m);
    App.$("#saveDarshan").onclick = async () => { await saveDarshan(); App.toast("Saved 🙏"); };
    App.$$("[data-savenote]").forEach(b => b.onclick = async () => { await saveNote(b.dataset.savenote); App.toast("Note saved"); });
    // auto-save while typing (so nothing is lost if the phone locks)
    const timers = {};
    App.$("#darshan").addEventListener("input", () => { clearTimeout(timers.d); timers.d = setTimeout(saveDarshan, 1200); });
    App.$$("[data-note]").forEach(t => t.addEventListener("input", () => { const m = t.dataset.note; clearTimeout(timers[m]); timers[m] = setTimeout(() => saveNote(m), 1200); }));
    App.$("#here").onclick = () => {
      if (!navigator.geolocation) { placeSheet(); return; }
      App.toast("Finding your location…");
      navigator.geolocation.getCurrentPosition(pos => placeSheet(pos.coords.latitude, pos.coords.longitude),
        () => { App.toast("Location not available — add by name"); placeSheet(); }, { enableHighAccuracy: true, timeout: 15000 });
    };
    App.$("#byName").onclick = () => placeSheet();
    App.$$("[data-delplace]").forEach(b => b.onclick = async () => { if (await App.confirmBox("Remove this place?")) await DB.remove(b.dataset.delplace); });
    drawMap(App.$("#dayMap"), places, ll => placeSheet(ll.lat, ll.lng));
  }

  async function render() {
    maps.forEach(m => m.remove()); maps = [];
    if (day) await renderDay(); else await renderOverview();
  }

  App.init("journal", render).then(() => { if (!App.$(".gate")) App.fab(() => ExpenseForm.open()); });
})();
