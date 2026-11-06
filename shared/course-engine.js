/* Korean Talk — course engine. Shared by both courses (Student's Book / Workbook); each course's own tiny bootstrap
 * script sets window.KT_CONFIG = { ns, title, brand } BEFORE this file loads, and provides the page's own
 * CURRICULUM / GRAMMAR globals (curriculum.js / grammar.js). Interface is Uzbek only — no language switcher.
 * Target language is Korean; the only two languages ever spoken by the app are Korean and Uzbek — never English.
 *
 * Levels: every unit has a "lvl" of "1A" or "1B". Units unlock strictly in curriculum order — a unit opens only once
 * the one before it (in CURRICULUM order) is completed, Day 1 is always open. Because every 1A unit precedes every
 * 1B unit in that array, this alone enforces "1B is only visible after finishing 1A" with no special-case code.
 * The last unit of each level is a review day (rev:true); the very last entry of the whole course is the final test
 * (final:true), whose question bank is built from every single lesson of the course (see buildFinalTestQuestions). */
(function(){
"use strict";

const CFG = window.KT_CONFIG || { ns: "kt", title: "Koreys tili", brand: "Korean Talk" };
const NS = CFG.ns;

const STORE_KEY = NS + "_progress_v1";
const SETTINGS_KEY = NS + "_settings_v1";
const QUIZ_KEY = NS + "_quizstate_v1";
const GRAMMAR_QUIZ_KEY = NS + "_grammarquiz_v1";
const HW_QUIZ_KEY = NS + "_hwquiz_v1";

function loadJSON(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch(e){ return fallback; }
}
function saveJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

let state = {
  progress: Object.assign({ completed:{}, grammarDone:{}, homeworkDone:{}, roleplay:{}, xp:0, streak:0, lastDate:null, name:"", courseFinished:null }, loadJSON(STORE_KEY, {})),
  settings: Object.assign({ showUz:true, rate:0.92, theme:"system" }, loadJSON(SETTINGS_KEY, {})),
  currentDay: null,
  currentTab: "vocab",
  currentUnit: null,
  quizState: {},
  grammarQuizState: {},
  flippedCards: {},
};

function todayStr(){ return new Date().toISOString().slice(0,10); }
function dow(dateStr){ return new Date(dateStr + "T00:00:00").getDay(); }   // 0 = Sunday

function saveProgress(){
  saveJSON(STORE_KEY, state.progress);
  if (window.KT_syncProgress){
    clearTimeout(saveProgress._t);
    saveProgress._t = setTimeout(() => window.KT_syncProgress(state.progress), 1200);
  }
}
function saveSettings(){ saveJSON(SETTINGS_KEY, state.settings); }

function applyTheme(theme){
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    if (!m.dataset.orig) m.dataset.orig = m.getAttribute("content");
    m.setAttribute("content", theme === "light" ? "#1A3D63" : theme === "dark" ? "#0D2140" : m.dataset.orig);
  });
}

function dayByNum(n){ return CURRICULUM.find(d => d.d === n); }
function levelDays(lvl){ return CURRICULUM.filter(d => d.lvl === lvl); }
const LEVELS = [...new Set(CURRICULUM.map(d => d.lvl))];

function isUnlocked(dayNum){
  const idx = CURRICULUM.findIndex(d => d.d === dayNum);
  if (idx <= 0) return true;
  const prev = CURRICULUM[idx - 1];
  return isCompleted(prev.d);
}
function isCompleted(dayNum){ return !!state.progress.completed[dayNum]; }
function completedCount(){ return Object.keys(state.progress.completed).length; }

function levelProgress(lvl){
  const days = levelDays(lvl);
  const done = days.filter(d => isCompleted(d.d)).length;
  return { done, total: days.length };
}
function levelComplete(lvl){ const p = levelProgress(lvl); return p.total > 0 && p.done === p.total; }

// ---------- Sunday is a built-in rest day: it never breaks the streak ----------
function prevStreakDate(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 1);   // skip back over Sunday
  return d.toISOString().slice(0, 10);
}

function markComplete(dayNum, score){
  const wasCompleted = isCompleted(dayNum);
  state.progress.completed[dayNum] = { date: todayStr(), score: score };
  if (!wasCompleted){
    state.progress.xp += 100 + (score || 0) * 5;
    const last = state.progress.lastDate, today = todayStr();
    if (last !== today){
      const expected = prevStreakDate(today);
      if (last === expected) state.progress.streak += 1;
      else state.progress.streak = 1;
      state.progress.lastDate = today;
    }
  }
  saveProgress();
}

function grammarUnitById(id){ return (typeof GRAMMAR !== "undefined" ? GRAMMAR : []).find(u => u.id === id); }
function isGrammarDone(id){ return !!state.progress.grammarDone[id]; }
function grammarDoneCount(){ return Object.keys(state.progress.grammarDone).length; }
function markGrammarComplete(id, score){
  const wasDone = isGrammarDone(id);
  state.progress.grammarDone[id] = { date: todayStr(), score: score };
  if (!wasDone) state.progress.xp += 60 + (score || 0) * 3;
  saveProgress();
}

// ---------- Speech: text-to-speech (Korean only; the UI itself is read, not spoken) ----------
let voices = [];
const liveUtterances = new Set();
let speechToken = 0;
let voiceFailToasted = false;

function loadVoices(){
  if (!window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().indexOf("ko") === 0);
}
if (window.speechSynthesis){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => { loadVoices(); if (state.view === "settings") render(); };
  let voicePolls = 0;
  const voicePoll = setInterval(() => { if (voices.length || ++voicePolls > 20) return clearInterval(voicePoll); loadVoices(); }, 250);
}
function mainVoice(){ return { voice: voices[0] || null, pitch: 1 }; }
function partnerVoice(){ return { voice: voices[1] || voices[0] || null, pitch: voices[1] ? 1 : 0.85 }; }
function ttsSupported(){ return !!window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined"; }

const CANCEL_SETTLE_MS = 80;
let lastCancelAt = 0;
function markCancelled(){ lastCancelAt = Date.now(); }
function stopSpeaking(){
  speechToken++;
  if (window.KTVoice) window.KTVoice.stop();
  if (window.speechSynthesis){ try{ window.speechSynthesis.cancel(); }catch(e){} markCancelled(); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden) stopSpeaking(); });
window.addEventListener("pagehide", stopSpeaking);

function speakBrowser(text, opts){
  opts = opts || {};
  return new Promise(resolve => {
    if (!ttsSupported()){ if (!opts.quiet) toast("Bu brauzerda ovoz qo'llab-quvvatlanmaydi."); return resolve(false); }
    const synth = window.speechSynthesis;
    const myToken = opts.token != null ? opts.token : speechToken;
    const mv = mainVoice();
    const pitch = opts.pitch != null ? opts.pitch : mv.pitch;
    let done = false, started = false, attempts = 0, watchdog = null, current = null;
    const finish = (ok) => { if (done) return; done = true; clearTimeout(watchdog); if (current) liveUtterances.delete(current); resolve(ok); };
    const attempt = (useVoice) => {
      attempts++;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = opts.rate || state.settings.rate || 0.92;
      u.pitch = pitch; u.volume = 1;
      if (useVoice){ u.voice = useVoice; u.lang = useVoice.lang || "ko-KR"; }
      current = u; liveUtterances.add(u);
      u.onstart = () => { if (u !== current) return; started = true; if (opts.onstart) opts.onstart(); };
      u.onend = () => { if (u === current) finish(true); };
      u.onerror = (e) => { if (done || u !== current) return; if (e && (e.error === "canceled" || e.error === "interrupted")) return finish(false); retry(); };
      try{ synth.resume(); }catch(e){}
      synth.speak(u);
      clearTimeout(watchdog);
      watchdog = setTimeout(() => { if (!started && !done) retry(); }, attempts === 1 ? 1500 : 2200);
    };
    const retry = () => {
      if (done) return;
      if (myToken !== speechToken) return finish(false);
      if (attempts >= 3){
        if (!voiceFailToasted && !opts.quiet){ voiceFailToasted = true; toast("Ovozni ijro etib bo'lmadi. Ovoz balandligini tekshiring."); }
        return finish(false);
      }
      if (current){ liveUtterances.delete(current); current = null; }
      try{ synth.cancel(); }catch(e){}
      markCancelled();
      setTimeout(() => { if (!done && myToken === speechToken) attempt(attempts === 1 ? (opts.voice || mv.voice) : null); }, 120);
    };
    if (opts.token == null || myToken === speechToken){
      if (synth.speaking || synth.pending){ try{ synth.cancel(); }catch(e){} markCancelled(); }
      const goFirst = () => attempt(opts.voice || mv.voice);
      const wait = CANCEL_SETTLE_MS - (Date.now() - lastCancelAt);
      if (wait > 0) setTimeout(() => { if (!done && myToken === speechToken) goFirst(); }, wait);
      else goFirst();
    } else finish(false);
  });
}

function speakOnce(text, opts){
  opts = opts || {};
  const myToken = opts.token != null ? opts.token : speechToken;
  const V = window.KTVoice;
  if (!V || !V.usable()) return speakBrowser(text, opts);
  if (opts.token != null && myToken !== speechToken) return Promise.resolve(false);
  return V.play(text, { gender: opts.gender || "female", lang: "ko", rate: opts.rate || state.settings.rate || 0.92, stale: () => myToken !== speechToken, onstart: opts.onstart })
    .then(r => { if (r === "played") return true; if (r === "stale" || myToken !== speechToken) return false; return speakBrowser(text, Object.assign({}, opts, { token: myToken })); });
}
function speak(text){ stopSpeaking(); return speakOnce(text, { token: speechToken }); }
function speakQueue(items, opts){
  opts = opts || {};
  stopSpeaking();
  const token = speechToken;
  (async () => {
    for (let i = 0; i < items.length; i++){
      if (token !== speechToken) return;
      if (opts.onItem) opts.onItem(i);
      const it = typeof items[i] === "string" ? { text: items[i] } : items[i];
      if (window.KTVoice) for (let j = i + 1; j <= i + 2 && j < items.length; j++){ const nx = typeof items[j] === "string" ? { text: items[j] } : items[j]; window.KTVoice.prefetch(nx.text, nx.gender || "female", "ko"); }
      const ok = await speakOnce(it.text, { token, quiet: i > 0, voice: it.voice, pitch: it.pitch, gender: it.gender });
      if (token !== speechToken) return;
      if (!ok && i === 0) return;
    }
    if (token === speechToken && opts.onDone) opts.onDone();
  })();
  return { stop: () => { if (token === speechToken) stopSpeaking(); } };
}

// ---------- Speech: recognition + scoring (Korean) ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRec = null;
function speechSupported(){ return !!SR; }
function stopListening(){ if (activeRec){ try{ activeRec.abort(); }catch(e){} activeRec = null; } }

// Simple whitespace/punctuation tokenisation (Korean has no contractions to expand).
function normalizeWords(text){
  return String(text || "").trim().split(/\s+/).map(w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
}
function editDistance(a, b){
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++){
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function wordsMatch(a, b){
  if (a === b) return true;
  const len = Math.min(a.length, b.length);
  if (len >= 4) return editDistance(a, b) <= 1;
  return false;
}
function scoreSpeech(target, heard){
  const displayWords = String(target).split(/\s+/).filter(Boolean);
  const flat = [];
  displayWords.forEach((dw, i) => normalizeWords(dw).forEach(w => flat.push({ w, owner: i })));
  const h = normalizeWords(heard);
  const n = flat.length, m = h.length;
  const marks = displayWords.map(word => ({ word, ok: false, has: false }));
  if (!n || !m) return { score: 0, marks: marks.map(k => ({ word: k.word, ok: !n })) };
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i][j] = wordsMatch(flat[i-1].w, h[j-1]) ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const hit = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0){
    if (wordsMatch(flat[i-1].w, h[j-1]) && dp[i][j] === dp[i-1][j-1] + 1){ hit[i-1] = true; i--; j--; }
    else if (dp[i-1][j] >= dp[i][j-1]) i--; else j--;
  }
  const matched = dp[n][m];
  flat.forEach((f, idx) => { marks[f.owner].has = true; if (hit[idx]) marks[f.owner].hits = (marks[f.owner].hits || 0) + 1; marks[f.owner].total = (marks[f.owner].total || 0) + 1; });
  const extra = Math.max(0, m - n);
  const score = Math.max(0, Math.min(100, Math.round((matched / (n + extra * 0.5)) * 100)));
  return { score, marks: marks.map(k => ({ word: k.word, ok: !k.has || k.hits === k.total })) };
}
function similarity(heard, target){ return scoreSpeech(target, heard).score; }

async function ensureMic(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { ok: speechSupported(), reason: "unsupported" };
  try{ const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(t => t.stop()); return { ok: true }; }
  catch(err){ const name = err && err.name;
    if (name === "NotAllowedError" || name === "SecurityError") return { ok: false, reason: "denied" };
    if (name === "NotFoundError") return { ok: false, reason: "nomic" };
    return { ok: false, reason: "error" };
  }
}
function listenOnce(cb){
  stopListening();
  let rec;
  try{ rec = new SR(); }catch(e){ cb.onDone({ error: "unsupported" }); return null; }
  rec.lang = "ko-KR"; rec.interimResults = true; rec.maxAlternatives = 3; rec.continuous = false;
  let alts = null, err = null, finished = false;
  rec.onresult = (event) => {
    const res = event.results[event.results.length - 1];
    if (res.isFinal){ alts = Array.from(res).map(a => a.transcript); }
    else if (cb.onInterim) cb.onInterim(res[0].transcript);
  };
  rec.onerror = (event) => { err = event.error || "error"; };
  rec.onend = () => { if (finished) return; finished = true; if (activeRec === rec) activeRec = null; if (alts && alts.length) cb.onDone({ alts }); else cb.onDone({ error: err || "no-speech" }); };
  activeRec = rec;
  try{ rec.start(); }catch(e){ finished = true; activeRec = null; cb.onDone({ error: "unsupported" }); return null; }
  return rec;
}

