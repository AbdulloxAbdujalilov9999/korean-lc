/* Starts a live voice conversation with the ElevenLabs Korean Talk teacher agent (Vercel serverless function).
 * One shared agent serves both courses (Student's Book and Workbook) — the browser sends its own lesson/progress
 * context as dynamic variables (see shared/tutor-ui.js agentVariables()).
 *
 *   GET  /api/agent?health=1   -> { configured }
 *   POST /api/agent            -> { signedUrl, maxSeconds }
 *
 * The agent is private: the browser can only talk to it with a short-lived signed link this function asks
 * ElevenLabs for. The API key never leaves the server.
 *   ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID  (both required; the id comes from the ElevenLabs dashboard after
 *   importing elevenlabs/teacher.agent.json)
 */
"use strict";
const { checkUser, makeLimiter } = require("./_auth.js");

const MAX_SECONDS = 1800;   // keep equal to conversation.max_duration_seconds in elevenlabs/teacher.agent.json
const underLimit = makeLimiter({ perWindow: 4, windowMs: 60 * 60 * 1000, perDay: 12 });

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "authorization, content-type");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(obj));
}

async function handler(req, res) {
  const env = process.env;
  const now = Date.now();
  const configured = !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID);
  if (req.method === "OPTIONS") return send(res, 204, {});
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  if (req.method === "GET") return send(res, 200, q.health ? { configured } : { error: "method" });
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!configured) return send(res, 503, { error: "not-configured" });

  const auth = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return send(res, 401, { error: "sign-in" });
  const uid = await checkUser(token, now);
  if (!uid) return send(res, 403, { error: "not-allowed" });
  if (!underLimit(uid, now)) return send(res, 429, { error: "slow-down" });

  let up;
  try {
    up = await fetch("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=" + encodeURIComponent(env.ELEVENLABS_AGENT_ID),
      { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } });
  } catch (e) { return send(res, 503, { error: "upstream-unreachable" }); }
  if (!up.ok) {
    let detail = ""; try { detail = (await up.text()).slice(0, 300); } catch (e) {}
    console.error("agent: ElevenLabs answered " + up.status + " " + detail);
    return send(res, 503, { error: "upstream-" + up.status });
  }
  let signedUrl = "";
  try { signedUrl = (await up.json()).signed_url || ""; } catch (e) {}
  if (!/^wss:\/\//.test(signedUrl)) return send(res, 503, { error: "bad-link" });
  send(res, 200, { signedUrl, maxSeconds: MAX_SECONDS });
}

module.exports = handler;
