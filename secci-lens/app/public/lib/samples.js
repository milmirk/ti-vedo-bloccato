/*
 * SECCI Lens · tre documenti di esempio.
 *
 * Finanziatori, negozi, indirizzi e contatti sono di fantasia (domini .example).
 * Le etichette seguono il modulo SECCI italiano.
 *
 * Flussi di cassa usati per il TAEG (vedi anche finance.js):
 *
 *  1 · Lavatrice «tasso zero», Aurora Credito
 *      t = 0      il finanziatore paga 600,00 € al negozio
 *      mese 1     rata 60,00 € + istruttoria 10,00 € + bollo 16,00 € + incasso 1,00 € = 87,00 €
 *      mesi 2…10  rata 60,00 € + incasso 1,00 € = 61,00 €
 *      totale dovuto 636,00 € · costo del credito 36,00 € · TAEG 14,19% (scritto = calcolato)
 *
 *  2 · Prestito personale, Banca Lanterna
 *      t = 0      ricevi 5.000,00 € e paghi alla firma istruttoria 100,00 € + imposta sostitutiva 12,50 €
 *      mesi 1…48  rata 124,19 € (TAN 8,90%, ammortamento alla francese) + incasso 1,50 € = 125,69 €
 *      totale dovuto 6.145,62 € · costo del credito 1.145,62 € · TAEG 11,28% (scritto = calcolato)
 *
 *  3 · Lavatrice in 16 rate, Faro Finanziaria · documento con un numero che non torna
 *      t = 0      il finanziatore paga 600,00 € al negozio
 *      mese 1     rata 39,09 € (TAN 5,90%) + istruttoria 10,00 € + bollo 16,00 € + incasso 1,00 € = 66,09 €
 *      mesi 2…16  rata 39,09 € + incasso 1,00 € = 40,09 €
 *      totale dovuto 667,44 € (scritto = calcolato) · costo del credito 67,44 €
 *      TAEG calcolato 17,19%; il documento scrive 6,08%, che è il risultato
 *      del calcolo fatto senza le spese.
 *
 * I test (test/samples.test.mjs) verificano che i TAEG scritti in 1 e 2 siano
 * uguali a quelli calcolati da finance.js, arrotondati a due decimali.
 */

const S1 = `INFORMAZIONI EUROPEE DI BASE SUL CREDITO AI CONSUMATORI

1. Identità e contatti del finanziatore/intermediario del credito
Finanziatore: Aurora Credito S.p.A.
Indirizzo: Via dei Mille 10, 20100 Milano (MI)
Telefono: 800 000 001
Email: info@aurora-credito.example
Sito web: www.aurora-credito.example
Intermediario del credito: Elettro Casa Bianchi S.r.l., Corso Italia 5, 40100 Bologna (BO)

2. Caratteristiche principali del prodotto di credito
Tipo di contratto di credito: Prestito finalizzato all'acquisto di un bene («Promo Tasso Zero»)
Importo totale del credito
Limite massimo o somma totale degli importi messi a disposizione del consumatore: 600,00 €
Condizioni di prelievo
Modalità e tempi con i quali il consumatore può utilizzare il credito: l'importo è versato direttamente al venditore alla conclusione del contratto.
Durata del contratto di credito: 10 mesi
Rate ed, eventualmente, loro ordine di imputazione
10 rate mensili da 60,00 €, con addebito diretto sul conto corrente. La prima rata scade 30 giorni dopo l'erogazione. I pagamenti sono imputati prima alle spese, poi agli interessi e infine al capitale.
Importo totale dovuto dal consumatore
Importo del capitale preso in prestito, più gli interessi e i costi connessi al credito: 636,00 €
Beni o servizi: Lavatrice a carica frontale 9 kg. Prezzo in contanti: 600,00 €
Garanzie richieste: nessuna

3. Costi del credito
Tasso di interesse o, se applicabile, tassi di interesse diversi che si applicano al contratto di credito
Tasso fisso. TAN (tasso annuo nominale): 0,00%
Tasso annuo effettivo globale (TAEG)
Costo totale del credito espresso in percentuale, calcolata su base annua, dell'importo totale del credito. Il TAEG consente al consumatore di confrontare le varie offerte.
TAEG: 14,19%
Per calcolare il TAEG sono stati considerati: interessi, spese di istruttoria, imposta di bollo e spese di incasso rata.
Per ottenere il credito o per ottenerlo alle condizioni contrattuali offerte, è obbligatorio sottoscrivere un'assicurazione che garantisca il credito: no.
Costi connessi
Spese di istruttoria: 10,00 €, addebitate sulla prima rata
Imposta di bollo sul contratto: 16,00 €, addebitata sulla prima rata
Spese di incasso rata: 1,00 € per ogni rata
Costi in caso di ritardo nel pagamento
Tasso di mora: TAN maggiorato di 2 punti percentuali. Spese per ogni sollecito di pagamento: 5,00 €.

4. Altri importanti aspetti legali
Diritto di recesso: sì. Il consumatore può recedere dal contratto entro 14 giorni di calendario dalla conclusione del contratto.
Rimborso anticipato: il consumatore può rimborsare il credito in anticipo, in tutto o in parte, in qualsiasi momento.
`;

