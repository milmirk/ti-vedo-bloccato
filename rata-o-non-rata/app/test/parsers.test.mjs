import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_EMAILS, UNKNOWN_SAMPLE } from "../public/lib/samples.js";
import { parseEmail, splitEmails } from "../public/lib/parsers.js";
import { parseAmount, amountsInText, parseCount, countAppears, formatEuro } from "../public/lib/money.js";
import { parseDate, datesInText } from "../public/lib/dates.js";

const sample = (id) => SAMPLE_EMAILS.find((e) => e.id === id).text;

function expectPurchase(text, expected) {
  const r = parseEmail(text);
  assert.equal(r.status, "riconosciuta", `stato: ${r.status}, mancano: ${r.missing}`);
  for (const [k, v] of Object.entries(expected)) assert.deepEqual(r.purchase[k], v, k);
  // Semplificare senza tradire: ogni frase sorgente è copiata identica dall'email.
  for (const [k, src] of Object.entries(r.purchase.sources)) assert.ok(text.includes(src), `sorgente di ${k} non trovata: ${src}`);
  return r;
}

test("importi all'italiana e all'inglese diventano centesimi interi", () => {
  assert.equal(parseAmount("89,90 €"), 8990);
  assert.equal(parseAmount("€ 1.234,50"), 123450);
  assert.equal(parseAmount("EUR 64.50"), 6450);
  assert.equal(parseAmount("120"), 12000);
  assert.equal(parseAmount("1.200"), 120000);
  assert.equal(parseAmount("75,00 euro"), 7500);
  assert.equal(parseAmount("abc"), null);
  assert.equal(formatEuro(123450), "1.234,50 €");
  assert.equal(formatEuro(4000, { sign: true }), "+40,00 €");
});

test("negli importi del testo non finiscono i numeri delle date", () => {
  const cents = amountsInText("Prima rata: 28/10/2026, importo € 30,00 e 2026-10-04. Totale 120 euro.").map((a) => a.cents);
  assert.deepEqual(cents.sort((a, b) => a - b), [3000, 12000]);
});

test("date in tutti i formati delle email, con controllo dei giorni veri", () => {
  assert.equal(parseDate("28/09/2026"), "2026-09-28");
  assert.equal(parseDate("2026-10-04"), "2026-10-04");
  assert.equal(parseDate("giovedì 24 settembre 2026 (pagata)"), "2026-09-24");
  assert.equal(parseDate("1° ottobre 2026"), "2026-10-01");
  assert.equal(parseDate("28.10.2026"), "2026-10-28");
  assert.equal(parseDate("31/02/2026"), null);
  assert.deepEqual(datesInText("dal 2026-09-20 al 19 novembre 2026").map((d) => d.iso), ["2026-09-20", "2026-11-19"]);
});

test("numero di rate in cifre o in lettere, solo vicino a 'rate' o 'pagamenti'", () => {
  assert.equal(parseCount("tre"), 3);
  assert.equal(parseCount("10, a cadenza mensile"), 10);
  assert.ok(countAppears("Paghi tre quote da 25,00 euro", 3));
  assert.ok(countAppears("Numero pagamenti: 4", 4));
  assert.ok(!countAppears("Primo addebito: 2026-10-04", 4));
});

test("Pago3: rate mensili con prima rata a data numerica", () => {
  const r = expectPurchase(sample("es-pago3-modavia"), {
    provider: "Pago3", merchant: "ModaVia", kind: "bnpl", total: 8990, count: 3,
    installmentAmount: 2997, firstDate: "2026-09-28", frequency: "mensile",
  });
  assert.equal(r.purchase.sources.total, "Importo totale: 89,90 €");
  assert.match(r.purchase.lateFee, /commissione di ritardo fino a 7,00 €/);
});

