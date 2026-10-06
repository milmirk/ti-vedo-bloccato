import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createDetector } = require("../extension/content/detector.js");

function setup(sensitivity = "media") {
  let clock = 0;
  const d = createDetector({ sensitivity, now: () => clock });
  return {
    d,
    at(ms) { clock = ms; return ms; },
    rec(ev) { return d.record({ ...ev, at: clock }); },
  };
}

// ---------- segnali chiari: "normale" interviene subito ----------

test("dead_click: basta un click su un pulsante disattivato", () => {
  const { at, rec } = setup();
  at(1000);
  const out = rec({ type: "click", target: "avanti", dead: true });
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "dead_click");
  assert.equal(out[0].target, "avanti");
  assert.equal(out[0].detail.count, 1);
});

test("field_error: basta il primo errore su un campo", () => {
  const { at, rec } = setup();
  at(1000);
  const out = rec({ type: "invalid", target: "cf", message: "Valore non conforme (ERR_CF_016)" });
  assert.equal(out[0].type, "field_error");
  assert.equal(out[0].detail.message, "Valore non conforme (ERR_CF_016)");
});

test("di rado: aspetta che il segnale si ripeta", () => {
  const { at, rec } = setup("bassa");
  at(1000); assert.deepEqual(rec({ type: "click", target: "avanti", dead: true }), []);
  at(2000); assert.equal(rec({ type: "click", target: "avanti", dead: true })[0].type, "dead_click");
  const errori = setup("bassa");
  errori.at(1000); assert.deepEqual(errori.rec({ type: "invalid", target: "cf" }), []);
  errori.at(2000); assert.equal(errori.rec({ type: "invalid", target: "cf" })[0].type, "field_error");
});

test("di rado: due click a vuoto lontani nel tempo non bastano", () => {
  const { at, rec } = setup("bassa");
  at(1000); rec({ type: "click", target: "avanti", dead: true });
  at(9000);
  assert.deepEqual(rec({ type: "click", target: "avanti", dead: true }), []);
});

// ---------- inattività e distrazioni ----------

test("idle: nessun avviso prima che l'utente inizi il compito", () => {
  const { d, at } = setup();
  assert.deepEqual(d.tick(at(60000)), []);
});

test("idle: avvisa dopo 12 secondi, una sola volta per periodo", () => {
  const { d, at, rec } = setup();
  at(1000); rec({ type: "activity" });
  assert.deepEqual(d.tick(at(12000)), []);
  const out = d.tick(at(13500));
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "idle");
  assert.deepEqual(d.tick(at(90000)), [], "non ripete finché l'utente non fa qualcosa");
});

test("idle: il tempo in un'altra scheda non conta", () => {
  const { d, at, rec } = setup();
  at(1000); rec({ type: "activity" });
  at(2000); rec({ type: "hidden" });
  assert.deepEqual(d.tick(at(40000)), []);
});

test("idle: un click a vuoto conta come azione, non fa scattare l'inattività subito dopo", () => {
  const { d, at, rec } = setup();
  at(30000); rec({ type: "click", target: "prenota", dead: true });
  assert.deepEqual(d.tick(at(31000)), []);
});

test("presence: chi sta leggendo (scroll, mouse) non riceve l'avviso di inattività", () => {
  const { d, at, rec } = setup();
  at(1000); rec({ type: "activity" });
  at(10000); rec({ type: "presence" });
  assert.deepEqual(d.tick(at(20000)), []);
  assert.equal(d.tick(at(22500))[0].type, "idle");
});

test("presence: muovere il mouse da solo non avvia il compito", () => {
  const { d, at, rec } = setup();
  at(1000); rec({ type: "presence" });
  assert.deepEqual(d.tick(at(60000)), []);
});

test("return_after_away: riepilogo al rientro dopo 5 secondi altrove", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "activity" });
  at(2000); rec({ type: "hidden" });
  at(8000);
  const out = rec({ type: "visible" });
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "return_after_away");
  assert.equal(out[0].detail.awayMs, 6000);
});

test("return_after_away: un'occhiata veloce a un'altra scheda non disturba", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "activity" });
  at(2000); rec({ type: "hidden" });
  at(5000);
  assert.deepEqual(rec({ type: "visible" }), []);
});

// ---------- click, errori, navigazione ----------