// ---------- Icons ----------
const ICON_PATHS = {
  dashboard: '<circle cx="12" cy="12" r="9"/><path d="M15.3 8.7l-2 5-5 2 2-5z"/>',
  lessons: '<path d="M2 5.5C2 4.7 2.7 4 3.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3.5A1.5 1.5 0 0 1 2 16.5z"/><path d="M22 5.5c0-.8-.7-1.5-1.5-1.5H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  glossary: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  grammar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  progress: '<path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="5"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="5" width="3" height="13"/>',
  settings: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="14" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="8" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="16" cy="18" r="2"/>',
  speaker: '<path d="M4 9v6h4l5 5V4L8 9z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>',
  play: '<polygon points="6,3 20,12 6,21"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H4v2a4 4 0 0 0 4 3"/><path d="M16 5h4v2a4 4 0 0 1-4 3"/><path d="M12 13v4"/><path d="M9 21h6"/><path d="M10 17h4v4h-4z"/>',
  homework: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 13l2 2 4-4"/>',
  cards: '<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  bolt: '<polygon points="13,2 4,14 11,14 10,22 20,9 13,9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  chevronRight: '<polyline points="9,6 15,12 9,18"/>',
};
const TAB_ICONS = { talk:"chat", vocab:"cards", dialogue:"chat", grammar:"grammar", roleplay:"mic", practice:"target", quiz:"check", speak:"speaker" };
function icon(name, size){
  size = size || 20;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

// ---------- Toast ----------
let toastTimer = null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- PWA install ----------
let deferredInstallPrompt = null;
function isStandalone(){ return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true; }
function isIOSDevice(){ return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstallPrompt = e; if (state.view === "settings") render(); });
window.addEventListener("appinstalled", () => { deferredInstallPrompt = null; if (state.view === "settings") render(); });
async function installApp(){
  if (!deferredInstallPrompt) return;
  const promptEvent = deferredInstallPrompt; deferredInstallPrompt = null;
  promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  if (choice.outcome !== "accepted") toast("O'rnatish bekor qilindi.");
  render();
}

// ---------- Rendering: shell/nav ----------
function render(){
  stopSpeaking(); stopListening();
  renderNav();
  const view = state.view || "dashboard";
  if (view === "dashboard") renderDashboard();
  else if (view === "lessons") renderLessonList();
  else if (view === "levelDetail") renderLevelDetail(state.currentLevel);
  else if (view === "lesson") renderLesson(state.currentDay);
  else if (view === "progress") renderProgressPage();
  else if (view === "settings") renderSettings();
  else if (view === "grammar") renderGrammarBook();
  else if (view === "grammarCategory") renderGrammarCategory(state.currentCategory);
  else if (view === "grammarUnit") renderGrammarUnit(state.currentUnit);
  else if (view === "homework") renderHomework();
  else if (view === "homeworkSession") renderHomeworkSession(state.currentSession);
}
function setView(v, extra){ state.view = v; if (extra) Object.assign(state, extra); window.scrollTo(0,0); render(); }

const NAV_ACTIVE_GROUPS = { lessons: ["lessons","levelDetail","lesson","grammar","grammarCategory","grammarUnit"], homework: ["homework","homeworkSession"] };
function renderNav(){
  const nav = document.getElementById("mainNav");
  const items = [
    ["dashboard","Bosh sahifa","dashboard"],
    ["lessons","Darslar","lessons"],
    ...(window.KTHelper && window.KTHelper.available() ? [["teacher","O'qituvchi","chat"]] : []),
    ["homework","Uyga vazifa","homework"],
    ["progress","Natijalar","progress"],
    ["settings","Sozlamalar","settings"],
  ];
  nav.innerHTML = items.map(([id,label,iconName]) => {
    const activeGroup = NAV_ACTIVE_GROUPS[id];
    const isActive = activeGroup ? activeGroup.includes(state.view) : state.view === id;
    return `<button class="navbtn${isActive?" active":""}" data-nav="${id}"><span class="nav-icon">${icon(iconName,20)}</span><span class="nav-label">${label}</span></button>`;
  }).join("");
  nav.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => { if (btn.dataset.nav === "teacher") window.KTHelper.openTalk(); else setView(btn.dataset.nav); });
  });
}
window.addEventListener("kt-helper-ready", () => { try { renderNav(); } catch (e) {} });

function levelCardHtml(lvl){
  const lp = levelProgress(lvl);
  const pct = Math.round((lp.done / lp.total) * 100);
  const locked = lvl !== LEVELS[0] && !levelComplete(LEVELS[LEVELS.indexOf(lvl) - 1]);
  return `<button class="week-card${lp.done === lp.total ? " done" : ""}${locked ? " locked" : ""}" data-level="${lvl}" ${locked?"disabled":""}>
    <span class="week-top"><span class="week-badge">${locked ? icon("lock",14) : lvl}</span><span class="week-count mono">${lp.done}/${lp.total}</span></span>
    <span class="week-title">${lvl === "1A" ? "Boshlang'ich daraja" : "Davom etuvchi daraja"}${locked ? "<br><small>Avval 1A darajasini tugating</small>" : ""}</span>
    <span class="week-bar"><span style="width:${pct}%"></span></span>
  </button>`;
}

function renderDashboard(){
  const app = document.getElementById("app");
  const total = CURRICULUM.length;
  const done = completedCount();
  const pct = Math.round((done/total)*100);
  const nextDay = CURRICULUM.find(d => !isCompleted(d.d)) || CURRICULUM[total-1];
  const roadDots = CURRICULUM.map(d => {
    const cls = isCompleted(d.d) ? "dot done" : (isUnlocked(d.d) ? "dot unlocked" : "dot locked");
    const marker = d.rev ? " rev" : d.final ? " rev" : "";
    return `<button class="${cls}${marker}" data-day="${d.d}" title="${d.t}">${d.final ? icon("trophy",12) : (d.idx!=null?d.idx:d.d)}</button>`;
  }).join("");
  const hwDone = homeworkDoneCount(), hwTotal = homeworkSessions().length;
  const C = 2 * Math.PI * 34, dash = (pct / 100) * C;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";
  const sundayNote = dow(todayStr()) === 0 ? `<p class="hero-sub">${icon("sun",14)} Bugun yakshanba — dam olish kuni. Dars qilmasangiz ham ketma-ketligingiz (streak) buzilmaydi.</p>` : "";

  app.innerHTML = `
    <section class="hero-strip">
      <div class="hero-top">
        <div class="hero-left">
          <p class="eyebrow">${state.progress.name ? greet.toUpperCase() : CFG.title.toUpperCase()}</p>
          <h1 class="hwy-title">${state.progress.name ? escapeHtml(state.progress.name) : "Koreys tilini o'rganing"}</h1>
          <p class="hero-sub">${done === 0 ? "Koreys tilini ishonch bilan gapirish sari yo'lni boshlang." : `${done} / ${total} dars tugatildi — davom eting.`}</p>
          ${sundayNote}
        </div>
        <div class="ring" role="img" aria-label="${pct}%">
          <svg viewBox="0 0 80 80" width="88" height="88">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(246,250,253,0.16)" stroke-width="7"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#B3CFE5" stroke-width="7" stroke-linecap="round" stroke-dasharray="${dash} ${C}" transform="rotate(-90 40 40)"/>
          </svg>
          <span class="ring-num">${pct}<small>%</small></span>
        </div>
      </div>
      <div class="upnext">
        <div class="upnext-badge"><small>${nextDay.final ? "YAKUNIY" : nextDay.lvl}</small><b>${nextDay.final ? icon("trophy",20) : (CURRICULUM.indexOf(nextDay)+1)}</b></div>
        <div class="upnext-text">
          <p class="upnext-label">${done === 0 ? "BOSHLASH" : nextDay.final ? "YAKUNIY TEST" : nextDay.rev ? "KEYINGI · TAKRORLASH" : "KEYINGI DARS"}</p>
          <h2>${escapeHtml(nextDay.t)}</h2>
          ${nextDay.tu ? `<p class="upnext-tu">${escapeHtml(nextDay.tu)}</p>` : ""}
        </div>
        <button class="btn btn-accent btn-lg" id="continueBtn">${done === 0 ? "Boshlash" : "Davom etish"} ${icon("chevronRight",18)}</button>
      </div>
      <div class="hero-stats">
        <div class="stat-tile"><span class="stat-ico">${icon("flame",20)}</span><span class="stat-num">${state.progress.streak}</span><span class="stat-label">Kunlik ketma-ketlik</span></div>
        <div class="stat-tile"><span class="stat-ico">${icon("bolt",20)}</span><span class="stat-num">${state.progress.xp}</span><span class="stat-label">XP</span></div>
        <div class="stat-tile"><span class="stat-ico">${icon("homework",20)}</span><span class="stat-num">${hwDone}<span class="stat-den">/${hwTotal}</span></span><span class="stat-label">Uyga vazifa</span></div>
      </div>
      <button class="hero-link" id="setNameBtn">${state.progress.name ? "Ismingizni o'zgartirish" : "Ismingizni kiriting"}</button>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Yo'lingiz <span class="mono">(${pct}%)</span></h2>
        <p class="panel-sub">Har bir nuqta — bitta dars. Ko'k = ochiq. Yashil = tugatilgan. Kulrang = qulflangan. Kubok = yakuniy test.</p>
      </div>
      <div class="route"><div class="route-fill" style="width:${pct}%"></div></div>
      <div class="road">${roadDots}</div>
      <div class="legend">
        <span><i class="sw done"></i> Tugatilgan</span>
        <span><i class="sw unlocked"></i> Ochiq</span>
        <span><i class="sw locked"></i> Qulflangan</span>
        <span><i class="sw rev"></i> Takrorlash / Test</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>Darajalar</h2></div>
      <div class="week-grid">${LEVELS.map(levelCardHtml).join("")}</div>
    </section>
  `;
  document.getElementById("continueBtn").addEventListener("click", () => openLesson(nextDay.d));
  document.getElementById("setNameBtn").addEventListener("click", promptName);
  app.querySelectorAll("[data-day]").forEach(btn => {
    btn.addEventListener("click", () => { const n = Number(btn.dataset.day); if (isUnlocked(n)) openLesson(n); else toast("Bu dars hali qulflangan. Avval oldingi darsni tugating."); });
  });
  app.querySelectorAll("[data-level]:not([disabled])").forEach(btn => btn.addEventListener("click", () => setView("levelDetail", { currentLevel: btn.dataset.level })));
}

