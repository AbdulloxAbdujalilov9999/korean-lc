# Korean Talk — build handoff

Status: research/architecture phase done, zero app files written yet. Only `git init` run in this folder.
Resume by reading this file, then start scaffolding — no need to re-explore truck-talk-webapp.

## Decisions already made with the user (do not re-ask)
1. **New separate project** at `/Users/macbook/korean-talk-webapp` (own Firebase project later, not the trucktalk one).
2. **Structure**: 2 sections — Student's Book (`studentsbook/`) and Workbook (`workbook/`) — each its own course like trucktalk/speakup are today. Inside each, 1A's units come first, then 1B unlocks after (one continuous progress bar per book, not 4 separate tracks).
3. **Rollout**: scaffold the full platform working end-to-end first, with only 1-2 real units per level (so ~4 units per book to start), then author the rest later.
4. **AI teacher**: all 3 layers, same as trucktalk — narrated teach slideshow, tutor/translator chat, live ElevenLabs voice-call agent.
5. **Voiceover languages: Korean (target) + Uzbek (helper/native) only — never English.** User will supply an ElevenLabs API key when asked; still need to ask for it (not yet provided) and pick/ask for a Korean voice ID.
6. Content is **original, authored to match SNU Korean+ 1A/1B topics/order** (Student's Book PDF + Workbook PDF) — NOT scanned/reproduced pages (copyright: these are commercial SNU Language Education Institute textbooks). Treat the PDFs purely as a topic/curriculum reference, same way trucktalk didn't digitize a real English textbook — it hand-wrote original content in the same JSON schema described below.

## Source material
- 4 PDFs in `~/Downloads/`: `[@Korea_Book] 서울대 + Student's Book 1A.pdf`, `...1B.pdf`, `...Work Book 1A.pdf`, `...1B.pdf`. Scanned/image-only (no text layer) — use PyMuPDF (`import fitz`, already installed for this user, no brew/poppler available) to render pages to PNG for inspection if needed; do NOT run with `python3 -I` since fitz lives in user site-packages.
- Series: "SNU Korean+" (서울대 한국어+), Language Education Institute, Seoul National University, pub. 2022. Unit structure per the "how to use" pages: Vocabulary → Grammar (separate grammar booklet referenced, not merged) → Speaking 1/2/3 → Listening (Warm-up → Listening 1/2 → Speaking) → Reading → Writing → Culture/Pronunciation tips.

## Reference architecture (from `/Users/macbook/truck-talk-webapp`, fully read)
Monorepo pattern: one site, multiple course sections (`trucktalk/`, `speakup/`), sharing `shared/`. Root `index.html` is a picker. Each course has its **own** `index.html`, `app.js`, `curriculum.js`, `grammar.js` (not shared — they define the same globals so can't coexist on one page).

### Files to copy nearly as-is from truck-talk-webapp into `shared/` (generic, language-agnostic)
- `shared/tokens.css`, `theme.css`, `course.css` — visual system, reuse directly.
- `shared/i18n.js` — interface-language switcher (en/uz/ru chrome strings), reuse directly.
- `shared/neural-voice.js` — `window.TTVoice`, plays `/api/tts`, falls back silently. Reuse directly (already lang-agnostic: `lang==="uz"` flag pattern — just add `lang==="ko"`).
- `shared/auth-gate.js`, `phone-login.js`, `sync-queue.js`, `firebase.js`, `firebase-config.js` — reuse the *code*, but `firebase-config.js` needs a NEW Firebase project's keys (not created yet — needs user's Firebase account/CLI login; don't do this without asking, it's an account-creation action).
- `shared/teach-ui.js` — the full-screen narrated slideshow UI engine, reuse directly (generic).
- `shared/tutor-ui.js` — chat/translate/live-talk panel UI, reuse directly (generic UI; prompts live server-side).

### Files to write fresh per course (adapted from trucktalk's, NOT copied verbatim)
- `shared/teach-script.js` — course-specific slide scripting (trucktalk version is English/Uzbek-specific).
- `<course>/app.js` — adapt from `trucktalk/app.js` (2814 lines, fully read). Needs these changes for Korean:
  - `rec.lang = "en-US"` → `"ko-KR"` (speech recognition, for role-play mic scoring).
  - `CONTRACTIONS`/`NUM_WORDS` English-normalization tables in `scoreSpeech()`/`normalizeWords()` — drop or no-op, irrelevant for Korean text, harmless either way.
  - `localStorage` key prefix `tte_*` → something course-specific e.g. `ktsb_*` (Student's Book) / `ktwb_*` (Workbook) so the two courses' progress never collide (same pattern as trucktalk `tte_*` vs speakup `su_*`).
  - "60-Day"/"Day N"/"Week N" framing → rename to "Unit N" grouped by **Level** (1A / 1B) instead of "Week" (12 weeks). `weekProgress()`/`CURRICULUM.filter(d=>d.w===weekNum)` concept maps directly: use `d.lvl` ("1A"/"1B") instead of `d.w` (week number); "unlock next level only after previous level's units done" mirrors `isUnlocked()`'s week-gating logic.
  - All other logic (flashcards, dialogue playback w/ 2 voices, role-play turn-by-turn mic scoring, fill-blank/matching practice generator, quiz engine, grammar book, homework/glossary auto-chunking, progress/streak/XP, settings, certificate, PWA install, staff "finished" view) is language-agnostic — port essentially unchanged, just swap labels/strings and the `window.TTE_*` global prefix (rename to e.g. `window.KTSB_*`/`window.KTWB_*` so Student's Book and Workbook pages don't collide if ever loaded together, matching the TTE_ vs SU_ pattern speakup uses).
  - **Important**: the app works fully client-side with localStorage even with zero Firebase/backend wired up — every cloud/auth hook is `if (window.TTE_user) ...` guarded. Can ship and browser-test a complete standalone pilot before any Firebase/Vercel/ElevenLabs account work happens, by just calling `init()` directly at the bottom of app.js instead of waiting for `auth-gate.js` to call `TTE_mount`.

### Content schema (curriculum.js) — confirmed exact shape, reuse as-is with Korean swapped in for English
```js
const CURRICULUM = [
{"d":1,"lvl":"1A","wt":"<unit theme, e.g. '인사와 소개 (Greetings & Introductions)'>","t":"<English title, dev-facing>","tu":"<Uzbek title shown to student>",
 "v":[["<Korean word/phrase>","<Uzbek translation>","<Korean example sentence>"], ... 15-20 of these],
 "dl":[["<speaker>","<Korean line>","<Uzbek line>"], ...],
 "g":["<grammar point title>","<grammar explanation, plain text>"],
 "gu":"<optional id into GRAMMAR[] for 'go deeper'>",
 "qz":[["<question text>",["optA","optB","optC","optD"],<correctIdx>], ...],
 "sp":["<speaking prompt, Korean>","<speaking prompt, Uzbek>"]
},
... review/review-unit entries use "rev":true and only qz+sp (no v/dl/g), same as trucktalk's week-review days
];
if (typeof module !== "undefined") { module.exports = { CURRICULUM, ORIENTATION }; }
```
`GRAMMAR` array (grammar.js) shape: `{id, cat, title, titleUz, ruleUz, explain:[...], examples:[[ko,uz],...], mistakeWrong, mistakeRight, mistakeWhy, teach:[...optional, staff-only...], quiz:[[q,[opts],correctIdx],...]}` — "mistake" callouts should target real Uzbek↔Korean contrasts (particles, SOV order generally matches Uzbek actually — Korean and Uzbek are both SOV/agglutinative, which is a genuinely good pedagogical angle unlike the English version's SVO-vs-Uzbek contrast; lean into that similarity for easier teaching points, and flag genuine hard spots instead: honorifics/speech levels, topic marker 은/는 vs subject 이/가, no articles in either language so that's not an issue here).

### AI teacher — 3 layers, all confirmed working patterns in trucktalk
1. **Teach slideshow**: `shared/teach-ui.js` (generic) + new `shared/teach-script.js` (Korean words spoken + Uzbek narration) + `shared/neural-voice.js` → `/api/tts`.
2. **Tutor chat/translator**: `api/tutor.js` (Claude-based, Vercel fn) — adapt `PERSONA`/prompts: target language Korean, helper language Uzbek (not Russian — trucktalk supports Uzbek+Russian since Uzbekistan has Russian speakers too; decide if Korean course needs Russian too or Uzbek-only, probably mirror trucktalk and support both).
3. **Live voice agent**: `api/agent.js` (signs short-lived ElevenLabs URL) + `elevenlabs/teacher.agent.json` (new agent config, modeled on `elevenlabs/teacher.agent.json` in trucktalk: `language:"uz"`, Uzbek `first_message`, prompt instructs "teach in Uzbek, say Korean words/phrases clearly, never speak English", `tts.voice_id` = a Korean-capable ElevenLabs voice).

### TTS backend (`api/tts.js`, Vercel serverless, already proven)
- English: `ELEVENLABS_VOICE_FEMALE`/`_MALE`, model `eleven_multilingual_v2`.
- Uzbek (already solved, proven voice pipeline): `ELEVENLABS_UZ_VOICE`, model `eleven_v4` — reuse this exact pattern for Korean's Uzbek narration lines.
- **To add**: Korean lines — `eleven_multilingual_v2` officially supports Korean, so can likely just add `lang==="ko"` branch using a `ELEVENLABS_KO_VOICE` env var + that same multilingual model (simpler than Uzbek's case, which needed the newer v4 model). Still needs a real Korean voice ID — ask user or pick a stock ElevenLabs multilingual voice.
- **Still needed from user**: `ELEVENLABS_API_KEY` (user offered to provide it — not yet given), and either they name a Korean voice ID or we pick a default premade one.

## Immediate next steps (in order)
1. Scaffold `shared/` (copy+adapt the files listed above), `icons/`, root `index.html` hub (2-card picker: Student's Book / Workbook, same pattern as trucktalk/speakup picker), `manifest.json`, `.gitignore`, `package.json`.
2. Build `studentsbook/` and `workbook/` course shells: `index.html`, `app.js` (adapted per above), `curriculum.js` + `grammar.js` (start with pilot content: ~2 units 1A + 2 units 1B each, review units included).
3. Write `shared/teach-script.js` for the Korean courses.
4. Write `api/tts.js`, `api/tutor.js`, `api/agent.js`, `api/_auth.js` (adapt from trucktalk's; `_auth.js` can initially be a no-op/stub since there's no Firebase project yet — gate nothing until auth is wired).
5. Write `elevenlabs/teacher.agent.json` pilot config.
6. `.env.example` documenting all needed keys.
7. Test locally: serve the folder (e.g. `npx serve` or Python http.server) and open in the Browser pane; verify dashboard/lesson/quiz/flashcards/role-play UI all render and function using only localStorage (no backend needed for this smoke test).
8. Ask the user for the ElevenLabs API key + Korean voice preference once ready to wire real TTS; ask about Firebase project creation (needs their login/account) when ready for cloud sync.

## Not done / open questions for the user later
- Firebase project for this new app doesn't exist yet — needs user's Firebase login to create (CLI or console); out of scope to do autonomously.
- Exact SNU Korean+ 1A/1B unit count/topics beyond what's skimmed (preface + "how to use" pages only) — table of contents pages weren't located; pilot content will be written from general SNU Korean+ 1A knowledge (greetings, numbers, locations, daily routine, shopping, etc.) and can be refined against the real TOC later if needed.
- Workbook's content style should differ from Student's Book (more drilling/written practice per the "how to use" pages seen for Student's Book — Workbook equivalent pages weren't inspected yet) — worth a quick look at the Workbook PDF's own front matter before authoring its curriculum.js.
