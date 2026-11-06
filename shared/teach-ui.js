/* The lesson presentation: the teacher walks through a lesson slide by slide, speaking Uzbek for the explanations and
 * Korean for the words (see shared/teach-script.js for what is said; audio comes from /api/tts via KTVoice, and any
 * line that cannot be played falls back to the device voice or a reading pause, so the lesson always moves on).
 * Interface text is Uzbek only — no language switcher.
 *
 *   KTTeach.available({ dayNum })  -> does this lesson have a presentation?
 *   KTTeach.open({ dayNum })       -> full-screen presentation; returns false if there is none
 */
(function () {
  "use strict";
  var S = function () { return window.KTTeachScript; };
  var st = { el: null, deck: null, i: 0, playing: false, auto: true, gen: 0 };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var css = [
    "#ktTeach{position:fixed;inset:0;z-index:66;display:flex;flex-direction:column;background:var(--surface-2,#EAF2F9);color:var(--ink,#0A1931)}",
    "#ktTeach .th-top{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:var(--surface,#fff);border-bottom:1px solid var(--line,#D3E2EF)}",
    "#ktTeach .th-av{width:46px;height:46px;border-radius:50%;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);display:grid;place-items:center;font-size:24px;flex:none;transition:box-shadow .2s}",
    "#ktTeach .th-av.talk{box-shadow:0 0 0 6px var(--accent-soft,#DDEAF5),0 0 0 10px rgba(74,127,167,.25)}",
    "#ktTeach .th-who{flex:1;min-width:0}#ktTeach .th-who b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ktTeach .th-who span{font-size:.85rem;color:var(--muted,#4D6684)}",
    "#ktTeach .th-x{border:0;background:transparent;color:var(--muted,#4D6684);font-size:30px;line-height:1;cursor:pointer;padding:4px 10px}",
    "#ktTeach .th-bar{height:5px;background:var(--line,#D3E2EF)}#ktTeach .th-bar i{display:block;height:100%;width:0;background:var(--accent-2,#1B7F57);transition:width .3s}",
    "#ktTeach .th-stage{flex:1;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:22px 18px;text-align:center}",
    "#ktTeach .th-kick{font-size:.85rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#4D6684)}",
    "#ktTeach .th-big{font-size:clamp(1.8rem,7vw,3rem);font-weight:800;line-height:1.15;max-width:900px;word-break:break-word}",
    "#ktTeach .th-uz{font-size:clamp(1.3rem,5vw,2rem);color:var(--accent,#1A3D63);font-weight:700;max-width:800px}",
    "#ktTeach .th-sub{font-size:1.05rem;color:var(--muted,#4D6684);max-width:720px}",
    "#ktTeach .th-ex{background:var(--surface,#fff);border:1px solid var(--line,#D3E2EF);border-radius:16px;padding:12px 16px;font-size:1.1rem;max-width:760px}",
    "#ktTeach .th-word{cursor:pointer;background:transparent;border:0;color:inherit;font-family:inherit;padding:0}",
    "#ktTeach .th-hide{visibility:hidden}",
    "#ktTeach .th-lines{width:100%;max-width:760px;display:flex;flex-direction:column;gap:10px;text-align:left}",
    "#ktTeach .th-line{padding:10px 14px;border-radius:14px;background:var(--surface,#fff);border:2px solid transparent;opacity:.75}",
    "#ktTeach .th-line.on{border-color:var(--accent-mid,#4A7FA7);opacity:1}",
    "#ktTeach .th-line small{display:block;color:var(--muted,#4D6684);text-transform:uppercase;letter-spacing:.06em;font-size:.72rem}",
    "#ktTeach .th-line em{display:block;font-style:normal;color:var(--muted,#4D6684);margin-top:2px}",
    "#ktTeach .th-go{padding:14px 26px;border-radius:14px;border:0;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);font:inherit;font-weight:800;font-size:1.1rem;cursor:pointer;min-height:52px}",
    "#ktTeach .th-cap{min-height:3.2em;padding:8px 18px;text-align:center;font-size:1.02rem;line-height:1.4;color:var(--ink,#0A1931);background:var(--surface,#fff);border-top:1px solid var(--line,#D3E2EF)}",
    "#ktTeach .th-cap:empty{visibility:hidden}",
    "#ktTeach .th-ctl{background:var(--surface,#fff);border-top:1px solid var(--line,#D3E2EF);padding:10px 14px calc(10px + env(safe-area-inset-bottom))}",
    "#ktTeach .th-row{max-width:620px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px}",
    "#ktTeach .th-btn{min-width:56px;height:52px;padding:0 14px;border-radius:14px;border:1.5px solid var(--line,#D3E2EF);background:var(--surface-2,#EAF2F9);color:var(--ink,#0A1931);font:inherit;font-weight:700;cursor:pointer}",
    "#ktTeach .th-btn.main{background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);border-color:var(--accent,#1A3D63);min-width:72px;font-size:1.3rem}",
    "#ktTeach .th-btn[disabled]{opacity:.4;cursor:default}",
    "#ktTeach .th-auto{max-width:620px;margin:8px auto 0;display:flex;justify-content:center;gap:8px;align-items:center;font-size:.88rem;color:var(--muted,#4D6684);cursor:pointer}",
  ].join("\n");

  // ---- speaking one step: the lesson audio first, then the device voice, then just a reading pause ----
  function deviceSpeak(text, lang, gen) {
    return new Promise(function (resolve) {
      var synth = window.speechSynthesis;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined") return resolve(false);
      var done = false, u = new SpeechSynthesisUtterance(text);
      var finish = function (ok) { if (!done) { done = true; clearTimeout(cap); resolve(ok); } };
      var cap = setTimeout(function () { try { synth.cancel(); } catch (e) {} finish(false); }, 9000);
      u.lang = lang; u.rate = 0.9;
      var vs = synth.getVoices() || [], v = vs.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(lang.slice(0, 2)) === 0; })[0];
      if (!v) return finish(false);
      u.voice = v;
      u.onend = function () { finish(true); }; u.onerror = function () { finish(false); };
      try { synth.cancel(); synth.speak(u); } catch (e) { finish(false); }
    });
  }
  function say(text, o) {
    var V = window.KTVoice, uz = o.lang === "uz";
    var av = st.el && st.el.querySelector(".th-av");
    if (av) av.classList.add("talk");
    var stopTalk = function () { if (av) av.classList.remove("talk"); };
    var readingPause = function () { return wait(Math.min(7000, 700 + text.length * 55)); };
    // Korean has decent device voices on most platforms; Uzbek device voices are too rare/poor to bother with, so a
    // missing Uzbek line is just a timed reading pause instead.
    var viaDevice = function () { return uz ? readingPause() : deviceSpeak(text, "ko-KR", o.gen).then(function (ok) { return ok ? null : readingPause(); }); };
    var p = V && V.usable()
      ? V.play(text, { gender: o.gender, lang: o.lang, rate: o.rate || 1, stale: function () { return o.gen !== st.gen; } }).then(function (r) { return r === "failed" ? viaDevice() : null; })
      : viaDevice();
    return p.then(stopTalk, stopTalk);
  }

  // ---- the slides ----
  function showSlide(slide) {
    var stage = st.el.querySelector(".th-stage"); stage.textContent = "";
    st.el.querySelector(".th-bar i").style.width = Math.round(((st.i + 1) / st.deck.slides.length) * 100) + "%";
    st.el.querySelector(".th-count").textContent = (st.i + 1) + " / " + st.deck.slides.length;
    var back = st.el.querySelector(".th-back"), next = st.el.querySelector(".th-next");
    back.disabled = st.i === 0; next.disabled = st.i === st.deck.slides.length - 1;
    var add = function (cls, text) { var e = el("div", cls, text); stage.appendChild(e); return e; };
    var replay = function (text, gender) { return function () { st.gen++; if (window.KTVoice) window.KTVoice.stop(); say(text, { gender: gender, lang: "ko", rate: 0.85, gen: st.gen }); }; };
    st.reveal = null; st.lines = null;
    if (slide.kind === "intro") {
      add("th-kick", "Dars"); add("th-big", slide.title); if (slide.sub) add("th-uz", slide.sub);
    } else if (slide.kind === "word" || slide.kind === "recall") {
      var w = el("button", "th-word th-big", slide.word); w.type = "button"; w.setAttribute("aria-label", slide.word); w.addEventListener("click", replay(slide.word, "female")); stage.appendChild(w);
      var m = add("th-uz" + (slide.kind === "recall" ? " th-hide" : ""), slide.meaning || "?"); if (slide.kind === "recall") st.reveal = m;
      if (slide.example) add("th-ex", slide.example);
    } else if (slide.kind === "dialogue") {
      var box = el("div", "th-lines"); st.lines = [];
      slide.lines.forEach(function (l) {
        var row = el("div", "th-line"); row.appendChild(el("small", null, l.who)); row.appendChild(el("div", null, l.ko)); if (l.uz) row.appendChild(el("em", null, l.uz));
        box.appendChild(row); st.lines.push(row);
      });
      stage.appendChild(box);
    } else if (slide.kind === "grammar") {
      add("th-kick", "Grammatika"); add("th-big", slide.title);
      (slide.examples || []).forEach(function (e) { var b = add("th-ex", e.ko); b.appendChild(el("div", "th-sub", e.uz)); });
    } else if (slide.kind === "outro") {
      add("th-big", "Barakalla!");
      var go = el("button", "th-go", "Testga o'tish"); go.type = "button";
      go.addEventListener("click", function () { close(); try { if (window.KT_goQuiz) window.KT_goQuiz(); } catch (e) {} });
      stage.appendChild(go);
    }
    var V = window.KTVoice;
    if (V) [1, 2].forEach(function (n) {
      var s2 = st.deck.slides[st.i + n]; if (!s2) return;
      s2.steps.forEach(function (x) { if (x.t && (x.k === "uz" || x.k === "ko" || x.k === "line")) V.prefetch(x.t, x.gender, x.k === "uz" ? "uz" : "ko"); });
    });
  }

  function highlight(i) { (st.lines || []).forEach(function (r, n) { r.classList.toggle("on", n === i); }); }
  function caption(text) { var c = st.el && st.el.querySelector(".th-cap"); if (c) c.textContent = text || ""; }

  async function run(i) {
    var gen = ++st.gen; st.i = i; var slide = st.deck.slides[i]; showSlide(slide); setPlayIcon();
    for (var n = 0; n < slide.steps.length; n++) {
      if (gen !== st.gen) return;
      var s = slide.steps[n];
      if (s.k === "uz") { caption(s.t); await say(s.t, { lang: "uz", gen: gen }); }
      else if (s.k === "ko") await say(s.t, { lang: "ko", gender: s.gender, rate: s.rate, gen: gen });
      else if (s.k === "line") { highlight(s.i); await say(s.t, { lang: "ko", gender: s.gender, rate: s.rate, gen: gen }); await wait(350); }
      else if (s.k === "pause") await wait(s.ms);
      else if (s.k === "reveal" && st.reveal) st.reveal.classList.remove("th-hide");
    }
    if (gen !== st.gen) return;
    caption(""); highlight(-1);
    if (st.playing && st.auto && i < st.deck.slides.length - 1) { await wait(900); if (gen === st.gen && st.playing) return run(i + 1); }
    if (i === st.deck.slides.length - 1) { st.playing = false; setPlayIcon(); }
  }
  function stopAudio() { caption(""); st.gen++; if (window.KTVoice) window.KTVoice.stop(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} var av = st.el && st.el.querySelector(".th-av"); if (av) av.classList.remove("talk"); }
  function setPlayIcon() { var b = st.el && st.el.querySelector(".th-play"); if (b) { b.textContent = st.playing ? "⏸" : "▶"; b.setAttribute("aria-label", st.playing ? "Pauza" : "Ijro etish"); } }
  function go(i) {
    i = Math.max(0, Math.min(st.deck.slides.length - 1, i)); stopAudio(); st.i = i;
    if (st.playing) run(i); else { st.gen++; showSlide(st.deck.slides[i]); }
  }
  function close() { stopAudio(); st.playing = false; if (st.el) { st.el.remove(); st.el = null; } }

  function open(ctx) {
    var sc = S(); if (!sc || !ctx) return false;
    var deck = sc.build(ctx.dayNum); if (!deck) return false;
    if (st.el && st.el.isConnected) return true;
    st.deck = deck; st.i = 0; st.playing = false; st.gen++;
    var root = el("div"); root.id = "ktTeach"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Sizning koreys tili o'qituvchingiz"); st.el = root;
    var top = el("div", "th-top"), av = el("div", "th-av", "👩‍🏫"), who = el("div", "th-who");
    who.appendChild(el("b", null, deck.title)); who.appendChild(el("span", "th-count", ""));
    var x = el("button", "th-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Yopish"); x.addEventListener("click", close);
    top.appendChild(av); top.appendChild(who); top.appendChild(x);
    var bar = el("div", "th-bar"); bar.appendChild(el("i"));
    var stage = el("div", "th-stage"); stage.setAttribute("aria-live", "polite");
    var cap = el("div", "th-cap"); cap.setAttribute("aria-live", "polite");
    var ctl = el("div", "th-ctl"), row = el("div", "th-row");
    var back = el("button", "th-btn th-back", "⏮"), play = el("button", "th-btn main th-play", "▶"), next = el("button", "th-btn th-next", "⏭"), rep = el("button", "th-btn", "↻");
    [back, play, next, rep].forEach(function (b) { b.type = "button"; row.appendChild(b); });
    back.setAttribute("aria-label", "Orqaga"); next.setAttribute("aria-label", "Keyingi"); rep.setAttribute("aria-label", "Takrorlash");
    var auto = el("label", "th-auto"), cb = el("input"); cb.type = "checkbox"; cb.checked = st.auto; auto.appendChild(cb); auto.appendChild(document.createTextNode("Keyingi slaydga avtomatik o'tish"));
    ctl.appendChild(row); ctl.appendChild(auto);
    root.appendChild(top); root.appendChild(bar); root.appendChild(stage); root.appendChild(cap); root.appendChild(ctl); document.body.appendChild(root);

    back.addEventListener("click", function () { go(st.i - 1); });
    next.addEventListener("click", function () { go(st.i + 1); });
    rep.addEventListener("click", function () { stopAudio(); st.playing = true; run(st.i); });
    play.addEventListener("click", function () { if (st.playing) { st.playing = false; stopAudio(); setPlayIcon(); } else { st.playing = true; run(st.i); } });
    cb.addEventListener("change", function () { st.auto = cb.checked; });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    showSlide(deck.slides[0]);
    if (window.KTVoice) deck.slides[0].steps.forEach(function (x) { if (x.t && (x.k === "uz" || x.k === "ko")) window.KTVoice.prefetch(x.t, x.gender, x.k === "uz" ? "uz" : "ko"); });
    var start = el("button", "th-go", "Darsni boshlash"); start.type = "button";
    stage.appendChild(start);
    start.addEventListener("click", function () { st.playing = true; run(0); });
    setTimeout(function () { start.focus(); }, 60);
    return true;
  }

  var style = el("style"); style.textContent = css; document.head.appendChild(style);
  window.KTTeach = {
    available: function (ctx) { var sc = S(); return !!(sc && ctx && sc.enabled(ctx.dayNum)); },
    open: open,
  };
})();
