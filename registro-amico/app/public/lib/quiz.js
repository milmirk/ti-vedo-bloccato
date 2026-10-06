/*
 * Registro amico — verifica delle parole della scuola (prima e dopo).
 *
 * 5 domande a scelta multipla. La domanda mostra la parola del registro in
 * italiano; le risposte sono le spiegazioni del glossario nella lingua scelta.
 * Le stesse domande prima e dopo gli esercizi: così il confronto è onesto.
 *
 * Modulo puro (nessun DOM): lo usano il browser e i test.
 */
import { termById } from "./glossary.js";

// La risposta giusta è sempre `term`; le opzioni sono altre voci del glossario.
export const QUIZ = [
  { id: "q1", term: "presa-visione", options: ["giustificazione", "presa-visione", "pagella"] },
  { id: "q2", term: "giustificazione", options: ["giustificazione", "colloquio", "scrutinio"] },
  { id: "q3", term: "colloquio", options: ["compiti", "uscita-anticipata", "colloquio"] },
  { id: "q4", term: "uscita-anticipata", options: ["uscita-anticipata", "ritardo", "assenza"] },
  { id: "q5", term: "bacheca", options: ["pagella", "bacheca", "verifica"] },
];

export function questionTerm(q) {
  return termById(q.term);
}

/*
 * answers: { q1: "presa-visione", q2: "colloquio", ... }
 * Una domanda senza risposta conta come sbagliata.
 */
export function scoreQuiz(answers = {}, questions = QUIZ) {
  const details = questions.map((q) => {
    const chosen = Object.prototype.hasOwnProperty.call(answers, q.id) ? answers[q.id] : null;
    return { id: q.id, chosen, correct: q.term, ok: chosen === q.term };
  });
  return { score: details.filter((d) => d.ok).length, total: questions.length, details };
}

// Differenza tra la verifica dopo e quella prima (null se ne manca una).
export function quizDelta(pre, post) {
  if (!pre || !post) return null;
  return post.score - pre.score;
}
