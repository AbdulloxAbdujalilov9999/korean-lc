# Status: full 16-unit build complete

The architecture research that used to live in this file is now superseded — see **README.md** for the current
structure, and the "Still open" section there for what's left (Firebase project, API keys).

Quick summary of what exists as of this build:
- Hub (`index.html`) + two courses (`studentsbook/`, `workbook/`), each covering all 16 units of SNU Korean+ 1A/1B
  (32 lessons + 8 reviews + a final test per course, 41 "days" total), the Workbook drilling complementary
  vocabulary/situations for the same units rather than repeating the Student's Book's words.
- Full course engine (`shared/course-engine.js`): flashcards, dialogue + 2-voice playback, role-play with mic
  scoring, auto-generated practice (fill-blank/matching), quizzes, a shared grammar book, homework/glossary,
  progress/streak/XP (Sunday forgiven), settings, certificate.
- AI teacher, all 3 layers (`shared/teach-script.js`+`teach-ui.js`, `shared/tutor-ui.js`, `api/agent.js` +
  `elevenlabs/teacher.agent.json`), Uzbek-only, teaching Korean.
- Backend (`api/tts.js`, `tutor.js`, `agent.js`, `_auth.js`) — all optional, all gracefully disabled until their env
  vars are set.
- Tested end-to-end in-browser: dashboard, lesson flow, flashcard flip, dialogue playback, quiz scoring/completion,
  sequential unlock, the 1A→1B level gate, and the final test's full-course question bank all confirmed working.

Everything else (why each decision was made, the exact content schema, how to add more units) is in README.md now.
