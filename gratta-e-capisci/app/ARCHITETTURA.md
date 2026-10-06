# Architettura — Fortuna in Chiaro

Simulatore educativo statico (Tema 02). Si apre con un doppio click su `app/index.html`: nessun server, nessuna build, nessuna dipendenza, **zero token a runtime**.

## 1. Struttura dei file e proprietà

| File | Contenuto | Proprietario |
|---|---|---|
| `index.html` | Schermate (benvenuto, quiz, abitudine, anno in 10 s, schede, cruscotto) | Stanza Esperienza |
| `style.css` | Stile | Stanza Esperienza |
| `src/ui.js` | Eventi, rendering, animazione; chiama solo `window.Motore` e legge `window.GIOCHI` / `window.QUIZ` | Stanza Esperienza |
| `data/giochi.js` | `window.GIOCHI`: giochi, tabelle premi, fonti, numero verde | Stanza Motore |
| `data/quiz.js` | `window.QUIZ`: domande, opzioni, risposta corretta, spiegazione | Stanza Motore |
| `src/motore.js` | `window.Motore`: funzioni pure (calcolo, PRNG, simulazioni, quiz) | Stanza Motore |
| `tests/motore.test.js`, `tests/tests.html`, `tests/run-tests.ps1` | Test della logica (Edge headless) | Stanza Motore |

Ordine di caricamento in `index.html`:
```html
<script src="data/giochi.js"></script>
<script src="data/quiz.js"></script>
<script src="src/motore.js"></script>
<script src="src/ui.js"></script>
```
I dati sono file `.js` che assegnano una variabile globale, **non** `.json`: `fetch()` non funziona da `file://`.

## 2. Dati (`window.GIOCHI`)

```js
GIOCHI.giochi = [
  { id: "istantanea-5-a", tipo: "istantanea", nome: "Lotteria istantanea da 5 € (modello A)",
    prezzo: 5, emissione: 49920000, premi: [{ premio: 500000, vincenti: 4 }, ...],
    fonte: { ente: "ADM", url: "...", sezione: "ricerca-azzardo.md §1.1", affidabilita: "UFF" } },
  { id: "istantanea-5-b", ... }                        // §1.2, payout 60,1%
];
// Solo giochi con tabella premi ufficiale ADM. Il Lotto (ambo, terno) è stato tolto al checkpoint
// delle 14:30, perché le sue probabilità non erano riscontrate sulla pagina ADM.
GIOCHI.estrazioni = { numeri: 90, estratti: 5 }       // simulatore dei ritardatari: un'estrazione di 5 numeri su 90, come nel Lotto (§2)
GIOCHI.numeroVerde = { numero: "800 55 88 22", orari: "lunedì-venerdì 10:00-16:00", ... } // §6
GIOCHI.tettoPayoutLotterie = 0.75                      // §3
GIOCHI.italia2024 = { perditaNetta: 21.5e9, raccolta: 157.45e9, fonte: { sezione: "ricerca-azzardo.md §4", affidabilita: "UFF-sec" } } // BR-14
GIOCHI.seme = { demo: 20261005 }                      // BR-10
GIOCHI.abitudineDemo = { voci: [{ gioco: "istantanea-5-a", volte: 2, periodo: "giorno" }] } // Salvatore, 10 €/giorno
```
Ogni numero ha campo `fonte` con la sezione di `docs/idea/ricerca-azzardo.md`. Nessun marchio commerciale (BR-09).

## 3. Contratto API di `src/motore.js` (`window.Motore`)

Tutte funzioni pure: nessun accesso al DOM, nessuno stato globale. Importi in euro (numeri), probabilità in [0,1].

**Abitudine** (input comune):
```js
{ voci: [ { gioco: "istantanea-5-a", volte: 2, periodo: "giorno" },     // periodo: "giorno" | "settimana"
          { gioco: "istantanea-5-b", volte: 3, periodo: "settimana" } ] }
```