test("rage_click: raffica sullo stesso elemento", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "click", target: "giorno-12" });
  at(1400); rec({ type: "click", target: "giorno-12" });
  at(1800);
  assert.equal(rec({ type: "click", target: "giorno-12" })[0].type, "rage_click");
});

test("rage_click: click su elementi diversi sono navigazione normale", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "click", target: "a" });
  at(1400); rec({ type: "click", target: "b" });
  at(1800);
  assert.deepEqual(rec({ type: "click", target: "c" }), []);
});

test("back_forth: una correzione all'indietro è normale", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "step", id: "1" });
  at(2000); rec({ type: "step", id: "2" });
  at(3000); rec({ type: "step", id: "3" });
  at(4000); rec({ type: "step", id: "2" });
  at(5000);
  assert.deepEqual(rec({ type: "step", id: "3" }), []);
});

test("back_forth: avanti e indietro ripetuto segnala disorientamento", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "step", id: "2" });
  at(2000); rec({ type: "step", id: "3" });
  at(3000); rec({ type: "step", id: "2" });
  at(4000); rec({ type: "step", id: "3" });
  at(5000);
  const out = rec({ type: "step", id: "2" });
  assert.equal(out[0].type, "back_forth");
  assert.deepEqual(out[0].detail.path, ["2", "3", "2", "3", "2"]);
});

test("field_hesitation: torna sullo stesso campo senza scrivere", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "focus", target: "tessera" });
  at(2000);
  assert.equal(rec({ type: "focus", target: "tessera" })[0].type, "field_hesitation");
});

test("field_hesitation: ritorni lontani nel tempo non sono esitazione", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "focus", target: "tessera" });
  at(40000);
  assert.deepEqual(rec({ type: "focus", target: "tessera" }), []);
});

test("field_hesitation: scrivere azzera l'esitazione", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "focus", target: "tessera" });
  at(1500); rec({ type: "change", target: "tessera" });
  at(2000);
  assert.deepEqual(rec({ type: "focus", target: "tessera" }), []);
});

// ---------- non invadere ----------

test("cooldown: dopo un suggerimento non ne arriva subito un altro sulla stessa pagina", () => {
  const { at, rec } = setup();
  at(1000); assert.equal(rec({ type: "click", target: "avanti", dead: true }).length, 1);
  at(3000); assert.deepEqual(rec({ type: "click", target: "avanti", dead: true }), []);
  at(8000); assert.equal(rec({ type: "click", target: "avanti", dead: true }).length, 1);
});

test("cambio di passo: la pausa e i conteggi del passo precedente si azzerano", () => {
  const { at, rec } = setup();
  at(1000); rec({ type: "step", id: "2" });
  at(2000); assert.equal(rec({ type: "invalid", target: "cf" })[0].type, "field_error");
  at(3000); rec({ type: "step", id: "3" });
  at(3500);
  assert.equal(rec({ type: "click", target: "giorno-12", dead: true })[0].type, "dead_click");
});

test("feedback 'non_ora' alza la soglia, 'utile' la riporta giù", () => {
  const { d, at, rec } = setup();
  d.feedback("dead_click", "non_ora"); // 1 click → 2
  at(1000); assert.deepEqual(rec({ type: "click", target: "x", dead: true }), []);
  at(1500); assert.equal(rec({ type: "click", target: "x", dead: true })[0].type, "dead_click");
  d.feedback("dead_click", "utile");
  assert.equal(d.factors.dead_click, 1);
});

test("pausa: nessun avviso mentre è in pausa", () => {
  const { d, at, rec } = setup();
  d.pause(600000, 0);
  at(1000);
  assert.deepEqual(rec({ type: "click", target: "x", dead: true }), []);
  assert.equal(d.paused, true);
});

test("complete: a compito concluso smette di osservare", () => {
  const { d, at, rec } = setup();
  at(1000); rec({ type: "activity" });
  rec({ type: "complete" });
  assert.deepEqual(d.tick(at(100000)), []);
});

test("sensibilità: 'spesso' reagisce prima di 'normale'", () => {
  const alta = setup("alta");
  alta.at(1000); alta.rec({ type: "activity" });
  assert.equal(alta.d.tick(alta.at(9500))[0].type, "idle");
  const media = setup("media");
  media.at(1000); media.rec({ type: "activity" });
  assert.deepEqual(media.d.tick(media.at(9500)), []);
});