test("Rateo: ogni 2 settimane, data scritta per esteso, penale come scritta", () => {
  const r = expectPurchase(sample("es-rateo-pixelplay"), {
    provider: "Rateo", merchant: "PixelPlay", total: 7999, count: 4,
    installmentAmount: 1999, firstDate: "2026-10-05", frequency: "ogni_2_settimane",
  });
  assert.equal(r.purchase.sources.frequency, "Lo paghi in 4 rate da € 19,99, una ogni 2 settimane.");
  assert.equal(r.purchase.lateFee, "Ricorda: in caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.");
});

test("DividiPay: EUR con il punto, data ISO, ogni 30 giorni, nessuna penale scritta", () => {
  const r = expectPurchase(sample("es-dividipay-suonalive"), {
    provider: "DividiPay", merchant: "SuonaLive", total: 15600, count: 4,
    installmentAmount: 3900, firstDate: "2026-10-04", frequency: "ogni_30_giorni",
  });
  assert.equal(r.purchase.lateFee, null);
});

test("ElettroCasa: finanziamento in negozio, totale dovuto, 10 rate mensili", () => {
  expectPurchase(sample("es-elettrocasa"), {
    provider: "ElettroCasa", merchant: "Smartphone Kappa X5", kind: "finanziamento", total: 69900, count: 10,
    installmentAmount: 6990, firstDate: "2026-11-30", frequency: "mensile",
  });
});

test("tutte le 7 email di esempio vengono riconosciute dal loro parser", () => {
  const parsers = SAMPLE_EMAILS.map((e) => parseEmail(e.text)).map((r) => `${r.status}:${r.parser}`);
  assert.deepEqual(parsers, [
    "riconosciuta:pago3", "riconosciuta:pago3", "riconosciuta:rateo", "riconosciuta:rateo",
    "riconosciuta:dividipay", "riconosciuta:dividipay", "riconosciuta:elettrocasa",
  ]);
});

test("formato sconosciuto: le regole generiche trovano solo ciò che è scritto, il resto manca", () => {
  const r = parseEmail(UNKNOWN_SAMPLE);
  assert.equal(r.status, "incompleta");
  assert.deepEqual(r.missing.sort(), ["firstDate", "total"]);
  assert.equal(r.purchase.provider, "PagaPoi");
  assert.equal(r.purchase.count, 3);
  assert.equal(r.purchase.installmentAmount, 2500);
  assert.equal(r.purchase.frequency, "mensile");
});

test("formato generico completo: va controllato dalla persona, non aggiunto da solo", () => {
  const r = parseEmail("Da: PagaFacile <x@y.example>\nTotale ordine: 60,00 €\nPaghi in 3 rate mensili.\nPrima rata il 10/11/2026.");
  assert.equal(r.status, "da_controllare");
  assert.equal(r.purchase.total, 6000);
  assert.equal(r.purchase.firstDate, "2026-11-10");
});

test("un testo incollato con più email viene diviso", () => {
  const joined = SAMPLE_EMAILS.slice(0, 3).map((e) => e.text).join("\n\n");
  assert.equal(splitEmails(joined).length, 3);
  assert.equal(splitEmails("prima\n---\nseconda").length, 2);
  assert.equal(splitEmails("   ").length, 0);
});

test("anche il nome del servizio ha la sua riga sorgente (il mittente)", () => {
  for (const e of SAMPLE_EMAILS) {
    const p = parseEmail(e.text).purchase;
    assert.ok(p.sources.provider && p.sources.provider.includes(p.provider), e.id);
    assert.match(p.sources.provider, /^(Da|From):/, e.id);
  }
});

test("date con l'articolo giusto nelle frasi: il 2, l'8, dall'11, al 30", async () => {
  const { withArticle } = await import("../public/lib/dates.js");
  assert.equal(withArticle("2026-12-02", 2026), "il 2 dicembre");
  assert.equal(withArticle("2026-10-08", 2026), "l'8 ottobre");
  assert.equal(withArticle("2027-05-11", 2026, "dal"), "dall'11 maggio 2027");
  assert.equal(withArticle("2027-08-30", null, "al"), "al 30 agosto 2027");
});
