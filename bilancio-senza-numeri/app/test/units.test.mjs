import { test } from "node:test";
import assert from "node:assert/strict";
import { decompose, partsCents, resolveUnits, unitsFor, allUnits, CATALOG } from "../public/lib/units.js";

const U = Object.fromEntries(resolveUnits(CATALOG.map((u) => ({ id: u.id }))).map((u) => [u.id, u]));
const marco = [U.caffe, U.pizza, U.pranzo, U.spesa];
const summary = (d) => d.parts.map((p) => `${p.count}×${p.unit.id}`).join(" ");

test("scomposizione greedy: dal più grande al più piccolo, con il resto", () => {
  // 137,80 € = 5 spese piccole (125) + 1 pranzo (12) + 0,80 di resto
  const d = decompose(13780, marco);
  assert.equal(summary(d), "5×spesa 1×pranzo");
  assert.equal(d.rest, 80);
});

test("la scomposizione non perde e non inventa centesimi", () => {
  for (const cents of [0, 1, 119, 120, 121, 799, 2500, 9999, 18640, 123456]) {
    const d = decompose(cents, marco);
    assert.equal(partsCents(d.parts) + d.rest, cents, `cifra ${cents}`);
    assert.ok(d.rest < U.caffe.cents, "il resto è più piccolo dell'oggetto più piccolo");
  }
});

test("l'ordine delle unità in ingresso non cambia il risultato", () => {
  const a = decompose(4560, [U.caffe, U.spesa, U.pizza]);
  const b = decompose(4560, [U.pizza, U.caffe, U.spesa]);
  assert.deepEqual(summary(a), summary(b));
  assert.equal(a.rest, b.rest);
});

test("casi limite: zero, negativo, meno dell'oggetto più piccolo, nessuna unità", () => {
  assert.deepEqual(decompose(0, marco), { parts: [], rest: 0 });
  assert.deepEqual(decompose(-500, marco), { parts: [], rest: 0 });
  assert.deepEqual(decompose(100, marco), { parts: [], rest: 100 });
  assert.deepEqual(decompose(1000, []), { parts: [], rest: 1000 });
});

test("maxParts si ferma dopo due tipi di oggetto (per i 'circa')", () => {
  const d = decompose(13780, [U.caffe, U.pizza, U.pranzo, U.spesa, U.colazione], 2);
  assert.equal(d.parts.length, 2);
  assert.equal(summary(d), "5×spesa 1×pranzo");
});

test("i prezzi della persona sostituiscono quelli indicativi, entro limiti sensati", () => {
  const [caffe, pizza] = resolveUnits([{ id: "caffe", cents: 150 }, { id: "pizza", cents: 5 }, { id: "inventato" }, { id: "caffe", cents: 300 }]);
  assert.equal(caffe.cents, 150);
  assert.equal(pizza.cents, 800, "prezzo fuori limite: resta quello indicativo");
  assert.equal(resolveUnits([{ id: "inventato" }]).length, 0);
  assert.equal(allUnits([{ id: "caffe", cents: 150 }]).find((u) => u.id === "caffe").cents, 150);
});

test("oggetti piccoli: tolgono il più caro e quelli sopra la parte di un giorno, ne restano almeno due", () => {
  assert.deepEqual(unitsFor("grandi", marco, 1263).map((u) => u.id), ["caffe", "pizza", "pranzo", "spesa"]);
  assert.deepEqual(unitsFor("piccoli", marco, 1263).map((u) => u.id), ["caffe", "pizza", "pranzo"]);
  assert.deepEqual(unitsFor("giorni", marco, 500).map((u) => u.id), ["caffe", "pizza"]);
  assert.deepEqual(unitsFor("oggi", [U.pieno, U.spesagrande, U.spesa], 100).map((u) => u.id), ["spesa", "pieno"]);
});
