import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSecci, toCredit, detectTiming, fromAiFields, mergeParsed, locate } from "../public/lib/parser.js";
import { sampleById } from "../public/lib/samples.js";

const S1 = sampleById("lavatrice-tasso-zero").text;
const S2 = sampleById("prestito-personale").text;
const S3 = sampleById("lavatrice-16-rate").text;

test("esempio 1: legge ogni dato con il brano esatto del documento", () => {
  const p = parseSecci(S1);
  const f = p.fields;
  assert.equal(f.creditAmount.value, 600);
  assert.equal(f.creditAmount.raw, "600,00 €");
  assert.equal(f.duration.months, 10);
  assert.deepEqual([f.installments.count, f.installments.amount, f.installments.periodsPerYear], [10, 60, 12]);
  assert.equal(f.totalDue.value, 636);
  assert.equal(f.tan.value, 0);
  assert.equal(f.taeg.value, 14.19);
  assert.equal(f.lender.value, "Aurora Credito S.p.A.");
  for (const [key, field] of Object.entries(f)) {
    assert.ok(S1.includes(field.source), `${key}: il brano compare nel documento`);
    assert.ok(field.source.includes(field.raw), `${key}: il valore è dentro il brano`);
    assert.equal(S1.slice(field.valueStart, field.valueEnd), field.raw, `${key}: le posizioni puntano al valore`);
  }
  assert.match(f.taeg.source, /^Tasso annuo effettivo globale \(TAEG\)/);
});

test("esempio 1: tre spese, con il momento in cui si pagano", () => {
  const fees = parseSecci(S1).fees.map((x) => [x.kind, x.amount, x.timing, x.assumed]);
  assert.deepEqual(fees, [
    ["istruttoria", 10, "first", false],
    ["bollo", 16, "first", false],
    ["incasso", 1, "each", false],
  ]);
});

test("esempio 2: simbolo € prima del numero, migliaia col punto, spese alla firma", () => {
  const p = parseSecci(S2);
  assert.equal(p.fields.creditAmount.value, 5000);
  assert.equal(p.fields.creditAmount.raw, "€ 5.000,00");
  assert.equal(p.fields.totalDue.value, 6145.62);
  assert.equal(p.fields.installments.amount, 124.19);
  assert.equal(p.fields.tan.value, 8.9);
  const fees = Object.fromEntries(p.fees.map((x) => [x.kind, x]));
  assert.equal(fees.istruttoria.timing, "start");
  assert.equal(fees.imposta.amount, 12.5, "prende l'importo in euro, non lo 0,25%");
  assert.equal(fees.imposta.timing, "start");
  assert.equal(fees.incasso.timing, "each");
  assert.equal(p.fees.length, 3, "«Spese per comunicazioni periodiche: gratuite» non è una spesa");
});

test("esempio 3: formato compatto, etichetta e valore sulla stessa riga", () => {
  const p = parseSecci(S3);
  assert.equal(p.fields.taeg.value, 6.08);
  assert.equal(p.fields.tan.value, 5.9);
  assert.equal(p.fields.installments.count, 16);
  assert.equal(p.fields.installments.amount, 39.09);
  assert.deepEqual(p.missing, []);
});

test("variante: righe separate per numero e importo delle rate, elenchi puntati, a capo Windows", () => {
  const text = [
    "Informazioni europee di base sul credito ai consumatori",
    "- Importo totale del credito: 1.200,00 euro",
    "- Numero rate: 12",
    "- Importo rata: € 100,00",
    "- Spese di istruttoria: 20,00 €",
    "- TAEG: 3,1%",
  ].join("\r\n");
  const p = parseSecci(text);
  assert.equal(p.fields.creditAmount.value, 1200);
  assert.equal(p.fields.installments.count, 12);
  assert.equal(p.fields.installments.amount, 100);
  assert.equal(p.fields.taeg.decimals, 1);
  const fee = p.fees[0];
  assert.equal(fee.timing, "start");
  assert.equal(fee.assumed, true, "il documento non dice quando: ipotesi prudente, dichiarata");
  assert.ok(toCredit(p));
});

