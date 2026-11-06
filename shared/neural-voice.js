/* Natural voice for both courses (window.KTVoice). Plays audio from /api/tts, which turns each course phrase into a
 * lifelike recording once and caches it. If anything goes wrong (offline, voice not set up, quota used up, browser
 * can't play it) play() answers "failed" and the course falls back to the phone's built-in voice, so a student never
 * hears silence. Only Korean (the language being taught) and Uzbek (the teacher's narration) are ever spoken here —
 * never English.
 *
 *   KTVoice.usable()                      -> false after the server said it isn't set up (retried every 10 minutes)
 *   KTVoice.play(text, { gender, lang, rate, stale, onstart }) -> Promise<"played" | "stale" | "failed">
 *       lang: "ko" = Korean word/sentence being taught, "uz" = the teacher's Uzbek narration
 *   KTVoice.prefetch(text, gender, lang)  -> warm the next phrase of a list
 *   KTVoice.stop()                        -> silence now (pending play() calls resolve "stale")
 */
(function () {
  "use strict";
  var ENDPOINT = "/api/tts";
  var CACHE_NAME = "kt-voice-v1";
  var VOICE_VERSION = "1";   // bump when a voice/model changes: the audio is cached "forever" by URL
  var FETCH_TIMEOUT_MS = 12000;
  var RETRY_AFTER_MS = 10 * 60 * 1000;
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

  var audio = null, unlocked = false, disabledUntil = 0, current = null, generation = 0;
  var inflight = {};

  function ensureAudio() { if (!audio) { audio = new Audio(); audio.preload = "auto"; } return audio; }
  function unlock() {
    if (unlocked) return; unlocked = true;
    try { var a = ensureAudio(); a.src = SILENT; var p = a.play(); if (p && p.catch) p.catch(function () { unlocked = false; }); } catch (e) { unlocked = false; }
  }
  ["pointerdown", "touchend", "click", "keydown"].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });

  function urlFor(text, gender, lang) {
    return ENDPOINT + "?g=" + (gender === "male" ? "male" : "female") + (lang === "uz" || lang === "ko" ? "&l=" + lang + "&v=" + VOICE_VERSION : "") + "&t=" + encodeURIComponent(text);
  }
  function usable() { return typeof Audio !== "undefined" && typeof fetch === "function" && Date.now() >= disabledUntil; }

  function getBlob(text, gender, lang) {
    var url = urlFor(text, gender, lang);
    if (inflight[url]) return inflight[url];
    var p = (async function () {
      var cache = null;
      try { if (window.caches) cache = await caches.open(CACHE_NAME); } catch (e) {}
      if (cache) { try { var hit = await cache.match(url); if (hit) return await hit.blob(); } catch (e) {} }
      var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, FETCH_TIMEOUT_MS) : null;
      try {
        var res = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
        var type = (res.headers.get("content-type") || "");
        if (!res.ok || type.indexOf("audio") !== 0) {
          var json = type.indexOf("json") !== -1, code = "";
          if (json) { try { code = String((await res.json()).error || ""); } catch (e) {} }
          var out = (res.status === 503 && (!json || code === "not-configured" || /^upstream-(401|402|429)$/.test(code)))
            || ((res.status === 404 || res.status === 405) && !json);
          if (out) disabledUntil = Date.now() + RETRY_AFTER_MS;
          throw new Error("tts " + res.status);
        }
        var copy = res.clone();
        var blob = await res.blob();
        if (cache) { try { await cache.put(url, copy); } catch (e) {} }
        return blob;
      } finally { if (timer) clearTimeout(timer); }
    })();
    inflight[url] = p;
    var done = function () { delete inflight[url]; };
    p.then(done, done);
    return p;
  }

  function stop() {
    generation++;
    var c = current; current = null;
    if (audio) { try { audio.pause(); } catch (e) {} }
    if (c) c("stale");
  }

  function play(text, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      if (!usable()) return resolve("failed");
      stop();
      var myGen = generation;
      var finished = false;
      var objectUrl = null;
      var finish = function (result) {
        if (finished) return; finished = true;
        if (current === finish) current = null;
        if (objectUrl) { try { URL.revokeObjectURL(objectUrl); } catch (e) {} }
        resolve(result);
      };
      current = finish;
      getBlob(text, opts.gender, opts.lang).then(function (blob) {
        if (finished) return;
        if (myGen !== generation || (opts.stale && opts.stale())) return finish("stale");
        var a = ensureAudio();
        objectUrl = URL.createObjectURL(blob);
        a.onended = function () { finish("played"); };
        a.onerror = function () { finish("failed"); };
        a.onplaying = function () { if (opts.onstart) { try { opts.onstart(); } catch (e) {} } };
        a.src = objectUrl;
        a.defaultPlaybackRate = a.playbackRate = Math.min(1.25, Math.max(0.5, opts.rate || 1));
        a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = true;
        var p = a.play();
        if (p && p.catch) p.catch(function () { finish("failed"); });
      }).catch(function () { finish("failed"); });
    });
  }

  function prefetch(text, gender, lang) {
    if (!usable() || !text) return;
    getBlob(text, gender, lang).catch(function () {});
  }

  window.KTVoice = { usable: usable, play: play, prefetch: prefetch, stop: stop, _url: urlFor };
})();
