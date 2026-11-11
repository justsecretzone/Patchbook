/* Media surface: video or audio with a scene bar / waveform timeline. Patches carry a time or a range.
   Playback is kept cheap: per frame only the playhead transform and the time readout change. */
(() => {
  const { h, I, t, S, fmtTime, clamp } = PB;
  const isVideo = CFG.kind === "video";
  const stage = document.querySelector(".pb-stage");
  const media = h(isVideo ? "video" : "audio", { preload: "auto", id: "pb-media" });
  // no crossorigin: sources without CORS headers would fail to play
  media.setAttribute("playsinline", ""); media.setAttribute("webkit-playsinline", "");
  if (isVideo) media.disableRemotePlayback = true;
  const fps = CFG.fps || 25;
  const dur = () => (isFinite(media.duration) && media.duration) || CFG.duration || 0;
  const playBtn = h("button", { class: "md-play", "aria-label": t("play"), html: I.play });
  const time = h("span", { class: "md-time pb-num" });
  const tlHost = h("div", { class: "md-tl" });
  const empty = h("div", { class: "pb-placeholder", hidden: true }, h("b", { text: t("noSource") }), t("noSourceHint"));
  const big = h("div", { class: "md-cplay", "aria-hidden": "true", html: I.play, hidden: true });
  const viewer = h("div", { class: isVideo ? "md-video" : "md-audio" }, media, empty, isVideo ? big : null);
  const rateSel = h("select", { class: "pb-select md-rate", "aria-label": t("speed"), id: "pb-rate" }, ["0.5", "0.75", "1", "1.25", "1.5", "2"].map((r) => h("option", { value: r, text: r + "×", selected: r === "1" })));
  rateSel.addEventListener("change", () => (media.playbackRate = +rateSel.value));
  stage.append(
    viewer,
    h("div", { class: "md-controls" }, h("div", { class: "md-row" }, playBtn, time, h("span", { class: "pb-grow" }), rateSel), h("div", { class: "md-tlw" }, tlHost)));

  if (CFG.src) media.src = CFG.src; else { empty.hidden = false; media.hidden = true; }

  // ---------- the clock ----------
  // While the element is still busy with a seek, further seeks wait in `want` and only the newest one is applied.
  let want = null;
  const now = () => (want != null ? want : media.currentTime || 0);
  function seek(tt) {
    const v = clamp(tt, 0, dur() || 0);
    if (media.seeking && media.readyState > 0) want = v;
    else { want = null; try { media.currentTime = v; } catch {} }
    // a draft that took the playhead automatically follows deliberate seeks
    if (S.draft.auto && S.draft.anchor && S.draft.anchor.t2 == null) { const a = anchorFor(v); S.draft.anchor = a; S.draft.label = fullLabel(a); tl.draw(); }
    tick();
  }
  media.addEventListener("seeked", () => {
    if (want == null) return;
    const w = want; want = null;
    if (Math.abs(media.currentTime - w) > 0.02) { try { media.currentTime = w; } catch {} }
  });

  // ---------- big waveform (audio) ----------
  let peaks = null, bigBase = null, bigPlayed = null, bigW = 0;
  if (!isVideo) {
    bigBase = h("canvas", { class: "md-big" }); bigPlayed = h("canvas", { class: "md-big md-big-p" });
    const art = h("div", { class: "md-art" }, bigBase, bigPlayed);
    viewer.prepend(art);
    new ResizeObserver(drawBig).observe(art);
    art.addEventListener("pointerdown", (e) => { const r = art.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur()); });
  }
  async function loadPeaks() {
    if (isVideo || !CFG.src) return;
    try {
      const buf = await (await fetch(CFG.src)).arrayBuffer();
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new AC(1, 2, 44100);
      const audio = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
      const ch = audio.getChannelData(0), n = 2400, step = Math.max(1, Math.floor(ch.length / n));
      const out = new Float32Array(n); let max = 0;
      for (let i = 0; i < n; i++) { let m = 0; const s = i * step; for (let j = 0; j < step; j += 4) { const v = Math.abs(ch[s + j] || 0); if (v > m) m = v; } out[i] = m; if (m > max) max = m; }
      for (let i = 0; i < n; i++) out[i] = Math.pow(out[i] / (max || 1), 0.8);
      peaks = out; tl.draw(); drawBig();
    } catch (e) { /* waveform is optional */ }
  }
  // Drawn once per size, theme or file. Progress is a clip on the second canvas, not a redraw.
  function drawBig() {
    if (!bigBase) return;
    const r = bigBase.getBoundingClientRect(), d = Math.min(3, devicePixelRatio || 1), P = PB.pal();
    bigW = r.width;
    for (const [cv, color] of [[bigBase, P.faint], [bigPlayed, P.acc]]) {
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      const c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
      if (!peaks) continue;
      const mid = r.height / 2, bars = Math.floor(r.width / 4);
      c.fillStyle = color; c.beginPath();
      for (let i = 0; i < bars; i++) {
        const v = peaks[Math.floor((i / bars) * peaks.length)] || 0, hh = Math.max(1.5, v * (mid - 6));
        c.roundRect ? c.roundRect(i * 4, mid - hh, 2.4, hh * 2, 1.2) : c.rect(i * 4, mid - hh, 2.4, hh * 2);
      }
      c.fill();
    }
    lastBig = -1; bigPos();
  }
  let lastBig = -1;
  function bigPos() {
    if (!bigPlayed || !bigW) return;
    const D = dur(), x = D ? Math.round((now() / D) * bigW) : 0;
    if (x === lastBig) return; lastBig = x;
    bigPlayed.style.clipPath = "inset(0 " + Math.max(0, bigW - x) + "px 0 0)";
  }

  // ---------- timeline ----------
  const anchorFor = (a, b) => (b != null ? { t: +a.toFixed(1), t2: +b.toFixed(1) } : { t: +a.toFixed(1) });
  const labelFor = (a) => (a.t2 != null ? fmtTime(a.t, true) + " - " + fmtTime(a.t2, true) : fmtTime(a.t, true));
  const chapterAt = (tt) => { const ch = CFG.chapters || []; let name = ""; for (const [n, s] of ch) if (tt >= s) name = n; return name; };
  const fullLabel = (a) => { const c = chapterAt(a.t); return labelFor(a) + (c ? " · " + c : ""); };
  let resume = false;
  const tl = PB.Timeline(tlHost, {
    duration: dur, time: now, chapters: () => CFG.chapters || [], peaks: () => peaks,
    pins: () => PB.visible().filter((p) => p.anchor && p.anchor.t != null),
    draft: () => S.draft.anchor,
    seek: (tt) => seek(tt),
    onScrubStart: () => { resume = false; media.pause(); },
    onRange: (a, b) => { media.pause(); seek(a); const an = anchorFor(a, b); PB.setDraft(an, fullLabel(an)); },
  });

  // ---------- per-frame work: text only when it changes, one transform for the playhead ----------
  let lastTime = "", lastChip = null, lastPaused = null;
  function tick() {
    const n = now(), s = fmtTime(n, true) + " / " + fmtTime(dur());
    if (s !== lastTime) { lastTime = s; time.textContent = s; }
    if (lastPaused !== media.paused) {
      lastPaused = media.paused;
      playBtn.innerHTML = media.paused ? I.play : I.pause; playBtn.setAttribute("aria-label", t(media.paused ? "play" : "pause"));
      big.hidden = !media.paused || !CFG.src; viewer.classList.toggle("playing", !media.paused);
    }
    tl.pos(); bigPos();
    const chip = S.draft.anchor ? S.draft.label : (dur() ? fullLabel(anchorFor(n)) : "");
    if (chip !== lastChip) { lastChip = chip; PB.refreshChip(); }
  }
  let raf = 0;
  const loop = () => { raf = 0; tick(); if (!media.paused && !media.ended) raf = requestAnimationFrame(loop); };
  const run = () => { if (!raf) raf = requestAnimationFrame(loop); };
  for (const ev of ["play", "playing"]) media.addEventListener(ev, run);
  for (const ev of ["pause", "seeked", "seeking", "ended", "timeupdate"]) media.addEventListener(ev, () => { if (!raf) tick(); });
  for (const ev of ["loadedmetadata", "durationchange"]) media.addEventListener(ev, () => { if (!tl.zoomed()) tl.reset(true); else tl.draw(); lastTime = ""; tick(); });
  media.addEventListener("error", () => { if (CFG.src) PB.toast(t("mediaFail"), 4000); tick(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !media.paused) run(); });

  playBtn.addEventListener("click", toggle);
  if (isVideo) viewer.addEventListener("click", toggle);
  let toggledAt = 0;
  function toggle() {
    if (!CFG.src) return;
    const n = performance.now(); if (n - toggledAt < 250) return; toggledAt = n; // one tap, one toggle
    if (media.paused) { if (media.ended) seek(0); const p = media.play(); if (p && p.catch) p.catch(() => tick()); }
    else media.pause();
    tick();
  }

  PB.boot({
    kind: CFG.kind, timeBased: true,
    defaultAnchor: () => (dur() ? { anchor: anchorFor(now()), label: fullLabel(anchorFor(now())) } : null),
    // Typing pauses and pins the draft to this moment, so the patch lands where the user started writing.
    onTyping: () => {
      if (!media.paused) media.pause();
      if (!S.draft.anchor && !S.draft.general && dur()) { const a = anchorFor(now()); S.draft.anchor = a; S.draft.label = fullLabel(a); S.draft.auto = true; PB.refreshChip(); tl.draw(); }
    },
    onChange: () => { lastChip = null; tl.draw(); drawBig(); tick(); },
    // the panel covers the player on phones: no point in decoding video underneath it
    onPanel: (open, phone) => { if (open && phone && !media.paused) media.pause(); },
    focus: (p) => { if (p.anchor && p.anchor.t != null) { media.pause(); seek(p.anchor.t); } },
    onKey: (e) => {
      const k = e.key;
      if (k === "k" || k === "K" || k === " ") { toggle(); return true; }
      if (k === "j" || k === "J") { seek(now() - 2); return true; }
      if (k === "l" || k === "L") { seek(now() + 2); return true; }
      if (k === "ArrowLeft") { seek(now() - (e.shiftKey ? 5 : 1)); return true; }
      if (k === "ArrowRight") { seek(now() + (e.shiftKey ? 5 : 1)); return true; }
      if (isVideo && k === ",") { media.pause(); seek(now() - 1 / fps); return true; }
      if (isVideo && k === ".") { media.pause(); seek(now() + 1 / fps); return true; }
      if (k === "c" || k === "C") { media.pause(); PB.focusComposer(); return true; }
      return false;
    },
  });
  tick(); loadPeaks();
})();
