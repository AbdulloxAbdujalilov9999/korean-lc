/* The AI teacher — Uzbek only, teaching Korean. Three tools behind one floating button:
 * "Bu dars" (teaches the lesson on screen step by step), "Tarjima" (Korean <-> Uzbek) and "Repetitor" (free chat
 * practice) — plus a full-screen spoken conversation (openTalk: text+mic, or a live ElevenLabs voice call once
 * /api/agent says it's set up). Talks to /api/tutor and /api/agent, and only appears once the server says it is set
 * up (ANTHROPIC_API_KEY / ELEVENLABS_API_KEY+AGENT_ID in Vercel) and the student is "signed in" (or, until accounts
 * exist, always — see KT_user below). Text from the server is always inserted as plain text. */
(function () {
  "use strict";
  var ENDPOINT = "/api/tutor";
  var configured = false, agentReady = false, btn = null, sheet = null, shown = false;
  var st = { tab: "translate", chat: [], busy: false, lessons: {} };
  var talk = { chat: [], busy: false, auto: true, voice: true, listening: false, speaking: false, micBlocked: false, rec: null, el: null, gen: 0, autoRun: 0 };

  function user() { return window.KT_user || { uid: "local" }; }   // until accounts exist, the helper is open to everyone on this device
  function token() { var f = window.KT_getToken; return f ? f() : Promise.resolve("local"); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var css = [
    "#ktHelperBtn{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:45;width:54px;height:54px;border-radius:50%;border:0;cursor:pointer;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);box-shadow:0 6px 20px rgba(10,25,49,.28);display:grid;place-items:center;font-size:24px;line-height:1}",
    "@media(min-width:761px){#ktHelperBtn{bottom:24px;right:24px}}",
    "#ktHelper{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,25,49,.45)}",
    "#ktHelper .hp{background:var(--surface,#fff);color:var(--ink,#0A1931);border:1px solid var(--line,#D3E2EF);width:min(560px,100%);max-height:86vh;display:flex;flex-direction:column;border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(10,25,49,.25)}",
    "@media(min-width:761px){#ktHelper{align-items:center}#ktHelper .hp{border-radius:18px;padding-bottom:16px}}",
    "#ktHelper .hh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}",
    "#ktHelper .hh b{font-size:1.05rem}",
    "#ktHelper .hx{border:0;background:transparent;color:var(--muted,#4D6684);font-size:26px;line-height:1;cursor:pointer;padding:4px 8px}",
    "#ktHelper .ht{display:flex;gap:6px;margin-bottom:12px}",
    "#ktHelper .ht button{flex:1;padding:10px;border-radius:12px;border:1.5px solid var(--line,#D3E2EF);background:var(--surface-2,#EAF2F9);color:var(--ink,#0A1931);font-weight:700;cursor:pointer}",
    "#ktHelper .ht button.on{background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);border-color:var(--accent,#1A3D63)}",
    "#ktHelper textarea,#ktHelper input{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1.5px solid var(--line,#D3E2EF);background:var(--surface,#fff);color:var(--ink,#0A1931);font:inherit}",
    "#ktHelper .go{margin-top:10px;padding:12px 18px;border-radius:12px;border:0;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);font-weight:700;cursor:pointer;min-height:46px}",
    "#ktHelper .go[disabled]{opacity:.55;cursor:default}",
    "#ktHelper .out{margin-top:12px;padding:12px;border-radius:12px;background:var(--surface-2,#EAF2F9);white-space:pre-wrap;min-height:20px;font-size:1.05rem}",
    "#ktHelper .err{color:#B3261E}",
    "#ktHelper .chat{overflow:auto;flex:1;min-height:160px;max-height:46vh;display:flex;flex-direction:column;gap:8px;margin-bottom:10px}",
    "#ktHelper .m{max-width:86%;padding:10px 12px;border-radius:14px;white-space:pre-wrap}",
    "#ktHelper .m.u{align-self:flex-end;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff)}",
    "#ktHelper .m.a{align-self:flex-start;background:var(--surface-2,#EAF2F9)}",
    "#ktHelper .hint{color:var(--muted,#4D6684);font-size:.92rem;margin:4px 0 10px}",
    "#ktHelper .row{display:flex;gap:8px}#ktHelper .row .go{margin-top:0}",
    "#ktHelper .big{width:100%;margin:6px 0 2px}",
    "#ktHelper .link{border:0;background:transparent;color:var(--muted,#4D6684);text-decoration:underline;cursor:pointer;padding:6px 2px;font:inherit;font-size:.9rem}",
    "#ktTalk{position:fixed;inset:0;z-index:65;display:flex;flex-direction:column;background:var(--surface-2,#EAF2F9);color:var(--ink,#0A1931)}",
    "#ktTalk .tk-top{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:var(--surface,#fff);border-bottom:1px solid var(--line,#D3E2EF)}",
    "#ktTalk .tk-av{width:44px;height:44px;border-radius:50%;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);display:grid;place-items:center;font-size:22px;flex:none}",
    "#ktTalk .tk-who{flex:1;min-width:0}#ktTalk .tk-who b{display:block}#ktTalk .tk-st{font-size:.85rem;color:var(--muted,#4D6684)}",
    "#ktTalk .tk-x{border:0;background:transparent;color:var(--muted,#4D6684);font-size:30px;line-height:1;cursor:pointer;padding:4px 10px}",
    "#ktTalk .tk-chat{flex:1;overflow:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px;max-width:760px;width:100%;margin:0 auto;box-sizing:border-box}",
    "#ktTalk .tk-m{max-width:88%;padding:12px 14px;border-radius:16px}",
    "#ktTalk .tk-m.t{align-self:flex-start;background:var(--surface,#fff);border:1px solid var(--line,#D3E2EF)}#ktTalk .tk-m.t .say{font-size:1.15rem;line-height:1.4}",
    "#ktTalk .tk-m.t .nt{margin-top:6px;font-size:.92rem;color:var(--muted,#4D6684)}",
    "#ktTalk .tk-m.t .ko{margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--accent-soft,#DDEAF5);color:var(--ink,#0A1931);font-size:1.3rem;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px}",
    "#ktTalk .tk-m.s{align-self:flex-end;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff)}",
    "#ktTalk .tk-live{align-self:flex-end;max-width:88%;color:var(--muted,#4D6684);font-style:italic}",
    "#ktTalk .tk-bot{background:var(--surface,#fff);border-top:1px solid var(--line,#D3E2EF);padding:12px 14px calc(12px + env(safe-area-inset-bottom))}",
    "#ktTalk .tk-in{max-width:760px;margin:0 auto;display:flex;align-items:center;gap:10px}",
    "#ktTalk .tk-mic{width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;flex:none;font-size:28px;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);box-shadow:0 4px 14px rgba(10,25,49,.25)}",
    "#ktTalk .tk-mic.on{background:#B3261E;animation:ktpulse 1.2s infinite}@keyframes ktpulse{50%{box-shadow:0 0 0 12px rgba(179,38,30,.18)}}",
    "#ktTalk .tk-mic[disabled]{opacity:.45;cursor:default}",
    "#ktTalk .tk-in input{flex:1;min-width:0;padding:13px;border-radius:12px;border:1.5px solid var(--line,#D3E2EF);background:var(--surface,#fff);color:var(--ink,#0A1931);font:inherit}",
    "#ktTalk .tk-send{padding:13px 16px;border-radius:12px;border:0;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);font-weight:700;cursor:pointer;min-height:48px}",
    "#ktTalk .tk-opt{max-width:760px;margin:8px auto 0;display:flex;gap:16px;flex-wrap:wrap;font-size:.88rem;color:var(--muted,#4D6684);align-items:center}",
    "#ktTalk .tk-opt label{display:flex;align-items:center;gap:6px;cursor:pointer}",
    "#ktTalk .tk-opt button{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0 2px}",
    ".kt-orb{--s:44px;--c1:#4A7FA7;--c2:#9ce6e6;--lvl:0;width:var(--s);height:var(--s);position:relative;flex:none;display:grid;place-items:center}",
    ".kt-orb b{position:absolute;inset:19%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0,var(--c2) 24%,var(--c1) 64%,rgba(0,0,0,.25) 100%);box-shadow:0 0 calc(var(--s)*.35) var(--c1);transform:scale(calc(1 + var(--lvl)*.5));transition:transform .08s linear,box-shadow .3s;animation:ktbreath 3.4s ease-in-out infinite}",
    ".kt-orb i{position:absolute;inset:0;border-radius:50%;border:1.5px solid var(--c1);opacity:.6;transition:border-color .3s}",
    ".kt-orb i:nth-of-type(1){border-style:dashed;animation:ktspin 16s linear infinite}",
    ".kt-orb i:nth-of-type(2){inset:9%;border-color:var(--c2);border-top-color:transparent;border-bottom-color:transparent;animation:ktspin 6s linear infinite reverse}",
    ".kt-orb.listening{--c1:#22d3ee;--c2:#a5f3fc}.kt-orb.speaking{--c1:#8b5cf6;--c2:#ddd6fe}",
    ".kt-orb.connecting i:nth-of-type(2){animation-duration:1s}",
    ".kt-orb.big{--s:min(52vw,210px)}.kt-orb.big i:nth-of-type(2){border-width:2px}",
    "@keyframes ktspin{to{transform:rotate(360deg)}}@keyframes ktbreath{50%{filter:brightness(1.3)}}",
    "@media (prefers-reduced-motion:reduce){.kt-orb i,.kt-orb b{animation:none}}",
    "#ktTalk.vt{background:radial-gradient(120% 90% at 50% 0%,#14224a 0%,#0a1024 55%,#04060f 100%);color:#e8eefc}",
    "#ktTalk.vt .tk-top,#ktTalk.vt .tk-bot{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}",
    "#ktTalk.vt .tk-x,#ktTalk.vt .tk-st,#ktTalk.vt .tk-opt{color:#9fb0d6}",
    "#ktTalk .vt-stage{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 12px 6px}",
    "#ktTalk .vt-status{min-height:1.4em;font-size:1rem;letter-spacing:.04em;color:#cfd9f5}#ktTalk .vt-clock{font-size:.85rem;color:#8fa0c8;min-height:1.1em;font-variant-numeric:tabular-nums}",
    "#ktTalk.vt .tk-chat{padding-top:8px}",
    "#ktTalk.vt .tk-m.t{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#e8eefc}",
    "#ktTalk.vt .tk-m.s{background:#2f5fa3;color:#fff}",
    "#ktTalk.vt .tk-m small{display:block;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;opacity:.65;margin-bottom:3px}",
    "#ktTalk .link{background:transparent;border:0;text-decoration:underline;cursor:pointer;font:inherit;font-size:.88rem;padding:6px 0 0;color:inherit;opacity:.75}",
    "#ktTalk.vt .link{color:#9fb0d6}#ktTalk.vt .hint{color:#8fa0c8}",
    "#ktTalk.vt .tk-send{background:#3b6fc0}#ktTalk.vt .tk-send[disabled]{opacity:.5}",
    "#teacherDock{position:sticky;top:8px;z-index:30;display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;border:1px solid var(--line,#D3E2EF);background:var(--surface,#fff);color:var(--ink,#0A1931);box-shadow:var(--shadow,0 6px 20px rgba(10,25,49,.12))}",
    "#teacherDock .dk-t{flex:1;min-width:0}#teacherDock b{display:block;font-size:.98rem}#teacherDock span{display:block;font-size:.84rem;color:var(--muted,#4D6684)}",
    "#teacherDock button{border:0;cursor:pointer;font:inherit}",
    "#teacherDock .dk-go{padding:10px 16px;border-radius:12px;background:var(--accent,#1A3D63);color:var(--accent-ink,#fff);font-weight:700;min-height:44px;white-space:nowrap}",
    "#teacherDock .dk-ic{width:44px;height:44px;border-radius:12px;background:var(--surface-2,#EAF2F9);color:var(--ink,#0A1931);font-size:1.15rem}",
    "@media (max-width:520px){#teacherDock{flex-wrap:wrap;gap:8px 10px;padding:10px 12px}#teacherDock .dk-t{flex:1 1 calc(100% - 64px)}#teacherDock .dk-go{flex:1 1 auto}}",
    "#teacherCard{margin-top:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;border-radius:14px;border:1.5px dashed var(--accent-mid,#4A7FA7);background:var(--accent-soft,#DDEAF5);color:var(--ink,#0A1931)}",
  ].join("\n");

  function lesson() { try { return window.KT_lessonContext ? window.KT_lessonContext() : null; } catch (e) { return null; } }
  function lessonContext() { var h = document.querySelector(".hwy-title"); return h ? h.textContent.replace(/\s+/g, " ").trim().slice(0, 120) : ""; }

  function askRaw(body) {
    return token().then(function (tk) {
      return fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + tk }, body: JSON.stringify(body) });
    }).then(function (res) {
      if (res.ok) return res.json();
      return res.json().catch(function () { return {}; }).then(function (j) { var e = new Error("http"); e.status = res.status; e.code = j && j.error; throw e; });
    });
  }
  var warmedAt = 0;
  function warm() {
    if (Date.now() - warmedAt < 4 * 60 * 1000) return; warmedAt = Date.now();
    askRaw({ mode: "warm" }).catch(function () { warmedAt = 0; });
  }
  function ask(body) { return askRaw(body).then(function (j) { return j.reply; }); }
  function why(e) {
    if (e && (e.message === "auth" || e.status === 401 || e.status === 403)) return "Qaytadan kiring va yordamchidan foydalaning.";
    if (e && e.status === 429) return "Biroz kuting, keyin qayta urinib ko'ring.";
    return "Yordamchi hozir band. Bir daqiqadan so'ng qayta urinib ko'ring.";
  }

  function close() { if (sheet) { sheet.remove(); sheet = null; } if (btn) btn.focus(); }
  function open(tab) {
    if (sheet && sheet.isConnected) return;
    var hasLesson = !!lesson();
    st.tab = tab || (hasLesson ? "teacher" : (st.tab === "teacher" ? "translate" : st.tab));
    if (st.tab === "teacher" && !hasLesson) st.tab = "translate";
    sheet = el("div"); sheet.id = "ktHelper"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Yordamchi");
    sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
    var panel = el("div", "hp"); sheet.appendChild(panel);
    var head = el("div", "hh"); head.appendChild(el("b", null, "Yordamchi"));
    var x = el("button", "hx", "×"); x.type = "button"; x.setAttribute("aria-label", "Yopish"); x.addEventListener("click", close); head.appendChild(x); panel.appendChild(head);
    var tabs = el("div", "ht"), body = el("div");
    (hasLesson ? [["teacher", "Bu dars"]] : []).concat([["translate", "Tarjima"], ["tutor", "Repetitor"]]).forEach(function (t) {
      var b = el("button", st.tab === t[0] ? "on" : "", t[1]); b.type = "button";
      b.addEventListener("click", function () { st.tab = t[0]; Array.prototype.forEach.call(tabs.children, function (c) { c.className = ""; }); b.className = "on"; draw(body); });
      tabs.appendChild(b);
    });
    panel.appendChild(tabs); panel.appendChild(body); draw(body);
    document.body.appendChild(sheet);
    warm();
  }

  function draw(body) { body.textContent = ""; (st.tab === "teacher" ? drawTeacher : st.tab === "translate" ? drawTranslate : drawTutor)(body); }

  function drawTeacher(body) {
    var ctx = lesson();
    if (!ctx) { body.appendChild(el("p", "hint", "O'qituvchi bilan birga o'rganish uchun biror darsni oching.")); return; }
    var key = "d" + ctx.dayNum, chat = st.lessons[key] || (st.lessons[key] = []);
    var box = el("div", "chat"); box.setAttribute("aria-live", "polite");
    var row = el("div", "row"), input = el("input"); input.type = "text"; input.maxLength = 500; input.placeholder = "Javobingizni yozing"; input.setAttribute("aria-label", "Javobingizni yozing");
    var send = el("button", "go", "Yuborish"); send.type = "button";
    var start = el("button", "go big", "Darsni boshlash"); start.type = "button";
    var reset = el("button", "link", "Qaytadan boshlash"); reset.type = "button";
    function paint() {
      box.textContent = "";
      var shown = chat.filter(function (m) { return !m.hidden; });
      if (!shown.length) box.appendChild(el("p", "hint", "\"Boshlash\"ni bosing — o'qituvchingiz bugungi darsni boshlaydi."));
      shown.forEach(function (m) { box.appendChild(el("div", "m " + (m.role === "user" ? "u" : "a"), m.content)); });
      start.hidden = chat.length > 0; row.hidden = chat.length === 0; reset.hidden = chat.length === 0;
      box.scrollTop = box.scrollHeight;
    }
    function turn(text, hidden) {
      if (st.busy) return;
      chat.push({ role: "user", content: text, hidden: !!hidden }); st.busy = true; send.disabled = start.disabled = true; paint();
      box.appendChild(el("div", "m a", "O'ylayapman…")); box.scrollTop = box.scrollHeight;
      ask({ mode: "lesson", lesson: ctx, messages: chat.slice(-16).map(function (m) { return { role: m.role, content: m.content }; }) })
        .then(function (r) { chat.push({ role: "assistant", content: r }); })
        .catch(function (e) { chat.push({ role: "assistant", content: why(e) }); })
        .then(function () { st.busy = false; send.disabled = start.disabled = false; paint(); input.focus(); });
    }
    start.addEventListener("click", function () { turn("Men tayyorman. Darsni boshlang.", true); });
    send.addEventListener("click", function () { var t = input.value.trim(); if (t) { input.value = ""; turn(t, false); } });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send.click(); } });
    reset.addEventListener("click", function () { if (st.busy) return; chat.length = 0; paint(); });
    row.appendChild(input); row.appendChild(send);
    body.appendChild(box); body.appendChild(start); body.appendChild(row); body.appendChild(reset); paint();
    setTimeout(function () { (chat.length ? input : start).focus(); }, 50);
  }

  function drawTranslate(body) {
    var ta = el("textarea"); ta.rows = 3; ta.maxLength = 400; ta.placeholder = "So'z yoki gapni yozing"; ta.setAttribute("aria-label", "So'z yoki gapni yozing");
    var go = el("button", "go", "Tarjima qilish"); go.type = "button";
    var out = el("div", "out"); out.setAttribute("aria-live", "polite");
    go.addEventListener("click", function () {
      var text = ta.value.trim(); if (!text || st.busy) return;
      st.busy = true; go.disabled = true; out.className = "out"; out.textContent = "O'ylayapman…";
      ask({ mode: "translate", text: text }).then(function (r) { out.textContent = r; })
        .catch(function (e) { out.className = "out err"; out.textContent = why(e); })
        .then(function () { st.busy = false; go.disabled = false; });
    });
    body.appendChild(ta); body.appendChild(go); body.appendChild(out); setTimeout(function () { ta.focus(); }, 50);
  }

  function drawTutor(body) {
    var chat = el("div", "chat"); chat.setAttribute("aria-live", "polite");
    function paint() {
      chat.textContent = "";
      if (!st.chat.length) chat.appendChild(el("p", "hint", "Repetitoringizga o'zbekcha yozing — u koreyscha o'rgatadi. Xato qilish mumkin."));
      st.chat.forEach(function (m) { chat.appendChild(el("div", "m " + (m.role === "user" ? "u" : "a"), m.content)); });
      chat.scrollTop = chat.scrollHeight;
    }
    var row = el("div", "row"), input = el("input"); input.type = "text"; input.maxLength = 500; input.placeholder = "Xabaringiz"; input.setAttribute("aria-label", "Xabaringiz");
    var send = el("button", "go", "Yuborish"); send.type = "button";
    function submit() {
      var text = input.value.trim(); if (!text || st.busy) return;
      st.chat.push({ role: "user", content: text }); input.value = ""; st.busy = true; send.disabled = true;
      paint(); var wait = el("div", "m a", "O'ylayapman…"); chat.appendChild(wait); chat.scrollTop = chat.scrollHeight;
      ask({ mode: "tutor", messages: st.chat.slice(-10), context: lessonContext() })
        .then(function (r) { st.chat.push({ role: "assistant", content: r }); })
        .catch(function (e) { st.chat.push({ role: "assistant", content: why(e) }); })
        .then(function () { st.busy = false; send.disabled = false; paint(); input.focus(); });
    }
    send.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    row.appendChild(input); row.appendChild(send); body.appendChild(chat); body.appendChild(row); paint(); setTimeout(function () { input.focus(); }, 50);
  }

  // ---------- The Teacher: a spoken conversation (text + mic, device voice) ----------
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function progress() { try { return window.KT_progressContext ? window.KT_progressContext() : null; } catch (e) { return null; } }

  function pickVoice() {
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    var ko = vs.filter(function (v) { return /^ko/i.test(v.lang); });
    return ko[0] || null;
  }
  function stopSpeaking() { talk.speaking = false; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
  function stopListening() { if (talk.rec) { try { talk.rec.abort(); } catch (e) {} talk.rec = null; } talk.listening = false; }

  function openTextTalk() {
    if (talk.el && talk.el.isConnected) return;
    var micOk = !!SR;
    var root = el("div"); root.id = "ktTalk"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Sizning koreys tili o'qituvchingiz"); talk.el = root;
    var top = el("div", "tk-top"), av = el("div", "tk-av", "👩‍🏫"), who = el("div", "tk-who"), status = el("span", "tk-st", "");
    who.appendChild(el("b", null, "Sizning koreys tili o'qituvchingiz")); who.appendChild(status);
    var x = el("button", "tk-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Yopish");
    top.appendChild(av); top.appendChild(who); top.appendChild(x);
    var chat = el("div", "tk-chat"); chat.setAttribute("aria-live", "polite");
    var bot = el("div", "tk-bot"), row = el("div", "tk-in");
    var mic = el("button", "tk-mic", "🎤"); mic.type = "button"; mic.setAttribute("aria-label", "Gapirish uchun bosing"); if (!micOk) mic.disabled = true;
    var input = el("input"); input.type = "text"; input.maxLength = 500; input.placeholder = "Javobingizni yozing"; input.setAttribute("aria-label", "Javobingizni yozing");
    var send = el("button", "tk-send", "Yuborish"); send.type = "button";
    row.appendChild(mic); row.appendChild(input); row.appendChild(send);
    var opt = el("div", "tk-opt");
    var l1 = el("label"), c1 = el("input"); c1.type = "checkbox"; c1.checked = talk.voice; l1.appendChild(c1); l1.appendChild(document.createTextNode("O'qituvchi ovozi"));
    var l2 = el("label"), c2 = el("input"); c2.type = "checkbox"; c2.checked = talk.auto && micOk; c2.disabled = !micOk; l2.appendChild(c2); l2.appendChild(document.createTextNode("Avtomatik tinglash"));
    var again = el("button", null, "Qaytadan boshlash"); again.type = "button";
    opt.appendChild(l1); opt.appendChild(l2); opt.appendChild(again);
    bot.appendChild(row); bot.appendChild(opt);
    root.appendChild(top); root.appendChild(chat); root.appendChild(bot); document.body.appendChild(root);

    var live = null;
    function setStatus() {
      status.textContent = talk.busy ? "O'ylayapti…" : talk.speaking ? "Gapiryapti…" : talk.listening ? "Tinglayapti…" : (talk.micBlocked ? "Mikrofon mavjud emas. Iltimos, javobingizni yozing." : "");
      mic.className = "tk-mic" + (talk.listening ? " on" : "");
    }
    function paint() {
      chat.textContent = "";
      if (!talk.chat.length) chat.appendChild(el("p", "hint", "O'qituvchingiz tayyorlanmoqda…"));
      talk.chat.forEach(function (m) {
        if (m.hidden) return;
        if (m.role === "user") { chat.appendChild(el("div", "tk-m s", m.content)); return; }
        var b = el("div", "tk-m t"); b.appendChild(el("div", "say", m.content)); if (m.note) b.appendChild(el("div", "nt", m.note));
        if (m.ko) {
          var line = el("div", "ko"), word = el("span", null, m.ko), spk = el("button", "link", "🔊"); spk.type = "button"; spk.setAttribute("aria-label", "Ijro etish");
          spk.addEventListener("click", function () { say(m.ko, function () {}); });
          line.appendChild(word); line.appendChild(spk); b.appendChild(line);
        }
        chat.appendChild(b);
      });
      if (live) chat.appendChild(live);
      chat.scrollTop = chat.scrollHeight; setStatus();
    }
    function say(text, done) {
      if (!text || !talk.voice || !window.speechSynthesis) return done();
      stopSpeaking(); var u = new SpeechSynthesisUtterance(text), v = pickVoice(), fin = false, started = false;
      u.lang = "ko-KR"; u.rate = 0.92; if (v) u.voice = v;
      function end() { if (fin) return; fin = true; clearTimeout(wd); clearTimeout(cap); talk.speaking = false; setStatus(); done(); }
      var wd = setTimeout(function () { if (!started) end(); }, 3000);
      var cap = setTimeout(end, 15000);
      u.onstart = function () { started = true; talk.speaking = true; setStatus(); };
      u.onend = end; u.onerror = end;
      try { speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) { end(); }
    }
    function listen() {
      if (!SR || talk.busy || talk.listening || !root.isConnected) return;
      stopSpeaking(); var rec = new SR(), got = false; talk.rec = rec;
      var lastT = talk.chat.filter(function (m) { return m.role === "assistant"; }).slice(-1)[0];
      rec.lang = lastT && lastT.ko ? "ko-KR" : "uz-UZ";
      rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onstart = function () { talk.listening = true; setStatus(); };
      rec.onresult = function (ev) {
        var txt = "", fin = false;
        for (var i = ev.resultIndex; i < ev.results.length; i++) { txt += ev.results[i][0].transcript; if (ev.results[i].isFinal) fin = true; }
        if (!live) { live = el("div", "tk-live"); }
        live.textContent = "“" + txt + "”"; paint();
        if (fin && txt.trim()) { got = true; live = null; turn(txt.trim(), false); }
      };
      rec.onerror = function (e) { if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) { talk.micBlocked = true; mic.disabled = true; } };
      rec.onend = function () { talk.listening = false; talk.rec = null; if (live && !got) { live = null; } paint(); };
      try { rec.start(); } catch (e) { talk.listening = false; }
    }
    function turn(text, hidden) {
      if (talk.busy) return;
      stopListening(); stopSpeaking(); var gen = talk.gen;
      talk.chat.push({ role: "user", content: text, hidden: !!hidden }); talk.busy = true; send.disabled = true; paint();
      askRaw({ mode: "talk", context: progress(), messages: talk.chat.slice(-16).map(function (m) { return { role: m.role, content: m.ko ? m.content + " [" + m.ko + "]" : m.content }; }) })
        .then(function (j) {
          if (gen !== talk.gen) return;
          talk.chat.push({ role: "assistant", content: j.say || j.reply, ko: j.ko || "", note: j.note || "" }); talk.busy = false; send.disabled = false; paint();
          say(j.ko || "", function () { if (talk.auto && SR && !talk.micBlocked && root.isConnected && ++talk.autoRun <= 10) listen(); });
        })
        .catch(function (e) { if (gen !== talk.gen) return; talk.chat.push({ role: "assistant", content: why(e), note: "" }); talk.busy = false; send.disabled = false; paint(); });
    }
    function begin() { talk.gen++; talk.chat = []; talk.busy = false; talk.autoRun = 0; turn("Men tayyorman. Boshlang.", true); }
    function close() { talk.gen++; talk.busy = false; stopListening(); stopSpeaking(); root.remove(); talk.el = null; }

    x.addEventListener("click", close);
    mic.addEventListener("click", function () { talk.autoRun = 0; if (talk.listening) stopListening(); else { stopSpeaking(); listen(); } paint(); });
    send.addEventListener("click", function () { var t = input.value.trim(); if (t) { input.value = ""; talk.autoRun = 0; turn(t, false); } });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send.click(); } });
    c1.addEventListener("change", function () { talk.voice = c1.checked; if (!talk.voice) stopSpeaking(); });
    c2.addEventListener("change", function () { talk.auto = c2.checked; });
    again.addEventListener("click", function () { stopListening(); stopSpeaking(); begin(); });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    paint(); if (talk.chat.length) { paint(); } else begin();
    setTimeout(function () { input.focus(); }, 80);
  }

  // ---------- The Teacher as a live voice call (ElevenLabs agent) ----------
  var SDK_URL = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.32.1/dist/lib.iife.js";
  var SDK_HASH = "sha384-/H9FO+W4/iXm0jrbV5RolrnHPc/xL0qgBQelFSw1mwGLju6BDADE48C9U/Un+PAP";
  var AGENT_ENDPOINT = "/api/agent";
  var voice = { el: null, conv: null, gen: 0 };

  function loadSDK() {
    if (window.KTAgentSDK) return Promise.resolve(window.KTAgentSDK);
    if (window.ElevenLabsClient) return Promise.resolve(window.ElevenLabsClient);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = SDK_URL; s.integrity = SDK_HASH; s.crossOrigin = "anonymous";
      s.onload = function () { window.ElevenLabsClient ? resolve(window.ElevenLabsClient) : reject(new Error("sdk")); };
      s.onerror = function () { reject(new Error("sdk")); };
      document.head.appendChild(s);
    });
  }
  function agentVariables() {
    var p = progress() || {}, u = user() || {};
    return {
      student_name: (String(u.name || "").trim().split(/\s+/)[0] || "do'stim").slice(0, 30),
      course: p.course || "Koreys tili", lessons_done: String(p.done || 0), next_lesson: p.next || "birinchi dars",
      recent_words: (p.words || []).slice(0, 8).map(function (w) { return w[0]; }).join(", ") || "hali yo'q",
    };
  }

  function openVoiceTeacher() {
    if (voice.el && voice.el.isConnected) return;
    var root = el("div"); root.id = "ktTalk"; root.className = "vt"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Sizning koreys tili o'qituvchingiz"); voice.el = root;
    var top = el("div", "tk-top"), who = el("div", "tk-who");
    who.appendChild(el("b", null, "Sizning koreys tili o'qituvchingiz"));
    var x = el("button", "tk-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Yopish");
    top.appendChild(who); top.appendChild(x);
    var stage = el("div", "vt-stage"), orb = el("div", "kt-orb big"), status = el("div", "vt-status", ""), clock = el("div", "vt-clock", "");
    orb.appendChild(el("i")); orb.appendChild(el("i")); orb.appendChild(el("b"));
    stage.appendChild(orb); stage.appendChild(status); stage.appendChild(clock);
    var chat = el("div", "tk-chat"); chat.setAttribute("aria-live", "polite");
    var bot = el("div", "tk-bot"), row = el("div", "tk-in");
    var start = el("button", "tk-send", "Suhbatni boshlash"); start.type = "button"; start.style.flex = "1";
    var mute = el("button", "tk-send", "🎤"); mute.type = "button"; mute.hidden = true; mute.setAttribute("aria-label", "Mikrofonni o'chirish");
    var end = el("button", "tk-send", "Suhbatni tugatish"); end.type = "button"; end.hidden = true; end.style.flex = "1";
    row.appendChild(start); row.appendChild(mute); row.appendChild(end);
    var hint = el("div", "tk-opt"); hint.appendChild(el("span", null, "Mikrofonga ruxsat bering, so'ng o'qituvchingiz bilan telefon qilgandek gaplashing."));
    var textLink = el("button", null, "Matnli o'qituvchidan foydalanish"); textLink.type = "button"; hint.appendChild(textLink);
    bot.appendChild(row); bot.appendChild(hint);
    root.appendChild(top); root.appendChild(stage); root.appendChild(chat); root.appendChild(bot); document.body.appendChild(root);

    var timer = null, left = 0, muted = false, raf = 0, level = 0, state = "idle";
    function setState(name, label) { state = name; orb.className = "kt-orb big " + name; status.textContent = label || ""; }
    function loop() {
      var c = voice.conv, target = 0;
      if (c) { try { target = state === "speaking" ? c.getOutputVolume() : state === "listening" && !muted ? c.getInputVolume() : 0; } catch (e) {} }
      level += ((target || 0) - level) * 0.35;
      orb.style.setProperty("--lvl", Math.min(1, level * 1.7).toFixed(3));
      raf = requestAnimationFrame(loop);
    }
    function stopLoop() { cancelAnimationFrame(raf); raf = 0; level = 0; orb.style.setProperty("--lvl", "0"); }
    function note(text, cls) { chat.appendChild(el("div", cls || "hint", text)); chat.scrollTop = chat.scrollHeight; }
    function show(active) { start.hidden = active; mute.hidden = !active; end.hidden = !active; }
    function tick() { left = Math.max(0, left - 1); clock.textContent = left ? Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") : ""; }
    function stopTimer() { clearInterval(timer); timer = null; clock.textContent = ""; }
    function addMessage(m) {
      var mine = m && (m.role === "user" || m.source === "user"), text = String((m && m.message) || "").trim();
      if (!text) return;
      var b = el("div", mine ? "tk-m s" : "tk-m t");
      b.appendChild(el("small", null, mine ? "Siz" : "O'qituvchi"));
      if (mine) b.appendChild(el("div", null, text));
      else {
        b.appendChild(el("div", "say", text));
        if (configured) {
          var tr = el("button", "link", "Tarjima"); tr.type = "button";
          tr.addEventListener("click", function () {
            tr.disabled = true; tr.textContent = "O'ylayapman…";
            ask({ mode: "translate", text: text }).then(function (r) { tr.replaceWith(el("div", "nt", r)); })
              .catch(function (e) { tr.replaceWith(el("div", "nt", why(e))); });
          });
          b.appendChild(tr);
        }
      }
      chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
    }
    function ended() { stopTimer(); stopLoop(); voice.conv = null; muted = false; mute.textContent = "🎤"; show(false); start.textContent = "Yana gaplashish"; start.disabled = false; setState("idle", ""); }
    function fail(e) {
      ended();
      var denied = e && (e.name === "NotAllowedError" || /permission|denied|NotAllowed/i.test(String(e.message || "")));
      note(denied ? "O'qituvchingiz bilan gaplashish uchun mikrofonga ruxsat bering." : why(e), "tk-m t");
    }
    function begin() {
      var gen = ++voice.gen; start.disabled = true; setState("connecting", "Ulanmoqda…");
      try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) new AC().resume(); } catch (e) {}
      token().then(function (tk) {
        return fetch(AGENT_ENDPOINT, { method: "POST", headers: { authorization: "Bearer " + tk } });
      }).then(function (res) {
        if (res.ok) return res.json();
        return res.json().catch(function () { return {}; }).then(function (j) { var e = new Error("http"); e.status = res.status; e.code = j.error; throw e; });
      }).then(function (link) {
        return loadSDK().then(function (sdk) {
          if (gen !== voice.gen) return null;
          return sdk.Conversation.startSession({
            signedUrl: link.signedUrl, dynamicVariables: agentVariables(),
            onMessage: addMessage,
            onModeChange: function (m) { setState((m && m.mode) === "speaking" ? "speaking" : "listening", (m && m.mode) === "speaking" ? "Gapiryapti…" : "Tinglayapti…"); },
            onDisconnect: function () { if (gen === voice.gen && voice.conv) ended(); },
            onError: function () { if (gen === voice.gen && voice.conv) { note("Yordamchi hozir band. Bir daqiqadan so'ng qayta urinib ko'ring.", "tk-m t"); } },
          }).then(function (conv) {
            if (gen !== voice.gen) { try { conv.endSession(); } catch (e) {} return; }
            voice.conv = conv; show(true); setState("listening", "Tinglayapti…"); left = link.maxSeconds || 1800; stopTimer(); timer = setInterval(tick, 1000); tick();
            if (!raf) loop();
          });
        });
      }).catch(function (e) { if (gen === voice.gen) fail(e); });
    }
    function hangUp() { var c = voice.conv; voice.gen++; voice.conv = null; stopTimer(); stopLoop(); if (c) { try { c.endSession(); } catch (e) {} } }
    function close() { hangUp(); root.remove(); voice.el = null; }

    start.addEventListener("click", begin);
    end.addEventListener("click", function () { hangUp(); ended(); note("Suhbat tugadi.", "hint"); });
    mute.addEventListener("click", function () { if (!voice.conv) return; muted = !muted; try { voice.conv.setMicMuted(muted); } catch (e) {} mute.textContent = muted ? "🔇" : "🎤"; mute.setAttribute("aria-label", muted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"); });
    textLink.addEventListener("click", function () { close(); openTextTalk(); });
    x.addEventListener("click", close);
    root.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    setState("idle", "");
    loadSDK().catch(function () {});
    setTimeout(function () { start.focus(); }, 80);
  }

  function openTalk() { if (agentReady) openVoiceTeacher(); else openTextTalk(); }

  var dockSpoken = {};
  var dockSound = (function () { try { return localStorage.getItem("kt_dock_sound") !== "off"; } catch (e) { return true; } })();
  function ensureCard() {
    var app = document.getElementById("app");
    var head = app && app.querySelector(".lesson-head");
    var ctx = head ? lesson() : null;
    var present = !!(ctx && window.KTTeach && window.KTTeach.available({ dayNum: ctx.dayNum }));
    var existing = document.getElementById("teacherDock");
    if (!ctx || !(present || configured)) { if (existing && !head) existing.remove(); return; }
    var key = "d" + ctx.dayNum, mode = present ? "present" : "chat";
    if (existing && existing.dataset.mode === mode && existing.dataset.key === key) return;
    if (existing) existing.remove();
    var dock = el("div"); dock.id = "teacherDock"; dock.dataset.mode = mode; dock.dataset.key = key;
    var orb = el("div", "kt-orb"); orb.appendChild(el("i")); orb.appendChild(el("i")); orb.appendChild(el("b"));
    var tx = el("div", "dk-t");
    tx.appendChild(el("b", null, present ? "O'qituvchingiz bu darsni tushuntirib beradi" : "Bu darsni o'qituvchingiz bilan o'rganing"));
    tx.appendChild(el("span", null, present ? "Darsni istalgan vaqtda o'zingiz ham qilishingiz mumkin." : "AI o'qituvchingiz so'zlarni tushuntiradi, suhbatni siz bilan mashq qiladi va javoblaringizni tekshiradi."));
    var go = el("button", "dk-go", "Darsni boshlash"); go.type = "button";
    go.addEventListener("click", function () { if (present) window.KTTeach.open({ dayNum: ctx.dayNum }); else open("teacher"); });
    dock.appendChild(orb); dock.appendChild(tx); dock.appendChild(go);
    if (configured || agentReady) {
      var ask1 = el("button", "dk-ic", "🎤"); ask1.type = "button"; ask1.setAttribute("aria-label", "O'qituvchidan so'rash"); ask1.addEventListener("click", function () { openTalk(); });
      dock.appendChild(ask1);
    }
    if (present) {
      var snd = el("button", "dk-ic", dockSound ? "🔊" : "🔇"); snd.type = "button"; snd.setAttribute("aria-label", dockSound ? "Ovoz yoqilgan" : "Ovoz o'chirilgan");
      snd.addEventListener("click", function () {
        dockSound = !dockSound; try { localStorage.setItem("kt_dock_sound", dockSound ? "on" : "off"); } catch (e) {}
        snd.textContent = dockSound ? "🔊" : "🔇"; snd.setAttribute("aria-label", dockSound ? "Ovoz yoqilgan" : "Ovoz o'chirilgan");
        if (!dockSound && window.KTVoice) window.KTVoice.stop();
      });
      dock.appendChild(snd);
    }
    app.insertBefore(dock, app.firstChild);
    var line = present && window.KTTeachScript && window.KTTeachScript.dockLine;
    if (line && dockSound && !dockSpoken[key] && window.KTVoice && window.KTVoice.usable()) {
      dockSpoken[key] = true;
      setTimeout(function () {
        if (!dock.isConnected) return;
        orb.classList.add("speaking");
        window.KTVoice.play(line, { lang: "uz", rate: 1, stale: function () { return !dock.isConnected; } }).then(function () { orb.classList.remove("speaking"); }, function () { orb.classList.remove("speaking"); });
      }, 500);
    }
  }
  function watchLessons() {
    var app = document.getElementById("app");
    if (app && window.MutationObserver) new MutationObserver(ensureCard).observe(app, { childList: true });
  }

  function refresh() {
    ensureCard();
    var show = configured;
    var menu = configured || agentReady;
    if (menu !== !!shown) { shown = menu; try { window.dispatchEvent(new Event("kt-helper-ready")); } catch (e) {} }
    if (show && !btn) {
      btn = el("button"); btn.id = "ktHelperBtn"; btn.type = "button"; btn.textContent = "💬"; btn.setAttribute("aria-label", "Yordamchidan so'rash");
      btn.addEventListener("click", function () { open(); }); document.body.appendChild(btn);
    } else if (!show && btn) { btn.remove(); btn = null; if (sheet) close(); }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet) close(); });

  var style = el("style"); style.textContent = css; document.head.appendChild(style);
  window.KTHelper = { open: open, openTalk: openTalk, available: function () { return configured || agentReady; } };
  watchLessons();
  fetch("/api/agent?health=1").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { agentReady = !!(j && j.configured); refresh(); }).catch(function () {});
  fetch(ENDPOINT + "?health=1").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { configured = !!(j && j.configured); refresh(); }).catch(function () {});
  setInterval(refresh, 1500);
})();
