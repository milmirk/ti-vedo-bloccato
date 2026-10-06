/*
 * Le 7 email di esempio di Chiara. Servizi, negozi e indirizzi sono INVENTATI:
 * Pago3, Rateo e DividiPay sono servizi "compra ora, paga dopo" di fantasia,
 * ElettroCasa è un negozio di fantasia con un finanziamento in negozio.
 * Ogni servizio ha il suo formato, come succede davvero.
 */

export const SAMPLE_TODAY = "2026-10-06";

export const SAMPLE_EMAILS = [
  {
    id: "es-pago3-modavia",
    label: "Pago3 · ModaVia",
    text: `Da: Pago3 <notifiche@pago3.example>
Oggetto: Ordine confermato: ModaVia, paghi in 3 rate
Data: 28/09/2026

Ciao Chiara,
il tuo acquisto su ModaVia è confermato.

Importo totale: 89,90 €
Piano: 3 rate mensili da 29,97 €
1ª rata: 29,97 € addebitata oggi, 28/09/2026
2ª rata: 29,97 € il 28/10/2026
3ª rata: 29,96 € il 28/11/2026

Le rate vengono addebitate in automatico sulla carta che hai indicato.
Se un addebito non va a buon fine, riproviamo dopo 2 giorni. In caso di mancato pagamento può essere applicata una commissione di ritardo fino a 7,00 €.

Il team Pago3`,
  },
  {
    id: "es-pago3-beautyland",
    label: "Pago3 · Beautyland",
    text: `Da: Pago3 <notifiche@pago3.example>
Oggetto: Ordine confermato: Beautyland, paghi in 3 rate
Data: 02/10/2026

Ciao Chiara,
il tuo acquisto su Beautyland è confermato.

Importo totale: 45,00 €
Piano: 3 rate mensili da 15,00 €
1ª rata: 15,00 € addebitata oggi, 02/10/2026
2ª rata: 15,00 € il 02/11/2026
3ª rata: 15,00 € il 02/12/2026

Le rate vengono addebitate in automatico sulla carta che hai indicato.
Se un addebito non va a buon fine, riproviamo dopo 2 giorni. In caso di mancato pagamento può essere applicata una commissione di ritardo fino a 7,00 €.

Il team Pago3`,
  },
  {
    id: "es-rateo-sneakerama",
    label: "Rateo · Sneakerama",
    text: `Da: Rateo <ciao@rateo.example>
Oggetto: Ecco il tuo piano Rateo per Sneakerama

Ehi Chiara!

Hai acquistato da Sneakerama per € 120,00.
Lo paghi in 4 rate da € 30,00, una ogni 2 settimane.

Prima rata: giovedì 24 settembre 2026 (pagata)
Poi: 8 ottobre, 22 ottobre e 5 novembre.

Ricorda: in caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.

A presto,
Rateo`,
  },
  {
    id: "es-rateo-pixelplay",
    label: "Rateo · PixelPlay",
    text: `Da: Rateo <ciao@rateo.example>
Oggetto: Ecco il tuo piano Rateo per PixelPlay

Ehi Chiara!

Hai acquistato da PixelPlay per € 79,99.
Lo paghi in 4 rate da € 19,99, una ogni 2 settimane. L'ultima rata è di € 20,02 per l'arrotondamento.

Prima rata: lunedì 5 ottobre 2026 (pagata)
Poi: 19 ottobre, 2 novembre e 16 novembre.

Ricorda: in caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.

A presto,
Rateo`,
  },
  {
    id: "es-dividipay-librilab",
    label: "DividiPay · LibriLab",
    text: `From: DividiPay <no-reply@dividipay.example>
Subject: Riepilogo del piano DividiPay #DP-58213

RIEPILOGO PIANO
Negozio: LibriLab
Totale ordine: EUR 64.50
Numero pagamenti: 3
Frequenza: ogni 30 giorni
Primo addebito: 2026-09-20
Importo di ogni pagamento: EUR 21.50

Gli addebiti successivi avvengono in automatico ogni 30 giorni dal primo.
Per domande rispondi a questa email.
DividiPay`,
  },
  {
    id: "es-dividipay-suonalive",
    label: "DividiPay · SuonaLive",
    text: `From: DividiPay <no-reply@dividipay.example>
Subject: Riepilogo del piano DividiPay #DP-60774

RIEPILOGO PIANO
Negozio: SuonaLive
Totale ordine: EUR 156.00
Numero pagamenti: 4
Frequenza: ogni 30 giorni
Primo addebito: 2026-10-04
Importo di ogni pagamento: EUR 39.00

Gli addebiti successivi avvengono in automatico ogni 30 giorni dal primo.
Per domande rispondi a questa email.
DividiPay`,
  },
  {
    id: "es-elettrocasa",
    label: "ElettroCasa · finanziamento",
    text: `Da: ElettroCasa Finanziamenti <finanziamenti@elettrocasa.example>
Oggetto: Conferma del contratto di finanziamento n. EC-2026-004471

Gentile Cliente,
le confermiamo l'attivazione del finanziamento per l'acquisto effettuato il 03/10/2026 presso il punto vendita ElettroCasa.

Bene acquistato: Smartphone Kappa X5
Importo finanziato: € 699,00
Numero di rate: 10, a cadenza mensile
Importo della rata: € 69,90
Scadenza della prima rata: 30 novembre 2026
Le rate successive scadono il giorno 30 di ogni mese; a febbraio, l'ultimo giorno del mese.
TAN 0,00% - TAEG 0,00%
Importo totale dovuto: € 699,00

In caso di ritardato pagamento sarà applicata una penale di € 10,00 per ciascuna rata insoluta.

Distinti saluti,
ElettroCasa Finanziamenti`,
  },
];

/** Un'email in un formato che nessun parser dedicato conosce: serve per la demo dell'AI. */
export const UNKNOWN_SAMPLE = `Da: PagaPoi <info@pagapoi.example>
Oggetto: Grazie per il tuo ordine

Ciao! Abbiamo diviso la tua spesa da CasaDeco: 75,00 euro in tutto.
Paghi tre quote da 25,00 euro, una al mese.
Si comincia giovedì 15 ottobre 2026.
Grazie da PagaPoi`;
