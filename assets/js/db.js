/* =============================================================
   Local-first data layer
   - Everything is saved on the phone first (IndexedDB) → works offline
   - When online + Supabase configured, changes sync to the family DB
   ============================================================= */
(function () {
  const DB_NAME = "pandya-yatra";
  const STORE = "records";
  let _db;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("kind", "kind");
        s.createIndex("dirty", "dirty");
      };
      req.onsuccess = () => { _db = req.result; res(_db); };
      req.onerror = () => rej(req.error);
    });
  }
  function tx(mode) { return open().then(db => db.transaction(STORE, mode).objectStore(STORE)); }
  const wrap = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  async function rawGet(id) { return wrap((await tx("readonly")).get(id)); }
  async function rawPut(rec) { return wrap((await tx("readwrite")).put(rec)); }
  async function rawAll() { return wrap((await tx("readonly")).getAll()); }
  async function rawByKind(kind) { return wrap((await tx("readonly")).index("kind").getAll(kind)); }

  function uid(prefix) {
    return (prefix || "r") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail })); }

  // ---------- public CRUD ----------
  const DB = {
    uid,
    async all(kind) {
      const list = await rawByKind(kind);
      return list.filter(r => !r.deleted).map(r => Object.assign({ id: r.id, _updated: r.updated_at }, r.data));
    },
    async get(id) {
      const r = await rawGet(id);
      return r && !r.deleted ? Object.assign({ id: r.id, _updated: r.updated_at }, r.data) : null;
    },
    async put(kind, data, id) {
      id = id || data.id || uid(kind);
      const clean = Object.assign({}, data); delete clean.id; delete clean._updated;
      await rawPut({ id, kind, data: clean, updated_at: Date.now(), deleted: false, dirty: 1 });
      emit("yatra:change", { kind, id });
      Sync.soon();
      return id;
    },
    async remove(id) {
      const r = await rawGet(id);
      if (!r) return;
      r.deleted = true; r.updated_at = Date.now(); r.dirty = 1;
      if (r.kind === "photo") r.data = { day: r.data.day }; // free space
      await rawPut(r);
      emit("yatra:change", { kind: r.kind, id });
      Sync.soon();
    },
    async exportAll() { return (await rawAll()).map(r => ({ id: r.id, kind: r.kind, data: r.data, updated_at: r.updated_at, deleted: r.deleted })); },
    async importAll(list) {
      let n = 0;
      for (const r of list) {
        const cur = await rawGet(r.id);
        if (!cur || (r.updated_at || 0) > (cur.updated_at || 0)) {
          await rawPut({ id: r.id, kind: r.kind, data: r.data, updated_at: r.updated_at || Date.now(), deleted: !!r.deleted, dirty: 1 }); n++;
        }
      }
      emit("yatra:change", { kind: "*" });
      Sync.soon();
      return n;
    },
    async pendingCount() {
      const list = await wrap((await tx("readonly")).index("dirty").getAll(1));
      return list.length;
    }
  };

  // ---------- Sync with Supabase (PostgREST over plain fetch) ----------
  const Sync = {
    state: "local", busy: false, timer: null, lastError: "",
    cfg() {
      const c = window.YATRA_CONFIG || {};
      let url = (localStorage.getItem("yatra.url") || c.SUPABASE_URL || "").trim().replace(/\/+$/, "");
      const key = (localStorage.getItem("yatra.key") || c.SUPABASE_KEY || "").trim();
      const trip = (localStorage.getItem("yatra.tripKey") || "").trim();
      return { url, key, trip, configured: !!(url && key), ready: !!(url && key && trip) };
    },
    headers(extra) {
      const { key, trip } = this.cfg();
      const h = { apikey: key, "x-trip-key": trip, "Content-Type": "application/json" };
      if (!key.startsWith("sb_")) h.Authorization = "Bearer " + key; // legacy JWT anon key
      return Object.assign(h, extra || {});
    },
    setState(s, msg) { this.state = s; this.lastError = msg || ""; emit("yatra:sync", { state: s, msg }); },
    soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 800); },
    async checkKey(url, key, trip) {
      const h = { apikey: key, "x-trip-key": trip, "Content-Type": "application/json" };
      if (!key.startsWith("sb_")) h.Authorization = "Bearer " + key;
      const r = await fetch(url.replace(/\/+$/, "") + "/rest/v1/rpc/check_trip_key", { method: "POST", headers: h, body: "{}" });
      if (!r.ok) throw new Error("Could not reach database (" + r.status + "). Check the URL/key and that you ran setup.sql.");
      return (await r.json()) === true;
    },
    async run() {
      const c = this.cfg();
      if (!c.ready) { this.setState("local"); return; }
      if (!navigator.onLine) { this.setState("offline"); return; }
      if (this.busy) { this.soon(); return; }
      this.busy = true;
      try {
        // 1) push local changes (batched by size; photos are large)
        const dirty = await wrap((await tx("readonly")).index("dirty").getAll(1));
        let batch = [], size = 0;
        const flush = async () => {
          if (!batch.length) return;
          const r = await fetch(c.url + "/rest/v1/records?on_conflict=id", {
            method: "POST",
            headers: this.headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
            body: JSON.stringify(batch.map(x => ({ id: x.id, kind: x.kind, data: x.data, updated_at: x.updated_at, deleted: x.deleted })))
          });
          if (!r.ok) throw new Error("Upload failed (" + r.status + "): " + (await r.text()).slice(0, 160));
          for (const x of batch) {
            const cur = await rawGet(x.id);
            if (cur && cur.updated_at === x.updated_at) { cur.dirty = 0; await rawPut(cur); }
          }
          batch = []; size = 0;
        };
        for (const rec of dirty) {
          const s = JSON.stringify(rec.data).length;
          if (size + s > 2500000) await flush();
          batch.push(rec); size += s;
        }
        await flush();

        // 2) pull remote changes since last cursor
        let cursor = localStorage.getItem("yatra.cursor") || "1970-01-01T00:00:00Z";
        let maxSeen = cursor, changed = false;
        for (let page = 0; page < 200; page++) {
          const q = c.url + "/rest/v1/records?select=id,kind,data,updated_at,deleted,server_at" +
            "&server_at=gt." + encodeURIComponent(maxSeen) + "&order=server_at.asc&limit=40";
          const r = await fetch(q, { headers: this.headers() });
          if (!r.ok) throw new Error("Download failed (" + r.status + ")");
          const rows = await r.json();
          for (const row of rows) {
            const cur = await rawGet(row.id);
            const remoteTs = Number(row.updated_at) || 0;
            if (!cur || (remoteTs >= (cur.updated_at || 0) && !(cur.dirty && cur.updated_at > remoteTs))) {
              if (!cur || cur.updated_at !== remoteTs || cur.deleted !== row.deleted) changed = true;
              await rawPut({ id: row.id, kind: row.kind, data: row.data, updated_at: remoteTs, deleted: !!row.deleted, dirty: 0 });
            }
            if (Date.parse(row.server_at) >= Date.parse(maxSeen)) maxSeen = row.server_at;
          }
          if (rows.length < 40) break;
        }
        // keep a 2-minute overlap so rows committed slightly out of order are not missed
        if (maxSeen !== cursor) localStorage.setItem("yatra.cursor", new Date(new Date(maxSeen).getTime() - 120000).toISOString());
        if (changed) emit("yatra:change", { kind: "*", remote: true });
        localStorage.setItem("yatra.lastSync", String(Date.now()));
        const pend = await DB.pendingCount();
        this.setState(pend ? "pending" : "ok");
      } catch (e) {
        console.warn("[sync]", e);
        this.setState(navigator.onLine ? "error" : "offline", e.message);
      } finally { this.busy = false; }
    },
    resetCursor() { localStorage.removeItem("yatra.cursor"); }
  };

  window.addEventListener("online", () => Sync.run());
  window.addEventListener("offline", () => Sync.setState(Sync.cfg().ready ? "offline" : "local"));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) Sync.run(); });
  setInterval(() => { if (!document.hidden) Sync.run(); }, 30000);

  window.DB = DB;
  window.Sync = Sync;
})();