function promptName(){
  const name = window.prompt("Ismingiz nima?", state.progress.name || "");
  if (name !== null){ state.progress.name = name.trim(); saveProgress(); render(); }
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function renderLessonList(){
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="quick quick-one">
      <button class="quick-tile" id="openGrammarBook"><span class="quick-ico">${icon("grammar",24)}</span><span class="quick-t">Grammatika</span><span class="quick-s">Qoidalarni o'rganing</span></button>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Barcha darslar</h2><p class="panel-sub">${LEVELS.length} daraja · ${CURRICULUM.length} dars · ${CFG.title}</p></div>
      <div class="week-grid">${LEVELS.map(levelCardHtml).join("")}</div>
    </section>
  `;
  document.getElementById("openGrammarBook").addEventListener("click", () => setView("grammar"));
  app.querySelectorAll("[data-level]:not([disabled])").forEach(btn => btn.addEventListener("click", () => setView("levelDetail", { currentLevel: btn.dataset.level })));
}

function renderLevelDetail(lvl){
  const app = document.getElementById("app");
  const days = levelDays(lvl);
  if (!days.length) { setView("lessons"); return; }
  const lp = levelProgress(lvl);
  app.innerHTML = `
    <section class="lesson-head">
      <div class="lesson-head-top"><button class="btn btn-ghost btn-sm" id="backToLessonsBtn">&larr; Barcha darslar</button></div>
      <p class="eyebrow">DARAJA ${lvl}</p>
      <h1 class="hwy-title">${lvl === "1A" ? "Boshlang'ich daraja" : "Davom etuvchi daraja"}</h1>
      <p class="hero-sub">${lp.done}/${lp.total} dars tugatildi.</p>
    </section>
    <section class="panel">
      <div class="day-grid">
        ${days.map((d,i) => {
          const locked = !isUnlocked(d.d);
          const done = isCompleted(d.d);
          return `<button class="day-card${done?" done":""}${locked?" locked":""}${d.rev||d.final?" rev":""}" data-day="${d.d}" ${locked?"disabled":""}>
            <span class="day-badge">${d.final ? icon("trophy",18) : i+1}</span>
            <span class="day-info">
              <span class="day-num mono">${d.final ? "YAKUNIY TEST" : d.rev ? "TAKRORLASH" : `DARS ${i+1}`}</span>
              <span class="day-title">${escapeHtml(d.t)}</span>
              ${d.tu ? `<span class="day-tu">${escapeHtml(d.tu)}</span>` : ""}
              ${done && state.progress.completed[d.d] ? `<span class="day-status">Natija: ${state.progress.completed[d.d].score}%</span>` : ""}
            </span>
            <span class="day-go">${locked ? icon("lock",20) : done ? icon("check",22) : icon("chevronRight",22)}</span>
          </button>`;
        }).join("")}
      </div>
    </section>
  `;
  document.getElementById("backToLessonsBtn").addEventListener("click", () => setView("lessons"));
  app.querySelectorAll("[data-day]:not([disabled])").forEach(btn => btn.addEventListener("click", () => openLesson(Number(btn.dataset.day))));
}

function openLesson(dayNum){
  if (!isUnlocked(dayNum)){ toast("Bu dars hali qulflangan. Avval oldingi darsni tugating."); return; }
  const d = dayByNum(dayNum);
  state.currentTab = d && (d.rev || d.final) ? "quiz" : "vocab";
  setView("lesson", { currentDay: dayNum });
}

// ---------- Lesson ----------
window.KT_lessonContext = function(){
  if (state.view !== "lesson") return null;
  const d = dayByNum(state.currentDay);
  if (!d) return null;
  const sources = d.rev ? levelDays(d.lvl).filter(x => !x.rev && x.v) : [d];
  const words = sources.flatMap(x => (x.v || []).slice(0, d.rev ? 4 : 30).map(r => [r[0], r[1]])).slice(0, 30);
  return { day: String(d.d), dayNum: d.d, title: d.t, review: !!d.rev, words,
    dialogue: (d.dl || []).map(r => [r[0], r[1], r[2]]), grammar: d.g ? d.g[0] + ": " + d.g[1] : "" };
};
window.KT_goQuiz = function(){ state.currentTab = "quiz"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
window.KT_progressContext = function(){
  const done = Object.keys(state.progress.completed || {}).map(Number).sort((a,b) => a - b);
  const recent = done.slice(-3).map(dayByNum).filter(Boolean);
  const next = CURRICULUM.find(d => !isCompleted(d.d));
  return { course: CFG.title, done: done.length, next: next ? next.t : "",
    words: recent.flatMap(d => (d.v || []).slice(0, 4).map(r => [r[0], r[1]])).slice(0, 12) };
};

const SECTION_TITLES = { vocab:"So'zlar", practice:"Mashq", dialogue:"Suhbat", roleplay:"Rolli o'yin", speak:"Gapirish" };
let activeParts = [];
function normalizeTab(id, d){
  if (id === "dialogue" || id === "roleplay" || id === "speak") return "talk";
  if (id === "practice") return d && d.rev ? "practice" : "vocab";
  return id;
}
function tabParts(id, d){
  if (id === "vocab") return ["vocab", "practice"];
  if (id === "talk") return d && d.rev ? ["roleplay", "speak"] : ["dialogue", "roleplay", "speak"];
  return [id];
}
function inTab(part){ return activeParts.indexOf(part) !== -1; }

function renderLesson(dayNum){
  const d = dayByNum(dayNum);
  const app = document.getElementById("app");
  const idx = CURRICULUM.findIndex(x=>x.d===dayNum);
  const prev = CURRICULUM[idx-1];
  const next = CURRICULUM[idx+1];

  if (d.final){ renderFinalTest(d, app, prev, next); return; }

  const tabs = d.rev
    ? [["practice","Mashq"],["talk","Suhbat"],["quiz","Takrorlash testi"]]
    : [["vocab","So'zlar"],["talk","Suhbat"],...(d.g ? [["grammar","Grammatika"]] : []),["quiz","Test"]];
  const askedFor = state.currentTab;
  state.currentTab = normalizeTab(askedFor, d);
  if (state.currentTab !== askedFor && tabParts(state.currentTab, d).indexOf(askedFor) !== -1) state.focusSection = askedFor;
  let stepIdx = tabs.findIndex(t => t[0] === state.currentTab);
  if (stepIdx < 0){ stepIdx = 0; state.currentTab = tabs[0][0]; }

  app.innerHTML = `
    <section class="lesson-head">
      <div class="lesson-head-top">
        <button class="btn btn-ghost btn-sm" id="backBtn">&larr; ${d.lvl} darajasi</button>
        <div class="lesson-pager">
          <button class="btn btn-ghost btn-sm" id="prevDayBtn" ${!prev || !isUnlocked(prev.d) ? "disabled" : ""}>&larr; Oldingi</button>
          <button class="btn btn-ghost btn-sm" id="nextDayBtn" ${!next || !isUnlocked(next.d) ? "disabled" : ""}>Keyingi &rarr;</button>
        </div>
      </div>
      <p class="eyebrow">${d.lvl}${d.rev ? " &middot; TAKRORLASH" : ""}</p>
      <h1 class="hwy-title">${escapeHtml(d.t)}</h1>
      ${d.tu ? `<p class="lesson-title-uz">${escapeHtml(d.tu)}</p>` : ""}
      <div class="lesson-badges">
        ${isCompleted(d.d) ? `<span class="badge-complete">✓ Tugatilgan · natija ${state.progress.completed[d.d].score}%</span>` : ""}
      </div>
    </section>
    <div class="tabbar" role="tablist">
      ${tabs.map(([id,label]) => `<button class="tabbtn${state.currentTab===id?" active":""}" data-tab="${id}" role="tab" aria-selected="${state.currentTab===id}">
        <span class="tab-ico">${icon(TAB_ICONS[id] || "lessons",22)}</span><span class="tab-lbl">${label}</span></button>`).join("")}
    </div>
    <section class="panel lesson-body" id="lessonBody"></section>
    <div class="step-nav">
      ${stepIdx > 0 ? `<button class="btn btn-ghost" id="stepPrev">&larr; ${escapeHtml(tabs[stepIdx-1][1])}</button>` : "<span></span>"}
      ${stepIdx < tabs.length - 1
        ? `<button class="btn btn-accent" id="stepNext"><span>Keyingi: ${escapeHtml(tabs[stepIdx+1][1])}</span> &rarr;</button>`
        : (next ? (isUnlocked(next.d) ? `<button class="btn btn-accent" id="stepNextDay"><span>Keyingi dars</span> &rarr;</button>` : `<button class="btn btn-ghost" disabled>${icon("lock",16)} Qulflangan</button>`) : "<span></span>")}
    </div>
  `;

  const goStep = (i) => { state.currentTab = tabs[i][0]; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const sp = document.getElementById("stepPrev"), sn = document.getElementById("stepNext"), snd = document.getElementById("stepNextDay");
  if (sp) sp.addEventListener("click", () => goStep(stepIdx - 1));
  if (sn) sn.addEventListener("click", () => goStep(stepIdx + 1));
  if (snd) snd.addEventListener("click", () => openLesson(next.d));
  document.getElementById("backBtn").addEventListener("click", () => setView("levelDetail", { currentLevel: d.lvl }));
  if (prev) document.getElementById("prevDayBtn").addEventListener("click", () => openLesson(prev.d));
  if (next) document.getElementById("nextDayBtn").addEventListener("click", () => openLesson(next.d));
  app.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { state.currentTab = btn.dataset.tab; render(); }));
  renderLessonTab(d);
}

function renderLessonTab(d){
  const body = document.getElementById("lessonBody");
  const parts = tabParts(state.currentTab, d);
  activeParts = parts;
  const draw = { vocab: renderVocabTab, practice: renderPracticeTab, dialogue: renderDialogueTab, roleplay: renderRolePlayTab, speak: renderSpeakTab, quiz: renderQuizTab, grammar: renderGrammarTab };
  if (parts.length === 1){ if (draw[parts[0]]) draw[parts[0]](d, body); }
  else {
    body.innerHTML = parts.map(p => `<div class="lesson-sec" id="sec-${p}"><h2 class="sec-title">${SECTION_TITLES[p]}</h2><div id="secBody-${p}"></div></div>`).join("");
    parts.forEach(p => draw[p](d, document.getElementById("secBody-" + p)));
  }
  if (state.focusSection){
    const el = document.getElementById("sec-" + state.focusSection);
    state.focusSection = null;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
}

function renderGrammarTab(d, body){
  const unit = d.gu ? grammarUnitById(d.gu) : null;
  body.innerHTML = `
    <p class="panel-sub">Bugungi qisqa grammatika maslahati:</p>
    <h3>${escapeHtml(d.g[0])}</h3>
    <p class="grammar-explain">${escapeHtml(d.g[1])}</p>
    ${unit ? `<div class="setting-row" style="margin-top:18px;"><div><h3>Chuqurroq o'rganish</h3><p class="panel-sub">To'liq tushuntirish, ko'proq misollar — Grammatika kitobida.</p></div>
      <button class="btn btn-accent btn-sm" id="goDeeperBtn">${escapeHtml(unit.title)} ${icon("chevronRight",14)}</button></div>` : ""}
  `;
  const btn = document.getElementById("goDeeperBtn");
  if (btn) btn.addEventListener("click", () => setView("grammarUnit", { currentUnit: unit.id, currentCategory: unit.cat }));
}

function renderVocabTab(d, body){
  body.innerHTML = `
    <div class="vocab-head">
      <p class="panel-sub">Kartochkani bosib o'zbekcha ma'nosi va misolni ko'ring. Karnay belgisini bosib so'zni tinglang.</p>
      <button class="btn btn-accent btn-sm" id="listenAllBtn">${icon("play",14)} Hammasini tinglash (${d.v.length})</button>
    </div>
    <div class="flashcards">
      ${d.v.map((item,i) => {
        const [ko, uz, ex] = item;
        const flipped = state.flippedCards[d.d+"-"+i];
        return `<div class="flashcard${flipped?" flipped":""}" data-idx="${i}">
          <div class="flashcard-inner">
            <div class="flashcard-face flashcard-front">
              <span class="fc-num mono">${i + 1}</span>
              <span class="fc-en">${escapeHtml(ko)}</span>
              <span class="fc-hint">bosib ko'ring</span>
              <button class="speak-btn" data-speak="${escapeHtml(ko)}" title="Tinglash" aria-label="Tinglash">${icon("speaker",18)}</button>
            </div>
            <div class="flashcard-face flashcard-back">
              ${state.settings.showUz ? `<span class="fc-uz">${escapeHtml(uz)}</span>` : ""}
              <span class="fc-ex">&ldquo;${escapeHtml(ex)}&rdquo;</span>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>
  `;
  document.getElementById("listenAllBtn").addEventListener("click", () => {
    if (!ttsSupported() && !(window.KTVoice && window.KTVoice.usable())){ toast("Ovoz bu brauzerda qo'llab-quvvatlanmaydi."); return; }
    const cards = body.querySelectorAll(".flashcard");
    speakQueue(d.v.map(v => v[0]), {
      onItem: (i) => { cards.forEach((c, k) => c.classList.toggle("now", k === i)); if (cards[i]) cards[i].scrollIntoView({ block: "center", behavior: "smooth" }); },
      onDone: () => cards.forEach(c => c.classList.remove("now")),
    });
  });
  body.querySelectorAll(".flashcard").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".speak-btn")) return;
      const key = d.d + "-" + card.dataset.idx;
      state.flippedCards[key] = !state.flippedCards[key];
      card.classList.toggle("flipped");
    });
  });
  body.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); speak(btn.dataset.speak); }));
}

function renderDialogueTab(d, body){
  if (!d.dl || !d.dl.length){ body.innerHTML = `<p class="panel-sub">Bu darsda suhbat yo'q.</p>`; return; }
  const first = d.dl[0][0];
  body.innerHTML = `
    <p class="panel-sub">Haqiqiy koreyscha suhbat. Qatorni tinglash uchun karnay belgisini bosing.</p>
    <div class="dlg-actions">
      <button class="btn btn-accent" id="playAllBtn">${icon("play",16)} To'liq suhbatni tinglash</button>
      <button class="btn btn-ghost" id="toRoleplayBtn">${icon("mic",16)} Endi o'zingiz urinib ko'ring</button>
    </div>
    <div class="dlg">
      ${d.dl.map(([speaker,ko,uz],i) => `
        <div class="dlg-msg ${speaker === first ? "a" : "b"}" data-idx="${i}">
          <span class="dlg-who">${escapeHtml(speaker)}</span>
          <div class="dlg-line"><p class="dlg-en">${escapeHtml(ko)}</p><button class="speak-btn" data-speak="${escapeHtml(ko)}" aria-label="Tinglash">${icon("speaker",18)}</button></div>
          ${state.settings.showUz ? `<p class="dlg-uz">${escapeHtml(uz)}</p>` : ""}
        </div>`).join("")}
    </div>
  `;
  body.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", () => speak(btn.dataset.speak)));
  document.getElementById("toRoleplayBtn").addEventListener("click", () => {
    const sec = document.getElementById("sec-roleplay");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" }); else { state.currentTab = "roleplay"; render(); }
  });
  document.getElementById("playAllBtn").addEventListener("click", () => {
    const first2 = d.dl[0][0], pv = partnerVoice();
    const lines = body.querySelectorAll(".dlg-msg");
    speakQueue(d.dl.map(l => l[0] === first2 ? { text: l[1] } : { text: l[1], voice: pv.voice, pitch: pv.pitch, gender: "male" }), {
      onItem: (i) => { lines.forEach((el, k) => el.classList.toggle("now", k === i)); if (lines[i]) lines[i].scrollIntoView({ block: "nearest", behavior: "smooth" }); },
      onDone: () => lines.forEach(el => el.classList.remove("now")),
    });
  });
}