| Funzione | Output | Esempio |
|---|---|---|
| `trovaGioco(id)` | oggetto gioco o eccezione | `trovaGioco("istantanea-5-a").prezzo` → `5` |
| `spesa(abitudine)` | `{ giorno, mese, anno }` (mese = anno/12, anno = giorno×365) | 2×5 €/giorno → `{ giorno: 10, mese: 304.17, anno: 3650 }` |
| `spesaAnnuaDaGiornaliera(eur)` | numero | `10` → `3650` |
| `valoreAtteso(giocoId)` | `{ costo, ritorno, perEuro }` per una giocata | A → `{ costo: 5, ritorno: 3.5607, perEuro: 0.7121 }` |
| `payout(giocoId)` | frazione restituita per euro | A → `0.7121`, B → `0.6006` |
| `perditaAttesa(abitudine)` | `{ giorno, anno, spesaAnno, ritornoAnno, perEuro }` | Salvatore → `anno ≈ 1050.83` (su 3.650) |
| `perditaAttesaSu(prezzo, payout, giocate)` | numero (per la domanda di trasferimento) | `(2, 0.7, 100)` → `60` |
| `probabilitaPremioMax(giocoId)` | `{ premio, p, unoSu }` | A → `{ premio: 500000, p: 8.01e-8, unoSu: 12480000 }` |
| `probabilitaVincita(giocoId)` | p di vincere qualunque premio (rimborso incluso) | A → `0.2383` |
| `anniAttesiPremioMax(abitudine)` | `[{ gioco, premio, giocateAnno, anni }]` per voce | Salvatore → `anni ≈ 17096` |
| `creaPRNG(seme)` | funzione `() => [0,1)` (mulberry32) | stesso seme → stessa sequenza |
| `estraiPremio(giocoId, rnd)` | importo vinto in una giocata | `0`, `10`, ... |
| `simulaAnno(abitudine, seme, giorni = 365)` | `{ giorni: [{ giorno, speso, vinto, spesoCum, vintoCum, eventi? }], totale: { speso, vinto, perso, classiVincite: { rimborso, piccole, reali, totale }, vinciteRimborso }, vincite: [{ giorno, gioco, premio }] }`. `eventi: [{ premio, classe, gioco, costo }]` presente **solo** nei giorni con vincite (L1); `vincite` = solo premi ≥ 100 € | demo (seme 20261005): 175 vincite, 72 solo rimborso, 69 piccole, 34 reali |
| `classeVincita(premio, costo)` | `"rimborso"` (premio = costo), `"piccole"` (costo < premio ≤ 2×costo), `"reali"` (> 2×costo), `null` se 0 | `(10, 5)` → `"piccole"` |
| `riepilogoVincite(giocoId)` | calcolo **esatto** dalla tabella: `{ quotaBigliettiVincenti, quotaRimborso, quotaPiccole, quotaSoloPiccole, quotaReali, vincenti: {rimborso, piccole, reali, totale}, emissione }`. Definizioni: `quotaBigliettiVincenti` = biglietti premiati / emissione; le altre quote sono **sul totale delle vincite**; `quotaPiccole` è **cumulata** (rimborso incluso, premio ≤ 2×costo); `quotaSoloPiccole` la esclude | A → `0.23825 / 0.38475 / 0.79398` (11.893.456 vincite: 4.576.000 da 5 €, 4.867.200 da 10 €) |
| `simulaFolla(abitudine, seme, n = 10000)` | `{ n, inAttivo, quotaInAttivo, speso, vinto, incassoBanco, perditaMedia, perditaMediana }`; `inAttivo` = vinto > speso a fine anno | demo: 174 su 10.000 in attivo (1,74%), perdita media 1.073,82 € (atteso 1.050,83), mediana 1.140 €; ~100-150 ms |
| `scalaFisica(unoSu)` | `{ stadi: round(unoSu / 60000), postiStadio: 60000 }` | `12480000` → `208` stadi |
| `superaSoglia(abitudine, sogliaMensile)` | `{ supera, spesaMese, eccedenza }`; soglia non numerica, vuota o negativa = nessuna soglia (`supera: false`) | Salvatore, 100 € → `{ true, 304.17, 204.17 }` |
| `contoBiglietto(giocoId)` | `{ costo, perditaMediaPerBiglietto, quotaRimborso, unoSu, stadi }` (BR-17) | A → `{ 5, 1.4395, 0.3847, 12480000, 208 }` |
| `simulaRitardatari(seme, n, numero = 90, ritardoMinimo = 100)` | `{ estrazioni, probabilitaTeorica, uscite, frequenza, casiInRitardo, usciteDopoRitardo, frequenzaDopoRitardo, ritardoMassimo }` | frequenza ≈ frequenzaDopoRitardo ≈ 5/90 |
| `verificaQuiz(domande, risposte)` | `{ punteggio, totale, dettaglio: [{ id, risposta, corretta, ok }] }` | `risposte = { q1: "b", ... }` |
| `confrontaQuiz(prima, dopo)` | `{ prima, dopo, delta, totalePrima, totaleDopo }` | cruscotto BR-07 |
| `formattaEuro(n, decimali = 0)` | stringa it-IT | `3650` → `"3.650 €"` |
| `formattaUnoSu(n)` | stringa | `12480000` → `"1 su 12.480.000"` |

