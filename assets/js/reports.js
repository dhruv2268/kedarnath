/* =============================================================
   Downloadable reports: Expense PDF, Expense Excel, Yatra Book PDF
   ============================================================= */
(function () {
  const NAVY = [20, 40, 77], SAFFRON = [238, 132, 35], INK = [15, 30, 58], GREY = [110, 122, 145], SOFT = [255, 241, 225];
  const latin = s => String(s == null ? "" : s).replace(/₹/g, "Rs.").replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "").trim();
  const rs = (n) => "Rs. " + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-IN");

  async function loadPDF() {
    await App.loadScript("assets/vendor/jspdf.umd.min.js");
    await App.loadScript("assets/vendor/jspdf.plugin.autotable.min.js");
    return window.jspdf.jsPDF;
  }
  async function busy(btn, fn) {
    const label = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.textContent = "Preparing…"; }
    try { await App.loadShared(); await fn(); }
    catch (e) { console.error(e); App.toast("Could not create file: " + e.message); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = label; } }
  }
  const stamp = () => new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  async function expenseData() {
    const list = (await DB.all("expense")).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    const toINR = e => App.toINR(e.amount, e.currency);
    const total = list.reduce((s, e) => s + toINR(e), 0);
    const group = keyFn => { const m = {}; list.forEach(e => { const k = keyFn(e); m[k] = m[k] || { total: 0, n: 0 }; m[k].n++; m[k].total += toINR(e); }); return m; };
    const dayKey = e => e.date < App.TRIP.start ? "0-pre" : e.date > App.TRIP.end ? "9-post" : e.date;
    return { list, total, byDay: group(dayKey), byCat: group(e => e.category), byPayer: group(e => e.paidBy), byMode: group(e => e.mode || "-"), toINR };
  }
  function dayLabel(k) {
    if (k === "0-pre") return ["Pre-trip", "Before 4 Nov"];
    if (k === "9-post") return ["After trip", "After 15 Nov"];
    return ["Day " + App.dayNumber(k), App.fmtDate(k)];
  }

  // ---------------- Expense PDF ----------------
  async function expensePDF(btn) {
    await busy(btn, async () => {
      const jsPDF = await loadPDF();
      const d = await expenseData();
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210;
      doc.setFillColor(...NAVY); doc.rect(0, 0, W, 34, "F");
      doc.setFillColor(...SAFFRON); doc.circle(W - 22, 14, 7, "F");
      doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
      doc.text("Travellers Family Annual Trip 2 - Expenses", 14, 15);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text("Part of the O Trip  |  Kedarnath, Chopta, Mussoorie  |  4 - 15 Nov 2026  |  " + latin(App.members().map(m => m.name).join(", ")), 14, 23);
      doc.text("Generated " + latin(stamp()), 14, 29);

      const tripDaysSpent = Object.keys(d.byDay).filter(k => /^\d/.test(k)).length;
      const boxes = [["Total spent", rs(d.total)], ["Entries", String(d.list.length)], ["Days with spend", String(tripDaysSpent)], ["Avg / trip day", tripDaysSpent ? rs(Object.keys(d.byDay).filter(k => /^\d/.test(k)).reduce((s, k) => s + d.byDay[k].total, 0) / tripDaysSpent) : "-"]];
      boxes.forEach((b, i) => {
        const x = 14 + i * 46;
        doc.setFillColor(...SOFT); doc.roundedRect(x, 40, 43, 20, 2, 2, "F");
        doc.setTextColor(...GREY); doc.setFontSize(8); doc.text(b[0].toUpperCase(), x + 4, 46);
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(b[1], x + 4, 54); doc.setFont("helvetica", "normal");
      });

      const head = { fillColor: NAVY, textColor: 255, fontStyle: "bold" };
      const base = { theme: "grid", headStyles: head, styles: { fontSize: 9, cellPadding: 2, textColor: INK, lineColor: [226, 232, 241] }, alternateRowStyles: { fillColor: [247, 249, 252] }, margin: { left: 14, right: 14 } };
      const num = { halign: "right" };

      const sec = (title, y, x) => { doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(title, x || 14, y); doc.setFont("helvetica", "normal"); };
      sec("Day-wise summary", 74);
      const dayKeys = Object.keys(d.byDay).sort();
      doc.autoTable(Object.assign({}, base, {
        startY: 77,
        head: [["Day", "Date", "Entries", "Total (Rs.)"]],
        body: dayKeys.map(k => { const v = d.byDay[k], l = dayLabel(k); return [l[0], latin(l[1]), v.n, rs(v.total)]; }),
        foot: [["Total", "", d.list.length, rs(d.total)]],
        footStyles: { fillColor: SOFT, textColor: INK, fontStyle: "bold" },
        columnStyles: { 2: num, 3: num }
      }));

      let y = doc.lastAutoTable.finalY + 10; if (y > 240) { doc.addPage(); y = 20; }
      sec("By category", y);
      doc.autoTable(Object.assign({}, base, {
        startY: y + 3, tableWidth: 88,
        head: [["Category", "Total (Rs.)", "%"]],
        body: Object.entries(d.byCat).sort((a, b) => b[1].total - a[1].total).map(([k, v]) => [latin(App.category(k).name), rs(v.total), d.total ? (v.total / d.total * 100).toFixed(1) + "%" : "-"]),
        columnStyles: { 1: num, 2: num }
      }));
      const yCat = doc.lastAutoTable.finalY;
      sec("Paid by", y, 108);
      doc.autoTable(Object.assign({}, base, {
        startY: y + 3, margin: { left: 108, right: 14 },
        head: [["Person", "Total (Rs.)"]],
        body: Object.entries(d.byPayer).map(([k, v]) => [latin(App.member(k).name), rs(v.total)]),
        columnStyles: { 1: num }
      }));
      const yPay = doc.lastAutoTable.finalY;
      doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Payment mode", 108, yPay + 9); doc.setFont("helvetica", "normal");
      doc.autoTable(Object.assign({}, base, {
        startY: yPay + 12, margin: { left: 108, right: 14 },
        head: [["Mode", "Total (Rs.)"]],
        body: Object.entries(d.byMode).map(([k, v]) => [latin(k), rs(v.total)]),
        columnStyles: { 1: num }
      }));

      doc.addPage();
      sec("All expenses", 18);
      doc.autoTable(Object.assign({}, base, {
        startY: 21,
        head: [["Date", "Time", "Category", "Details", "Paid by", "Mode", "Amount"]],
        body: d.list.map(e => [latin(App.fmtDate(e.date, { day: "numeric", month: "short" })), e.time || "", latin(App.category(e.category).name),
          latin([e.note, e.place].filter(Boolean).join(" - ")) || "-", latin(App.member(e.paidBy).name), e.mode || "", rs(d.toINR(e))]),
        styles: { fontSize: 8, cellPadding: 1.6, textColor: INK, lineColor: [226, 232, 241] },
        columnStyles: { 3: { cellWidth: 62 }, 6: num }
      }));
      footer(doc, "Travellers Family Annual Trip 2 - Expenses");
      App.download("Family-Trip-2-Expenses.pdf", doc.output("blob"));
      App.toast("Expense report downloaded");
    });
  }

  function footer(doc, title) {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text(title, 14, 290); doc.text("Page " + i + " of " + n, 196, 290, { align: "right" });
    }
  }

  // ---------------- Expense Excel ----------------
  async function expenseExcel(btn) {
    await busy(btn, async () => {
      await App.loadScript("assets/vendor/xlsx.mini.min.js");
      const d = await expenseData();
      const wb = XLSX.utils.book_new();
      const rows = d.list.map(e => ({
        "Day": App.dayNumber(e.date) ? "Day " + App.dayNumber(e.date) : (e.date < App.TRIP.start ? "Pre-trip" : "After trip"),
        "Date": e.date, "Time": e.time || "", "Category": App.category(e.category).name, "Details": e.note || "", "Place": e.place || "",
        "Paid by": App.member(e.paidBy).name, "Mode": e.mode || "", "Amount (Rs.)": Math.round(d.toINR(e) * 100) / 100
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [8, 11, 7, 14, 32, 18, 10, 7, 13].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, "All expenses");
      const daySheet = Object.keys(d.byDay).sort().map(k => { const v = d.byDay[k], l = dayLabel(k); return { "Day": l[0], "Date": l[1], "Entries": v.n, "Total (Rs.)": Math.round(v.total * 100) / 100 }; });
      daySheet.push({ "Day": "TOTAL", "Date": "", "Entries": d.list.length, "Total (Rs.)": Math.round(d.total * 100) / 100 });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daySheet), "Day-wise");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(d.byCat).sort((a, b) => b[1].total - a[1].total)
        .map(([k, v]) => ({ "Category": App.category(k).name, "Entries": v.n, "Total (Rs.)": Math.round(v.total * 100) / 100 }))), "By category");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(d.byPayer)
        .map(([k, v]) => ({ "Paid by": App.member(k).name, "Entries": v.n, "Total (Rs.)": Math.round(v.total * 100) / 100 }))), "By person");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "Trip": "Travellers Family Annual Trip 2 (part of the O Trip)", "Dates": "4-15 Nov 2026", "Generated": stamp() }]), "Info");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      App.download("Family-Trip-2-Expenses.xlsx", new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      App.toast("Excel downloaded");
    });
  }

  // ---------------- Yatra Book ----------------
  // Text is drawn on a canvas so Gujarati / Hindi / emoji in notes print correctly.
  const PXMM = 8;
  function textImage(text, widthMm, opt) {
    opt = Object.assign({ pt: 11, color: "#0F1E3A", weight: 400, lh: 1.45, family: "Inter, system-ui, sans-serif" }, opt || {});
    const fpx = opt.pt * 0.3528 * PXMM, wpx = widthMm * PXMM;
    const c = document.createElement("canvas"); const ctx = c.getContext("2d");
    const font = `${opt.weight} ${fpx}px ${opt.family}`; ctx.font = font;
    const lines = [];
    String(text || "").split("\n").forEach(par => {
      if (!par.trim()) { lines.push(""); return; }
      const words = par.split(/(\s+)/); let line = "";
      words.forEach(w => {
        const test = line + w;
        if (ctx.measureText(test).width > wpx && line.trim()) { lines.push(line.trim()); line = w.trimStart(); }
        else line = test;
        while (ctx.measureText(line).width > wpx && line.length > 1) { // very long word
          let i = line.length; while (i > 1 && ctx.measureText(line.slice(0, i)).width > wpx) i--;
          lines.push(line.slice(0, i)); line = line.slice(i);
        }
      });
      lines.push(line.trim());
    });
    const lhpx = fpx * opt.lh;
    c.width = Math.ceil(wpx); c.height = Math.max(1, Math.ceil(lines.length * lhpx + fpx * .3));
    ctx.font = font; ctx.fillStyle = opt.color; ctx.textBaseline = "top";
    lines.forEach((l, i) => ctx.fillText(l, 0, i * lhpx));
    return { src: c.toDataURL("image/png"), h: c.height / PXMM, w: widthMm, lines: lines.length, wrapped: lines, lhmm: lhpx / PXMM };
  }

  async function yatraBook(btn) {
    await busy(btn, async () => {
      const jsPDF = await loadPDF();
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, H = 297, M = 16, CW = W - 2 * M;
      const [photos, notes, places, plans, exps] = await Promise.all([DB.all("photo"), DB.all("jnote"), DB.all("place"), Routes.plans(), DB.all("expense")]);
      const darshans = {}; for (const dd of App.tripDays()) { const x = await DB.get("darshan-" + dd.date); if (x && x.text) darshans[dd.date] = x.text; }
      photos.sort((a, b) => (a.at || 0) - (b.at || 0));

      // ---- cover ----
      doc.setFillColor(...NAVY); doc.rect(0, 0, W, H, "F");
      doc.setFillColor(242, 165, 90); doc.circle(150, 120, 22, "F");
      doc.setFillColor(143, 169, 214); doc.triangle(0, 190, 70, 120, 130, 190, "F"); doc.triangle(80, 190, 150, 105, 230, 190, "F");
      doc.setFillColor(43, 70, 119); doc.triangle(-20, 215, 50, 150, 120, 215, "F"); doc.triangle(90, 215, 160, 140, 240, 215, "F");
      doc.setFillColor(255, 255, 255); doc.triangle(150, 105, 158, 115, 142, 115, "F"); doc.triangle(160, 140, 166, 148, 154, 148, "F");
      doc.setFillColor(19, 42, 82); doc.rect(0, 212, W, 85, "F");
      const cover = photos[0];
      doc.setTextColor(255); doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      doc.text("TRAVELLERS FAMILY  |  PART OF THE O TRIP", M, 40, { charSpace: 1.2 });
      doc.setFont("times", "bold"); doc.setFontSize(34);
      doc.text("Annual Trip 2", M, 60); doc.text("Kedarnath & beyond", M, 74);
      doc.setFont("helvetica", "normal"); doc.setFontSize(14);
      doc.text("4 - 15 November 2026", M, 88);
      doc.setFontSize(12); doc.setTextColor(255, 210, 160);
      doc.text("Travellers Family  |  " + latin(App.members().map(m => m.name).join("  |  ")), M, 236);
      doc.setTextColor(200, 214, 240); doc.setFontSize(10);
      doc.text("Gandhinagar  >  Haridwar  >  Kedarnath  >  Chopta  >  Mussoorie  >  Delhi  >  Kota  >  Home", M, 246);
      const odos = (await DB.all("drive")).map(x => Number(x.odo)).filter(Boolean);
      const km = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0;
      const spent = exps.reduce((s, e) => s + App.toINR(e.amount, e.currency), 0);
      doc.text(`12 days  |  ${photos.length} photos  |  ${places.length} places${km ? "  |  " + km.toLocaleString("en-IN") + " km" : ""}`, M, 254);
      if (cover) {
        doc.addPage(); fullPhoto(doc, cover, "Our yatra begins");
      }

      // ---- journey overview ----
      doc.addPage(); let y = header(doc, "Our 12 days", "The journey at a glance");
      doc.autoTable({
        startY: y, theme: "plain", margin: { left: M, right: M },
        styles: { fontSize: 10, cellPadding: 2.4, textColor: INK }, headStyles: { textColor: GREY, fontStyle: "bold", fontSize: 8 },
        head: [["DAY", "DATE", "ROUTE", "HIGHLIGHT"]],
        body: App.tripDays().map(d => { const p = plans[d.date] || {}; return ["Day " + d.n, latin(d.label), latin(p.from ? p.from + " > " + p.to : "-"), latin(p.title || "")]; }),
        didParseCell: c => { if (c.section === "body" && c.row.index % 2 === 0) c.cell.styles.fillColor = [247, 249, 252]; }
      });

      // ---- each day ----
      for (const d of App.tripDays()) {
        const p = plans[d.date] || {};
        const dayPhotos = photos.filter(x => x.day === d.date);
        const dayNotes = App.members().map(m => ({ m, n: notes.find(x => x.day === d.date && x.member === m.id) })).filter(x => x.n && x.n.text);
        const dayPlaces = places.filter(x => x.day === d.date).sort((a, b) => (a.at || 0) - (b.at || 0));
        doc.addPage();
        y = header(doc, "Day " + d.n + "  |  " + latin(App.fmtDate(d.date, { weekday: "long", day: "numeric", month: "long" })), p.title || "");
        if (p.from) { doc.setFontSize(10); doc.setTextColor(...GREY); doc.text(latin(p.from + "  >  " + p.to + (p.km ? "   (~" + p.km + " km)" : "")), M, y); y += 7; }
        const need = h => { if (y + h > H - 18) { doc.addPage(); y = 20; } };

        if (darshans[d.date]) {
          const t = textImage(darshans[d.date], CW - 12, { pt: 11.5 });
          need(t.h + 16);
          doc.setFillColor(...SOFT); doc.roundedRect(M, y, CW, t.h + 14, 3, 3, "F");
          doc.setFillColor(...SAFFRON); doc.rect(M, y, 1.6, t.h + 14, "F");
          doc.setFontSize(8); doc.setTextColor(184, 92, 10); doc.text("DARSHAN MOMENT", M + 6, y + 6);
          doc.addImage(t.src, "PNG", M + 6, y + 9, t.w, t.h); y += t.h + 20;
        }
        for (const { m, n } of dayNotes) {
          const t = textImage(n.text, CW - 6, { pt: 11 });
          need(Math.min(t.h, 40) + 12);
          doc.setFontSize(9); doc.setTextColor(...hex(m.color)); doc.setFont("helvetica", "bold");
          doc.text(latin(m.name).toUpperCase() + " WRITES", M, y + 3); doc.setFont("helvetica", "normal");
          y += 6;
          if (H - 18 - y < t.lhmm * 2) { doc.addPage(); y = 20; }
          const chunks = chunkText(n.text, CW - 6, H - 18 - y);
          chunks.forEach((ch, i) => { if (i > 0) { doc.addPage(); y = 20; } doc.addImage(ch.src, "PNG", M + 3, y, ch.w, ch.h); y += ch.h; });
          y += 6;
        }
        if (dayPlaces.length) {
          need(14);
          doc.setFontSize(8); doc.setTextColor(...GREY); doc.text("PLACES WE VISITED", M, y + 3); y += 6;
          const t = textImage(dayPlaces.map(x => "•  " + x.name + (x.time ? "  (" + x.time + ")" : "")).join("\n"), CW, { pt: 10.5 });
          need(t.h); doc.addImage(t.src, "PNG", M, y, t.w, t.h); y += t.h + 6;
        }
        if (dayPhotos.length) {
          const colW = (CW - 6) / 2;
          let col = 0, rowH = 0;
          for (const ph of dayPhotos) {
            const ratio = (ph.h || 3) / (ph.w || 4);
            const h = Math.min(colW * ratio, 95);
            const w = h / ratio > colW ? colW : h / ratio;
            const cap = ph.caption ? textImage(ph.caption, colW, { pt: 9, color: "#4A5878" }) : null;
            const blockH = h + (cap ? cap.h + 2 : 0) + 5;
            if (col === 0) { if (y + blockH > H - 18) { doc.addPage(); y = 20; } rowH = 0; }
            const x = M + col * (colW + 6);
            try { doc.addImage(ph.src, "JPEG", x + (colW - w) / 2, y, w, h, undefined, "FAST"); } catch (e) { }
            if (cap) doc.addImage(cap.src, "PNG", x, y + h + 2, cap.w, cap.h);
            rowH = Math.max(rowH, blockH);
            col++; if (col === 2) { col = 0; y += rowH; }
          }
          if (col === 1) y += rowH;
        }
        if (!darshans[d.date] && !dayNotes.length && !dayPlaces.length && !dayPhotos.length) {
          doc.setFontSize(11); doc.setTextColor(...GREY); doc.text("(No journal entries for this day.)", M, y + 4);
        }
      }

      // ---- closing ----
      doc.addPage(); y = header(doc, "Yatra in numbers", "");
      const lines = [["Days", "12"], ["Kilometres driven", km ? km.toLocaleString("en-IN") : "-"], ["Photos", String(photos.length)], ["Places pinned", String(places.length)], ["Total spent", rs(spent)]];
      lines.forEach(([k, v]) => { doc.setFontSize(11); doc.setTextColor(...GREY); doc.text(k, M, y); doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.text(v, W - M, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 9; });
      y += 20; doc.setFont("times", "bold"); doc.setFontSize(26); doc.setTextColor(...NAVY); doc.text("Har Har Mahadev", W / 2, y, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...GREY); doc.text("Made with love by the Travellers Family, November 2026", W / 2, y + 9, { align: "center" });

      footer(doc, "Travellers Family Annual Trip 2 - Yatra Book");
      App.download("Family-Trip-2-Yatra-Book.pdf", doc.output("blob"));
      App.toast("Yatra Book downloaded 🙏");
    });
  }

  // Split a long text into page-sized image chunks (by wrapped lines)
  function chunkText(text, widthMm, firstAvailMm) {
    const full = textImage(text, widthMm, { pt: 11 });
    if (full.h <= firstAvailMm) return [full];
    const lines = full.wrapped, per = Math.max(1, Math.floor(firstAvailMm / full.lhmm)), perPage = Math.floor(250 / full.lhmm);
    const out = []; let i = 0, n = per;
    while (i < lines.length) { out.push(textImage(lines.slice(i, i + n).join("\n"), widthMm, { pt: 11 })); i += n; n = perPage; }
    return out;
  }

  function hex(c) { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(c || ""); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : INK; }

  function header(doc, title, sub) {
    doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 30, "F");
    doc.setFillColor(...SAFFRON); doc.rect(0, 30, 210, 1.2, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(latin(title), 16, 14);
    if (sub) { const t = textImage(sub, 178, { pt: 11, color: "#DCE6F7" }); doc.addImage(t.src, "PNG", 16, 18, t.w, Math.min(t.h, 9)); }
    doc.setFont("helvetica", "normal");
    return 42;
  }

  function fullPhoto(doc, ph, caption) {
    const W = 210, H = 297;
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, H, "F");
    const ratio = (ph.h || 3) / (ph.w || 4);
    let w = W - 24, h = w * ratio; if (h > H - 60) { h = H - 60; w = h / ratio; }
    try { doc.addImage(ph.src, "JPEG", (W - w) / 2, 24, w, h, undefined, "FAST"); } catch (e) { }
    doc.setTextColor(255); doc.setFontSize(12); doc.text(latin(caption), W / 2, 24 + h + 12, { align: "center" });
  }

  window.Reports = { expensePDF, expenseExcel, yatraBook };
})();