// ---------- Role-play ----------
const RP_PASS = 70;
function rpLevelDays(d){ return levelDays(d.lvl).filter(x => x.dl); }
function rpDialogue(d, rp){ if (!d.rev) return d.dl || []; const src = dayByNum(rp.sourceDay); return (src && src.dl) || []; }
function rpSpeakers(dl){ return [...new Set(dl.map(l => l[0]))]; }
function rpDefaultRole(dl){ const sp = rpSpeakers(dl); return sp[1] || sp[0]; }
function ensureRP(d){
  if (!state.rolePlay) state.rolePlay = {};
  if (!state.rolePlay[d.d]){
    const first = d.rev ? (rpLevelDays(d)[0] || {}).d : d.d;
    state.rolePlay[d.d] = { phase:"intro", sourceDay:first, role:null, hideText:false, mode:"mic", run:0 };
  }
  return state.rolePlay[d.d];
}
function rpReset(d, rp, role){
  Object.assign(rp, { phase:"intro", role: role || null, idx:0, messages:[], results:{}, status:"idle", typing:false, speakingIdx:null, attempts:0, best:null, feedback:null, live:"", note:"" });
  rp.run++;
}
function unlockSpeech(){ if (!ttsSupported()) return; try{ const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); }catch(e){} }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function renderRolePlayTab(d, body){
  const rp = ensureRP(d);
  if (rp.phase === "intro") return renderRPIntro(d, body, rp);
  if (rp.status === "listening") rp.status = "idle";
  rpRender(d, body, rp);
  if (rp.phase === "play" && rp.status === "partner") rpAdvance(d, body, rp);
}

function renderRPIntro(d, body, rp){
  const dl = rpDialogue(d, rp);
  if (!dl.length){ body.innerHTML = `<p class="panel-sub">Bu kun uchun suhbat mavjud emas.</p>`; return; }
  const speakers = rpSpeakers(dl);
  if (!rp.role || !speakers.includes(rp.role)) rp.role = rpDefaultRole(dl);
  const prev = state.progress.roleplay && state.progress.roleplay[d.d];
  const canScore = speechSupported();
  body.innerHTML = `
    <div class="rp rp-intro">
      <div><span class="tip-label mono">ROLLI O'YIN</span>
        <p class="panel-sub" style="margin-top:6px;">Suhbatni o'zingiz boshqaring. Ilova boshqa odamni o'ynaydi va sizga gapiradi; sizning navbatingizda gapingiz ekranda chiqadi — uni ovoz chiqarib o'qing, mikrofon qanchalik to'g'ri aytganingizni tekshiradi.</p></div>
      ${d.rev ? `<div><p class="speak-target-label mono">SHU DARAJADAN SUHBAT TANLANG</p>
        <select id="rpSource" class="select" aria-label="Suhbat tanlang">
          ${rpLevelDays(d).map(x => `<option value="${x.d}" ${x.d===rp.sourceDay?"selected":""}>${escapeHtml(x.t)}</option>`).join("")}
        </select></div>` : ""}
      <div><p class="speak-target-label mono">SIZ KIM BO'LASIZ</p>
        <div class="rp-roles">${speakers.map(s => `<button class="rp-role${s===rp.role?" active":""}" data-role="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}</div></div>
      <div class="rp-options"><label class="rp-check"><input type="checkbox" id="rpHide" ${rp.hideText?"checked":""}> Qiyin rejim — gapimni kerak bo'lguncha yashirish</label></div>
      <div class="rp-mic-note">${canScore ? `${icon("mic",16)} Boshlaganingizda mikrofondan foydalanishga ruxsat so'raymiz.` : "Bu brauzerda nutqni tekshirish mavjud emas (Chrome, Edge yoki Safari'da ishlaydi). Baribir mashq qilishingiz mumkin."}</div>
      <button class="btn btn-accent btn-lg" id="rpStart">${icon("play",16)} Rolli o'yinni boshlash</button>
      ${prev ? `<p class="hint">Eng yaxshi natijangiz: <strong>${prev.best ? prev.best + "%" : "tugatilgan"}</strong></p>` : ""}
    </div>`;
  const src = document.getElementById("rpSource");
  if (src) src.addEventListener("change", () => { rp.sourceDay = Number(src.value); rp.role = null; renderRPIntro(d, body, rp); });
  body.querySelectorAll("[data-role]").forEach(b => b.addEventListener("click", () => { rp.role = b.dataset.role; rp.hideText = document.getElementById("rpHide").checked; renderRPIntro(d, body, rp); }));
  document.getElementById("rpStart").addEventListener("click", async () => {
    rp.hideText = document.getElementById("rpHide").checked;
    unlockSpeech();
    const btn = document.getElementById("rpStart"); btn.disabled = true;
    let mode = "mic", note = "";
    if (!speechSupported()){ mode = "self"; }
    else {
      const r = await ensureMic();
      if (!r.ok){ mode = "self";
        note = r.reason === "denied" ? "Mikrofon ushbu sayt uchun bloklangan. Brauzer sozlamalaridan ruxsat bering."
          : r.reason === "nomic" ? "Mikrofon topilmadi." : "Mikrofonni ishga tushirib bo'lmadi.";
      }
    }
    Object.assign(rp, { phase:"play", mode, note, ttsFailed:false, idx:0, messages:[], results:{}, status:"idle", typing:false, speakingIdx:null, attempts:0, best:null, feedback:null, live:"" });
    rpRender(d, body, rp);
    rpAdvance(d, body, rp);
  });
}

async function rpAdvance(d, body, rp){
  const run = ++rp.run;
  const dl = rpDialogue(d, rp);
  const alive = () => rp.run === run && body.isConnected && state.view === "lesson" && state.currentDay === d.d && inTab("roleplay");
  const pv = partnerVoice();
  while (rp.idx < dl.length){
    const [speaker, ko] = dl[rp.idx];
    if (speaker === rp.role){ rp.status = "idle"; rp.attempts = 0; rp.best = null; rp.feedback = null; rp.live = ""; rp.typing = false; rp.speakingIdx = null; rpRender(d, body, rp); return; }
    rp.status = "partner"; rp.typing = true; rpRender(d, body, rp);
    await sleep(500);
    if (!alive()) return;
    rp.typing = false;
    rp.messages.push({ who: speaker, en: ko, uz: dl[rp.idx][2], mine: false });
    rp.idx++;
    rp.speakingIdx = rp.messages.length - 1;
    rpRender(d, body, rp);
    if (!rp.ttsFailed){
      stopSpeaking();
      const played = await speakOnce(ko, { token: speechToken, voice: pv.voice, pitch: pv.pitch, gender: "male" });
      if (alive() && !played) rp.ttsFailed = true;
    }
    if (!alive()) return;
    rp.speakingIdx = null;
    await sleep(250);
    if (!alive()) return;
  }
  const scored = Object.values(rp.results).filter(r => r.score != null);
  const avg = scored.length ? Math.round(scored.reduce((a, r) => a + r.score, 0) / scored.length) : null;
  rp.summary = { avg };
  rp.phase = "done"; rp.status = "idle"; rp.typing = false; rp.speakingIdx = null;
  const prev = state.progress.roleplay[d.d];
  if (!prev) state.progress.xp += 30;
  state.progress.roleplay[d.d] = { best: Math.max((prev && prev.best) || 0, avg || 0), date: todayStr() };
  saveProgress();
  rpRender(d, body, rp);
}

function rpRender(d, body, rp){
  const dl = rpDialogue(d, rp);
  const showUz = state.settings.showUz;
  const myTurn = rp.phase === "play" && rp.status !== "partner" && rp.idx < dl.length && dl[rp.idx][0] === rp.role;
  const pct = Math.round((Math.min(rp.idx, dl.length) / dl.length) * 100);
  const chat = rp.messages.map((m, i) => `
    <div class="rp-msg ${m.mine ? "me" : "them"}${rp.speakingIdx === i ? " speaking" : ""}">
      <span class="rp-who">${escapeHtml(m.who)}${m.mine ? " · siz" : ""}</span>
      <div class="rp-line"><p>${escapeHtml(m.en)}</p><button class="speak-btn" data-rpspeak="${i}" aria-label="Tinglash">${icon("speaker",16)}</button></div>
      ${showUz && m.uz ? `<p class="rp-uz">${escapeHtml(m.uz)}</p>` : ""}
      ${m.mine && m.score != null ? `<span class="rp-score-chip">${m.score}%</span>` : ""}
    </div>`).join("") + (rp.typing ? `<div class="rp-typing" aria-label="Yozmoqda"><i></i><i></i><i></i></div>` : "");

  let turn = "";
  if (myTurn){
    const [, ko, uz] = dl[rp.idx];
    const fb = rp.feedback;
    const hidden = rp.hideText && !fb && !rp.revealed;
    const words = fb ? fb.marks.map(k => `<span class="w ${k.ok ? "ok" : "miss"}">${escapeHtml(k.word)}</span>`).join(" ") : escapeHtml(ko);
    const listening = rp.status === "listening";
    turn = `
      <div class="rp-turn" id="rpTurn">
        <span class="rp-turn-label">SIZNING NAVBATINGIZ · ${escapeHtml(rp.role.toUpperCase())}</span>
        <p class="rp-say${hidden ? " hidden-text" : ""}" id="rpSay">${words}</p>
        ${showUz ? `<p class="rp-say-uz">${escapeHtml(uz)}</p>` : ""}
        ${rp.hideText && !fb ? `<button class="btn btn-ghost btn-sm" id="rpReveal" style="align-self:flex-start;">${hidden ? "Gapimni ko'rsatish" : "Gapimni yashirish"}</button>` : ""}
        ${rp.note ? `<div class="rp-mic-note">${escapeHtml(rp.note)}</div>` : ""}
        <p class="rp-live" aria-live="polite" id="rpLive">${listening ? (rp.live ? "“" + escapeHtml(rp.live) + "”" : "Tinglanmoqda… gapiring") : escapeHtml(rp.live || "")}</p>
        ${fb ? rpFeedbackHtml(rp, fb) : `
          <div class="rp-turn-actions">
            <button class="btn btn-ghost" id="rpHear">${icon("speaker",16)} Eshitish</button>
            ${rp.mode === "mic"
              ? `<button class="rp-mic${listening ? " listening" : ""}" id="rpMic" aria-label="${listening ? "To'xtatish" : "Gapirish uchun bosing"}">${icon("mic",30)}</button>
                 <span class="rp-mic-hint">${listening ? "To'xtatish uchun bosing" : "Mikrofonni bosib gapiringiz"}</span>`
              : `<button class="btn btn-accent" id="rpSaid">Aytdim &rarr;</button>`}
          </div>`}
      </div>`;
  }

  let summary = "";
  if (rp.phase === "done"){
    const avg = rp.summary && rp.summary.avg;
    const lines = Object.values(rp.results);
    summary = `
      <div class="rp-summary">
        <span class="tip-label mono">SUHBAT TUGADI</span>
        <div class="rp-summary-score">${avg != null ? avg + "%" : "Tayyor!"}</div>
        <p class="panel-sub">${avg == null ? "Yaxshi ish — har bir qatorni o'qidingiz." : avg >= 85 ? "Ajoyib — ishonchli chiqdi." : avg >= RP_PASS ? "Yaxshi. Yana bir marta urinib ko'ring." : "Mashq qilishda davom eting — har bir qatorni tinglang, keyin yana ayting."}</p>
        ${lines.length ? `<div class="rp-summary-lines">${lines.map(r => `<div class="rp-summary-line"><span>${escapeHtml(r.en)}</span><span>${r.score != null ? r.score + "%" : "—"}</span></div>`).join("")}</div>` : ""}
        <div class="rp-fb-actions" style="justify-content:center;">
          <button class="btn btn-accent" id="rpAgain">${icon("refresh",16)} Yana o'ynash</button>
          <button class="btn btn-ghost" id="rpSwitch">Rollarni almashtirish</button>
        </div>
      </div>`;
  }

  body.innerHTML = `
    <div class="rp">
      <div class="rp-progress">
        <div class="progressbar"><div class="progressbar-fill" style="width:${rp.phase === "done" ? 100 : pct}%"></div></div>
        <span class="rp-progress-label mono">Siz: ${escapeHtml(rp.role)}</span>
        <button class="btn btn-ghost btn-sm" id="rpQuit">Tugatish</button>
      </div>
      <div class="rp-chat" aria-live="polite">${chat}</div>
      ${turn}
      ${summary}
    </div>`;

  body.querySelectorAll("[data-rpspeak]").forEach(b => b.addEventListener("click", () => {
    const m = rp.messages[Number(b.dataset.rpspeak)];
    if (m.mine) speak(m.en); else { const pv = partnerVoice(); stopSpeaking(); speakOnce(m.en, { token: speechToken, voice: pv.voice, pitch: pv.pitch, gender: "male" }); }
  }));
  const $q = (id) => document.getElementById(id);
  $q("rpQuit").addEventListener("click", () => { stopSpeaking(); stopListening(); rpReset(d, rp, rp.role); renderRolePlayTab(d, body); });
  if ($q("rpAgain")) $q("rpAgain").addEventListener("click", () => { const r = rp.role; rpReset(d, rp, r); renderRolePlayTab(d, body); });
  if ($q("rpSwitch")) $q("rpSwitch").addEventListener("click", () => { const others = rpSpeakers(dl).filter(s => s !== rp.role); rpReset(d, rp, others[0] || rp.role); renderRolePlayTab(d, body); });
  if (rp.phase === "done"){ const sm = body.querySelector(".rp-summary"); if (sm) sm.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  if (myTurn){
    const [, ko] = dl[rp.idx];
    if ($q("rpHear")) $q("rpHear").addEventListener("click", () => speak(ko));
    if ($q("rpReveal")) $q("rpReveal").addEventListener("click", () => { rp.revealed = !rp.revealed; rp.hideText = true; rpRender(d, body, rp); });
    if ($q("rpSay") && rp.hideText && !rp.feedback) $q("rpSay").addEventListener("click", () => { rp.revealed = true; rpRender(d, body, rp); });
    if ($q("rpMic")) $q("rpMic").addEventListener("click", () => rpListen(d, body, rp));
    if ($q("rpSaid")) $q("rpSaid").addEventListener("click", () => rpAccept(d, body, rp, null));
    if ($q("rpRetry")) $q("rpRetry").addEventListener("click", () => { rp.feedback = null; rp.live = ""; rpRender(d, body, rp); });
    if ($q("rpNext")) $q("rpNext").addEventListener("click", () => rpAccept(d, body, rp, rp.best));
    const t = $q("rpTurn");
    if (t && !rp._noScroll) t.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function rpFeedbackHtml(rp, fb){
  const good = fb.score >= RP_PASS;
  const cls = good ? "good" : fb.score >= 50 ? "okay" : "low";
  const title = fb.score >= 90 ? "Ajoyib!" : good ? "Yaxshi — bo'ldi!" : fb.score >= 50 ? "Deyarli to'g'ri" : "Yana urinib ko'ramiz";
  const tip = !good && rp.attempts >= 2 ? `<p class="rp-heard">Maslahat: "Eshitish"ni bosing, keyin har bir so'zni sekin ayting.</p>` : "";
  return `
    <div class="rp-feedback ${cls}">
      <p class="rp-fb-title">${title} <span class="mono">${fb.score}%</span></p>
      <p class="rp-heard">Siz aytdingiz: <b>&ldquo;${escapeHtml(fb.heard)}&rdquo;</b></p>
      ${fb.marks.some(k => !k.ok) ? `<p class="rp-heard">Yashil so'zlar aniq eshitildi; qizil (chizilgan) so'zlarni yana urinib ko'ring.</p>` : ""}
      ${tip}
      <div class="rp-fb-actions">
        ${good ? `<button class="btn btn-accent" id="rpNext">Davom etish &rarr;</button><button class="btn btn-ghost" id="rpRetry">Yana urinish</button>`
               : `<button class="btn btn-accent" id="rpRetry">${icon("mic",16)} Yana urinish</button><button class="btn btn-ghost" id="rpNext">Baribir davom etish</button>`}
      </div>
    </div>`;
}
function rpAccept(d, body, rp, score){
  const dl = rpDialogue(d, rp);
  const [, ko, uz] = dl[rp.idx];
  rp.messages.push({ who: rp.role, en: ko, uz, mine: true, score });
  rp.results[rp.idx] = { score, en: ko, attempts: rp.attempts };
  rp.idx++; rp.feedback = null; rp.revealed = false; rp.live = "";
  rpAdvance(d, body, rp);
}
function rpListen(d, body, rp){
  const dl = rpDialogue(d, rp);
  if (rp.status === "listening"){ stopListening(); return; }
  stopSpeaking();
  const target = dl[rp.idx][1];
  rp.status = "listening"; rp.live = ""; rp.feedback = null; rp.note = rp.note || "";
  rp._noScroll = true; rpRender(d, body, rp); rp._noScroll = false;
  const run = rp.run;
  const alive = () => rp.run === run && body.isConnected && inTab("roleplay") && state.currentDay === d.d;
  listenOnce({
    onInterim: (t) => { rp.live = t; const el = document.getElementById("rpLive"); if (el) el.textContent = "“" + t + "”"; },
    onDone: (res) => {
      if (!alive()) return;
      rp.status = "idle";
      if (res.error){
        const e = res.error;
        if (e === "not-allowed" || e === "service-not-allowed" || e === "unsupported"){ rp.mode = "self"; rp.note = "Mikrofon bloklangan yoki mavjud emas. Gapingizni o'qib, \"Aytdim\" ni bosing."; rp.live = ""; }
        else if (e === "no-speech") rp.live = "Hech narsa eshitilmadi — telefonga yaqinroq gapiring.";
        else if (e === "audio-capture") rp.live = "Mikrofon topilmadi.";
        else if (e === "network") rp.live = "Internet aloqasi kerak.";
        else if (e === "aborted") rp.live = "";
        else rp.live = "Aniq eshitilmadi — yana urinib ko'ring.";
        rp._noScroll = true; rpRender(d, body, rp); rp._noScroll = false;
        return;
      }
      let best = null;
      res.alts.forEach(t => { const r = scoreSpeech(target, t); if (!best || r.score > best.score) best = { score: r.score, marks: r.marks, heard: t }; });
      rp.attempts++;
      rp.best = Math.max(rp.best || 0, best.score);
      rp.feedback = best; rp.live = "";
      rpRender(d, body, rp);
    },
  });
}

// ---------- Practice generation ----------
function shuffle(arr){ const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function levelVocabPool(lvl){ const pool = []; levelDays(lvl).filter(x => !x.rev && x.v).forEach(x => pool.push(...x.v)); return pool; }
function uniqueByKo(pool){ const seen = new Set(), out = []; pool.forEach(item => { if (!seen.has(item[0])){ seen.add(item[0]); out.push(item); } }); return out; }
function primaryForm(ko){ return ko.trim(); }

function generateVocabQuestions(pool, count){
  const uniq = uniqueByKo(pool);
  const chosen = shuffle(uniq).slice(0, Math.min(count, uniq.length));
  return chosen.map(([ko, uz]) => {
    const distractors = shuffle(uniq.filter(p => p[1] !== uz)).slice(0, 3).map(p => p[1]);
    const opts = shuffle([uz, ...distractors]);
    return [`"${ko}" so'zi uzbekchada nimani anglatadi?`, opts, opts.indexOf(uz)];
  });
}
function generateFillBlank(pool, count){
  const uniq = uniqueByKo(pool);
  const allTerms = uniq.map(([ko]) => primaryForm(ko));
  const candidates = [];
  shuffle(uniq).forEach(([ko, uz, ex]) => {
    if (candidates.length >= count || !ex) return;
    const variant = primaryForm(ko);
    const idx = ex.indexOf(variant);
    if (idx !== -1){
      const sentence = ex.slice(0, idx) + "&#9612;&#9612;&#9612;&#9612;" + ex.slice(idx + variant.length);
      const distractors = shuffle(allTerms.filter(t => t !== variant)).slice(0, 5);
      candidates.push({ sentence, answer: variant, uz, ko, ex, bank: shuffle([variant, ...distractors]) });
    }
  });
  return candidates;
}
function generateMatchingPairs(pool, count){ const uniq = uniqueByKo(pool); return shuffle(uniq).slice(0, Math.min(count, uniq.length)).map(([ko, uz]) => [ko, uz]); }
function buildPracticeSet(d){
  const pool = d.rev ? levelVocabPool(d.lvl) : d.v;
  const pairs = generateMatchingPairs(pool, 8);
  return { fb: generateFillBlank(pool, 6), match: { pairs, shuffledUz: shuffle(pairs.map(p => p[1])), matchedEn: [], selectedEn: null, selectedUz: null, wrong: false } };
}
function ensurePracticeState(d){ if (!state.practiceState) state.practiceState = {}; if (!state.practiceState[d.d]) state.practiceState[d.d] = buildPracticeSet(d); return state.practiceState[d.d]; }

