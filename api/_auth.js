/* Shared by the AI endpoints (api/tutor.js, api/agent.js): "is this caller allowed to use this right now?".
 *
 * TEMPORARY: there is no Firebase/account system wired up yet for Korean Talk, so every caller is currently let
 * through as a single shared "local" identity — checkUser() always resolves. This keeps the three AI-teacher
 * endpoints working out of the box for local testing / a single-user deployment, at the cost of the rate limiter
 * being global instead of per-person (fine for a pilot; not fine once this has many real students).
 *
 * TO UPGRADE once a Firebase project exists for this app: copy the real checkUser()/mayUse() from
 * truck-talk-webapp/api/_auth.js (verifies the caller's Firebase ID token with Google, then reads their profile from
 * the database with that same token), point FIREBASE_WEB_KEY/DB_URL at this app's own project, and this file's
 * exported shape (mayUse, checkUser, makeLimiter) stays identical — api/tutor.js and api/agent.js need no changes.
 * (Files starting with an underscore are not served as endpoints by Vercel.) */
"use strict";

const DAY_MS = 24 * 60 * 60 * 1000;

function mayUse(){ return true; }

async function checkUser(token /*, now */){
  return token ? "local" : null;   // any non-empty bearer token is accepted until real accounts exist
}

function makeLimiter({ perWindow, windowMs, perDay }) {
  const hits = new Map();
  return function underLimit(uid, now) {
    const list = (hits.get(uid) || []).filter((t) => now - t < DAY_MS);
    const recent = list.filter((t) => now - t < windowMs).length;
    if (recent >= perWindow || list.length >= perDay) { hits.set(uid, list); return false; }
    list.push(now); hits.set(uid, list);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}

module.exports = { mayUse, checkUser, makeLimiter };
