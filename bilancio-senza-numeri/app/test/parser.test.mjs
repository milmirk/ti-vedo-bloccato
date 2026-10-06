import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSpendText, parseAmount, wordToNumber, textHasNumber, textHasAmount, normalize } from "../public/lib/parser.js";
import { allUnits } from "../public/lib/units.js";

const items = (t, units) => parseSpendText(t, units).items.map((i) => `${i.count}×${i.unitId}=${i.cents}`).join(" ");

test("frasi semplici con un oggetto", () => {
  assert.equal(items("un caffè"), "1×caffe=120");
  assert.equal(items("Caffe"), "1×caffe=120", "senza accento e con la maiuscola");
  assert.equal(items("2 pizze"), "2×pizza=1600");
  assert.equal(items("ho preso tre panini"), "3×panino=1500");
});

test("importi scritti dalla persona: dopo l'oggetto, con «euro» o con «€»", () => {
  assert.equal(items("spesa 30"), "1×spesa=3000");
  assert.equal(items("benzina 50 euro"), "1×pieno=5000");
  assert.equal(items("30 euro di spesa"), "1×spesa=3000");
  assert.equal(items("pizza 9,50€"), "1×pizza=950");
  assert.equal(items("2 pizze, 18 euro"), "2×pizza=1800", "l'importo è il totale della voce");
  assert.equal(items("tre caffè da 1,50"), "3×caffe=450", "«da» indica il prezzo di ciascuno");
});

test("frasi con più cose e con l'importo staccato", () => {
  assert.equal(items("due caffè e un panino"), "2×caffe=240 1×panino=500");
  assert.equal(items("ho fatto la spesa, circa 30 euro"), "1×spesa=3000");
  assert.equal(items("una spesa grande e un pieno"), "1×spesagrande=8000 1×pieno=6000");
  assert.equal(items("regalo 15 euro"), "1×altro=1500");
});

test("usa i prezzi della persona", () => {
  const mine = allUnits([{ id: "caffe", cents: 150 }]);
  assert.equal(items("due caffè", mine), "2×caffe=300");
});

test("quello che non capisce lo dice, senza inventare", () => {
  const r = parseSpendText("un caffè e poi il parcheggio");
  assert.equal(r.items.length, 1);
  assert.deepEqual(r.unknown, ["il parcheggio"]);
  const none = parseSpendText("boh");
  assert.deepEqual(none.items, []);
  assert.deepEqual(none.unknown, ["boh"]);
  assert.deepEqual(parseSpendText("").items, []);
  assert.deepEqual(parseSpendText("ventidue pizze").unknown, ["ventidue pizze"], "più di venti pezzi: meglio chiedere");
  assert.deepEqual(parseSpendText("spesa 5000 euro").unknown, ["spesa 5000 euro"], "importo fuori misura");
});

test("numeri e importi, in cifre e in lettere", () => {
  assert.equal(wordToNumber("trentacinque"), 35);
  assert.equal(wordToNumber("ventitré"), 23);
  assert.equal(wordToNumber("pizza"), null);
  assert.equal(parseAmount("circa 30 euro"), 3000);
  assert.equal(parseAmount("2,5"), 250);
  assert.equal(parseAmount("trenta euro"), 3000);
  assert.equal(parseAmount("niente"), null);
  assert.equal(normalize("Ho preso 2 PIZZE, 18€."), "ho preso 2 pizze , 18 euro ,");
  assert.ok(textHasNumber("due caffè", 2) && textHasNumber("2 caffè", 2) && !textHasNumber("un caffè", 2));
  assert.ok(textHasAmount("spesa 30 euro", 3000) && !textHasAmount("spesa 30 euro", 300), "«3» non vale se il testo dice «30»");
});

test("un totale per più cose resta un totale, i soldi ricevuti non sono spese, «un paio» vale due", () => {
  const r = parseSpendText("due caffè e un panino, 8 euro in tutto");
  assert.deepEqual(r.items, [{ unitId: "altro", count: 1, cents: 800, priced: "testo", label: "due caffè e un panino" }]);
  assert.equal(r.totalCents, 800);
  const back = parseSpendText("un caffè e mi hanno ridato 5 euro");
  assert.equal(back.totalCents, 120);
  assert.deepEqual(back.unknown, ["mi hanno ridato 5 euro"]);
  assert.equal(items("un paio di caffè"), "2×caffe=240");
  assert.ok(textHasNumber("un paio di caffè", 2));
});