function renderPracticeTab(d, body){
  const ps = ensurePracticeState(d);
  const fbCorrect = ps.fb.filter(f => f.selected && f.selected === f.answer).length;
  const matchDone = ps.match.matchedEn.length;
  body.innerHTML = `
    <div class="practice-header">
      <p class="panel-sub">${d.rev ? "Shu darajaning hamma so'zlaridan avtomatik tuzilgan — har safar yangi." : "Bugungi so'zlardan avtomatik tuzilgan — har safar yangi."}</p>
      <button class="btn btn-ghost btn-sm" id="newSetBtn">${icon("refresh",14)} Yangi mashq</button>
    </div>
    <div class="practice-block">
      <span class="tip-label mono">BO'SH JOYNI TO'LDIRING · ${fbCorrect}/${ps.fb.length} to'g'ri</span>
      ${ps.fb.map((item, i) => `
        <div class="fib-item">
          <p class="fib-sentence">${item.sentence.replace("&#9612;&#9612;&#9612;&#9612;", item.selected ? `<span class="fib-filled ${item.selected===item.answer?"correct":"incorrect"}">${escapeHtml(item.selected)}</span>` : `<span class="fib-blank">____</span>`)}</p>
          ${state.settings.showUz ? `<p class="fib-uz">${escapeHtml(item.uz)}</p>` : ""}
          <div class="fib-bank">${item.bank.map(word => `<button class="fib-chip${item.selected===word?(word===item.answer?" correct":" incorrect"):""}" data-fb="${i}" data-word="${escapeHtml(word)}" ${item.selected?"disabled":""}>${escapeHtml(word)}</button>`).join("")}</div>
        </div>`).join("")}
    </div>
    <div class="practice-block">
      <span class="tip-label mono">SO'ZLARNI MOSLASHTIRING · ${matchDone}/${ps.match.pairs.length}</span>
      <p class="panel-sub">Koreyscha so'zni, keyin uning juftini bosing.</p>
      <div class="match-grid">
        <div class="match-col">${ps.match.pairs.map(([ko]) => { const matched = ps.match.matchedEn.includes(ko); const selected = ps.match.selectedEn === ko; const wrong = ps.match.wrong && selected;
          return `<button class="match-btn${matched?" matched":""}${selected?" selected":""}${wrong?" wrong":""}" data-en="${escapeHtml(ko)}" ${matched?"disabled":""}>${escapeHtml(ko)}</button>`; }).join("")}</div>
        <div class="match-col">${ps.match.shuffledUz.map(uz => { const pairKo = ps.match.pairs.find(p => p[1] === uz)[0]; const matched = ps.match.matchedEn.includes(pairKo); const selected = ps.match.selectedUz === uz; const wrong = ps.match.wrong && selected;
          return `<button class="match-btn${matched?" matched":""}${selected?" selected":""}${wrong?" wrong":""}" data-uz="${escapeHtml(uz)}" ${matched?"disabled":""}>${escapeHtml(uz)}</button>`; }).join("")}</div>
      </div>
    </div>
  `;
  document.getElementById("newSetBtn").addEventListener("click", () => { state.practiceState[d.d] = buildPracticeSet(d); renderPracticeTab(d, body); });
  body.querySelectorAll("[data-fb]").forEach(btn => btn.addEventListener("click", () => { ps.fb[Number(btn.dataset.fb)].selected = btn.dataset.word; renderPracticeTab(d, body); }));
  body.querySelectorAll("[data-en]").forEach(btn => btn.addEventListener("click", () => { ps.match.selectedEn = btn.dataset.en; attemptMatch(d, body, ps); }));
  body.querySelectorAll("[data-uz]").forEach(btn => btn.addEventListener("click", () => { ps.match.selectedUz = btn.dataset.uz; attemptMatch(d, body, ps); }));
}
function attemptMatch(d, body, ps){
  if (!ps.match.selectedEn || !ps.match.selectedUz){ renderPracticeTab(d, body); return; }
  const pair = ps.match.pairs.find(p => p[0] === ps.match.selectedEn);
  if (pair && pair[1] === ps.match.selectedUz){
    ps.match.matchedEn.push(ps.match.selectedEn); ps.match.selectedEn = null; ps.match.selectedUz = null; ps.match.wrong = false;
    renderPracticeTab(d, body);
    if (ps.match.matchedEn.length === ps.match.pairs.length) toast("Moslashtirish tugadi! Barakalla.");
  } else {
    ps.match.wrong = true; renderPracticeTab(d, body);
    setTimeout(() => { ps.match.selectedEn = null; ps.match.selectedUz = null; ps.match.wrong = false; renderPracticeTab(d, body); }, 700);
  }
}

function buildQuizQuestions(d){
  const core = d.qz.map(q => q.slice());
  const pool = d.rev ? levelVocabPool(d.lvl) : d.v;
  const generated = generateVocabQuestions(pool, 8);
  return shuffle(core.concat(generated));
}
function renderQuizTab(d, body){
  const qs = loadJSON(QUIZ_KEY, {});
  if (!state.quizState[d.d]) state.quizState[d.d] = qs[d.d] || {};
  const qState = state.quizState[d.d];
  if (!qState.questions || !qState.questions.length){ qState.questions = buildQuizQuestions(d); qState.answers = {}; qState.submitted = false; }
  const questions = qState.questions;
  body.innerHTML = `
    <p class="panel-sub">${d.rev ? `${questions.length} ta savol · shu darajaning umumiy takrorlashi.` : `${questions.length} ta savol. Hammasiga javob berib, yuboring.`}</p>
    <form id="quizForm">
      ${questions.map((q,qi) => `
        <fieldset class="quiz-q">
          <legend>${qi+1}. ${escapeHtml(q[0])}</legend>
          <div class="quiz-opts">${q[1].map((opt,oi) => `<label class="quiz-opt"><input type="radio" name="q${qi}" value="${oi}" ${qState.answers[qi]===oi?"checked":""} ${qState.submitted?"disabled":""}><span>${escapeHtml(opt)}</span></label>`).join("")}</div>
          ${qState.submitted ? `<p class="quiz-feedback ${qState.answers[qi]===q[2]?"correct":"incorrect"}">${qState.answers[qi]===q[2] ? "✓ To'g'ri" : "✗ To'g'ri javob: " + escapeHtml(q[1][q[2]])}</p>` : ""}
        </fieldset>`).join("")}
      ${qState.submitted
        ? `<div class="quiz-result"><strong>Natija: ${qState.score}%</strong> — ${qState.score>=70 ? "Ajoyib ish!" : "Materialni qayta ko'rib chiqing."}</div>
           <button type="button" class="btn btn-ghost" id="retakeBtn">Yangi test bilan qayta topshirish</button>`
        : `<button type="submit" class="btn btn-accent">Javoblarni yuborish</button>`}
    </form>
  `;
  const form = document.getElementById("quizForm");
  form.addEventListener("change", (e) => { if (e.target.name && e.target.name.startsWith("q")) qState.answers[Number(e.target.name.slice(1))] = Number(e.target.value); });
  if (!qState.submitted){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (Object.keys(qState.answers).length < questions.length){ toast("Yuborishdan oldin barcha savollarga javob bering."); return; }
      let correct = 0; questions.forEach((q,qi) => { if (qState.answers[qi] === q[2]) correct++; });
      qState.score = Math.round((correct / questions.length) * 100); qState.submitted = true; persistQuizState();
      if (!d.rev){ markComplete(d.d, qState.score); toast(qState.score>=70 ? "Dars tugadi! XP qo'shildi." : "Dars tugadi. Materialni qayta ko'rib chiqing."); }
      else toast(`Takrorlash testi yuborildi — natija ${qState.score}%.`);
      render();
    });
  } else {
    const retake = document.getElementById("retakeBtn");
    if (retake) retake.addEventListener("click", () => { state.quizState[d.d] = { answers:{}, submitted:false, questions: buildQuizQuestions(d) }; persistQuizState(); render(); });
  }
}
function persistQuizState(){ const flat = {}; Object.keys(state.quizState).forEach(k => { flat[k] = state.quizState[k]; }); saveJSON(QUIZ_KEY, flat); }

