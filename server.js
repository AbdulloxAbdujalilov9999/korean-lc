/* Plain Node server for deploying this static site + its api/*.js serverless functions somewhere that isn't
 * Vercel (e.g. Render). Zero dependencies on purpose, matching the rest of this project.
 *
 * On Vercel, api/tts.js / tutor.js / agent.js are deployed as-is (Vercel's own file-based routing + serverless
 * runtime calls them directly) — this file is NOT used there. It exists only for platforms that want one
 * long-running Node process instead: it serves the static files and mounts the same three handler modules as
 * routes, feeding them a (req, res) pair shaped the same way Vercel's runtime does (req.query, a parsed req.body
 * for POSTs), so the handlers themselves needed zero changes.
 *
 *   PORT   optional, defaults to 3000 (Render sets this itself)
 */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const API_ROUTES = {
  "/api/tts": require("./api/tts.js"),
  "/api/tutor": require("./api/tutor.js"),
  "/api/agent": require("./api/agent.js"),
};

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
};

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : null); } catch (e) { resolve(null); } });
    req.on("error", () => resolve(null));
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) { res.statusCode = 403; return res.end("forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) {
      // SPA-ish fallback for a course's own clean routes (not currently used, but harmless): 404 otherwise.
      res.statusCode = 404; res.setHeader("content-type", "text/plain"); return res.end("not found");
    }
    res.statusCode = 200;
    res.setHeader("content-type", MIME[path.extname(full)] || "application/octet-stream");
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const handler = API_ROUTES[u.pathname];
  if (handler) {
    req.query = Object.fromEntries(u.searchParams);
    if (req.method === "POST") req.body = await readJsonBody(req);
    try { await handler(req, res); } catch (e) {
      console.error(u.pathname, e);
      if (!res.headersSent) { res.statusCode = 500; res.setHeader("content-type", "application/json"); }
      res.end(JSON.stringify({ error: "server-error" }));
    }
    return;
  }
  serveStatic(req, res, u.pathname);
});

server.listen(PORT, () => console.log(`Korean Talk listening on :${PORT}`));
