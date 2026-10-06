// Glossario, testi dell'aiuto nelle 3 lingue, verifica delle parole.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GLOSSARY, termById, findTerms, termIn, defIn } from "../public/lib/glossary.js";
import { STRINGS, LANGS, t, quotesOf, placeholdersOf } from "../public/lib/i18n.js";
import { TASKS, taskStringKeys } from "../public/lib/tasks.js";
import { QUIZ, scoreQuiz, quizDelta } from "../public/lib/quiz.js";
import { registerLabels, NOTICES } from "../public/lib/data.js";

const ARABIC = /[؀-ۿ]/;
const LATIN_WORD = /[A-Za-zÀ-ÿ]{2,}/;

// ---------------------------------------------------------------- glossario
test("glossario: ogni parola ha italiano semplice, arabo e inglese, senza testi vuoti", () => {
  assert.ok(GLOSSARY.length >= 20, "almeno 20 parole della scuola");
  const ids = new Set();
  for (const g of GLOSSARY) {
    assert.ok(!ids.has(g.id), `id ripetuto: ${g.id}`);
    ids.add(g.id);
    assert.ok(g.term.trim(), `${g.id}: parola`);
    assert.ok(g.forms.length > 0, `${g.id}: forme`);
    assert.ok(g.it.def.trim().length > 10, `${g.id}: it`);
    for (const lang of ["ar", "en"]) {
      assert.ok(g[lang].term.trim(), `${g.id}: termine ${lang}`);
      assert.ok(g[lang].def.trim().length > 5, `${g.id}: definizione ${lang}`);
    }
    assert.match(g.ar.term, ARABIC, `${g.id}: il termine arabo è in caratteri arabi`);
    assert.match(g.ar.def, ARABIC, `${g.id}: la definizione araba è in caratteri arabi`);
    assert.doesNotMatch(g.en.def, ARABIC);
  }
});

test("glossario: ci sono tutte le parole chiave richieste dal registro", () => {
  const required = ["giustificazione", "assenza", "ritardo", "uscita-anticipata", "colloquio", "presa-visione",
    "bacheca", "pagella", "scrutinio", "nota-disciplinare", "compiti", "verifica", "coordinatore-di-classe"];
  required.forEach((id) => assert.ok(termById(id), id));
});

test("glossario: una forma appartiene a una sola parola", () => {
  const seen = new Map();
  for (const g of GLOSSARY) for (const f of g.forms) {
    assert.ok(!seen.has(f), `«${f}» è sia in ${seen.get(f)} sia in ${g.id}`);
    seen.set(f, g.id);
  }
});

test("findTerms riconosce le parole (anche maiuscole e plurali) senza cambiare il testo", () => {
  const text = "Assenze, ritardi e uscite anticipate: l'evento del 01/10/2026 è Da giustificare.";
  const parts = findTerms(text);
  assert.equal(parts.map((p) => p.text).join(""), text, "il testo resta identico");
  const ids = parts.filter((p) => p.termId).map((p) => p.termId);
  assert.deepEqual(ids, ["assenza", "ritardo", "uscita-anticipata", "da-giustificare"]);
});

test("findTerms preferisce la forma più lunga e non evidenzia la stessa parola due volte", () => {
  const seen = new Set();
  const a = findTerms("Il coordinatore di classe legge la presa visione.", seen);
  assert.deepEqual(a.filter((p) => p.termId).map((p) => p.termId), ["coordinatore-di-classe", "presa-visione"]);
  const b = findTerms("Ancora la presa visione.", seen);
  assert.equal(b.filter((p) => p.termId).length, 0);
  assert.equal(findTerms("Il voto è nel vocabolario").filter((p) => p.termId).length, 1, "«vocabolario» non è «voto»");
});

test("termIn/defIn: in italiano la parola del registro, nelle altre lingue la traduzione", () => {
  const g = termById("presa-visione");
  assert.equal(termIn(g, "it"), "presa visione");
  assert.equal(termIn(g, "ar"), g.ar.term);
  assert.equal(defIn(g, "en"), g.en.def);
});

// ---------------------------------------------------------------- testi dell'aiuto
test("ogni testo dell'aiuto esiste in arabo, inglese e italiano, e non è vuoto", () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    for (const lang of LANGS) {
      assert.equal(typeof entry[lang], "string", `${key} manca in ${lang}`);
      assert.ok(entry[lang].trim().length > 0, `${key} è vuoto in ${lang}`);
    }
    assert.deepEqual(placeholdersOf(entry.ar), placeholdersOf(entry.it), `${key}: segnaposto ar`);
    assert.deepEqual(placeholdersOf(entry.en), placeholdersOf(entry.it), `${key}: segnaposto en`);
  }
});