function renderSpeakTab(d, body){
  const prompt = d.sp;
  const supported = speechSupported();
  body.innerHTML = `
    <div class="speak-panel">
      <span class="tip-label mono">GAPIRISH MASHQI</span>
      <p class="speak-prompt-en">${escapeHtml(prompt[0])}</p>
      ${state.settings.showUz ? `<p class="speak-prompt-uz">${escapeHtml(prompt[1])}</p>` : ""}
      ${d.dl ? `<div class="speak-target-wrap"><p class="speak-target-label mono">BUGUNGI SUHBATDAN BIR QATOR AYTIB KO'RING:</p>
        <select id="targetSelect" class="select" aria-label="Qator tanlang">${d.dl.map((l,i)=>`<option value="${i}">${escapeHtml(l[1])}</option>`).join("")}</select></div>` : ""}
      <div class="radio-check">
        <button class="btn btn-accent" id="micBtn" ${!supported?"disabled":""}>${icon("mic",16)} <span class="mic-btn-label">${supported ? "Tekshiruvni boshlash" : "Mikrofon qo'llab-quvvatlanmaydi"}</span></button>
        <div id="micResult" class="mic-result"></div>
      </div>
      ${!supported ? `<p class="hint">Nutqni tanish Chrome asosidagi brauzerlarda yaxshi ishlaydi.</p>` : ""}
    </div>
  `;
  if (supported && d.dl){
    const micBtn = document.getElementById("micBtn"), resultEl = document.getElementById("micResult");
    micBtn.addEventListener("click", () => {
      const select = document.getElementById("targetSelect");
      const target = d.dl[Number(select.value)][1];
      const rec = new SR(); rec.lang = "ko-KR"; rec.interimResults = false; rec.maxAlternatives = 1;
      micBtn.innerHTML = `${icon("mic",16)} <span class="mic-btn-label">Tinglanmoqda…</span>`; micBtn.disabled = true; resultEl.innerHTML = "";
      rec.onresult = (event) => {
        const heard = event.results[0][0].transcript;
        const score = similarity(heard, target);
        resultEl.innerHTML = `<p class="mic-heard">Siz aytdingiz: “${escapeHtml(heard)}”</p><p class="mic-score ${score>=70?"good":score>=40?"okay":"low"}">Moslik: ${score}% — ${score>=70 ? "Barakalla!" : score>=40 ? "Yaqinlashyapsiz." : "Yana urinib ko'ring."}</p>`;
      };
      rec.onerror = () => { resultEl.innerHTML = `<p class="mic-heard">Aniq eshitilmadi. Yana urinib ko'ring.</p>`; };
      rec.onend = () => { micBtn.innerHTML = `${icon("mic",16)} <span class="mic-btn-label">Tekshiruvni boshlash</span>`; micBtn.disabled = false; };
      rec.start();
    });
  }
}

// ---------- Glossary / Homework ----------
const HW_SESSION_SIZE = 20;
let HOMEWORK_SESSIONS_CACHE = null;
function buildGlossary(){
  const map = new Map();
  CURRICULUM.forEach(d => { if (d.v) d.v.forEach(([ko,uz,ex]) => { const key = ko; if (!map.has(key)) map.set(key, { en: ko, uz, ex, day: d.d }); }); });
  return Array.from(map.values());
}
function homeworkSessions(){
  if (HOMEWORK_SESSIONS_CACHE) return HOMEWORK_SESSIONS_CACHE;
  const glossary = buildGlossary();
  const chunks = [];
  for (let i = 0; i < glossary.length; i += HW_SESSION_SIZE) chunks.push(glossary.slice(i, i + HW_SESSION_SIZE));
  HOMEWORK_SESSIONS_CACHE = chunks;
  return chunks;
}
function isHomeworkDone(n){ return !!state.progress.homeworkDone[n]; }
function homeworkDoneCount(){ return Object.keys(state.progress.homeworkDone).length; }
function markHomeworkComplete(n, score){ const wasDone = isHomeworkDone(n); state.progress.homeworkDone[n] = { date: todayStr(), score }; if (!wasDone) state.progress.xp += 80 + (score || 0) * 3; saveProgress(); }

