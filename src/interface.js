/* Interface surface: a live, clickable website or app in a frame. Pins attach to real DOM elements. */
(() => {
  const { h, I, t, S } = PB;
  const L = {
    pages: t("pages"), screens: t("screens"), shots: t("screenshots"), import: t("importShot"), reload: t("reload"), page: t("pageWord"), noPages: t("noPages"),
    element: { a: t("elLink"), button: t("elButton"), img: t("elImage"), picture: t("elImage"), video: t("elVideo"), svg: t("elIcon"), input: t("elInput"), textarea: t("elInput"), select: t("elSelect"), nav: t("elNav"), header: t("elHeader"), footer: t("elFooter"), form: t("elForm"), h: t("elHeading") },
  };
  const pages = (CFG.pages || []).map((p) => (typeof p === "string" ? { name: p, src: p } : p));
  const isImg = (src) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(src || "") || /^\/_blob\//.test(src || "");
  const bps = [["Auto", 0, "auto"], ...(CFG.breakpoints || [])].map(([name, w, icon, hh]) => ({ name, w, icon, h: hh || null }));

  // ---------- DOM ----------
  const stage = document.querySelector(".pb-stage");
  const select = h("select", { class: "pb-select", id: "pb-view", "aria-label": L.page });
  const bpSeg = h("div", { class: "pb-seg", role: "group", "aria-label": "Breakpoints" });
  const widthOut = h("span", { class: "pb-kbd pb-num if-width" });
  const fileIn = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, id: "pb-board-file", onchange: (e) => { importBoards([...e.target.files]); e.target.value = ""; } });
  const bar = h("div", { class: "pb-bar" },
    PB.modeToggle(), select,
    h("span", { class: "pb-grow" }),
    bpSeg, widthOut,
    h("button", { class: "pb-ibtn", title: L.import, "aria-label": L.import, html: I.camera, onclick: () => fileIn.click() }),
    h("button", { class: "pb-ibtn if-reload", title: L.reload, "aria-label": L.reload, html: I.reload, onclick: () => reload() }), fileIn);
  const area = h("div", { class: "if-area" });
  const frame = h("div", { class: "if-frame" });
  const iframe = h("iframe", { class: "if-iframe", title: "Preview", id: "pb-iframe" });
  const catcher = h("div", { class: "if-catch", hidden: true });
  const pointLayer = h("div", { class: "if-points" });
  frame.append(iframe, catcher, pointLayer);
  const imgHost = h("div", { class: "if-img", hidden: true });
  const empty = h("div", { class: "pb-placeholder", hidden: true }, h("b", { text: L.noPages }), t("noSourceHint"));
  area.append(frame, imgHost, empty);
  stage.append(bar, area);

  // ---------- breakpoints ----------
  const prefersDevice = CFG.device && innerWidth > 700;
  let bp = prefersDevice ? bps.find((b) => b.icon === "phone") || bps[0] : bps[0];
  for (const b of bps) {
    const btn = h("button", { "data-bp": b.name, title: b.w ? `${b.name} · ${b.w}px` : `Auto · ${t("yourWidth")}`, "aria-label": b.name, "aria-pressed": String(b === bp), html: I[b.icon] || I.desktop });
    btn.addEventListener("click", () => setBp(b));
    bpSeg.append(btn);
  }
  function setBp(b) { bp = b; for (const x of bpSeg.children) x.setAttribute("aria-pressed", String(x.dataset.bp === b.name)); layout(); }
  function layout() {
    const r = area.getBoundingClientRect();
    if (!r.width) return;
    const device = CFG.device && bp.w && bp.icon !== "desktop" && bp.icon !== "laptop";
    frame.classList.toggle("device", !!device);
    frame.classList.toggle("fixed", !!bp.w);
    if (!bp.w) {
      Object.assign(frame.style, { width: r.width + "px", height: r.height + "px", transform: "none", left: "0px", top: "0px" });
      widthOut.textContent = Math.round(r.width) + " px";
    } else {
      const pad = r.width < 500 ? 10 : 24, bez = device ? 24 : 0;
      const dh = device ? (bp.h || Math.round(bp.w * 2.16)) : 0;
      let s = Math.min(1, (r.width - pad * 2) / (bp.w + bez));
      if (device) s = Math.min(s, (r.height - pad * 2) / (dh + bez));
      const fh = device ? dh : (r.height - pad * 2) / s;
      Object.assign(frame.style, { width: bp.w + "px", height: fh + "px", transform: `scale(${s})`, left: (r.width - (bp.w + bez) * s) / 2 + "px", top: (device ? (r.height - (dh + bez) * s) / 2 : pad) + "px" });
      widthOut.textContent = bp.w + " px" + (s < 0.999 ? " · " + Math.round(s * 100) + "%" : "");
    }
    schedule();
  }
  new ResizeObserver(layout).observe(area);

  // ---------- views: pages + screenshot boards ----------
  let view = null; // {type:'page'|'image'|'board', key, src, name, id}
  function views() {
    const v = pages.map((p) => ({ type: isImg(p.src) ? "image" : "page", key: "p:" + p.src, src: p.src, name: p.name || p.src }));
    for (const b of PB.boards) v.push({ type: "board", key: "b:" + b.id, src: PB.blobUrl(b.asset), name: b.name, id: b.id });
    return v;
  }
  function renderSelect() {
    const v = views(); select.textContent = "";
    const g1 = h("optgroup", { label: CFG.kind === "app" ? L.screens : L.pages }), g2 = h("optgroup", { label: L.shots });
    for (const x of v) (x.type === "board" ? g2 : g1).append(h("option", { value: x.key, text: x.name }));
    if (g1.children.length) select.append(g1);
    if (g2.children.length) select.append(g2);
    if (view) select.value = view.key;
    select.hidden = v.length < 2;
  }
  select.addEventListener("change", () => open(views().find((x) => x.key === select.value)));
  function open(v, then) {
    if (!v) { empty.hidden = false; frame.hidden = true; imgHost.hidden = true; return; }
    view = v; empty.hidden = true; select.value = v.key;
    const img = v.type !== "page";
    frame.hidden = img; imgHost.hidden = !img; bpSeg.hidden = img; widthOut.hidden = img;
    if (img) { canvas.load(v.src); canvas.setMode(S.mode); then && setTimeout(then, 60); }
    else { pendingThen = then || null; if (iframe.getAttribute("src") !== v.src) iframe.src = v.src; else if (then) then(); layout(); }
    PB.refreshChip();
  }
  let pendingThen = null;
  function reload() { if (view && view.type === "page") { try { iframe.contentWindow.location.reload(); } catch { iframe.src = view.src; } } else if (view) canvas.fit(); }

  async function importBoards(files) {
    let last = null;
    for (const f of files) { try { last = await PB.addBoard(f); } catch (e) { PB.toast(t("uploadFail")); } }
    renderSelect();
    if (last) { open(views().find((x) => x.key === "b:" + last.id)); PB.setMode("comment"); }
  }

  // ---------- image canvas for screenshots / image screens ----------
  const canvas = PB.ImageCanvas(imgHost, {
    mode: () => S.mode,
    pins: () => PB.visible().filter((p) => p.anchor && matchesImage(p.anchor)),
    draft: () => (S.draft.anchor && matchesImage(S.draft.anchor) ? S.draft.anchor : null),
    onDraft: (c, live) => {
      const a = view.type === "board" ? { board: view.id, ...c } : { page: view.src, frac: true, ...c };
      a.x = +a.x.toFixed(4); a.y = +a.y.toFixed(4); if (a.w != null) { a.w = +a.w.toFixed(4); a.h = +a.h.toFixed(4); }
      if (live) { S.draft.anchor = a; canvas.draw(); return; }
      PB.setDraft(a, label(a));
    },
    onMovePin: (id, a) => PB.movePatch(id, a, label(a)),
  });
  const matchesImage = (a) => view && ((view.type === "board" && a.board === view.id) || (view.type === "image" && a.page === view.src && a.frac));

  // ---------- live frame ----------
  let pinStyle = null;
  const retheme = () => { if (pinStyle) pinStyle.textContent = PIN_CSS(); schedule(); };
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme); } catch {}
  let fdoc = null, fwin = null, root = null, pinsBox = null, hl = null, hlTag = null, pointMode = false, raf = 0;
  const PIN_CSS = () => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    return `:host{all:initial}
*{box-sizing:border-box}
.pb-pin{position:absolute;width:26px;height:26px;transform:translateY(-100%);border-radius:50% 50% 50% 0;background:${v("--accent")};color:${v("--on-accent")};font:600 11px/26px ${v("--font")};text-align:center;cursor:pointer;pointer-events:auto;box-shadow:0 0 0 2px ${v("--panel")},0 3px 8px rgba(0,0,0,.3);user-select:none}
.pb-pin.working{background:${v("--work")}}.pb-pin.done{background:${v("--done-pin")}}
.pb-pin.sel{box-shadow:0 0 0 2px ${v("--panel")},0 0 0 4px ${v("--accent")},0 3px 8px rgba(0,0,0,.3);z-index:3}
.pb-pin:not(.done){cursor:grab;touch-action:none}.pb-pin.dragging{cursor:grabbing;box-shadow:0 0 0 2px ${v("--panel")},0 10px 22px rgba(0,0,0,.35);z-index:5}
.pb-pin.draft{background:${v("--panel")};color:${v("--ink")};box-shadow:0 0 0 2px ${v("--ink")},0 3px 8px rgba(0,0,0,.3)}
.hl{position:absolute;pointer-events:none;outline:1.5px solid ${v("--ink")};outline-offset:1px;border-radius:2px;box-shadow:0 0 0 9999px rgba(0,0,0,0);transition:all .06s}
.hl.on-dark{outline-color:#fff}
.tag{position:absolute;transform:translateY(-100%);margin-top:-4px;font:500 10.5px/1 ${v("--mono")};background:${v("--ink")};color:${v("--panel")};padding:3px 5px;border-radius:4px;white-space:nowrap;pointer-events:none}`;
  };
  iframe.addEventListener("load", () => {
    attach();
    const fn = pendingThen; pendingThen = null; if (fn) setTimeout(fn, 80);
  });
  function attach() {
    fdoc = null; fwin = null; root = null;
    try { fwin = iframe.contentWindow; fdoc = iframe.contentDocument; if (!fdoc || !fdoc.documentElement) throw 0; void fwin.location.href; pointMode = false; }
    catch { fdoc = null; fwin = null; pointMode = true; setMode(S.mode); schedule(); return; }
    const host = fdoc.createElement("patchbook-layer");
    host.style.cssText = "position:absolute!important;left:0!important;top:0!important;width:0!important;height:0!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;margin:0!important;padding:0!important;border:0!important";
    root = host.attachShadow({ mode: "open" });
    const style = fdoc.createElement("style"); style.textContent = PIN_CSS(); pinStyle = style;
    hl = fdoc.createElement("div"); hl.className = "hl"; hl.hidden = true;
    hlTag = fdoc.createElement("div"); hlTag.className = "tag"; hlTag.hidden = true;
    pinsBox = fdoc.createElement("div");
    root.append(style, hl, hlTag, pinsBox);
    fdoc.documentElement.appendChild(host);
    const ours = (e) => e.composedPath && e.composedPath().includes(host);
    const block = (e) => { if (S.mode === "comment" && !ours(e)) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } };
    for (const ev of ["mousedown", "mouseup", "pointerdown", "pointerup", "dblclick", "submit", "auxclick", "contextmenu", "touchstart", "touchend"]) fdoc.addEventListener(ev, block, true);
    fdoc.addEventListener("click", (e) => { if (S.mode !== "comment" || ours(e)) return; block(e); place(e); }, true);
    fdoc.addEventListener("mousemove", (e) => { if (S.mode === "comment" && !ours(e)) highlight(e.target); }, true);
    fdoc.addEventListener("mouseleave", () => { hl.hidden = true; hlTag.hidden = true; });
    fdoc.addEventListener("keydown", (e) => {
      if (PB.keyTarget(e) && S.mode !== "comment") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "c" || e.key === "C") { e.preventDefault(); PB.setMode(S.mode === "comment" ? "browse" : "comment"); }
      else if (e.key === "v" || e.key === "V") { if (S.mode === "comment") { e.preventDefault(); PB.setMode("browse"); } }
      else if (e.key === "Escape") { PB.clearDraft(); PB.setMode("browse"); }
    }, true);
    fdoc.addEventListener("paste", (e) => PB.handlePaste(e));
    fwin.addEventListener("scroll", schedule, { passive: true });
    fwin.addEventListener("resize", schedule);
    fwin.addEventListener("hashchange", () => { schedule(); PB.refreshChip(); });
    try { new fwin.ResizeObserver(schedule).observe(fdoc.documentElement); } catch {}
    setMode(S.mode); schedule();
  }
  function pageKey() {
    if (!fwin) return view ? view.src : "";
    try {
      const base = new URL(".", location.href).href, u = new URL(fwin.location.href);
      let k = u.href.startsWith(base) ? u.href.slice(base.length) : u.href;
      k = k.split("#")[0]; if (u.hash.includes("/")) k += u.hash;
      return k || (view ? view.src : "");
    } catch { return view ? view.src : ""; }
  }
  const norm = (k) => String(k || "").replace(/^\.\//, "").replace(/\/index\.html?$/i, "/").replace(/^index\.html?$/i, "");
  const samePage = (a, b) => norm(a) === norm(b);

  // ---------- anchors ----------
  function snippet(el) {
    const s = (el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("placeholder") || el.getAttribute("title"))) || el.innerText || el.textContent || el.value || "";
    return String(s).replace(/\s+/g, " ").trim().slice(0, 60);
  }
  function cssPath(el) {
    const esc = (fwin && fwin.CSS && fwin.CSS.escape) || CSS.escape;
    if (el.id && fdoc.querySelectorAll("#" + esc(el.id)).length === 1) return "#" + esc(el.id);
    const parts = [];
    while (el && el.nodeType === 1 && el !== fdoc.body && el !== fdoc.documentElement) {
      if (el.id && fdoc.querySelectorAll("#" + esc(el.id)).length === 1) { parts.unshift("#" + esc(el.id)); break; }
      let part = el.tagName.toLowerCase();
      const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.tagName === el.tagName) : [];
      if (sib.length > 1) part += `:nth-of-type(${sib.indexOf(el) + 1})`;
      parts.unshift(part); el = el.parentElement;
    }
    return (parts[0] && parts[0][0] === "#" ? "" : "body > ") + parts.join(" > ");
  }
  function openTag(el) { const m = el.outerHTML.match(/^<[^>]{0,240}>?/); return m ? m[0] : ""; }
  function pickable(el) {
    if (!el || el.nodeType !== 1) el = el && el.parentElement;
    // prefer the meaningful ancestor (link, button, label) over an inner span/svg path
    const up = el && el.closest && el.closest("a,button,label,input,select,textarea,[role=button]");
    if (up) el = up;
    if (el && el.closest && el.closest("svg") && el.tagName.toLowerCase() !== "svg") el = el.closest("svg");
    return el;
  }
  function anchorAt(cx, cy, target) {
    const el = pickable(target);
    const a = { page: pageKey(), bp: bp.name, vw: fwin.innerWidth, x: Math.round(cx + fwin.scrollX), y: Math.round(cy + fwin.scrollY) };
    if (el && el !== fdoc.body && el !== fdoc.documentElement && el.tagName.toLowerCase() !== "patchbook-layer") {
      const r = el.getBoundingClientRect();
      Object.assign(a, { sel: cssPath(el), tag: el.tagName.toLowerCase(), snip: snippet(el), html: openTag(el),
        ox: +((cx - r.left) / Math.max(1, r.width)).toFixed(3), oy: +((cy - r.top) / Math.max(1, r.height)).toFixed(3) });
    }
    return a;
  }
  function place(e) {
    const a = anchorAt(e.clientX, e.clientY, e.target);
    hl.hidden = true; hlTag.hidden = true;
    PB.setDraft(a, label(a));
  }
  function under(pinEl, cx, cy) {
    pinEl.style.pointerEvents = "none";
    const t = fdoc.elementFromPoint(cx, cy);
    pinEl.style.pointerEvents = "";
    return t;
  }
  function makeDraggable(el, id) {
    PB.draggable(el, {
      onClick: () => id && PB.select(id, false),
      onMove: (ev) => { el.style.left = ev.clientX + fwin.scrollX + "px"; el.style.top = ev.clientY + fwin.scrollY + "px"; highlight(under(el, ev.clientX, ev.clientY)); },
      onDrop: (ev) => { hl.hidden = true; const a = anchorAt(ev.clientX, ev.clientY, under(el, ev.clientX, ev.clientY)); PB.movePatch(id, a, label(a)); },
    });
  }
  function resolve(a) {
    if (!fdoc || !a.sel) return null;
    let el = null;
    try { el = fdoc.querySelector(a.sel); } catch {}
    const head = (a.snip || "").slice(0, 14);
    if (el && (!head || snippet(el).startsWith(head))) return el;
    if (head && a.tag) { for (const c of fdoc.getElementsByTagName(a.tag)) if (snippet(c) === a.snip) return c; }
    return el;
  }
  function docPos(a) {
    const el = resolve(a);
    if (el) { const r = el.getBoundingClientRect(); if (r.width || r.height) return { x: r.left + fwin.scrollX + a.ox * r.width, y: r.top + fwin.scrollY + a.oy * r.height }; }
    const k = a.vw ? fwin.innerWidth / a.vw : 1;
    return { x: a.x * k, y: a.y };
  }
  function label(a) {
    const parts = [];
    if (a.board) { const b = PB.boards.find((x) => x.id === a.board); parts.push(b ? b.name : t("screenshot")); parts.push(a.w != null ? t("region") : t("point")); return parts.join(" · "); }
    if (pages.length > 1 || (a.page && !pages.some((p) => samePage(p.src, a.page)))) { const p = pages.find((x) => samePage(x.src, a.page)); parts.push(p ? p.name : a.page); }
    if (a.frac) { parts.push(a.w != null ? t("region") : t("point")); return parts.join(" · "); }
    if (a.tag) {
      const kind = /^h[1-6]$/.test(a.tag) ? L.element.h : L.element[a.tag] || "";
      const snip = a.snip ? PB.quote(a.snip.length > 34 ? a.snip.slice(0, 33) + "…" : a.snip) : "";
      parts.push([kind, snip].filter(Boolean).join(" ") || t("elElement"));
    } else parts.push(t("point"));
    if (a.bp && a.bp !== "Auto") parts.push(a.bp);
    return parts.join(" · ");
  }
  function highlight(target) {
    const el = pickable(target);
    if (!el || el === fdoc.body || el === fdoc.documentElement) { hl.hidden = true; hlTag.hidden = true; return; }
    const r = el.getBoundingClientRect(), sx = fwin.scrollX, sy = fwin.scrollY;
    Object.assign(hl.style, { left: r.left + sx + "px", top: r.top + sy + "px", width: r.width + "px", height: r.height + "px" });
    hl.hidden = false;
    hlTag.hidden = true;
  }

  // ---------- pins ----------
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawPins); }
  function drawPins() {
    if (S.dragging) return;
    if (view && view.type !== "page") { canvas.draw(); return; }
    const key = pageKey();
    const list = PB.visible().filter((p) => p.anchor && !p.anchor.board && !p.anchor.frac && samePage(p.anchor.page, key));
    const d = S.draft.anchor && !S.draft.anchor.board && !S.draft.anchor.frac && samePage(S.draft.anchor.page, key) ? S.draft.anchor : null;
    if (pinsBox) {
      pinsBox.textContent = "";
      for (const p of list) {
        const pos = docPos(p.anchor), el = PB.pin(p.n, p.status, S.sel === p.id, { left: pos.x + "px", top: pos.y + "px" });
        if (PB.canDrag(p.status)) makeDraggable(el, p.id);
        else el.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); PB.select(p.id, false); });
        pinsBox.append(el);
      }
      if (d) { const pos = docPos(d), el = PB.pin(0, "draft", false, { left: pos.x + "px", top: pos.y + "px" }); makeDraggable(el, null); pinsBox.append(el); }
    }
    pointLayer.textContent = "";
    if (pointMode && S.mode === "comment") {
      for (const p of list) { const el = PB.pin(p.n, p.status, S.sel === p.id, { left: p.anchor.x + "px", top: p.anchor.y + "px" }); el.addEventListener("click", () => PB.select(p.id, false)); pointLayer.append(el); }
      if (d) pointLayer.append(PB.pin(0, "draft", false, { left: d.x + "px", top: d.y + "px" }));
    }
  }
  catcher.addEventListener("click", (e) => {
    const r = frame.getBoundingClientRect(), s = r.width / frame.offsetWidth || 1;
    const a = { page: view ? view.src : "", bp: bp.name, vw: frame.offsetWidth, x: Math.round((e.clientX - r.left) / s), y: Math.round((e.clientY - r.top) / s), viewport: true };
    PB.setDraft(a, label(a));
  });
  function setMode(m) {
    catcher.hidden = !(pointMode && m === "comment");
    if (fdoc) {
      if (!fdoc.getElementById("pb-cursor")) { const st = fdoc.createElement("style"); st.id = "pb-cursor"; st.textContent = "html.pb-commenting,html.pb-commenting *{cursor:crosshair!important}"; (fdoc.head || fdoc.documentElement).append(st); }
      fdoc.documentElement.classList.toggle("pb-commenting", m === "comment");
    }
    frame.classList.toggle("commenting", m === "comment");
    if (hl && m !== "comment") { hl.hidden = true; hlTag.hidden = true; }
    canvas.setMode(m); schedule();
  }

  // ---------- jump to a patch ----------
  function focus(p) {
    const a = p.anchor; if (!a) return;
    const go = () => {
      if (a.board || a.frac) { canvas.draw(); return; }
      if (!fwin) return;
      const pos = docPos(a);
      fwin.scrollTo({ top: Math.max(0, pos.y - fwin.innerHeight / 3), behavior: "smooth" });
      schedule();
    };
    if (a.board) { const v = views().find((x) => x.key === "b:" + a.board); if (v && (!view || view.key !== v.key)) return open(v, go); return go(); }
    if (a.frac) { const v = views().find((x) => x.type === "image" && x.src === a.page); if (v && (!view || view.key !== v.key)) return open(v, go); return go(); }
    if (a.bp && a.bp !== bp.name && a.bp !== "Auto") { const b = bps.find((x) => x.name === a.bp); if (b) setBp(b); }
    if (view && view.type === "page" && samePage(pageKey(), a.page)) return go();
    const pg = pages.find((x) => samePage(x.src, a.page));
    if (pg) return open(views().find((x) => x.key === "p:" + pg.src), go);
    if (a.page && !/^https?:/i.test(a.page)) { pendingThen = go; iframe.src = a.page; }
  }

  PB.boot({
    kind: CFG.kind, modes: true, boards: true, fabHost: area,
    onMode: setMode,
    onChange: schedule,
    onBoards: renderSelect,
    focus,
    onStageDrop: (files) => importBoards(files),
    onPasteImages: (files) => importBoards(files),
  });
  renderSelect();
  open(views()[0]);
  if (CFG.device && !prefersDevice) setBp(bps[0]); else setBp(bp);
})();