test("un testo che non è un SECCI non viene interpretato a caso", () => {
  const p = parseSecci("Ciao! Ti mando il preventivo del divano: 550 euro, si può fare in 12 rate.");
  assert.equal(p.isSecci, false);
  assert.equal(p.complete, false);
  assert.equal(toCredit(p), null);
  assert.equal(parseSecci("").complete, false);
});

test("momento di pagamento delle spese dalle parole del documento", () => {
  assert.equal(detectTiming("Spese di istruttoria: 10 €, addebitate sulla prima rata", "istruttoria").timing, "first");
  assert.equal(detectTiming("Spese di incasso rata: 1 € per ogni rata", "incasso").timing, "each");
  assert.equal(detectTiming("Imposta: 16 €, trattenuta all'erogazione", "bollo").timing, "start");
  assert.deepEqual(detectTiming("Imposta di bollo: 16 €", "bollo"), { timing: "start", assumed: true });
});

const DOC = `Preventivo finanziamento - Aurora Credito
Ti finanziamo 900 euro per il divano.
Pagherai in 18 comode rate mensili da 52,50 euro l'una.
Commissione di gestione pratica 25 euro alla firma.
Totale da restituire 970,00 euro.`;

test("citazioni dell'AI: accettate solo se compaiono nel documento, numeri letti dal codice", () => {
  const ai = {
    fields: {
      lender: { quote: "Aurora Credito", value_text: "Aurora Credito" },
      creditAmount: { quote: "Ti finanziamo 900 euro per il divano.", value_text: "900 euro" },
      duration: { quote: "", value_text: "" },
      installments: { quote: "Pagherai in 18 comode rate   mensili da 52,50 euro l'una.", count_text: "18", amount_text: "52,50 euro" },
      totalDue: { quote: "Totale da restituire 970,00 euro.", value_text: "970,00 euro" },
      tan: { quote: "TAN 0%", value_text: "0%" },
      taeg: { quote: "TAEG 9,99%", value_text: "9,99%" },
    },
    fees: [
      { kind: "istruttoria", label: "Commissione di gestione pratica", amount_text: "25 euro", quote: "Commissione di gestione pratica 25 euro alla firma." },
      { kind: "altro", label: "Spese postali", amount_text: "3 euro", quote: "Spese postali 3 euro" },
    ],
  };
  const p = fromAiFields(DOC, ai);
  assert.equal(p.fields.creditAmount.value, 900);
  assert.equal(p.fields.installments.count, 18);
  assert.equal(p.fields.installments.amount, 52.5);
  assert.equal(p.fields.totalDue.value, 970);
  assert.ok(DOC.includes(p.fields.installments.source), "il brano mostrato è quello vero, non quello dell'AI");
  assert.equal(p.fields.tan, undefined, "TAN e TAEG inventati vengono scartati");
  assert.equal(p.fields.taeg, undefined);
  assert.equal(p.fees.length, 1, "la spesa inventata viene scartata");
  assert.equal(p.fees[0].timing, "start");
  assert.equal(p.rejected.length, 3);
  assert.equal(p.complete, true);
});

test("citazioni dell'AI: un valore che non è dentro la sua citazione viene scartato", () => {
  const p = fromAiFields(DOC, { fields: { creditAmount: { quote: "Ti finanziamo 900 euro per il divano.", value_text: "950 euro" } }, fees: [] });
  assert.equal(p.fields.creditAmount, undefined);
  assert.match(p.rejected[0].reason, /non compare nella citazione/);
  assert.equal(fromAiFields(DOC, null).complete, false, "risposta vuota o malformata: nessun dato");
});

test("unione regole + AI: i valori letti dalle regole hanno la precedenza", () => {
  const rules = parseSecci(S3);
  const ai = fromAiFields(S3, { fields: { creditAmount: { quote: "Prezzo in contanti: 600,00 €", value_text: "600,00 €" } }, fees: [] });
  const merged = mergeParsed(rules, ai);
  assert.equal(merged.fields.creditAmount.origin, "regole");
  assert.equal(merged.origin, "regole");
  assert.ok(locate(S3, "Importo totale   del credito"), "la ricerca tollera spazi diversi");
});
