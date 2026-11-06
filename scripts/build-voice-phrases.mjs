/* Builds api/_phrases.json (every Korean phrase /api/tts is allowed to speak) and api/_phrases_uz.json (every Uzbek
 * teacher-narration line it is allowed to speak), across both courses (studentsbook, workbook).
 * Run after editing any curriculum.js/grammar.js:   node scripts/build-voice-phrases.mjs */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const COURSES = ["studentsbook", "workbook"];

function load(files) {
  const ctx = {}; vm.createContext(ctx);
  const src = files.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
  vm.runInContext(src + `
;this.__x={CURRICULUM:typeof CURRICULUM!=='undefined'?CURRICULUM:[],GRAMMAR:typeof GRAMMAR!=='undefined'?GRAMMAR:[]}`, ctx);
  return ctx.__x;
}

const koSet = new Set();
const add = (s) => { if (typeof s === "string") { const n = normalize(s); if (n && n.length <= 300) koSet.add(n); } };
const addAll = (v) => { if (typeof v === "string") add(v); else if (Array.isArray(v)) v.forEach(addAll); else if (v && typeof v === "object") Object.values(v).forEach(addAll); };
function normalize(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }

for (const course of COURSES) {
  const x = load([`${course}/curriculum.js`, `shared/grammar.js`]);
  for (const d of x.CURRICULUM) {
    (d.v || []).forEach((r) => { add(r[0]); add(r[2]); });      // Korean word/phrase, Korean example sentence
    (d.dl || []).forEach((r) => add(r[1]));                       // conversation lines (Korean side)
  }
  for (const g of x.GRAMMAR) { (g.examples || []).forEach((e) => add(e[0])); }
}
const koOut = [...koSet].sort();
fs.writeFileSync(path.join(root, "api", "_phrases.json"), JSON.stringify(koOut));
console.log(`api/_phrases.json: ${koOut.length} Korean phrases, ${koOut.reduce((a, s) => a + s.length, 0)} characters`);

// the teacher's spoken Uzbek lines (shared/teach-script.js): the only Uzbek the endpoint will speak
const uzSet = new Set();
for (const course of COURSES) {
  const ctx = {}; vm.createContext(ctx);
  const src = [`${course}/curriculum.js`, "shared/grammar.js", "shared/teach-script.js"].map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
  // top-level `const CURRICULUM` does not become a property of the vm's global object (unlike `var`), so expose it
  // explicitly the same way load() does above, or `ctx.CURRICULUM` below would silently be undefined.
  vm.runInContext(src + `\n;this.__CURRICULUM=typeof CURRICULUM!=='undefined'?CURRICULUM:[];`, ctx);
  const S = ctx.KTTeachScript;
  if (!S) continue;
  uzSet.add(normalize(S.dockLine));
  const C = ctx.__CURRICULUM || [];
  for (const d of C) {
    const p = S.build(d.d);
    for (const slide of p ? p.slides : []) for (const st of slide.steps) {
      if (st.k === "uz") uzSet.add(normalize(st.t));
      if (st.k === "ko" || st.k === "line") {
        const n = normalize(st.t);
        if (!koSet.has(n)) { console.error(`${course}: teacher says a Korean line that is not in the phrase list: ${st.t}`); process.exit(1); }
      }
    }
  }
}
const uzOut = [...uzSet].sort();
fs.writeFileSync(path.join(root, "api", "_phrases_uz.json"), JSON.stringify(uzOut));
console.log(`api/_phrases_uz.json: ${uzOut.length} Uzbek lines, ${uzOut.reduce((a, s) => a + s.length, 0)} characters`);