function renderHomework(){
  const app = document.getElementById("app");
  const sessions = homeworkSessions();
  const done = homeworkDoneCount();
  const pct = sessions.length ? Math.round((done / sessions.length) * 100) : 0;
  const totalWords = sessions.reduce((s,c) => s+c.length, 0);
  if (!state.hwExpanded) state.hwExpanded = {};
  app.innerHTML = `
    <section class="hero-strip">
      <div class="hero-left">
        <p class="eyebrow">UYGA VAZIFA</p>
        <h1 class="hwy-title">Lug'at mashqi</h1>
        <p class="hero-sub">Kursdagi har bir so'z, ${HW_SESSION_SIZE} tadan guruhlarga bo'lingan. Bo'limni oching, so'zlarni o'rganing, keyin testdan o'ting.</p>
      </div>
      <div class="hero-stats"><div class="stat-tile"><span class="stat-num">${done}<span class="stat-den">/${sessions.length}</span></span><span class="stat-label">Bo'lim tugadi</span></div></div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Lug'at — O'rganish va test</h2><p class="panel-sub">${totalWords} ta so'z. Qidiring yoki bo'limni oching.</p></div>
      <input type="search" id="hwSearch" class="search-input" aria-label="So'z qidirish" placeholder="So'z qidiring..." value="${escapeHtml(state.hwSearchQuery||"")}">
      <div class="progressbar" id="hwProgressbar"><div class="progressbar-fill" style="width:${pct}%"></div></div>
      <div id="hwBody"></div>
    </section>
  `;
  const searchInput = document.getElementById("hwSearch");
  searchInput.addEventListener("input", (e) => { state.hwSearchQuery = e.target.value; drawHomeworkBody(); });
  drawHomeworkBody();

  function drawHomeworkBody(){
    const bodyEl = document.getElementById("hwBody");
    const progressEl = document.getElementById("hwProgressbar");
    const query = (state.hwSearchQuery || "").trim().toLowerCase();
    if (query){
      progressEl.hidden = true;
      const matches = [];
      sessions.forEach((words, i) => { words.forEach(w => { if (w.en.toLowerCase().includes(query) || w.uz.toLowerCase().includes(query)) matches.push({ ...w, session: i }); }); });
      bodyEl.innerHTML = matches.length ? `<div class="gloss-list">${matches.map(w => `
        <div class="gloss-item"><div class="gloss-main"><span class="gloss-en">${escapeHtml(w.en)}</span><button class="speak-btn" data-speak="${escapeHtml(w.en)}" aria-label="Tinglash">${icon("speaker",18)}</button></div>
        ${state.settings.showUz ? `<span class="gloss-uz">${escapeHtml(w.uz)}</span>` : ""}<span class="gloss-ex">&ldquo;${escapeHtml(w.ex)}&rdquo;</span>
        <button class="gloss-daylink mono" data-jump="${w.session}">Bo'lim ${w.session + 1}</button></div>`).join("")}</div>` : `<p class="panel-sub">Hech narsa topilmadi.</p>`;
      bodyEl.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", () => speak(btn.dataset.speak)));
      bodyEl.querySelectorAll("[data-jump]").forEach(btn => btn.addEventListener("click", () => {
        const target = Number(btn.dataset.jump); state.hwSearchQuery = ""; state.hwExpanded[target] = true; setView("homework");
        const el = document.getElementById("hw-session-" + target); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
      return;
    }
    progressEl.hidden = false;
    bodyEl.innerHTML = `<div class="accordion">${sessions.map((words, i) => {
      const n = i + 1, doneInfo = state.progress.homeworkDone[n], expanded = !!state.hwExpanded[i];
      return `<div class="accordion-item${expanded?" open":""}" id="hw-session-${i}">
        <button class="accordion-header" data-toggle="${i}">
          <span class="accordion-lead"><span class="acc-badge${doneInfo ? " done" : ""}">${doneInfo ? icon("check",20) : n}</span>
            <span class="accordion-title"><span class="accordion-num mono">BO'LIM ${n}</span><span class="acc-range">${escapeHtml(words[0].en)} &ndash; ${escapeHtml(words[words.length-1].en)}</span></span></span>
          <span class="accordion-right">${doneInfo ? `<span class="grammar-card-badge">✓ ${doneInfo.score}%</span>` : `<span class="grammar-card-badge muted">${words.length} so'z</span>`}<span class="accordion-chevron">${icon("chevronRight",16)}</span></span>
        </button>
        ${expanded ? `<div class="accordion-body"><div class="practice-header"><p class="panel-sub">${words.length} ta so'z.</p><button class="btn btn-ghost btn-sm" data-playsession="${i}">${icon("play",14)} Hammasini tinglash</button></div>
          <div class="transcript">${words.map(w => `<div class="transcript-line" style="grid-template-columns:1fr 34px;"><div class="line-text"><p class="line-en">${escapeHtml(w.en)}</p>${state.settings.showUz ? `<p class="line-uz">${escapeHtml(w.uz)}</p>` : ""}<p class="fib-uz" style="font-style:italic;">&ldquo;${escapeHtml(w.ex)}&rdquo;</p></div><button class="speak-btn" data-speak="${escapeHtml(w.en)}" aria-label="Tinglash">${icon("speaker",18)}</button></div>`).join("")}</div>
          <button class="btn btn-accent" data-quiz="${i}" style="margin-top:14px;">${doneInfo ? "Testni qayta topshirish" : "Testni topshirish"}</button></div>` : ""}
      </div>`;
    }).join("")}</div>`;
    bodyEl.querySelectorAll("[data-toggle]").forEach(btn => btn.addEventListener("click", () => { state.hwExpanded[Number(btn.dataset.toggle)] = !state.hwExpanded[Number(btn.dataset.toggle)]; drawHomeworkBody(); }));
    bodyEl.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); speak(btn.dataset.speak); }));
    bodyEl.querySelectorAll("[data-quiz]").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); setView("homeworkSession", { currentSession: Number(btn.dataset.quiz) }); }));
    bodyEl.querySelectorAll("[data-playsession]").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); speakQueue(sessions[Number(btn.dataset.playsession)].map(w => w.en)); }));
  }
}
function renderHomeworkSession(sessionIndex){
  const app = document.getElementById("app");
  const sessions = homeworkSessions();
  const words = sessions[sessionIndex];
  if (!words) { setView("homework"); return; }
  const n = sessionIndex + 1, prevOk = sessionIndex > 0, nextOk = sessionIndex < sessions.length - 1;
  const doneInfo = state.progress.homeworkDone[n];
  app.innerHTML = `
    <section class="lesson-head">
      <div class="lesson-head-top"><button class="btn btn-ghost btn-sm" id="backToHomeworkBtn">&larr; Uyga vazifa</button>
        <div class="lesson-pager"><button class="btn btn-ghost btn-sm" id="prevSessionBtn" ${!prevOk?"disabled":""}>&larr; Oldingi</button><button class="btn btn-ghost btn-sm" id="nextSessionBtn" ${!nextOk?"disabled":""}>Keyingi &rarr;</button></div></div>
      <p class="eyebrow">UYGA VAZIFA · BO'LIM ${n} / ${sessions.length}</p>
      <h1 class="hwy-title">${words.length} ta so'zni o'rganing</h1>
      <div class="lesson-badges">${doneInfo ? `<span class="badge-complete">✓ Tugatilgan · natija ${doneInfo.score}%</span>` : `<span class="badge-time mono">${icon("clock",14)} O'rganing, keyin test</span>`}</div>
    </section>
    <section class="panel">
      <div class="practice-header"><p class="panel-sub">Hammasini o'qing, so'ng pastdagi testdan o'ting.</p><button class="btn btn-accent btn-sm" id="playAllWordsBtn">${icon("play",14)} Hammasini tinglash</button></div>
      <div class="transcript">${words.map(w => `<div class="transcript-line" style="grid-template-columns:1fr 34px;"><div class="line-text"><p class="line-en">${escapeHtml(w.en)}</p>${state.settings.showUz ? `<p class="line-uz">${escapeHtml(w.uz)}</p>` : ""}<p class="fib-uz" style="font-style:italic;">&ldquo;${escapeHtml(w.ex)}&rdquo;</p></div><button class="speak-btn" data-speak="${escapeHtml(w.en)}" aria-label="Tinglash">${icon("speaker",18)}</button></div>`).join("")}</div>
    </section>
    <section class="panel" id="hwQuizPanel"><div class="panel-head"><h2>Test — Vazifani tugatish uchun</h2></div><div id="hwQuizBody"></div></section>
  `;
  document.getElementById("backToHomeworkBtn").addEventListener("click", () => setView("homework"));
  if (prevOk) document.getElementById("prevSessionBtn").addEventListener("click", () => setView("homeworkSession", { currentSession: sessionIndex - 1 }));
  if (nextOk) document.getElementById("nextSessionBtn").addEventListener("click", () => setView("homeworkSession", { currentSession: sessionIndex + 1 }));
  app.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", () => speak(btn.dataset.speak)));
  document.getElementById("playAllWordsBtn").addEventListener("click", () => speakQueue(words.map(w => w.en)));
  renderHomeworkQuiz(sessionIndex, words);
}
function buildHomeworkQuiz(words){ return shuffle(generateVocabQuestions(words.map(w => [w.en, w.uz]), words.length)); }
function renderHomeworkQuiz(sessionIndex, words){
  const n = sessionIndex + 1;
  const body = document.getElementById("hwQuizBody");
  const saved = loadJSON(HW_QUIZ_KEY, {});
  if (!state.homeworkQuizState) state.homeworkQuizState = {};
  if (!state.homeworkQuizState[n]) state.homeworkQuizState[n] = saved[n] || {};
  const qState = state.homeworkQuizState[n];
  if (!qState.questions || !qState.questions.length){ qState.questions = buildHomeworkQuiz(words); qState.answers = {}; qState.submitted = false; }
  const questions = qState.questions;
  body.innerHTML = `
    <p class="panel-sub">${questions.length} ta savol — har bir so'z uchun bittadan.</p>
    <form id="hwQuizForm">${questions.map((q,qi) => `
      <fieldset class="quiz-q"><legend>${qi+1}. ${escapeHtml(q[0])}</legend>
        <div class="quiz-opts">${q[1].map((opt,oi) => `<label class="quiz-opt"><input type="radio" name="hq${qi}" value="${oi}" ${qState.answers[qi]===oi?"checked":""} ${qState.submitted?"disabled":""}><span>${escapeHtml(opt)}</span></label>`).join("")}</div>
        ${qState.submitted ? `<p class="quiz-feedback ${qState.answers[qi]===q[2]?"correct":"incorrect"}">${qState.answers[qi]===q[2] ? "✓ To'g'ri" : "✗ To'g'ri javob: " + escapeHtml(q[1][q[2]])}</p>` : ""}
      </fieldset>`).join("")}
      ${qState.submitted ? `<div class="quiz-result"><strong>Natija: ${qState.score}%</strong> — Uyga vazifa tugadi.</div><button type="button" class="btn btn-ghost" id="hwRetakeBtn">Qayta topshirish</button>`
                          : `<button type="submit" class="btn btn-accent">Yuborish va vazifani tugatish</button>`}
    </form>`;
  const form = document.getElementById("hwQuizForm");
  form.addEventListener("change", (e) => { if (e.target.name && e.target.name.startsWith("hq")) qState.answers[Number(e.target.name.slice(2))] = Number(e.target.value); });
  if (!qState.submitted){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (Object.keys(qState.answers).length < questions.length){ toast("Yuborishdan oldin barcha savollarga javob bering."); return; }
      let correct = 0; questions.forEach((q,qi) => { if (qState.answers[qi] === q[2]) correct++; });
      qState.score = Math.round((correct / questions.length) * 100); qState.submitted = true; persistHomeworkQuizState();
      markHomeworkComplete(n, qState.score); toast(`Bo'lim ${n} uyga vazifasi tugadi! XP qo'shildi.`); render();
    });
  } else {
    const retake = document.getElementById("hwRetakeBtn");
    if (retake) retake.addEventListener("click", () => { state.homeworkQuizState[n] = { answers:{}, submitted:false, questions: buildHomeworkQuiz(words) }; persistHomeworkQuizState(); renderHomeworkQuiz(sessionIndex, words); });
  }
}
function persistHomeworkQuizState(){ saveJSON(HW_QUIZ_KEY, state.homeworkQuizState || {}); }

// ---------- Grammar Book ----------
function grammarCategories(){ return [...new Set((typeof GRAMMAR !== "undefined" ? GRAMMAR : []).map(u => u.cat))]; }
function categoryProgress(cat){ const units = GRAMMAR.filter(u => u.cat === cat); const done = units.filter(u => isGrammarDone(u.id)).length; return { done, total: units.length }; }
function renderGrammarBook(){
  const app = document.getElementById("app");
  const cats = grammarCategories();
  const done = grammarDoneCount();
  app.innerHTML = `
    <section class="hero-strip">
      <div class="hero-left"><p class="eyebrow">GRAMMATIKA KITOBI</p><h1 class="hwy-title">Koreys tili grammatikasi</h1>
        <p class="hero-sub">${GRAMMAR.length} ta bo'lim, ${cats.length} ta mavzuga bo'lingan — har biri o'zbek tilida tushuntirilgan. Istalgan tartibda ko'ring, hech narsa qulflangan emas.</p></div>
      <div class="hero-stats"><div class="stat-tile"><span class="stat-num">${done}<span class="stat-den">/${GRAMMAR.length}</span></span><span class="stat-label">Bo'lim tugadi</span></div></div>
    </section>
    <section class="panel"><div class="panel-head"><h2>Mavzular</h2></div>
      <div class="week-grid">${cats.map(cat => { const cp = categoryProgress(cat); const pct = Math.round((cp.done/cp.total)*100);
        return `<button class="week-card" data-cat="${escapeHtml(cat)}"><span class="week-num">${cp.total} BO'LIM</span><span class="week-title">${escapeHtml(cat)}</span><span class="week-bar"><span style="width:${pct}%"></span></span><span class="week-count mono">${cp.done}/${cp.total} tugadi</span></button>`; }).join("")}</div>
    </section>
  `;
  app.querySelectorAll("[data-cat]").forEach(btn => btn.addEventListener("click", () => setView("grammarCategory", { currentCategory: btn.dataset.cat })));
}
function renderGrammarCategory(cat){
  const app = document.getElementById("app");
  const units = GRAMMAR.filter(u => u.cat === cat);
  if (!units.length) { setView("grammar"); return; }
  const cp = categoryProgress(cat);
  app.innerHTML = `
    <section class="lesson-head"><div class="lesson-head-top"><button class="btn btn-ghost btn-sm" id="backToGrammarBtn">&larr; Grammatika kitobi</button></div>
      <p class="eyebrow">GRAMMATIKA KITOBI</p><h1 class="hwy-title">${escapeHtml(cat)}</h1><p class="hero-sub">${cp.total} ta bo'lim · ${cp.done} tasi tugadi.</p></section>
    <section class="panel"><div class="grammar-grid">${units.map(u => `
      <button class="grammar-card${isGrammarDone(u.id)?" done":""}" data-unit="${u.id}"><span class="grammar-card-title">${escapeHtml(u.title)}</span>
        ${isGrammarDone(u.id) ? `<span class="grammar-card-badge">✓ ${state.progress.grammarDone[u.id].score}%</span>` : `<span class="grammar-card-badge muted">Boshlanmagan</span>`}</button>`).join("")}</div></section>
  `;
  document.getElementById("backToGrammarBtn").addEventListener("click", () => setView("grammar"));
  app.querySelectorAll("[data-unit]").forEach(btn => btn.addEventListener("click", () => setView("grammarUnit", { currentUnit: btn.dataset.unit, currentCategory: cat })));
}
function renderGrammarUnit(unitId){
  const u = grammarUnitById(unitId);
  const app = document.getElementById("app");
  if (!u) { setView("grammar"); return; }
  const catUnits = GRAMMAR.filter(x => x.cat === u.cat);
  const idx = catUnits.findIndex(x => x.id === unitId);
  const prev = catUnits[idx - 1], next = catUnits[idx + 1];
  app.innerHTML = `
    <section class="lesson-head"><div class="lesson-head-top"><button class="btn btn-ghost btn-sm" id="backToGrammarBtn">&larr; ${escapeHtml(u.cat)}</button>
        <div class="lesson-pager"><button class="btn btn-ghost btn-sm" id="prevUnitBtn" ${!prev?"disabled":""}>&larr; Oldingi</button><button class="btn btn-ghost btn-sm" id="nextUnitBtn" ${!next?"disabled":""}>Keyingi &rarr;</button></div></div>
      <p class="eyebrow">${escapeHtml(u.cat).toUpperCase()}</p><h1 class="hwy-title">${escapeHtml(u.title)}</h1>
      ${isGrammarDone(u.id) ? `<div class="lesson-badges"><span class="badge-complete">✓ Tugatilgan · natija ${state.progress.grammarDone[u.id].score}%</span></div>` : ""}
    </section>
    <section class="panel"><div class="panel-head"><h2>Tushuntirish</h2></div>${u.explain.map(p => `<p class="grammar-explain">${escapeHtml(p)}</p>`).join("")}</section>
    <section class="panel"><div class="panel-head"><h2>Misollar</h2></div><div class="transcript">${u.examples.map(([ko,uz]) => `
      <div class="transcript-line" style="grid-template-columns:1fr 34px;"><div class="line-text"><p class="line-en">${escapeHtml(ko)}</p><p class="line-uz">${escapeHtml(uz)}</p></div><button class="speak-btn" data-speak="${escapeHtml(ko)}" aria-label="Tinglash">${icon("speaker",18)}</button></div>`).join("")}</div></section>
    <section class="panel"><div class="panel-head"><h2>Keng tarqalgan xato</h2></div><div class="mistake-box">
      <p class="mistake-line wrong">✗ ${escapeHtml(u.mistakeWrong)}</p><p class="mistake-line right">✓ ${escapeHtml(u.mistakeRight)}</p><p class="mistake-why">${escapeHtml(u.mistakeWhy)}</p></div></section>
    <section class="panel" id="grammarQuizPanel"><div class="panel-head"><h2>Test</h2></div><div id="grammarQuizBody"></div></section>
  `;
  document.getElementById("backToGrammarBtn").addEventListener("click", () => setView("grammarCategory", { currentCategory: u.cat }));
  if (prev) document.getElementById("prevUnitBtn").addEventListener("click", () => setView("grammarUnit", { currentUnit: prev.id, currentCategory: u.cat }));
  if (next) document.getElementById("nextUnitBtn").addEventListener("click", () => setView("grammarUnit", { currentUnit: next.id, currentCategory: u.cat }));
  app.querySelectorAll("[data-speak]").forEach(btn => btn.addEventListener("click", () => speak(btn.dataset.speak)));
  renderGrammarQuiz(u);
}
function renderGrammarQuiz(u){
  const body = document.getElementById("grammarQuizBody");
  const saved = loadJSON(GRAMMAR_QUIZ_KEY, {});
  if (!state.grammarQuizState[u.id]) state.grammarQuizState[u.id] = saved[u.id] || { answers:{}, submitted:false };
  const qState = state.grammarQuizState[u.id];
  body.innerHTML = `
    <form id="grammarQuizForm">${u.quiz.map((q,qi) => `
      <fieldset class="quiz-q"><legend>${qi+1}. ${escapeHtml(q[0])}</legend>
        <div class="quiz-opts">${q[1].map((opt,oi) => `<label class="quiz-opt"><input type="radio" name="gq${qi}" value="${oi}" ${qState.answers[qi]===oi?"checked":""} ${qState.submitted?"disabled":""}><span>${escapeHtml(opt)}</span></label>`).join("")}</div>
        ${qState.submitted ? `<p class="quiz-feedback ${qState.answers[qi]===q[2]?"correct":"incorrect"}">${qState.answers[qi]===q[2] ? "✓ To'g'ri" : "✗ To'g'ri javob: " + escapeHtml(q[1][q[2]])}</p>` : ""}
      </fieldset>`).join("")}
      ${qState.submitted ? `<div class="quiz-result"><strong>Natija: ${qState.score}%</strong></div><button type="button" class="btn btn-ghost" id="grammarRetakeBtn">Qayta topshirish</button>`
                          : `<button type="submit" class="btn btn-accent">Javoblarni yuborish</button>`}
    </form>`;
  const form = document.getElementById("grammarQuizForm");
  form.addEventListener("change", (e) => { if (e.target.name && e.target.name.startsWith("gq")) qState.answers[Number(e.target.name.slice(2))] = Number(e.target.value); });
  if (!qState.submitted){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (Object.keys(qState.answers).length < u.quiz.length){ toast("Yuborishdan oldin barcha savollarga javob bering."); return; }
      let correct = 0; u.quiz.forEach((q,qi) => { if (qState.answers[qi] === q[2]) correct++; });
      qState.score = Math.round((correct / u.quiz.length) * 100); qState.submitted = true; persistGrammarQuizState();
      markGrammarComplete(u.id, qState.score); toast("Bo'lim tugadi! XP qo'shildi."); render();
    });
  } else {
    const retake = document.getElementById("grammarRetakeBtn");
    if (retake) retake.addEventListener("click", () => { state.grammarQuizState[u.id] = { answers:{}, submitted:false }; persistGrammarQuizState(); renderGrammarQuiz(u); });
  }
}
function persistGrammarQuizState(){ const flat = {}; Object.keys(state.grammarQuizState).forEach(k => { flat[k] = state.grammarQuizState[k]; }); saveJSON(GRAMMAR_QUIZ_KEY, flat); }

// ---------- Final test: draws from EVERY lesson of this course ----------
function buildFinalTestQuestions(){
  const lessons = CURRICULUM.filter(d => !d.final && d.v && d.v.length);
  const fromEachLesson = lessons.flatMap(d => {
    const own = (d.qz || []).slice(0, 2).map(q => q.slice());
    const vocab = generateVocabQuestions(d.v, 2);
    return own.concat(vocab);
  });
  return shuffle(fromEachLesson);
}
function renderFinalTest(d, app, prev, next){
  const qs = loadJSON(QUIZ_KEY, {});
  if (!state.quizState[d.d]) state.quizState[d.d] = qs[d.d] || {};
  const qState = state.quizState[d.d];
  if (!qState.questions || !qState.questions.length){ qState.questions = buildFinalTestQuestions(); qState.answers = {}; qState.submitted = false; }
  const questions = qState.questions;
  const PASS = 70;
  app.innerHTML = `
    <section class="lesson-head">
      <div class="lesson-head-top"><button class="btn btn-ghost btn-sm" id="backBtn">&larr; ${d.lvl} darajasi</button></div>
      <p class="eyebrow">${icon("trophy",14)} YAKUNIY TEST</p>
      <h1 class="hwy-title">${escapeHtml(d.t)}</h1>
      <p class="hero-sub">${questions.length} ta savol — butun kursning HAR BIR darsidan. ${PASS}% yoki undan yuqori natija kursni tugatadi.</p>
      ${state.progress.courseFinished ? `<div class="lesson-badges"><span class="badge-complete">✓ Kurs tugatildi · natija ${state.progress.courseFinished.score}%</span></div>` : ""}
    </section>
    <section class="panel" id="finalBody"></section>
  `;
  document.getElementById("backBtn").addEventListener("click", () => setView("levelDetail", { currentLevel: d.lvl }));
  const body = document.getElementById("finalBody");
  function draw(){
    body.innerHTML = `
      <form id="finalForm">${questions.map((q,qi) => `
        <fieldset class="quiz-q"><legend>${qi+1}. ${escapeHtml(q[0])}</legend>
          <div class="quiz-opts">${q[1].map((opt,oi) => `<label class="quiz-opt"><input type="radio" name="f${qi}" value="${oi}" ${qState.answers[qi]===oi?"checked":""} ${qState.submitted?"disabled":""}><span>${escapeHtml(opt)}</span></label>`).join("")}</div>
          ${qState.submitted ? `<p class="quiz-feedback ${qState.answers[qi]===q[2]?"correct":"incorrect"}">${qState.answers[qi]===q[2] ? "✓ To'g'ri" : "✗ To'g'ri javob: " + escapeHtml(q[1][q[2]])}</p>` : ""}
        </fieldset>`).join("")}
        ${qState.submitted
          ? `<div class="quiz-result"><strong>Natija: ${qState.score}%</strong> — ${qState.score>=PASS ? "Kursni muvaffaqiyatli tugatdingiz!" : "Yana urinib ko'ring — " + PASS + "% kerak."}</div>
             ${qState.score>=PASS ? `<button type="button" class="btn btn-accent" id="certBtn">${icon("trophy",16)} Sertifikatni ko'rish</button>` : ""}
             <button type="button" class="btn btn-ghost" id="finalRetakeBtn">Qayta topshirish</button>`
          : `<button type="submit" class="btn btn-accent">Yakuniy testni yuborish</button>`}
      </form>`;
    const form = document.getElementById("finalForm");
    form.addEventListener("change", (e) => { if (e.target.name && e.target.name.startsWith("f")) qState.answers[Number(e.target.name.slice(1))] = Number(e.target.value); });
    if (!qState.submitted){
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (Object.keys(qState.answers).length < questions.length){ toast("Yuborishdan oldin barcha savollarga javob bering."); return; }
        let correct = 0; questions.forEach((q,qi) => { if (qState.answers[qi] === q[2]) correct++; });
        qState.score = Math.round((correct / questions.length) * 100); qState.submitted = true; persistQuizState();
        markComplete(d.d, qState.score);
        if (qState.score >= PASS) state.progress.courseFinished = { date: todayStr(), score: qState.score };
        saveProgress();
        toast(qState.score>=PASS ? "Barakalla! Kursni tugatdingiz." : `Natija ${qState.score}%. ${PASS}% kerak — qayta urinib ko'ring.`);
        draw();
      });
    } else {
      const retake = document.getElementById("finalRetakeBtn");
      if (retake) retake.addEventListener("click", () => { state.quizState[d.d] = { answers:{}, submitted:false, questions: buildFinalTestQuestions() }; persistQuizState(); draw(); });
      const cert = document.getElementById("certBtn");
      if (cert) cert.addEventListener("click", showCertificate);
    }
  }
  draw();
}