Regole della simulazione:
- giocate **giornaliere**: `volte` giocate ogni giorno; **settimanali**: distribuite in modo deterministico, `floor((d+1)·v/7) − floor(d·v/7)` al giorno `d`.
- lotteria istantanea: estrazione per categoria con probabilità `vincenti / emissione` (estrazione con reinserimento, approssimazione dichiarata);
- ritardatari: 5 numeri distinti su 90 a ogni estrazione, eventi indipendenti;
- folla (`simulaFolla`): un solo PRNG con seme, persone in sequenza (riproducibile). Prestazioni: campionatore precalcolato per voce (nessuna ricerca del gioco per giocata), uscita immediata per i biglietti non vincenti (~76%) e ricerca binaria sulla cumulata; 7,3 milioni di giocate in ~0,1-0,15 s in Edge. La mappatura u → premio è identica a `estraiPremio`, quindi `simulaAnno` dà gli stessi risultati di prima a parità di seme.

Arrotondamenti: il motore restituisce valori non arrotondati; l'arrotondamento è solo nella presentazione (`formatta*`).

## 4. Scelte tecniche e motivazioni

| Scelta | Motivo |
|---|---|
| HTML/CSS/JS statico, apertura da `file://` | Sulla macchina non ci sono Node né Python; la demo non deve dipendere da server o rete |
| Nessuna libreria esterna | Zero installazione, nessuna licenza da verificare, nessun rischio di CDN offline |
| Dati in `.js` con variabile globale | `fetch` di JSON è bloccato da `file://` |
| Motore puro separato dalla UI | Testabile in isolamento; le due stanze lavorano in parallelo su un contratto stabile |
| PRNG con seme (mulberry32) | Demo riproducibile (BR-10) e test deterministici |
| Valore atteso esatto accanto alla simulazione | La simulazione non può sembrare "truccata": il numero esatto è calcolato dalla tabella ufficiale |
| **Zero token a runtime**, nessun LLM | Tutto è calcolo deterministico su dati ufficiali: nessuna API key, costo per utente nullo, funziona offline |
| Privacy (BR-12) | Nessun dato inviato in rete; l'eventuale stato del quiz resta in memoria o in `localStorage` del browser |

## 5. Servizi esterni
Nessuno a runtime. Le fonti (ADM, ISS) sono citate nei dati e nell'interfaccia, non interrogate.

## 6. Test
`tests/tests.html` carica dati, motore e `motore.test.js`; `tests/run-tests.ps1` lo esegue in Edge headless ed esce con codice ≠ 0 se un test fallisce.
