/* Natural-voice endpoint (Vercel serverless function). Korean and Uzbek only — this app never speaks English.
 *
 *   GET /api/tts?l=ko&g=female|male&t=<Korean phrase>   -> audio/mpeg
 *   GET /api/tts?l=uz&t=<Uzbek teaching line>            -> audio/mpeg (the teacher's Uzbek narration)
 *   GET /api/tts?health=1                                -> { configured, ... }  (never reveals a key)
 *
 * Safe to leave public because it only ever speaks phrases that exist in the courses (api/_phrases.json for Korean,
 * api/_phrases_uz.json for the teacher's Uzbek lines, both built by scripts/build-voice-phrases.mjs — run that
 * after editing any course's curriculum.js/grammar.js), so nobody can use it as a free text-to-speech service, and
 * a successful answer is cached forever (CDN + the student's device), so each phrase is generated once.
 * Any failure answers 503 *without* caching, and the app quietly falls back to the device voice.
 *
 *   ELEVENLABS_API_KEY   required
 *   ELEVENLABS_VOICE_KO (Korean voice id), ELEVENLABS_UZ_VOICE (Uzbek voice id) — both have working defaults below
 *   ELEVENLABS_MODEL_KO (default eleven_multilingual_v2), ELEVENLABS_MODEL_UZ (default eleven_v4)
 */
"use strict";

const PHRASES_KO = new Set(safeRequire("./_phrases.json"));
const PHRASES_UZ = new Set(safeRequire("./_phrases_uz.json"));
function safeRequire(p){ try { return require(p); } catch (e) { return []; } }

function normalize(s) {
  return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
}

// Defaults: native-Korean voices from ElevenLabs' shared voice library (not a generic English voice stretched via
// the multilingual model, which is what this used to default to and sounded accented). "Yeonhee" (female, lively,
// standard accent) and "JaeGyu" (male, calm, standard accent) — checked by ear against real lesson lines.
// Uzbek: the same voice/model truck-talk-webapp already proved works for Uzbek narration (eleven_v4, native-sounding).
const KO_VOICE = "vhhJX7dyal9WlYW2UAsj";       // Yeonhee
const KO_VOICE_MALE = "gKJdDVRmX8dROO8aA5I8";  // JaeGyu
const UZ_VOICE = "agoC45V78njTIxYzwmSb";

function synthKo(env, gender, text) {
  const voice = (gender === "male" ? env.ELEVENLABS_VOICE_KO_MALE : env.ELEVENLABS_VOICE_KO) || (gender === "male" ? KO_VOICE_MALE : KO_VOICE);
  return fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voice) + "?output_format=mp3_44100_64", {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({
      text, model_id: env.ELEVENLABS_MODEL_KO || "eleven_multilingual_v2", language_code: "ko",
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
}
function synthUz(env, text) {
  const voice = env.ELEVENLABS_UZ_VOICE || UZ_VOICE;
  return fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voice) + "?output_format=mp3_44100_64", {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({
      text, model_id: env.ELEVENLABS_MODEL_UZ || "eleven_v4", language_code: "uz",
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
}

function send(res, status, headers, body) {
  res.statusCode = status;
  res.setHeader("access-control-allow-origin", "*");
  for (const k of Object.keys(headers)) res.setHeader(k, headers[k]);
  res.end(body);
}
const json = (res, status, obj) => send(res, status, { "content-type": "application/json", "cache-control": "no-store" }, JSON.stringify(obj));

async function handler(req, res) {
  const env = process.env;
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  const configured = !!env.ELEVENLABS_API_KEY;

  if (q.health) return json(res, 200, { configured, korean: PHRASES_KO.size, uzbek: PHRASES_UZ.size });
  if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "method" });

  const gender = q.g === "male" ? "male" : "female";
  const text = normalize(q.t);
  if (!text || text.length > 300) return json(res, 400, { error: "bad-text" });
  const uz = q.l === "uz";
  if (!(uz ? PHRASES_UZ : PHRASES_KO).has(text)) return json(res, 404, { error: "not-in-course" });
  if (!configured) return json(res, 503, { error: "not-configured" });

  const once = () => (uz ? synthUz(env, text) : synthKo(env, gender, text));
  let up;
  try {
    try { up = await once(); if (up.status >= 500) up = await once(); } catch (e) { up = await once(); }
  } catch (e) { return json(res, 503, { error: "upstream-unreachable" }); }
  if (!up.ok) return json(res, 503, { error: "upstream-" + up.status });
  const audio = Buffer.from(await up.arrayBuffer());
  if (!audio.length) return json(res, 503, { error: "empty-audio" });
  send(res, 200, { "content-type": "audio/mpeg", "content-length": String(audio.length), "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable" }, audio);
}

module.exports = handler;
module.exports.normalize = normalize;
