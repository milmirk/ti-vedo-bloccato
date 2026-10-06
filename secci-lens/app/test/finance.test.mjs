import { test } from "node:test";
import assert from "node:assert/strict";
import {
  solveRate, computeTaeg, totalDue, buildSchedule, annuityPayment, impliedTan, checkCoherence, analyze,
  formatEuro, formatPercent, formatNumber, formatMonths, parseItNumber, decimalsOf, round2, roundTo,
} from "../public/lib/finance.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} non è vicino a ${b}`);
const plain = (creditAmount, count, amount, fees = []) => ({ creditAmount, installments: { count, amount }, fees });

test("TAEG 0%: le rate restituiscono esattamente il credito e non ci sono spese", () => {
  assert.equal(computeTaeg(plain(600, 10, 60)), 0);
  assert.equal(totalDue(plain(600, 10, 60)), 600);
});

test("TAEG su casi calcolati a mano (un solo pagamento)", () => {
  // 1.000 € oggi, 1.100 € tra 12 mesi: 1100 / (1+X) = 1000 → X = 10%
  near(solveRate([{ t: 0, amount: 1000 }], [{ t: 1, amount: 1100 }]) * 100, 10);
  // 1.000 € oggi, 1.050 € tra 6 mesi: (1,05)^2 − 1 = 10,25%
  near(solveRate([{ t: 0, amount: 1000 }], [{ t: 0.5, amount: 1050 }]) * 100, 10.25);
  // spesa di 100 € alla firma, 1.000 € tra un anno: 1000 / 900 − 1 = 11,11%
  near(solveRate([{ t: 0, amount: 1000 }], [{ t: 0, amount: 100 }, { t: 1, amount: 1000 }]) * 100, 100 / 9);
});

test("senza spese, il TAEG di un ammortamento alla francese è (1 + TAN/12)^12 − 1", () => {
  const rata = annuityPayment(5000, 8.9, 48);
  near(computeTaeg(plain(5000, 48, rata)), ((1 + 0.089 / 12) ** 12 - 1) * 100, 1e-6);
  assert.equal(round2(rata), 124.19);
});

test("il risolutore regge tassi molto alti e tassi negativi", () => {
  // 1.000 € oggi, 2.000 € dopo un mese: X = 2^12 − 1
  near(solveRate([{ t: 0, amount: 1000 }], [{ t: 1 / 12, amount: 2000 }]), 2 ** 12 - 1, 1e-3);
  // restituisco meno di quanto ricevo: tasso negativo
  near(solveRate([{ t: 0, amount: 1000 }], [{ t: 1, amount: 900 }]) * 100, -10);
});

test("la stessa spesa pesa di più se si paga prima: firma > prima rata > nessuna spesa", () => {
  const base = { creditAmount: 600, installments: { count: 10, amount: 60 } };
  const firma = computeTaeg({ ...base, fees: [{ kind: "istruttoria", amount: 20, timing: "start" }] });
  const prima = computeTaeg({ ...base, fees: [{ kind: "istruttoria", amount: 20, timing: "first" }] });
  const zero = computeTaeg({ ...base, fees: [] });
  assert.ok(firma > prima && prima > zero, `${firma} > ${prima} > ${zero}`);
});

test("piano delle rate: il capitale torna tutto, gli interessi sono rate − credito", () => {
  const rata = round2(annuityPayment(5000, 8.9, 48));
  const rows = buildSchedule(plain(5000, 48, rata, [{ kind: "incasso", label: "Spese di incasso rata", amount: 1.5, timing: "each" }]));
  assert.equal(rows.length, 48);
  near(rows.reduce((s, r) => s + r.principal, 0), 5000, 1e-6);
  near(rows.reduce((s, r) => s + r.interest, 0), 48 * rata - 5000, 1e-6);
  assert.equal(rows.at(-1).residual, 0);
  assert.ok(rows[0].interest > rows.at(-1).interest, "con l'ammortamento alla francese gli interessi calano");
  near(rows[0].total, rata + 1.5, 1e-9);
});

test("spese alla firma: compaiono come pagamento a t = 0 nel piano", () => {
  const rows = buildSchedule(plain(1000, 2, 500, [{ kind: "istruttoria", label: "Spese di istruttoria", amount: 30, timing: "start" }]));
  assert.equal(rows[0].k, 0);
  assert.equal(rows[0].total, 30);
  assert.equal(rows.length, 3);
});

test("TAN implicito nelle rate", () => {
  near(impliedTan(plain(600, 10, 60)), 0);
  near(impliedTan(plain(5000, 48, annuityPayment(5000, 8.9, 48))), 8.9, 1e-6);
});

test("controllo di coerenza: coincide, non coincide, e tolleranza per un TAEG scritto con un decimale", () => {
  const credit = plain(600, 10, 60, [{ kind: "bollo", amount: 16, timing: "first" }]);
  const taeg = computeTaeg(credit);
  const [ok] = checkCoherence(credit, { taeg: roundTo(taeg, 2), taegDecimals: 2 });
  assert.equal(ok.match, true);
  const [ko] = checkCoherence(credit, { taeg: roundTo(taeg, 2) + 0.5, taegDecimals: 2 });
  assert.equal(ko.match, false);
  const [one] = checkCoherence(credit, { taeg: roundTo(taeg, 1), taegDecimals: 1 });
  assert.equal(one.match, true);
  const due = checkCoherence(credit, { totalDue: 616 }).find((c) => c.key === "totalDue");
  assert.equal(due.match, true);
  assert.equal(checkCoherence(credit, { totalDue: 600 })[0].match, false);
});

test("analisi: costo totale del credito = totale dovuto − importo del credito", () => {
  const a = analyze(plain(600, 10, 60, [
    { kind: "istruttoria", label: "Spese di istruttoria", amount: 10, timing: "first" },
    { kind: "incasso", label: "Spese di incasso rata", amount: 1, timing: "each" },
  ]));
  assert.equal(a.totalDue, 620);
  assert.equal(a.totalCost, 20);
  assert.equal(a.feesTotal, 20);
  assert.equal(a.interestTotal, 0);
  assert.equal(a.durationMonths, 10);
});

test("formati italiani dei numeri", () => {
  assert.equal(formatEuro(1234.56), "1.234,56 €");
  assert.equal(formatEuro(6145.62), "6.145,62 €");
  assert.equal(formatEuro(0.5), "0,50 €");
  assert.equal(formatEuro(1000000), "1.000.000,00 €");
  assert.equal(formatPercent(14.194529), "14,19%");
  assert.equal(formatNumber(30, 0), "30");
  assert.equal(formatMonths(10), "10 mesi");
  assert.equal(formatMonths(48), "48 mesi (4 anni)");
  assert.equal(formatMonths(16), "16 mesi (1 anno e 4 mesi)");
});

test("lettura dei numeri scritti all'italiana", () => {
  assert.equal(parseItNumber("€ 5.000,00"), 5000);
  assert.equal(parseItNumber("1.234,56"), 1234.56);
  assert.equal(parseItNumber("600,00 €"), 600);
  assert.equal(parseItNumber("8,90%"), 8.9);
  assert.equal(parseItNumber("17.43"), 17.43);
  assert.ok(Number.isNaN(parseItNumber("dieci")));
  assert.equal(decimalsOf("14,19%"), 2);
  assert.equal(decimalsOf("14,2%"), 1);
});
