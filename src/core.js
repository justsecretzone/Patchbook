/* Patchbook core: patch store, sidebar, composer, screenshots, image canvas, timeline.
   Every template defines `CFG` before this script and calls PB.boot({...}) after it. */
const PB = (() => {
  // Language: CFG.lang is set by Claude to the user's language. German and English ship built in;
  // for any other language Claude passes CFG.strings with every key of STR.en translated.
  const want = String(CFG.lang && CFG.lang !== "auto" ? CFG.lang : (navigator.language || "en")).slice(0, 2).toLowerCase();
  const STR = {
    de: {
      q1: "„", q2: "“", pages: "Seiten", screens: "Screens", reload: "Neu laden", pageWord: "Seite", noPages: "Noch keine Seite verknüpft", yourWidth: "deine Breite",
      elLink: "Link", elButton: "Button", elImage: "Bild", elVideo: "Video", elIcon: "Icon", elInput: "Eingabefeld", elSelect: "Auswahl", elNav: "Navigation", elHeader: "Kopfbereich", elFooter: "Fußbereich", elForm: "Formular", elHeading: "Überschrift", elElement: "Element",
      attachFrame: "Frame anhängen", prev: "Zurück", next: "Weiter", zoomIn: "Vergrößern", zoomOut: "Verkleinern", play: "Abspielen", speed: "Tempo",
      patches: "Patches", open: "Offen", openN: "offen", collapse: "Patches einklappen", expand: "Patches ausklappen", done: "Erledigt", working: "Claude arbeitet daran",
      placeholder: "Was soll sich ändern?", general: "Allgemein", browse: "Ansehen", comment: "Kommentieren",
      emptyOpen: "Noch keine Patches. Tippe auf Kommentieren und dann auf eine Stelle.", tapSpot: "Tippe auf eine Stelle",
      emptyOpenTime: "Noch keine Patches. Einfach oben tippen, der Zeitstempel kommt automatisch.",
      emptyDone: "Noch nichts erledigt.", otherPages: "+{n} auf anderen Seiten", otherImages: "+{n} auf anderen Bildern", thisPageOnly: "Nur diese Seite", thisImageOnly: "Nur dieses Bild",
      attach: "Screenshot anhängen", drop: "Screenshot hier ablegen", local: "Patches bleiben in diesem Browser.",
      readonly: "Nur Lesen. Zum Kommentieren braucht es Bearbeitungsrechte.",
      handoff: "Fertig? Schreib Claude:", handoffText: "Patches abarbeiten", handoffLocal: "Fertig? Kopieren und in den Chat einfügen:", copyPatches: "Patches kopieren", shotNote: "Screenshot im Chat anhängen", copied: "Kopiert", copy: "Kopieren",
      armed: "Nochmal klicken zum Löschen", del: "Löschen", markDone: "Als erledigt markieren", reopen: "Wieder öffnen",
      uploadFail: "Upload fehlgeschlagen", saveFail: "Speichern fehlgeschlagen", send: "Speichern",
      screenshot: "Screenshot", screenshots: "Screenshots", importShot: "Screenshot importieren", fit: "Einpassen",
      page: "S.", region: "Bereich", point: "Punkt", removeAnchor: "Ohne Stelle", edit: "Doppelklick zum Bearbeiten",
      noSource: "Noch keine Datei verknüpft", noSourceHint: "Claude setzt die Quelle im CFG-Block, sobald die erste Version steht.",
    },
    en: {
      q1: "“", q2: "”", pages: "Pages", screens: "Screens", reload: "Reload", pageWord: "Page", noPages: "No page linked yet", yourWidth: "your width",
      elLink: "Link", elButton: "Button", elImage: "Image", elVideo: "Video", elIcon: "Icon", elInput: "Input", elSelect: "Dropdown", elNav: "Navigation", elHeader: "Header", elFooter: "Footer", elForm: "Form", elHeading: "Heading", elElement: "Element",
      attachFrame: "Attach frame", prev: "Previous", next: "Next", zoomIn: "Zoom in", zoomOut: "Zoom out", play: "Play", speed: "Speed",
      patches: "Patches", open: "Open", openN: "open", collapse: "Collapse patches", expand: "Expand patches", done: "Done", working: "Claude is on it",
      placeholder: "What should change?", general: "General", browse: "Browse", comment: "Comment",
      emptyOpen: "No patches yet. Tap Comment, then tap a spot.", tapSpot: "Tap a spot",
      emptyOpenTime: "No patches yet. Just type above, the timestamp is added for you.",
      emptyDone: "Nothing done yet.", otherPages: "+{n} on other pages", otherImages: "+{n} on other images", thisPageOnly: "This page only", thisImageOnly: "This image only",
      attach: "Attach screenshot", drop: "Drop screenshot here", local: "Patches stay in this browser.",
      readonly: "Read only. Commenting needs edit access.",
      handoff: "Done? Say:", handoffText: "Work through the patches", handoffLocal: "Done? Copy and paste into the chat:", copyPatches: "Copy patches", shotNote: "attach the screenshot in the chat", copied: "Copied", copy: "Copy",
      armed: "Click again to delete", del: "Delete", markDone: "Mark as done", reopen: "Reopen",
      uploadFail: "Upload failed", saveFail: "Could not save", send: "Save",
      screenshot: "Screenshot", screenshots: "Screenshots", importShot: "Import screenshot", fit: "Fit",
      page: "p.", region: "Area", point: "Point", removeAnchor: "No anchor", edit: "Double-click to edit",
      noSource: "No file linked yet", noSourceHint: "Claude sets the source in the CFG block once the first version exists.",
    },
  };
  const lang = STR[want] ? want : (CFG.strings ? want : "en");
  const t = (k) => (CFG.strings && CFG.strings[k] != null ? CFG.strings[k] : null) ?? (STR[lang] || STR.en)[k] ?? STR.en[k] ?? k;
  const quote = (s) => t("q1") + s + t("q2");

  const I = {
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.7 18.1V3.7A2.1 2.1 0 0 1 6.8 1.6h10.4a2.1 2.1 0 0 1 2.1 2.1v12.7a1.6 1.6 0 0 1-1.6 1.6H4.7"/><path d="M4.7 16.5v2.9A2.4 2.4 0 0 0 7.1 21.8h10.5a1.7 1.7 0 0 0 1.7-1.7v-3.2"/><path d="M8.05 1.6v16.5"/><path d="M9.75 19.9v2.8l-1.35-1L7.05 22.7v-2.8z" fill="currentColor" stroke-width="1"/><path d="M11.85 8.75 10.1 10.6l1.75 1.85"/><path d="M15.6 8.75 17.35 10.6 15.6 12.45"/><path d="M14.4 8.3 13.05 12.9"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 3l14 7-6 2-2 6z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3a8 8 0 0 0-7.2 11.5L3.5 20.5l6-1.3A8 8 0 1 0 12 3z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    pinMini: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a8 8 0 0 1 0 16H4v-8a8 8 0 0 1 8-8z"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"/></svg>',
    panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    desktop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/></svg>',
    laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 18.5h19"/></svg>',
    tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  };

  const $ = (s, r = document) => r.querySelector(s);
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  }
  const fmtTime = (s, dec = false) => {
    s = Math.max(0, s || 0);
    const m = Math.floor(s / 60), r = s - m * 60;
    return m + ":" + (dec ? r.toFixed(1).padStart(4, "0") : String(Math.floor(r)).padStart(2, "0"));
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- state ----------
  const S = {
    patches: [], boards: [], filter: "open", mode: "browse", sel: null, me: null,
    draft: { anchor: null, label: "", shots: [] }, live: false, readonly: false, profiles: {},
  };
  let O = {};
  let db = null, assets = null, user = null, col = null, bcol = null;
  const localBlobs = new Map();
  let ui = {};

  const isOpen = (p) => p.status !== "done";
  // A patch belongs to the page, screen or image it was made on; the surface decides via O.scope.
  const inScope = (p) => S.scopeAll || !O.scope || !p.anchor || O.scope(p);
  const inTab = (p, f) => (f === "open" ? isOpen(p) : !isOpen(p));
  const visible = () => S.patches.filter((p) => inTab(p, S.filter) && inScope(p));
  const blobUrl = (id) => (String(id).startsWith("data:") ? id : localBlobs.get(id) || "/_blob/" + id);
  function changed() { renderList(); O.onChange && O.onChange(); saveLocal(); }

  // ---------- connect ----------
  async function connect() {
    for (let i = 0; i < 20 && !(window.claude && window.claude.use); i++) await new Promise((r) => setTimeout(r, 75));
    if (!(window.claude && window.claude.use)) return goLocal();
    try {
      [db, user, assets] = await Promise.all(["db", "user", "assets"].map((n) => window.claude.use(n).catch(() => null)));
    } catch { db = null; }
    if (!db) return goLocal();
    S.live = true;
    try { S.me = user ? await user.id() : null; } catch { S.me = null; }
    try { if (user && (await user.can("data.write")) === false) S.readonly = true; } catch {}
    col = db.collection(CFG.collection);
    subscribe(col, (docs) => { S.patches = docs; resolveProfiles(); changed(); });
    if (O.boards) {
      bcol = db.collection(CFG.collection + "_boards");
      subscribe(bcol, (docs) => { S.boards = docs.sort((a, b) => a.created - b.created); O.onBoards && O.onBoards(); });
    }
    renderFoot();
  }
  function subscribe(ref, fn) {
    const go = () => ref.onSnapshot(
      (snap) => fn(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => { if (e && e.code === "unavailable") setTimeout(go, 1500 + Math.random() * 1500); else if (e && (e.code === "revoked" || e.code === "not_granted")) { S.readonly = true; renderFoot(); } }
    );
    go();
  }
  const LKEY = "patchbook-" + CFG.collection;
  function goLocal() {
    S.live = false;
    try { const d = JSON.parse(localStorage.getItem(LKEY) || "null"); if (d) { S.patches = d.patches || []; S.boards = d.boards || []; O.onBoards && O.onBoards(); } } catch {}
    renderFoot(); changed();
  }
  function saveLocal() {
    if (S.live) return;
    try { localStorage.setItem(LKEY, JSON.stringify({ patches: S.patches, boards: S.boards })); }
    catch { try { localStorage.setItem(LKEY, JSON.stringify({ patches: S.patches.map((p) => ({ ...p, shots: (p.shots || []).filter((x) => !String(x).startsWith("data:")) })), boards: [] })); } catch {} }
  }
  function copyPatches() {
    const open = S.patches.filter(isOpen).sort((a, b) => (a.n || 0) - (b.n || 0));
    const lines = [`Patchbook · ${CFG.kind} · ${CFG.version || "v1"} · ${open.length}`];
    for (const p of open) {
      lines.push("", `#${p.n} ${p.label || t("general")}`, p.text || "");
      if (p.shots && p.shots.length) lines.push(`(${p.shots.length}× ${t("shotNote")})`);
      if (p.anchor) lines.push("anchor: " + JSON.stringify(p.anchor));
    }
    copy(lines.join("\n"));
  }
  async function resolveProfiles() {
    if (!user || !user.profiles) return;
    const ids = [...new Set(S.patches.map((p) => p.author).filter(Boolean))];
    if (ids.length < 2) { S.profiles = {}; return; }
    try { S.profiles = await user.profiles(ids); renderList(); } catch {}
  }

  // ---------- writes ----------
  async function addPatch() {
    if (S.readonly) return;
    const text = ui.ta.value.trim();
    const shots = S.draft.shots.filter((s) => !s.pending);
    if (!text && !shots.length) return;
    if (S.draft.shots.some((s) => s.pending)) return toast("…");
    let anchor = S.draft.anchor, label = S.draft.label;
    if (!anchor && !S.draft.general && O.defaultAnchor) { const d = O.defaultAnchor(); if (d) ({ anchor, label } = d); }
    const n = S.patches.reduce((m, p) => Math.max(m, p.n || 0), 0) + 1;
    const doc = {
      kind: CFG.kind, version: CFG.version || "v1", status: "open", n, text,
      anchor: anchor || null, label: label || t("general"), shots: shots.map((s) => s.id),
      created: Date.now(), author: S.me || null,
    };
    ui.ta.value = ""; autosize();
    clearDraft(true); updateSend();
    if (col) {
      try { const ref = await col.add(doc); S.sel = ref.id; }
      catch (e) { ui.ta.value = text; toast(t("saveFail") + (e && e.code ? " (" + e.code + ")" : "")); if (e && e.code === "invalid_argument") { S.readonly = true; renderFoot(); } }
    } else { const id = "local-" + n; S.patches.push({ id, ...doc }); S.sel = id; changed(); }
  }
  async function patchUpdate(p, fields) {
    if (col) { try { await col.doc(p.id).update(fields); } catch (e) { toast(t("saveFail")); } }
    else { Object.assign(p, fields); changed(); }
  }
  // Drag a pin: a short press selects, moving more than 4px drags; onDrop saves the new place.
  function draggable(el, { onMove, onDrop, onClick }) {
    el.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      e.stopPropagation(); e.preventDefault();
      const sx = e.clientX, sy = e.clientY; let moved = false, ended = false, guard = 0;
      try { el.setPointerCapture(e.pointerId); } catch {}
      // Never leave S.dragging stuck: a lost capture or a silent pointer ends the drag.
      const arm = () => { clearTimeout(guard); guard = setTimeout(() => finish({ type: "timeout" }), 4000); };
      const mv = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        if (!moved) { moved = true; S.dragging = true; el.classList.add("dragging"); }
        arm(); ev.preventDefault(); onMove(ev);
      };
      const finish = (ev) => {
        if (ended) return; ended = true; clearTimeout(guard);
        for (const [t, f] of [["pointermove", mv], ["pointerup", finish], ["pointercancel", finish], ["lostpointercapture", finish]]) el.removeEventListener(t, f);
        el.classList.remove("dragging"); S.dragging = false;
        if (moved && ev.type === "pointerup") onDrop(ev); else if (!moved && ev.type === "pointerup") onClick && onClick(); else changed();
      };
      el.addEventListener("pointermove", mv); el.addEventListener("pointerup", finish); el.addEventListener("pointercancel", finish); el.addEventListener("lostpointercapture", finish);
    });
    el.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });
  }
  function movePatch(id, anchor, label) {
    if (!id) { S.draft.anchor = anchor; S.draft.label = label || ""; S.draft.general = false; renderDraft(); changed(); return; }
    const p = S.patches.find((x) => x.id === id); if (!p) return;
    Object.assign(p, { anchor, label }); changed();
    if (col) col.doc(p.id).update({ anchor, label }).catch(() => toast(t("saveFail")));
  }
  const canDrag = (st) => !S.readonly && st !== "done";
  async function patchDelete(p) {
    if (col) { try { await col.doc(p.id).delete(); } catch { toast(t("saveFail")); } }
    else { S.patches = S.patches.filter((x) => x !== p); changed(); }
    if (S.sel === p.id) S.sel = null;
  }

  async function shrink(blob) {
    if (blob.size < 12e6 || !/^image\/(png|jpeg|webp)$/.test(blob.type)) return blob;
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 3200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
  }
  async function upload(blob) {
    blob = await shrink(blob);
    if (assets) { const r = await assets.upload(blob); return { id: r.id, url: r.url }; }
    const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
    return { id: url, url };
  }
  async function attach(files) {
    for (const f of files) {
      if (!f || !/^image\//.test(f.type)) continue;
      const tmp = { id: null, url: URL.createObjectURL(f), pending: true };
      S.draft.shots.push(tmp); renderDraft();
      try { const r = await upload(f); Object.assign(tmp, r, { pending: false }); }
      catch (e) { S.draft.shots = S.draft.shots.filter((s) => s !== tmp); toast(t("uploadFail") + (e && e.code ? " (" + e.code + ")" : "")); }
      renderDraft();
    }
    ui.ta.focus();
  }
  async function addBoard(file, name) {
    const up = await upload(file);
    const b = { name: name || file.name || t("screenshot"), asset: up.id, created: Date.now(), author: S.me || null, kind: CFG.kind };
    if (bcol) { const ref = await bcol.add(b); const full = { id: ref.id, ...b }; if (!S.boards.find((x) => x.id === ref.id)) S.boards.push(full); return full; }
    const full = { id: "lb-" + Date.now(), ...b }; S.boards.push(full); saveLocal(); O.onBoards && O.onBoards(); return full;
  }

  // ---------- draft ----------
  function setDraft(anchor, label) {
    S.draft.anchor = anchor; S.draft.label = label || ""; S.draft.general = false; S.sel = null;
    if (S.collapsed && !mobile()) setCollapsed(false, true);
    renderDraft(); changed(); if (ui.ta) { ui.ta.focus({ preventScroll: true }); setTimeout(() => document.activeElement !== ui.ta && ui.ta.focus({ preventScroll: true }), 0); }
  }
  function clearDraft(withShots) {
    S.draft.anchor = null; S.draft.label = ""; S.draft.general = false;
    if (withShots) S.draft.shots = [];
    renderDraft(); O.onChange && O.onChange();
  }
  function renderDraft() {
    let label = S.draft.label, general = !S.draft.anchor;
    if (!S.draft.anchor && !S.draft.general && O.defaultAnchor) { const d = O.defaultAnchor(); if (d) { label = d.label; general = false; } }
    ui.ctx.classList.toggle("general", general);
    ui.ctxIcon.innerHTML = general ? I.dot : I.pinMini;
    ui.ctxText.textContent = general ? t("general") : label;
    ui.ctxText.title = general ? "" : label;
    ui.ctxX.hidden = general;
    ui.ctx.hidden = general;
    const row = ui.dshots; row.textContent = "";
    for (const s of S.draft.shots) {
      row.append(h("span", { class: "pb-dshot" + (s.pending ? " pending" : "") },
        h("img", { src: s.url, alt: t("screenshot"), onclick: () => lightbox(s.url) }),
        h("button", { "aria-label": t("del"), title: t("del"), html: I.x, onclick: () => { S.draft.shots = S.draft.shots.filter((x) => x !== s); renderDraft(); } })));
    }
    row.hidden = !S.draft.shots.length;
    updateSend();
  }
  function updateSend() { if (ui.send) ui.send.disabled = S.readonly || !(ui.ta.value.trim() || S.draft.shots.some((x) => !x.pending)); }
  const refreshChip = () => ui.ctx && renderDraft();

  // ---------- sidebar ----------
  function mount() {
    const side = h("aside", { id: "pb-side", "aria-label": t("patches") });
    const seg = h("div", { class: "pb-seg", role: "group" });
    ui.tabs = {};
    for (const f of ["open", "done"]) {
      const b = h("button", { "aria-pressed": String(S.filter === f), onclick: () => { S.filter = f; S.sel = null; renderTabs(); changed(); } },
        h("span", { text: t(f) }), h("span", { class: "pb-count pb-num", text: "0" }));
      ui.tabs[f] = b; seg.append(b);
    }
    ui.sum = h("span", { class: "pb-sum pb-num" });
    ui.toggle = h("button", { class: "pb-ibtn pb-toggle", "aria-label": t("collapse"), title: t("collapse"), onclick: (e) => { e.stopPropagation(); setCollapsed(!S.collapsed); } });
    const head = h("header", { class: "pb-head" }, h("div", { class: "pb-title" }, t("patches"), ui.sum), seg, ui.toggle);
    head.addEventListener("click", (e) => { if (O.layout !== "below" && mobile() && !e.target.closest(".pb-seg")) setCollapsed(!S.collapsed); });
    ui.railCount = h("span", { class: "pb-rail-count pb-num" });
    ui.rail = h("button", { class: "pb-rail", "aria-label": t("expand"), title: t("expand"), onclick: () => setCollapsed(false) },
      h("span", { class: "pb-ibtn", html: I.panel }), ui.railCount);
    ui.list = h("div", { class: "pb-list", role: "list" });
    ui.ctxIcon = h("span", { class: "pb-ctx-ico" });
    ui.ctxText = h("span", { class: "pb-ctx-text" });
    ui.ctxX = h("button", { class: "pb-ctx-x", title: t("removeAnchor"), "aria-label": t("removeAnchor"), html: I.x, onclick: () => { S.draft.anchor = null; S.draft.label = ""; S.draft.general = true; renderDraft(); O.onChange && O.onChange(); ui.ta.focus(); } });
    ui.ctx = h("div", { class: "pb-ctx" }, ui.ctxIcon, ui.ctxText, ui.ctxX);
    ui.dshots = h("div", { class: "pb-dshots", hidden: true });
    ui.ta = h("textarea", { class: "pb-ta", id: "pb-text", rows: "1", placeholder: t("placeholder"), "aria-label": t("placeholder") });
    ui.file = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, id: "pb-file", onchange: (e) => { attach([...e.target.files]); e.target.value = ""; } });
    ui.send = h("button", { class: "pb-send", title: t("send"), "aria-label": t("send"), html: I.up, onclick: addPatch });
    const extra = O.composerExtra ? O.composerExtra() : null;
    ui.compose = h("div", { class: "pb-compose" }, ui.ctx, ui.dshots,
      h("div", { class: "pb-crow" }, ui.ta,
        h("button", { class: "pb-ibtn", title: t("attach"), "aria-label": t("attach"), html: I.image, onclick: () => ui.file.click() }),
        extra, ui.send), ui.file);
    const copyBtn = h("button", { class: "pb-ibtn", title: t("copy"), "aria-label": t("copy"), html: I.copy, onclick: () => copy(t("handoffText")) });
    ui.handoffLabel = h("span", { text: t("handoff") });
    ui.handoffCode = h("code", { text: t("handoffText") });
    ui.copyAll = h("button", { class: "pb-btn pb-copyall", text: t("copyPatches"), onclick: copyPatches, hidden: true });
    ui.copyBtn = copyBtn;
    ui.handoff = h("div", { class: "pb-handoff" }, ui.handoffLabel, ui.handoffCode, copyBtn, ui.copyAll);
    ui.note = h("div", { class: "pb-note", hidden: true });
    side.append(ui.rail, head, ui.list, h("div", { class: "pb-foot" }, ui.compose, ui.handoff, ui.note));
    document.getElementById("pb-app").append(side);

    ui.ta.addEventListener("input", () => { autosize(); updateSend(); O.onTyping && O.onTyping(); });
    ui.ta.addEventListener("focus", () => { O.onTyping && O.onTyping(); refreshChip(); });
    ui.ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); addPatch(); }
      else if (e.key === "Escape") { e.preventDefault(); if (S.draft.anchor) clearDraft(); ui.ta.blur(); }
    });
    dropTarget(ui.compose, (files) => attach(files), (on) => ui.compose.classList.toggle("drag", on));
    renderTabs(); renderDraft(); renderFoot();
    let stored = null; try { stored = localStorage.getItem("pb-collapsed-" + CFG.kind); } catch {}
    if (O.layout === "below") { document.getElementById("pb-app").classList.add("below"); setCollapsed(false, true); return; }
    setCollapsed(stored != null ? stored === "1" : mobile(), true);
  }
  function mobile() { return matchMedia("(max-width: 860px)").matches; }
  function setCollapsed(v, silent) {
    S.collapsed = !!v;
    document.getElementById("pb-app").classList.toggle("collapsed", S.collapsed);
    ui.toggle.innerHTML = mobile() ? I.chev : I.panel;
    ui.toggle.classList.toggle("flip", mobile() && !S.collapsed);
    ui.toggle.title = ui.toggle.ariaLabel = S.collapsed ? t("expand") : t("collapse");
    if (!silent) try { localStorage.setItem("pb-collapsed-" + CFG.kind, S.collapsed ? "1" : "0"); } catch {}
    if (!S.collapsed && S.sel) setTimeout(() => { const el = ui.list.querySelector(`[data-id="${CSS.escape(S.sel)}"]`); el && el.scrollIntoView({ block: "nearest" }); }, 60);
  }
  function autosize() { ui.ta.style.height = "0px"; ui.ta.style.height = Math.max(20, Math.min(160, ui.ta.scrollHeight - 10)) + "px"; }
  function renderTabs() {
    const nOpen = S.patches.filter(isOpen).length;
    if (ui.sum) { ui.sum.textContent = nOpen ? nOpen + " " + t("openN") : ""; ui.railCount.textContent = nOpen ? String(nOpen) : ""; ui.railCount.hidden = !nOpen; }
    for (const f of ["open", "done"]) {
      ui.tabs[f].setAttribute("aria-pressed", String(S.filter === f));
      ui.tabs[f].querySelector(".pb-count").textContent = S.patches.filter((p) => inTab(p, f) && inScope(p)).length;
    }
  }
  function renderFoot() {
    if (!ui.note) return;
    const msg = S.readonly ? t("readonly") : !S.live ? t("local") : "";
    ui.note.hidden = !msg; ui.note.textContent = msg;
    ui.compose.hidden = S.readonly; ui.handoff.hidden = S.readonly;
    const local = !S.live;
    ui.handoffLabel.textContent = local ? t("handoffLocal") : t("handoff");
    ui.handoffCode.hidden = local; ui.copyBtn.hidden = local; ui.copyAll.hidden = !local;
  }
  function renderList() {
    if (!ui.list) return;
    renderTabs();
    const items = visible().sort((a, b) => S.filter === "open" ? (a.n || 0) - (b.n || 0) : (b.doneAt || b.created || 0) - (a.doneAt || a.created || 0));
    ui.list.textContent = "";
    const elsewhere = O.scope && !S.scopeAll ? S.patches.filter((p) => inTab(p, S.filter) && !inScope(p)).length : 0;
    const scopeLink = () => {
      if (!O.scope || (!elsewhere && !S.scopeAll)) return null;
      const noun = O.scopeNoun === "image" ? ["otherImages", "thisImageOnly"] : ["otherPages", "thisPageOnly"];
      return h("button", { class: "pb-scope", onclick: () => { S.scopeAll = !S.scopeAll; changed(); } },
        S.scopeAll ? t(noun[1]) : t(noun[0]).replace("{n}", elsewhere));
    };
    if (!items.length) {
      ui.list.append(h("div", { class: "pb-empty" }, h("span", { html: S.filter === "open" ? I.comment : I.check }),
        S.filter === "open" ? (O.timeBased ? t("emptyOpenTime") : t("emptyOpen")) : t("emptyDone")));
      const l = scopeLink(); if (l) ui.list.append(l);
      return;
    }
    for (const p of items) ui.list.append(itemEl(p));
    const l = scopeLink(); if (l) ui.list.append(l);
  }
  function itemEl(p) {
    const st = p.status === "done" ? "done" : p.status === "working" ? "working" : "open";
    const el = h("article", { class: `pb-item ${st}${S.sel === p.id ? " sel" : ""}`, role: "listitem", "data-id": p.id, tabindex: "0" });
    const meta = h("div", { class: "pb-meta" });
    const prof = S.profiles[p.author];
    if (prof) meta.append(h("span", { class: "pb-who", style: `background:${prof.color || "#888"}`, title: prof.name || "", text: (prof.name || "?").trim().charAt(0).toUpperCase() }));
    meta.append(h("span", { class: "pb-where", text: p.label || t("general") }));
    const text = h("div", { class: "pb-text", text: p.text || "", title: S.readonly ? null : t("edit") });
    if (!S.readonly) text.addEventListener("dblclick", (e) => {
      e.stopPropagation(); text.contentEditable = "true"; text.focus();
      const end = () => { text.contentEditable = "false"; const v = text.textContent.trim(); if (v && v !== p.text) patchUpdate(p, { text: v }); else text.textContent = p.text; };
      text.addEventListener("blur", end, { once: true });
      text.addEventListener("keydown", (k) => { if (k.key === "Enter" && !k.shiftKey) { k.preventDefault(); text.blur(); } if (k.key === "Escape") { text.textContent = p.text; text.blur(); } });
    });
    const body = h("div", { style: "min-width:0" }, meta, text);
    if (p.shots && p.shots.length) body.append(h("div", { class: "pb-shots" }, p.shots.map((id) => h("img", { src: blobUrl(id), alt: t("screenshot"), loading: "lazy", onclick: (e) => { e.stopPropagation(); lightbox(blobUrl(id)); } }))));
    if (st === "working") body.append(h("div", { class: "pb-state", text: t("working") }));
    if (p.reply) body.append(h("div", { class: "pb-reply" }, h("span", { text: p.reply })));
    const acts = h("div", { class: "pb-acts" });
    if (!S.readonly) {
      acts.append(h("button", {
        class: "pb-ibtn pb-ok", title: st === "done" ? t("reopen") : t("markDone"), "aria-label": st === "done" ? t("reopen") : t("markDone"),
        html: st === "done" ? I.undo : I.check,
        onclick: (e) => { e.stopPropagation(); patchUpdate(p, st === "done" ? { status: "open", doneAt: null } : { status: "done", doneAt: Date.now() }); },
      }));
      const del = h("button", { class: "pb-ibtn pb-del", title: t("del"), "aria-label": t("del"), html: I.trash });
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        if (del.classList.contains("armed")) return patchDelete(p);
        del.classList.add("armed"); del.title = t("armed"); toast(t("armed"));
        setTimeout(() => { del.classList.remove("armed"); del.title = t("del"); }, 2600);
      });
      acts.append(del);
    }
    el.append(h("div", { class: "pb-badge pb-num", text: String(p.n || "·") }), body, acts);
    el.addEventListener("click", () => select(p.id, true));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === el) select(p.id, true); });
    return el;
  }
  function select(id, jump) {
    S.sel = id;
    if (S.collapsed && !jump) setCollapsed(false, true);
    const p = S.patches.find((x) => x.id === id);
    if (p) {
      const want = isOpen(p) ? "open" : "done";
      if (S.filter !== want) { S.filter = want; renderTabs(); }
    }
    changed();
    const el = ui.list.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (jump && p && O.focus) O.focus(p);
  }

  // ---------- helpers ----------
  let toastTimer;
  function toast(msg, ms) {
    let el = $(".pb-toast"); if (!el) { el = h("div", { class: "pb-toast", role: "status" }); document.body.append(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), ms || 2200);
  }
  function lightbox(src) {
    const lb = h("div", { class: "pb-lightbox", onclick: () => lb.remove() }, h("img", { src, alt: "" }));
    const esc = (e) => { if (e.key === "Escape") { lb.remove(); document.removeEventListener("keydown", esc, true); } };
    document.addEventListener("keydown", esc, true); document.body.append(lb);
  }
  function copy(text) {
    const done = () => toast(t("copied"));
    try { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); } catch { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    const ta = h("textarea", { style: "position:fixed;opacity:0" }); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch {} ta.remove();
  }
  function imagesFrom(dt) {
    const out = [];
    if (!dt) return out;
    for (const it of dt.items || []) if (it.kind === "file" && /^image\//.test(it.type)) { const f = it.getAsFile(); if (f) out.push(f); }
    if (!out.length) for (const f of dt.files || []) if (/^image\//.test(f.type)) out.push(f);
    return out;
  }
  function dropTarget(el, onFiles, onHover) {
    let depth = 0;
    el.addEventListener("dragenter", (e) => { if (![...(e.dataTransfer?.types || [])].includes("Files")) return; e.preventDefault(); depth++; onHover && onHover(true); });
    el.addEventListener("dragover", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) e.preventDefault(); });
    el.addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) onHover && onHover(false); });
    el.addEventListener("drop", (e) => { const files = imagesFrom(e.dataTransfer); depth = 0; onHover && onHover(false); if (!files.length) return; e.preventDefault(); e.stopPropagation(); onFiles(files); });
  }
  function handlePaste(e) {
    const files = imagesFrom(e.clipboardData);
    if (!files.length || S.readonly) return;
    e.preventDefault();
    if (O.onPasteImages && document.activeElement !== ui.ta && !S.draft.anchor) O.onPasteImages(files);
    else attach(files);
  }
  function modeToggle() { return null; }
  function mountFab(host) {
    ui.fabLabel = h("span", { class: "pb-fab-label", text: t("comment") });
    ui.fab = h("button", { class: "pb-fab", id: "pb-fab", "aria-pressed": "false", title: t("comment"), onclick: () => setMode(S.mode === "comment" ? "browse" : "comment") },
      h("span", { class: "pb-fab-ico", html: I.comment }), ui.fabLabel);
    host.append(ui.fab);
  }
  function setMode(m) {
    if (S.readonly && m === "comment") return;
    S.mode = m;
    if (ui.fab) { const on = m === "comment"; ui.fab.setAttribute("aria-pressed", String(on)); ui.fab.querySelector(".pb-fab-ico").innerHTML = on ? I.x : I.comment; ui.fabLabel.textContent = on ? t("tapSpot") : t("comment"); }
    if (m === "browse" && S.draft.anchor) clearDraft();
    O.onMode && O.onMode(m);
  }
  function pin(n, status, sel, extra) {
    const el = document.createElement("div");
    el.className = "pb-pin" + (status === "done" ? " done" : status === "working" ? " working" : status === "draft" ? " draft" : "") + (sel ? " sel" : "");
    el.textContent = status === "draft" ? "+" : String(n || "·");
    if (extra) Object.assign(el.style, extra);
    return el;
  }
  function keyTarget(e) { const tg = e.target; return tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)); }

  // ---------- boot ----------
  function boot(opts) {
    O = opts || {};
    mount();
    const stage = document.querySelector(".pb-stage");
    if (stage) {
      const zone = h("div", { class: "pb-dropzone", hidden: true, text: O.onStageDrop ? t("importShot") : t("drop") });
      stage.append(zone);
      if (O.modes && !S.readonly) mountFab(O.fabHost || stage);
      dropTarget(stage, (files) => (O.onStageDrop ? O.onStageDrop(files) : attach(files)), (on) => (zone.hidden = !on));
    }
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", (e) => {
      if (keyTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (O.onKey && O.onKey(e)) { e.preventDefault(); return; }
      if (O.modes && (e.key === "c" || e.key === "C")) { e.preventDefault(); setMode(S.mode === "comment" ? "browse" : "comment"); }
      else if (O.modes && (e.key === "v" || e.key === "V")) { e.preventDefault(); setMode("browse"); }
      else if (e.key === "Escape" && S.draft.anchor) { clearDraft(); }
    });
    if (CFG.version) document.querySelectorAll("[data-pb-version]").forEach((el) => (el.textContent = CFG.version));
    connect();
  }

  // ---------- image canvas (pins + regions on a zoomable picture) ----------
  function ImageCanvas(host, opts) {
    host.classList.add("ic");
    const inner = h("div", { class: "ic-inner" });
    const img = h("img", { class: "ic-img", alt: "", draggable: "false" });
    const layer = h("div", { class: "ic-layer" });
    const zoomOut = h("output", { title: t("fit") });
    const zoomBox = h("div", { class: "ic-zoom" },
      h("button", { class: "pb-ibtn", "aria-label": t("zoomOut"), html: I.minus, onclick: () => zoomCenter(1 / 1.25) }), zoomOut,
      h("button", { class: "pb-ibtn", "aria-label": t("zoomIn"), html: I.plus, onclick: () => zoomCenter(1.25) }));
    zoomOut.addEventListener("click", fit);
    inner.append(img, layer); host.append(inner, zoomBox);
    let z = 1, tx = 0, ty = 0, W = 0, H = 0, fitted = false, space = false;

    function apply() { inner.style.transform = `translate(${tx}px,${ty}px) scale(${z})`; layer.style.setProperty("--iz", 1 / z); zoomOut.textContent = Math.round(z * 100) + "%"; }
    function fit() {
      if (!W) return;
      const r = host.getBoundingClientRect();
      z = Math.min((r.width - 40) / W, (r.height - 40) / H, 2); if (!(z > 0)) z = 1;
      tx = (r.width - W * z) / 2; ty = (r.height - H * z) / 2; fitted = true; apply();
    }
    function zoomAt(f, cx, cy) { const nz = clamp(z * f, 0.05, 10); tx = cx - (cx - tx) * (nz / z); ty = cy - (cy - ty) * (nz / z); z = nz; fitted = false; apply(); }
    function zoomCenter(f) { const r = host.getBoundingClientRect(); zoomAt(f, r.width / 2, r.height / 2); }
    function load(src) {
      W = 0; layer.textContent = ""; img.removeAttribute("src");
      if (!src) return;
      img.onload = () => { W = img.naturalWidth; H = img.naturalHeight; inner.style.width = W + "px"; inner.style.height = H + "px"; fit(); draw(); };
      img.src = src;
    }
    function coord(e) {
      const r = inner.getBoundingClientRect();
      return { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) };
    }
    function draw() {
      if (S.dragging) return;
      layer.textContent = "";
      const add = (a, n, st, sel, id) => {
        const region = a.w != null ? h("div", { class: "pb-region" + (st === "done" ? " done" : st === "draft" ? " draft" : ""), style: `left:${a.x * 100}%;top:${a.y * 100}%;width:${a.w * 100}%;height:${a.h * 100}%` }) : null;
        if (region) layer.append(region);
        const p = pin(n, st, sel, { left: a.x * 100 + "%", top: a.y * 100 + "%" });
        if (canDrag(st) && opts.onMovePin) {
          let pos = null;
          draggable(p, {
            onClick: () => id && select(id, false),
            onMove: (ev) => {
              const c = coord(ev); let x = c.x, y = c.y;
              if (a.w != null) { x = clamp(x, 0, 1 - a.w); y = clamp(y, 0, 1 - a.h); }
              pos = { x, y }; p.style.left = x * 100 + "%"; p.style.top = y * 100 + "%";
              if (region) { region.style.left = x * 100 + "%"; region.style.top = y * 100 + "%"; }
            },
            onDrop: () => { if (pos) opts.onMovePin(id, { ...a, x: +pos.x.toFixed(4), y: +pos.y.toFixed(4) }); },
          });
        } else if (id) p.addEventListener("pointerdown", (e) => { e.stopPropagation(); select(id, false); });
        layer.append(p);
      };
      for (const p of opts.pins()) add(p.anchor, p.n, p.status, S.sel === p.id, p.id);
      const d = opts.draft && opts.draft();
      if (d) add(d, 0, "draft", false, null);
    }
    let drag = null;
    host.addEventListener("pointerdown", (e) => {
      if (e.button > 1 || !W) return;
      host.setPointerCapture(e.pointerId);
      const pan = opts.mode() !== "comment" || space || e.button === 1;
      drag = { pan, x: e.clientX, y: e.clientY, tx, ty, c0: coord(e), moved: false };
      if (pan) host.classList.add("panning");
    });
    host.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      if (drag.pan) { tx = drag.tx + dx; ty = drag.ty + dy; fitted = false; apply(); }
      else if (drag.moved) { const c = coord(e); drag.rect = { x: Math.min(c.x, drag.c0.x), y: Math.min(c.y, drag.c0.y), w: Math.abs(c.x - drag.c0.x), h: Math.abs(c.y - drag.c0.y) }; opts.onDraft(drag.rect, true); }
    });
    const end = () => {
      if (!drag) return; host.classList.remove("panning");
      if (!drag.pan) { if (drag.rect && drag.rect.w > 0.004 && drag.rect.h > 0.004) opts.onDraft(drag.rect, false); else if (!drag.moved) opts.onDraft(drag.c0, false); }
      drag = null;
    };
    host.addEventListener("pointerup", end); host.addEventListener("pointercancel", end);
    host.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = host.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      else { tx -= e.deltaX; ty -= e.deltaY; fitted = false; apply(); }
    }, { passive: false });
    window.addEventListener("keydown", (e) => { if (e.code === "Space" && !keyTarget(e)) { space = true; } });
    window.addEventListener("keyup", (e) => { if (e.code === "Space") space = false; });
    new ResizeObserver(() => { if (fitted) fit(); }).observe(host);
    const setMode = (m) => { host.classList.toggle("comment", m === "comment"); host.classList.toggle("browse", m !== "comment"); };
    setMode(opts.mode());
    return { load, fit, draw, setMode, zoomAt, get zoom() { return z; } };
  }

  // ---------- timeline (scene bar, waveform, dots, press-and-hold zoom, drag = range) ----------
  function Timeline(host, opts) {
    host.classList.add("tl");
    const cv = h("canvas"); const tip = h("div", { class: "tl-tip", hidden: true });
    host.append(cv, tip);
    const ctx = cv.getContext("2d");
    let v0 = 0, v1 = 0, target = null, hover = null, range = null, pd = null, raf = 0;
    const DOT = 20, BAR_Y = 28, PAD = 10;
    const dur = () => opts.duration() || 0;
    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    function size() { const r = host.getBoundingClientRect(); const d = devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); return r; }
    let R = size();
    new ResizeObserver(() => { R = size(); draw(); }).observe(host);
    const IW = () => Math.max(1, R.width - PAD * 2);
    const tToX = (tt) => PAD + ((tt - v0) / Math.max(1e-6, v1 - v0)) * IW();
    const xToT = (x) => clamp(v0 + ((x - PAD) / IW()) * (v1 - v0), 0, dur());
    function animate() {
      cancelAnimationFrame(raf);
      const step = () => {
        if (!target) return;
        v0 += (target[0] - v0) * 0.28; v1 += (target[1] - v1) * 0.28;
        if (Math.abs(target[0] - v0) + Math.abs(target[1] - v1) < 0.002) { v0 = target[0]; v1 = target[1]; target = null; }
        draw(); if (target) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    function setView(a, b, now) { if (now) { v0 = a; v1 = b; target = null; draw(); } else { target = [a, b]; animate(); } }
    function reset(now) { setView(0, dur(), now); }
    function draw() {
      const W = R.width, Hh = R.height, D = dur();
      ctx.clearRect(0, 0, W, Hh);
      if (!D) return;
      if (v1 <= v0) { v0 = 0; v1 = D; }
      const ink = css("--ink"), muted = css("--muted"), line = css("--line"), lineS = css("--line-strong"), acc = css("--accent"), accSoft = css("--accent-soft"), panel = css("--panel"), work = css("--work"), donePin = css("--done-pin");
      const barH = Hh - BAR_Y - 4;
      // chapters
      const ch = opts.chapters ? opts.chapters() : [];
      ctx.save(); roundRect(PAD, BAR_Y, W - PAD * 2, barH, 7); ctx.clip();
      ctx.fillStyle = line; ctx.fillRect(PAD, BAR_Y, W - PAD * 2, barH);
      ch.forEach(([name, s], i) => {
        const e = i + 1 < ch.length ? ch[i + 1][1] : D;
        const x0 = tToX(s), x1 = tToX(e);
        if (x1 < 0 || x0 > W) return;
        if (i % 2) { ctx.fillStyle = line; ctx.fillRect(x0, BAR_Y, x1 - x0, barH); }
        ctx.fillStyle = lineS; ctx.fillRect(x0, BAR_Y, 1, barH);
        if (x1 - x0 > 46) { ctx.fillStyle = muted; ctx.font = "11px " + css("--font"); ctx.save(); ctx.beginPath(); ctx.rect(x0 + 6, BAR_Y, x1 - x0 - 12, barH); ctx.clip(); ctx.fillText(name, Math.max(x0, 0) + 7, BAR_Y + 15); ctx.restore(); }
      });
      // waveform
      const peaks = opts.peaks && opts.peaks();
      if (peaks && peaks.length) {
        const mid = BAR_Y + barH / 2 + (ch.length ? 6 : 0), amp = (barH / 2 - (ch.length ? 10 : 4));
        const played = opts.time();
        for (let x = PAD; x < W - PAD; x += 2) {
          const tt = xToT(x), i = Math.floor((tt / D) * peaks.length), pk = peaks[clamp(i, 0, peaks.length - 1)] || 0;
          const hh = Math.max(1, pk * amp);
          ctx.fillStyle = tt <= played ? acc : muted; ctx.globalAlpha = tt <= played ? 0.85 : 0.55;
          ctx.fillRect(x, mid - hh, 1.4, hh * 2);
        }
        ctx.globalAlpha = 1;
      }
      // ranges of patches
      for (const p of opts.pins()) {
        const a = p.anchor || {}; if (a.t2 == null) continue;
        ctx.fillStyle = p.status === "done" ? line : accSoft; ctx.fillRect(tToX(a.t), BAR_Y, tToX(a.t2) - tToX(a.t), barH);
      }
      if (range) { ctx.fillStyle = accSoft; ctx.fillRect(tToX(range[0]), BAR_Y, tToX(range[1]) - tToX(range[0]), barH); ctx.fillStyle = acc; ctx.fillRect(tToX(range[0]), BAR_Y, 1.5, barH); ctx.fillRect(tToX(range[1]) - 1.5, BAR_Y, 1.5, barH); }
      ctx.restore();
      // zoom ticks
      if (v1 - v0 < D * 0.99) {
        const span = v1 - v0, step = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60].find((s) => span / s < 14) || 120;
        ctx.fillStyle = muted; ctx.font = "10px " + css("--mono");
        for (let s = Math.ceil(v0 / step) * step; s <= v1; s += step) { const x = tToX(s); ctx.fillRect(x, Hh - 8, 1, 6); }
      }
      // playhead
      const px = tToX(opts.time());
      ctx.fillStyle = ink; ctx.fillRect(px - 1, BAR_Y - 4, 2, barH + 8);
      ctx.beginPath(); ctx.arc(px, BAR_Y - 4, 4, 0, Math.PI * 2); ctx.fill();
      // dots
      const sel = S.sel;
      for (const p of opts.pins()) {
        const a = p.anchor || {}; if (a.t == null) continue;
        const x = tToX(a.t); if (x < -10 || x > W + 10) continue;
        ctx.fillStyle = p.status === "done" ? donePin : p.status === "working" ? work : acc;
        ctx.beginPath(); ctx.arc(x, 10, p.id === sel ? 9.5 : 8, 0, Math.PI * 2); ctx.fill();
        if (p.id === sel) { ctx.strokeStyle = panel; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.fillStyle = css("--on-accent"); ctx.font = "600 9.5px " + css("--font"); ctx.textAlign = "center"; ctx.fillText(String(p.n || ""), x, 13.5); ctx.textAlign = "start";
      }
      const d = opts.draft && opts.draft();
      if (d && d.t != null) { const x = tToX(d.t); ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 10, 6, 0, Math.PI * 2); ctx.stroke(); }
      if (hover != null && !pd) { tip.hidden = false; tip.style.left = clamp(hover, 24, W - 24) + "px"; tip.textContent = fmtTime(xToT(hover), v1 - v0 < 30); }
      else if (!pd || pd.mode === "pending") tip.hidden = true;
    }
    function roundRect(x, y, w, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function hitDot(x, y) {
      if (y > DOT + 4) return null;
      let best = null, bd = 10;
      for (const p of opts.pins()) { const a = p.anchor || {}; if (a.t == null) continue; const d = Math.abs(tToX(a.t) - x); if (d < bd) { bd = d; best = p; } }
      return best;
    }
    const lx = (e) => e.clientX - host.getBoundingClientRect().left;
    const ly = (e) => e.clientY - host.getBoundingClientRect().top;
    host.addEventListener("pointerdown", (e) => {
      if (!dur() || e.button > 0) return;
      const x = lx(e), dot = hitDot(x, ly(e));
      if (dot) { select(dot.id, true); return; }
      host.setPointerCapture(e.pointerId);
      const t0 = xToT(x);
      pd = { x, t0, mode: "pending", timer: setTimeout(() => {
        if (!pd || pd.mode !== "pending") return;
        pd.mode = "zoom";
        const span = Math.max(Math.min(dur(), 4), dur() * 0.08), c = t0;
        const a = clamp(c - span * ((x - PAD) / IW()), 0, Math.max(0, dur() - span));
        setView(a, a + span); opts.seek(t0); opts.onScrubStart && opts.onScrubStart();
      }, 320) };
    });
    host.addEventListener("pointermove", (e) => {
      const x = lx(e); hover = x;
      if (pd) {
        if (pd.mode === "pending" && Math.abs(x - pd.x) > 6 && opts.onRange) { clearTimeout(pd.timer); pd.mode = "range"; }
        if (pd.mode === "zoom") { opts.seek(xToT(x)); tip.hidden = false; tip.style.left = clamp(x, 24, R.width - 24) + "px"; tip.textContent = fmtTime(xToT(x), true); }
        if (pd.mode === "range") { const t1 = xToT(x); range = [Math.min(pd.t0, t1), Math.max(pd.t0, t1)]; }
      }
      draw();
    });
    host.addEventListener("pointerleave", () => { hover = null; draw(); });
    const up = () => {
      if (!pd) return; clearTimeout(pd.timer);
      if (pd.mode === "pending") opts.seek(pd.t0);
      else if (pd.mode === "zoom") reset();
      else if (pd.mode === "range" && range) { if (range[1] - range[0] > 0.15) opts.onRange(range[0], range[1]); }
      range = null; pd = null; tip.hidden = true; draw();
    };
    host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);
    return { draw, reset };
  }

  return {
    boot, refresh: () => changed(), quote, setCollapsed, draggable, movePatch, canDrag, t, I, h, $, S, pin, blobUrl, fmtTime, clamp, toast, lightbox, setDraft, clearDraft, refreshChip, select, setMode,
    modeToggle, visible, addBoard, attach, upload, keyTarget, handlePaste, ImageCanvas, Timeline, lang,
    get patches() { return S.patches; }, get boards() { return S.boards; },
  };
})();
