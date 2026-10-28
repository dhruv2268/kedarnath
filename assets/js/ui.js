/* =============================================================
   Motion layer — purely visual. Does not touch any app data/logic.
   ============================================================= */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("is-entering", "js-img");

  // ---------- first-render choreography ----------
  let entered = false;
  const main = document.getElementById("main");
  const onFirstRender = () => {
    if (entered || !main || !main.children.length) return;
    entered = true;
    countUp();
    setTimeout(() => root.classList.remove("is-entering"), 1500);
  };

  // ---------- count-up numbers (₹ totals, km, stats) ----------
  function countUp() {
    if (reduce) return;
    document.querySelectorAll(".stat .v, .big-total, .chip.on b").forEach(el => {
      if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
      const txt = el.textContent.trim();
      const m = /^(₹)?([\d,]+)$/.exec(txt);
      if (!m) return;
      const target = Number(m[2].replace(/,/g, ""));
      if (!target || target < 10) return;
      const pre = m[1] || "", t0 = performance.now(), dur = 1100;
      const fmt = n => pre + Math.round(n).toLocaleString("en-IN");
      const step = t => {
        if (el.textContent !== fmt(el._last ?? 0) && el._last != null) return; // content was replaced by the app
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el._last = target * e; el.textContent = fmt(el._last);
        if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
      };
      el._last = 0; el.textContent = fmt(0); requestAnimationFrame(step);
    });
  }

  // ---------- image fade-in ----------
  document.addEventListener("load", e => { if (e.target.tagName === "IMG") e.target.classList.add("loaded"); }, true);
  const markImgs = scope => scope.querySelectorAll && scope.querySelectorAll("img").forEach(img => { if (img.complete && img.naturalWidth) img.classList.add("loaded"); });

  // ---------- countdown flip ----------
  const flip = el => { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); };

  // ---------- segmented controls: gliding pill ----------
  function glide(seg) {
    if (seg._glide || reduce) return;
    seg._glide = true; seg.classList.add("glide");
    const ind = document.createElement("span"); ind.className = "seg-ind"; seg.prepend(ind);
    const place = (animate) => {
      const on = seg.querySelector("button.on");
      if (!on) { ind.style.opacity = 0; return; }
      if (!animate) ind.style.transition = "none";
      ind.style.opacity = 1; ind.style.width = on.offsetWidth + "px";
      ind.style.transform = `translateX(${on.offsetLeft - 4}px)`;
      if (!animate) { void ind.offsetWidth; ind.style.transition = ""; }
    };
    place(false);
    new MutationObserver(() => place(true)).observe(seg, { subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", () => place(false));
  }

  // ---------- tab bar indicator slides from the previous tab ----------
  function tabbar(nav) {
    const ind = nav.querySelector(".tab-ind"); if (!ind) return;
    const cur = Number(getComputedStyle(ind).getPropertyValue("--i")) || 0;
    const prev = sessionStorage.getItem("ui.tab");
    if (prev != null && !ind.classList.contains("none") && Number(prev) !== cur && !reduce) {
      ind.style.transition = "none"; ind.style.setProperty("--i", prev); void ind.offsetWidth;
      ind.style.transition = ""; requestAnimationFrame(() => ind.style.setProperty("--i", cur));
    }
    nav.querySelectorAll("a").forEach((a, i) => a.addEventListener("click", () => {
      sessionStorage.setItem("ui.tab", ind.classList.contains("none") ? i : cur);
      if (!ind.classList.contains("none")) { ind.classList.remove("none"); ind.style.setProperty("--i", i); }
      if (navigator.vibrate) navigator.vibrate(6);
    }));
    if (!ind.classList.contains("none")) sessionStorage.setItem("ui.tab", cur);
  }

  // ---------- bottom sheet: drag down to close ----------
  function sheetDrag(sh) {
    if (sh._drag) return; sh._drag = true;
    const handles = [sh.querySelector(".grab"), sh.querySelector(".sheet-head")].filter(Boolean);
    let y0 = null, dy = 0;
    const down = e => { if (e.target.closest("button")) return; y0 = e.clientY; dy = 0; sh.classList.add("dragging"); handles.forEach(h => h.setPointerCapture && h.setPointerCapture(e.pointerId)); };
    const move = e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
    const up = () => {
      if (y0 == null) return; y0 = null; sh.classList.remove("dragging"); sh.style.transform = "";
      if (dy > 110) { const c = sh.querySelector("[data-close]"); c && c.click(); }
    };
    handles.forEach(h => { h.addEventListener("pointerdown", down); h.addEventListener("pointermove", move); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up); });
  }

  // ---------- header gets a shadow once you scroll ----------
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { const h = document.querySelector(".appbar"); if (h) h.style.boxShadow = scrollY > 6 ? "0 8px 24px -16px rgba(0,0,0,.35)" : ""; ticking = false; });
  }, { passive: true });

  // ---------- subtle haptics on key actions (Android) ----------
  document.addEventListener("click", e => { if (e.target.closest(".fab, .btn.saffron, .btn.primary") && navigator.vibrate) navigator.vibrate(8); }, true);

  // ---------- watch the DOM ----------
  const scan = node => {
    if (node.nodeType !== 1) return;
    if (node.matches(".tabbar")) tabbar(node);
    if (node.matches(".sheet")) sheetDrag(node);
    node.querySelectorAll && node.querySelectorAll(".seg").forEach(glide);
    if (node.matches(".seg")) glide(node);
    markImgs(node);
  };
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === "characterData" || (m.type === "childList" && m.target.closest && m.target.closest(".countdown"))) {
        const b = (m.target.nodeType === 3 ? m.target.parentElement : m.target);
        if (b && b.matches && b.matches(".countdown b") && b._v !== b.textContent) { if (b._v != null) flip(b); b._v = b.textContent; }
        continue;
      }
      m.addedNodes.forEach(scan);
      if (m.target === main) onFirstRender();
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  document.querySelectorAll(".tabbar, .sheet, .seg").forEach(scan);
})();