test("ogni compito ha tutti i suoi testi (istruzioni, suggerimenti, feedback) nelle 3 lingue", () => {
  for (const task of TASKS) {
    for (const key of taskStringKeys(task)) {
      assert.ok(STRINGS[key], `${task.id}: manca la chiave ${key}`);
    }
  }
  ["wrong.nav", "wrong.generic", "wrong.blocked", "wrong.answer", "hint.showWhere", "level.1", "level.2", "level.3"]
    .forEach((k) => assert.ok(STRINGS[k], k));
});

test("le parole del registro tra «» sono in italiano e uguali nelle tre lingue", () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    const it = [...new Set(quotesOf(entry.it))].sort();
    assert.deepEqual([...new Set(quotesOf(entry.ar))].sort(), it, `${key}: «» in arabo`);
    assert.deepEqual([...new Set(quotesOf(entry.en))].sort(), it, `${key}: «» in inglese`);
    quotesOf(entry.ar).forEach((q) => assert.doesNotMatch(q, ARABIC, `${key}: «${q}» deve restare in italiano`));
  }
});

test("ogni parola tra «» esiste davvero nel registro", () => {
  const labels = registerLabels().map((l) => l.toLowerCase());
  for (const [key, entry] of Object.entries(STRINGS)) {
    for (const q of quotesOf(entry.it)) {
      if (q.startsWith("{")) continue;
      assert.ok(labels.some((l) => l.includes(q.toLowerCase())), `${key}: «${q}» non è nel registro`);
    }
  }
});

test("i testi arabi sono in caratteri arabi; quelli inglesi e italiani no", () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    const arPlain = entry.ar.replace(/«[^»]*»/g, "").replace(/\{\w+\}/g, "");
    if (LATIN_WORD.test(entry.it.replace(/«[^»]*»/g, ""))) assert.match(arPlain, ARABIC, `${key}: ar`);
    assert.doesNotMatch(entry.en, ARABIC, `${key}: en`);
    assert.doesNotMatch(entry.it, ARABIC, `${key}: it`);
  }
});

test("arabo neutro: nessun imperativo solo maschile o solo femminile nei testi dell'aiuto", () => {
  // Imperativi frequenti nelle interfacce: اضغط/اضغطي، اختر/اختاري، انقر/انقري، افتح/افتحي.
  const gendered = /(?<![\p{L}])(اضغطي?|اختر|اختاري|انقري?|افتحي?|ابحثي?)(?![\p{L}])/u;
  for (const [key, entry] of Object.entries(STRINGS)) {
    assert.doesNotMatch(entry.ar, gendered, `${key}: usa «يُرجى» + nome verbale o una frase descrittiva`);
  }
  for (const g of GLOSSARY) assert.doesNotMatch(g.ar.def, gendered, g.id);
});

test("t() sostituisce i segnaposto e usa l'italiano se manca una chiave in una lingua", () => {
  assert.equal(t("en", "step.count", { n: 2, total: 5 }), "Step 2 of 5");
  assert.equal(t("ar", "step.count", { n: 2, total: 5 }), "الخطوة 2 من 5");
  assert.equal(t("it", "chiave.inesistente"), "chiave.inesistente");
});

test("le spiegazioni già pronte esistono per ogni comunicazione e lingua", () => {
  for (const n of NOTICES) for (const lang of LANGS) {
    const e = n.explanations[lang];
    assert.ok(e && e.explanation.trim() && e.what_to_do.trim(), `${n.id}/${lang}`);
    assert.ok(e.quotes.length >= 1);
  }
});

// ---------------------------------------------------------------- verifica delle parole
test("quiz: 5 domande, ogni risposta giusta è tra le opzioni e nel glossario", () => {
  assert.equal(QUIZ.length, 5);
  for (const q of QUIZ) {
    assert.ok(q.options.includes(q.term), q.id);
    assert.equal(new Set(q.options).size, q.options.length, `${q.id}: opzioni ripetute`);
    q.options.forEach((o) => assert.ok(termById(o), `${q.id}: ${o}`));
  }
});

test("quiz: punteggio, domande senza risposta e confronto prima/dopo", () => {
  const all = Object.fromEntries(QUIZ.map((q) => [q.id, q.term]));
  assert.equal(scoreQuiz(all).score, 5);
  const pre = scoreQuiz({ q1: "pagella", q2: "giustificazione" });
  assert.equal(pre.score, 1);
  assert.equal(pre.details.find((d) => d.id === "q3").chosen, null);
  const post = scoreQuiz({ ...all, q5: "verifica" });
  assert.equal(post.score, 4);
  assert.equal(quizDelta(pre, post), 3);
  assert.equal(quizDelta(null, post), null);
});