const S2 = `INFORMAZIONI EUROPEE DI BASE SUL CREDITO AI CONSUMATORI

1. Identità e contatti del finanziatore
Finanziatore: Banca Lanterna S.p.A.
Indirizzo: Piazza della Loggia 3, 10100 Torino (TO)
Telefono: 011 000 0000
Email: prestiti@banca-lanterna.example
Sito web: www.banca-lanterna.example

2. Caratteristiche principali del prodotto di credito
Tipo di contratto di credito: Prestito personale
Importo totale del credito
Limite massimo o somma totale degli importi messi a disposizione del consumatore: € 5.000,00
Condizioni di prelievo
Modalità e tempi con i quali il consumatore può utilizzare il credito: l'importo è accreditato sul conto corrente del consumatore entro 5 giorni lavorativi dalla firma del contratto.
Durata del contratto di credito: 48 mesi
Rate ed, eventualmente, loro ordine di imputazione
48 rate mensili di € 124,19, ciascuna comprensiva di capitale e interessi (ammortamento alla francese), con addebito diretto sul conto corrente.
Importo totale dovuto dal consumatore
Importo del capitale preso in prestito, più gli interessi e i costi connessi al credito: € 6.145,62
Garanzie richieste: nessuna

3. Costi del credito
Tasso di interesse o, se applicabile, tassi di interesse diversi che si applicano al contratto di credito
Tasso fisso. TAN: 8,90%
Tasso annuo effettivo globale (TAEG)
Costo totale del credito espresso in percentuale, calcolata su base annua, dell'importo totale del credito. Il TAEG consente al consumatore di confrontare le varie offerte.
TAEG: 11,28%
Costi connessi
Spese di istruttoria: € 100,00, pagate alla firma del contratto
Imposta sostitutiva: € 12,50 (0,25% dell'importo totale del credito), pagata alla firma del contratto
Spese di incasso rata: € 1,50 per ciascuna rata
Spese per comunicazioni periodiche: gratuite in formato elettronico
Costi in caso di ritardo nel pagamento
Interessi di mora pari al TAN maggiorato di 2 punti percentuali.

4. Altri importanti aspetti legali
Diritto di recesso: sì, entro 14 giorni di calendario dalla conclusione del contratto.
Rimborso anticipato: il consumatore può rimborsare il credito in anticipo in qualsiasi momento. Il finanziatore ha diritto a un indennizzo non superiore all'1% dell'importo rimborsato in anticipo.
`;

const S3 = `INFORMAZIONI EUROPEE DI BASE SUL CREDITO AI CONSUMATORI

1. Identità e contatti del finanziatore
Finanziatore: Faro Finanziaria S.p.A.
Indirizzo: Viale Europa 21, 00100 Roma (RM)
Email: clienti@faro-finanziaria.example
Intermediario del credito: Mondo Elettrodomestici S.r.l.

2. Caratteristiche principali del prodotto di credito
Tipo di contratto di credito: Credito finalizzato all'acquisto rateale
Importo totale del credito: 600,00 €
Durata del contratto di credito: 16 mesi
Rate ed, eventualmente, loro ordine di imputazione: 16 rate mensili da 39,09 €, la prima 30 giorni dopo la consegna del bene
Importo totale dovuto dal consumatore: 667,44 €
Beni o servizi: Lavatrice 8 kg classe A. Prezzo in contanti: 600,00 €

3. Costi del credito
Tasso di interesse: TAN fisso 5,90%
Tasso annuo effettivo globale (TAEG): 6,08%
Costi connessi
Spese di istruttoria: 10,00 €, addebitate sulla prima rata
Imposta di bollo: 16,00 €, addebitata sulla prima rata
Spese di incasso rata: 1,00 € per ogni rata
Costi in caso di ritardo nel pagamento: interessi di mora al tasso legale maggiorato di 2 punti.

4. Altri importanti aspetti legali
Diritto di recesso: entro 14 giorni dalla conclusione del contratto.
`;

export const SAMPLES = [
  {
    id: "lavatrice-tasso-zero",
    title: "Lavatrice «tasso zero»",
    lender: "Aurora Credito",
    summary: "600 € in 10 rate, TAN 0%",
    text: S1,
  },
  {
    id: "prestito-personale",
    title: "Prestito personale",
    lender: "Banca Lanterna",
    summary: "5.000 € in 48 rate, TAN 8,90%",
    text: S2,
  },
  {
    id: "lavatrice-16-rate",
    title: "Lavatrice in 16 rate",
    lender: "Faro Finanziaria",
    summary: "600 € in 16 rate · un numero non torna",
    text: S3,
  },
];

export const sampleById = (id) => SAMPLES.find((s) => s.id === id) || null;
