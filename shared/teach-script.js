/* The teacher's presentation for a lesson, built from the lesson's own data (Korean words + Uzbek meanings, dialogue +
 * translations, grammar rule in Uzbek). Pure data, no screen: shared/teach-ui.js plays it. Everything the teacher
 * says is either Korean (the word/sentence being taught) or Uzbek (the explanation) — never English.
 *
 *   KTTeachScript.enabled(dayNum)   -> is there a presentation for this lesson?
 *   KTTeachScript.build(dayNum)     -> { title, sub, slides: [{ kind, ...visual, steps: [...] }] } | null
 *
 * A step is one of: { k:"uz", t } the teacher speaks Uzbek | { k:"ko", t, gender, rate } a Korean word or sentence
 * | { k:"line", i, t, gender } a dialogue line (highlights line i) | { k:"pause", ms } time for the student to repeat
 * | { k:"reveal" } show the hidden answer.
 * Needs the page's CURRICULUM / GRAMMAR globals (set by that course's curriculum.js / grammar.js). */
(function (root) {
  "use strict";

  var ONES = ["", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"];
  var TENS = ["", "o'n", "yigirma", "o'ttiz", "qirq", "ellik", "oltmish", "yetmish", "sakson", "to'qson"];
  function uzNumber(n) {
    n = Math.floor(Math.abs(n));
    if (n < 1 || n > 99) return String(n);
    return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
  }
  function uzOrdinal(n) { var w = uzNumber(n); return /[aeiou']$/.test(w) ? w + "-chi" : w + "-inchi"; }

  var tidy = function (s) { return String(s == null ? "" : s).replace(/\s*\.\.\.\s*$/, "").replace(/\s+/g, " ").trim(); };
  var meaning = function (s) { return tidy(s).replace(/\.+$/, ""); };
  var spoken = function (s) { return meaning(s).replace(/\s*\([^)]*\)/g, "").replace(/\s*\/\s*/g, ", ").replace(/\s+/g, " ").trim() || meaning(s).replace(/[()]/g, ""); };

  function data() {
    return {
      C: typeof CURRICULUM !== "undefined" ? CURRICULUM : root.CURRICULUM || [],
      G: typeof GRAMMAR !== "undefined" ? GRAMMAR : root.GRAMMAR || [],
    };
  }

  function dayByNum(n) { return data().C.find(function (x) { return x.d === Number(n); }); }

  function enabled(dayNum) { var d = dayByNum(dayNum); return !!(d && (d.v && d.v.length || d.dl && d.dl.length)); }

  function build(dayNum) {
    var d = dayByNum(dayNum);
    if (!d) return null;
    var G = data().G;
    var slides = [];

    var words = (d.v || []).map(function (r) { return { ko: tidy(r[0]), uz: meaning(r[1]), ex: tidy(r[2]) }; }).filter(function (w) { return w.ko; });

    // 1. welcome
    slides.push({
      kind: "intro", title: d.t, sub: d.tu,
      steps: d.rev
        ? [{ k: "uz", t: "Salom! Bugun " + (d.lvl || "") + " darajasini takrorlaymiz." }, { k: "uz", t: "Men koreyscha so'z aytaman, siz o'zbekcha ma'nosini o'ylab ko'ring. Boshladik!" }]
        : d.final
        ? [{ k: "uz", t: "Salom! Bugun yakuniy test kuni. Butun kursda o'rgangan hamma narsangizni sinab ko'ramiz." }]
        : [{ k: "uz", t: "Salom! Bugungi dars: " + (d.tu || d.t) + ". " + uzNumber(words.length) + " ta yangi so'z o'rganamiz." }, { k: "uz", t: "Men so'zni koreyscha aytaman, siz takrorlang. Boshladik!" }],
    });

    // 2. the words, one at a time: say it, what it means, say it with me, an example
    words.forEach(function (w) {
      slides.push({
        kind: "word", word: w.ko, meaning: w.uz, example: w.ex,
        steps: [
          { k: "ko", t: w.ko, gender: "female", rate: 0.85 },
          { k: "uz", t: "Bu — " + spoken(w.uz) + " degani." },
          { k: "uz", t: "Takrorlang." },
          { k: "pause", ms: 3500 },
        ].concat(w.ex ? [{ k: "uz", t: "Misol." }, { k: "ko", t: w.ex, gender: "female", rate: 0.9 }] : []),
      });
    });

    // 3. the conversation, two voices, translation on screen
    if (d.dl && d.dl.length) {
      var lines = d.dl.map(function (r) { return { who: r[0], ko: tidy(r[1]), uz: tidy(r[2]) }; });
      var first = lines[0].who;
      slides.push({
        kind: "dialogue", lines: lines,
        steps: [{ k: "uz", t: "Endi qisqa suhbatni tinglang. Tarjimasini ekranda ko'rasiz." }]
          .concat(lines.map(function (l, i) { return { k: "line", i: i, t: l.ko, gender: l.who === first ? "female" : "male", rate: 0.95 }; }))
          .concat([{ k: "uz", t: "Endi siz ham shunday gapirib ko'ring." }]),
      });
    }

    // 4. the grammar point, in Uzbek
    var unit = d.gu ? G.find(function (g) { return g.id === d.gu; }) : null;
    var rule = unit ? tidy(unit.rule) : (d.g ? tidy(d.g[1]) : "");
    if (rule) {
      var exs = unit && unit.examples ? unit.examples.slice(0, 2).map(function (e) { return { ko: tidy(e[0]), uz: tidy(e[1]) }; }) : [];
      var gsteps = [{ k: "uz", t: "Endi grammatika. " + rule }];
      exs.forEach(function (e) { gsteps.push({ k: "uz", t: "Masalan." }, { k: "ko", t: e.ko, gender: "female", rate: 0.9 }, { k: "uz", t: "Ya'ni: " + e.uz }); });
      slides.push({ kind: "grammar", title: unit ? tidy(unit.title) : tidy(d.g && d.g[0]), rule: rule, examples: exs, steps: gsteps });
    }

    // 5. a review day has no words of its own: quick recall of the level's words so far
    if (d.rev && !d.final) {
      var recap = [];
      data().C.filter(function (x) { return x.lvl === d.lvl && !x.rev && x.v; }).forEach(function (x) {
        x.v.slice(0, 4).forEach(function (r) { var ko = tidy(r[0]); if (ko) recap.push({ ko: ko, uz: meaning(r[1]) }); });
      });
      recap.slice(0, 10).forEach(function (w) {
        slides.push({
          kind: "recall", word: w.ko, meaning: w.uz,
          steps: [{ k: "ko", t: w.ko, gender: "female", rate: 0.9 }, { k: "uz", t: "Bu nima degani?" }, { k: "pause", ms: 3500 }, { k: "reveal" }, { k: "uz", t: spoken(w.uz) + "." }],
        });
      });
    }

    // 6. goodbye + on to the quiz
    slides.push({
      kind: "outro",
      steps: [{ k: "uz", t: d.final ? "Barakalla! Siz butun kursni tugatdingiz. Yakuniy testga o'ting." : "Barakalla! Bugungi darsni tugatdingiz. Endi test bo'limiga o'tib, o'zingizni sinab ko'ring." }],
    });
    return { day: d.d, title: d.t, sub: d.tu, slides: slides };
  }

  var DOCK_LINE = "Salom! Bu darsni men tushuntirib beraman. Boshlash uchun menga bosing.";

  root.KTTeachScript = { enabled: enabled, build: build, dockLine: DOCK_LINE, uzNumber: uzNumber, uzOrdinal: uzOrdinal };
})(typeof window !== "undefined" ? window : globalThis);