// ---------- Progress page ----------
function renderProgressPage(){
  const app = document.getElementById("app");
  const done = completedCount();
  const total = CURRICULUM.length;
  const entries = Object.entries(state.progress.completed).map(([day,info]) => ({ day:Number(day), ...info })).sort((a,b)=>a.day-b.day);
  const avgScore = entries.length ? Math.round(entries.reduce((s,e)=>s+(e.score||0),0)/entries.length) : 0;
  const cf = state.progress.courseFinished;
  app.innerHTML = `
    <section class="panel"><div class="panel-head"><h2>Sizning natijalaringiz</h2></div>
      <div class="hero-stats" style="margin-bottom:1.5rem;">
        <div class="stat-tile"><span class="stat-num">${done}<span class="stat-den">/${total}</span></span><span class="stat-label">Dars tugadi</span></div>
        <div class="stat-tile"><span class="stat-num">${state.progress.streak}</span><span class="stat-label">Kunlik ketma-ketlik</span></div>
        <div class="stat-tile"><span class="stat-num">${avgScore}%</span><span class="stat-label">O'rtacha natija</span></div>
        <div class="stat-tile"><span class="stat-num">${state.progress.xp}</span><span class="stat-label">Jami XP</span></div>
      </div>
      ${cf ? `<div class="cert-callout">${icon("trophy",22)}<p>Siz kursni tugatdingiz!</p><button class="btn btn-accent" id="certBtn">Sertifikatni ko'rish / chop etish</button></div>` : `<p class="panel-sub">Kursni tugatish uchun yakuniy testdan o'ting.</p>`}
    </section>
    <section class="panel"><div class="panel-head"><h2>Grammatika kitobi</h2><p class="panel-sub">${grammarDoneCount()} / ${GRAMMAR.length} bo'lim tugadi.</p></div>
      <div class="progressbar"><div class="progressbar-fill" style="width:${Math.round((grammarDoneCount()/GRAMMAR.length)*100)}%"></div></div>
      <button class="btn btn-ghost btn-sm" id="openGrammarBtn">${icon("grammar",14)} Grammatika kitobini ochish</button>
    </section>
    <section class="panel"><div class="panel-head"><h2>Tugatilgan darslar</h2></div>
      ${entries.length ? `<div class="log-table"><div class="log-row log-head mono"><span>Dars</span><span>Sana</span><span>Natija</span></div>
        ${entries.map(e => `<div class="log-row"><span>${dayByNum(e.day) ? escapeHtml(dayByNum(e.day).t) : e.day}</span><span class="mono">${e.date}</span><span class="mono">${e.score}%</span></div>`).join("")}</div>`
        : `<p class="panel-sub">Hali hech qanday dars tugatilmagan — Darslar bo'limidan boshlang.</p>`}
    </section>
  `;
  if (cf) document.getElementById("certBtn").addEventListener("click", showCertificate);
  document.getElementById("openGrammarBtn").addEventListener("click", () => setView("grammar"));
}

function showCertificate(){
  const name = state.progress.name || window.prompt("Sertifikat uchun ismingizni kiriting:", "") || "Talaba";
  if (!state.progress.name){ state.progress.name = name; saveProgress(); }
  const modal = document.getElementById("modalRoot");
  const date = new Date().toLocaleDateString("uz-UZ", { year:"numeric", month:"long", day:"numeric" });
  const cf = state.progress.courseFinished;
  modal.innerHTML = `
    <div class="modal-backdrop" id="certBackdrop"><div class="cert-sheet"><div class="cert-border">
      <p class="cert-eyebrow mono">${CFG.brand.toUpperCase()} · ${CFG.title.toUpperCase()}</p>
      <h2 class="cert-title">Tugatish sertifikati</h2>
      <p class="cert-line">Ushbu sertifikat tasdiqlaydiki</p>
      <p class="cert-name">${escapeHtml(name)}</p>
      <p class="cert-line">${CFG.title} kursini — barcha darslar, grammatika va yakuniy testni — muvaffaqiyatli tugatdi.</p>
      <div class="cert-footer"><div><span class="cert-date mono">${date}</span><span class="cert-foot-label">Sana</span></div><div><span class="cert-score mono">${cf ? cf.score : "—"}%</span><span class="cert-foot-label">Yakuniy test natijasi</span></div></div>
    </div><div class="cert-actions"><button class="btn btn-accent" id="printCertBtn">Chop etish / PDF</button><button class="btn btn-ghost" id="closeCertBtn">Yopish</button></div></div></div>
  `;
  document.getElementById("closeCertBtn").addEventListener("click", closeModal);
  document.getElementById("certBackdrop").addEventListener("click", (e) => { if (e.target.id==="certBackdrop") closeModal(); });
  document.getElementById("printCertBtn").addEventListener("click", () => window.print());
}
function closeModal(){ document.getElementById("modalRoot").innerHTML = ""; }

// ---------- Settings ----------
function renderSettings(){
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="panel"><div class="panel-head"><h2>Sozlamalar</h2></div>
      <div class="setting-row"><div><h3>Tarjimalarni ko'rsatish</h3><p class="panel-sub">Har bir koreyscha so'z, gap va savol ostida o'zbekcha tarjimani ko'rsatish.</p></div>
        <label class="switch"><input type="checkbox" id="toggleUz" ${state.settings.showUz?"checked":""}><span class="slider"></span></label></div>
      <div class="setting-row"><div><h3>Ko'rinish</h3><p class="panel-sub">Yorug' yoki qorong'i. "Avto" telefon sozlamasiga mos keladi.</p></div>
        <div class="seg" id="themeSeg" role="group" aria-label="Ko'rinish">${[["system","Avto"],["light","Yorug'"],["dark","Qorong'i"]].map(([v,l]) => `<button data-theme-opt="${v}" class="${(state.settings.theme||"system")===v?"active":""}">${l}</button>`).join("")}</div></div>
      <div class="setting-row"><div><h3>Gapirish tezligi</h3><p class="panel-sub">Boshlang'ich darajadagi talabalar uchun ovozni sekinlashtiring.</p></div>
        <input type="range" id="rateRange" aria-label="Gapirish tezligi" min="0.5" max="1.2" step="0.1" value="${state.settings.rate}"></div>
      ${!isStandalone() && (deferredInstallPrompt || isIOSDevice()) ? `<div class="setting-row"><div><h3>Ilovani o'rnatish</h3>
        <p class="panel-sub">${deferredInstallPrompt ? `${CFG.brand} ilovasini bosh ekranga qo'shing — oflayn ham ishlaydi.` : "iPhone/iPad: Safari'da Ulashish belgisini bosing, so'ng \"Bosh ekranga qo'shish\"."}</p></div>
        ${deferredInstallPrompt ? `<button class="btn btn-accent btn-sm" id="installAppBtn">O'rnatish</button>` : ""}</div>` : ""}
      <div class="setting-row"><div><h3>Ismingiz</h3><p class="panel-sub">Bosh sahifa va sertifikatda ko'rsatiladi.</p></div>
        <button class="btn btn-ghost btn-sm" id="editNameBtn2">${state.progress.name ? escapeHtml(state.progress.name) : "Ism kiritish"}</button></div>
    </section>
    <section class="panel"><details class="danger-zone"><summary><span>Qo'shimcha: boshidan boshlash</span><span class="danger-chev">${icon("chevronRight",16)}</span></summary>
      <div class="danger-body"><p class="panel-sub">Boshidan boshlash har bir tugatilgan darsni, test natijasini, XP va ketma-ketlikni shu qurilmadan o'chiradi. Buni ortga qaytarib bo'lmaydi.</p>
        <label class="danger-check"><input type="checkbox" id="resetAck"><span>Men barcha natijalarim o'chirilishini va buni ortga qaytarib bo'lmasligini tushunaman.</span></label>
        <button class="btn btn-danger" id="resetBtn" disabled>Barcha natijalarimni o'chirish</button></div>
    </details></section>
  `;
  document.getElementById("toggleUz").addEventListener("change", (e) => { state.settings.showUz = e.target.checked; saveSettings(); render(); });
  document.querySelectorAll("[data-theme-opt]").forEach(b => b.addEventListener("click", () => { state.settings.theme = b.dataset.themeOpt; saveSettings(); applyTheme(state.settings.theme); render(); }));
  document.getElementById("rateRange").addEventListener("input", (e) => { state.settings.rate = Number(e.target.value); saveSettings(); });
  document.getElementById("rateRange").addEventListener("change", () => speak("안녕하세요"));
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) installBtn.addEventListener("click", installApp);
  document.getElementById("editNameBtn2").addEventListener("click", promptName);
  const ack = document.getElementById("resetAck");
  ack.addEventListener("change", () => { document.getElementById("resetBtn").disabled = !ack.checked; });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!ack.checked) return;
    state.progress = { completed:{}, grammarDone:{}, homeworkDone:{}, roleplay:{}, xp:0, streak:0, lastDate:null, name:"", courseFinished:null };
    state.quizState = {}; state.grammarQuizState = {}; state.homeworkQuizState = {}; state.practiceState = {}; state.rolePlay = {}; state.flippedCards = {};
    saveProgress(); saveJSON(QUIZ_KEY, {}); saveJSON(GRAMMAR_QUIZ_KEY, {}); saveJSON(HW_QUIZ_KEY, {});
    toast("Natijalar o'chirildi."); setView("dashboard");
  });
}

// ---------- Init ----------
function init(){
  applyTheme(state.settings.theme);
  setView("dashboard");
  setTimeout(loadVoices, 300);
}
window.KT_mount = init;
window.KT_refresh = () => { if (state.view) render(); else renderNav(); };

init();   // no accounts yet: mount immediately instead of waiting for an auth gate

})();
