/* Media surface: video or audio with a scene bar / waveform timeline. Patches carry a time or a range. */
(() => {
  const { h, I, t, S, fmtTime, clamp } = PB;
  const isVideo = CFG.kind === "video";
  const stage = document.querySelector(".pb-stage");
  const media = h(isVideo ? "video" : "audio", { preload: "auto", playsinline: true, id: "pb-media" });
  // no crossorigin: sources without CORS headers would fail to play
  media.setAttribute("playsinline", ""); media.setAttribute("webkit-playsinline", "");
  const fps = CFG.fps || 25;
  const dur = () => (isFinite(media.duration) && media.duration) || CFG.duration || 0;
  const playBtn = h("button", { class: "md-play", "aria-label": t("play"), html: I.play });
  const time = h("span", { class: "md-time pb-num" });
  const tlHost = h("div", { class: "md-tl" });
  const empty = h("div", { class: "pb-placeholder", hidden: true }, h("b", { text: t("noSource") }), t("noSourceHint"));
  const viewer = h("div", { class: isVideo ? "md-video" : "md-audio" }, media, empty);
  const grab = null;
  const rateSel = h("select", { class: "pb-select md-rate", "aria-label": t("speed"), id: "pb-rate" }, ["0.5", "0.75", "1", "1.25", "1.5", "2"].map((r) => h("option", { value: r, text: r + "×", selected: r === "1" })));
  rateSel.addEventListener("change", () => (media.playbackRate = +rateSel.value));
  stage.append(
    viewer,
    h("div", { class: "md-controls" }, h("div", { class: "md-row" }, playBtn, time, h("span", { class: "pb-grow" }), rateSel), h("div", { class: "md-tlw" }, tlHost)));

  if (CFG.src) media.src = CFG.src; else { empty.hidden = false; media.hidden = true; }
  if (!isVideo) {
    const art = h("div", { class: "md-art" });
    const wave = h("canvas", { class: "md-big" });
    art.append(wave); viewer.prepend(art);
    var bigWave = wave;
  }

  // ---------- peaks (audio) ----------
  let peaks = null;
  async function loadPeaks() {
    if (isVideo || !CFG.src) return;
    try {
      const buf = await (await fetch(CFG.src)).arrayBuffer();
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new AC(1, 2, 44100);
      const audio = await ctx.decodeAudioData(buf);
      const ch = audio.getChannelData(0), n = 2400, step = Math.max(1, Math.floor(ch.length / n));
      const out = new Float32Array(n); let max = 0;
      for (let i = 0; i < n; i++) { let m = 0; const s = i * step; for (let j = 0; j < step; j += 4) { const v = Math.abs(ch[s + j] || 0); if (v > m) m = v; } out[i] = m; if (m > max) max = m; }
      for (let i = 0; i < n; i++) out[i] = Math.pow(out[i] / (max || 1), 0.8);
      peaks = out; tl.draw(); drawBig();
    } catch (e) { /* waveform is optional */ }
  }
  function drawBig() {
    if (!bigWave) return;
    const r = bigWave.getBoundingClientRect(), d = devicePixelRatio || 1;
    bigWave.width = Math.round(r.width * d); bigWave.height = Math.round(r.height * d);
    const c = bigWave.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
    if (!peaks) return;
    const cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue("--accent").trim(), mut = cs.getPropertyValue("--faint").trim();
    const D = dur(), p = D ? media.currentTime / D : 0, mid = r.height / 2, bars = Math.floor(r.width / 4);
    for (let i = 0; i < bars; i++) {
      const v = peaks[Math.floor((i / bars) * peaks.length)] || 0, hh = Math.max(1.5, v * (mid - 6));
      c.fillStyle = i / bars <= p ? acc : mut;
      c.beginPath(); c.roundRect ? c.roundRect(i * 4, mid - hh, 2.4, hh * 2, 1.2) : c.rect(i * 4, mid - hh, 2.4, hh * 2); c.fill();
    }
  }
  if (bigWave) {
    new ResizeObserver(drawBig).observe(bigWave);
    bigWave.addEventListener("pointerdown", (e) => { const r = bigWave.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur()); });
  }

  // ---------- timeline ----------
  const anchorFor = (a, b) => (b != null ? { t: +a.toFixed(1), t2: +b.toFixed(1) } : { t: +a.toFixed(1) });
  const labelFor = (a) => (a.t2 != null ? fmtTime(a.t, true) + " - " + fmtTime(a.t2, true) : fmtTime(a.t, true));
  const chapterAt = (tt) => { const ch = CFG.chapters || []; let name = ""; for (const [n, s] of ch) if (tt >= s) name = n; return name; };
  const fullLabel = (a) => { const c = chapterAt(a.t); return labelFor(a) + (c ? " · " + c : ""); };
  const tl = PB.Timeline(tlHost, {
    duration: dur, time: () => media.currentTime || 0, chapters: () => CFG.chapters || [], peaks: () => peaks,
    pins: () => PB.visible().filter((p) => p.anchor && p.anchor.t != null),
    draft: () => S.draft.anchor,
    seek: (tt) => seek(tt),
    onScrubStart: () => media.pause(),
    onRange: (a, b) => { media.pause(); seek(a); const an = anchorFor(a, b); PB.setDraft(an, fullLabel(an)); },
  });
  function seek(tt) {
    const v = clamp(tt, 0, dur() || 0);
    try { media.currentTime = v; } catch {}
    // a draft that took the playhead automatically follows deliberate seeks
    if (S.draft.auto && S.draft.anchor && S.draft.anchor.t2 == null) { const a = anchorFor(v); S.draft.anchor = a; S.draft.label = fullLabel(a); lastChip = ""; }
    tick(v);
  }
  let lastChip = "", lastPaused = null;
  function tick(at) {
    const now = at != null ? at : media.currentTime;
    time.textContent = fmtTime(now, true) + " / " + fmtTime(dur());
    if (lastPaused !== media.paused) { lastPaused = media.paused; playBtn.innerHTML = media.paused ? I.play : I.pause; playBtn.setAttribute("aria-label", t(media.paused ? "play" : "pause")); }
    tl.draw(); drawBig();
    // only touch the composer when its label actually changes, not on every frame
    const chip = S.draft.anchor ? S.draft.label : (dur() ? fullLabel(anchorFor(now)) : "");
    if (chip !== lastChip) { lastChip = chip; PB.refreshChip(); }
  }
  let raf = 0;
  const loop = () => { tick(); if (!media.paused) raf = requestAnimationFrame(loop); };
  media.addEventListener("play", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
  for (const ev of ["pause", "playing", "seeked", "loadedmetadata", "durationchange", "ended"]) media.addEventListener(ev, () => { if (ev === "loadedmetadata") tl.reset(true); tick(); });
  media.addEventListener("error", () => { if (CFG.src) PB.toast(t("uploadFail")); tick(); });
  // video: size the player to the picture so it gets the largest possible area without letterboxing
  function fitStage() {
    if (!isVideo || !media.videoWidth) return;
    const app = document.getElementById("pb-app"), stageEl = viewer.parentElement; if (!app || !stageEl) return;
    const chrome = stageEl.getBoundingClientRect().height - viewer.getBoundingClientRect().height;
    const w = stageEl.getBoundingClientRect().width, natural = w * media.videoHeight / media.videoWidth + chrome;
    const h = Math.round(Math.max(260, Math.min(natural, innerHeight - (innerWidth < 861 ? 96 : 140))));
    app.style.setProperty("--stage-h", h + "px"); app.style.setProperty("--stage-h-m", h + "px");
    fitW = innerWidth;
  }
  // Refit only when the width changes: the phone keyboard shrinks the height and must not make the player jump.
  let fitW = 0;
  media.addEventListener("loadedmetadata", fitStage);
  addEventListener("resize", () => { if (innerWidth !== fitW) fitStage(); });
  playBtn.addEventListener("click", toggle);
  if (isVideo) media.addEventListener("click", toggle);
  let toggledAt = 0;
  function toggle() {
    if (!media.src) return;
    const now = performance.now(); if (now - toggledAt < 250) return; toggledAt = now; // one tap, one toggle
    if (media.paused) { if (media.ended) media.currentTime = 0; const p = media.play(); if (p && p.catch) p.catch(() => tick()); }
    else media.pause();
    tick();
  }

  function grabFrame() {
    if (!media.videoWidth) return;
    media.pause();
    const c = document.createElement("canvas"); c.width = media.videoWidth; c.height = media.videoHeight;
    try { c.getContext("2d").drawImage(media, 0, 0); c.toBlob((b) => { if (b) PB.attach([new File([b], "frame-" + media.currentTime.toFixed(1) + ".png", { type: "image/png" })]); }, "image/png"); }
    catch { PB.toast(t("uploadFail")); }
  }

  PB.boot({
    kind: CFG.kind, timeBased: true, layout: "below",
    defaultAnchor: () => (dur() ? { anchor: anchorFor(media.currentTime), label: fullLabel(anchorFor(media.currentTime)) } : null),
    // Typing pauses and pins the draft to this moment, so the patch lands where the user started writing.
    onTyping: () => {
      if (!media.paused) media.pause();
      if (!S.draft.anchor && !S.draft.general && dur()) { const a = anchorFor(media.currentTime); S.draft.anchor = a; S.draft.label = fullLabel(a); S.draft.auto = true; PB.refreshChip(); tl.draw(); }
    },
    onChange: () => { lastChip = ""; tl.draw(); },
    composerExtra: () => grab,
    focus: (p) => { if (p.anchor && p.anchor.t != null) { media.pause(); seek(p.anchor.t); } },
    onKey: (e) => {
      const k = e.key;
      if (k === "k" || k === "K" || k === " ") { toggle(); return true; }
      if (k === "j" || k === "J") { seek(media.currentTime - 2); return true; }
      if (k === "l" || k === "L") { seek(media.currentTime + 2); return true; }
      if (k === "ArrowLeft") { seek(media.currentTime - (e.shiftKey ? 5 : 1)); return true; }
      if (k === "ArrowRight") { seek(media.currentTime + (e.shiftKey ? 5 : 1)); return true; }
      if (isVideo && k === ",") { media.pause(); seek(media.currentTime - 1 / fps); return true; }
      if (isVideo && k === ".") { media.pause(); seek(media.currentTime + 1 / fps); return true; }
      if (k === "c" || k === "C") { media.pause(); document.getElementById("pb-text").focus(); return true; }
      return false;
    },
  });
  new MutationObserver(() => tick()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => tick()); } catch {}
  tick(); loadPeaks();
})();
