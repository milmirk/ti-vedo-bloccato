# Deliverable · Tema 02 Inclusione Finanziaria

## 01 · User Difficulty Statement

**Chi:** Samira, 41 anni. Lavora e gestisce le spese di casa, ma ha poca dimestichezza con i termini finanziari.

**In quale processo:** la lavatrice si è rotta. In un negozio di elettrodomestici le propongono una lavatrice da 600 € «a tasso zero», in 10 rate mensili. Prima della firma le consegnano il modulo SECCI, «Informazioni europee di base sul credito ai consumatori»: è obbligatorio, uguale in tutta Europa, e contiene tutte le informazioni sul finanziamento.

**Quale difficoltà, nel momento esatto:**

1. **Il TAN e il TAEG.** Sul cartellino c'è scritto «tasso zero» e nel modulo c'è «TAN 0,00%». Ma due righe sotto c'è «TAEG: 14,19%». Samira non sa quale dei due numeri conta, né perché non sono uguali.
2. **Il totale.** Il modulo scrive «Importo totale dovuto dal consumatore: 636,00 €». Samira pensava di pagare 600 €.
3. **Le spese sparse.** Istruttoria (10,00 €, sulla prima rata), imposta di bollo (16,00 €, sulla prima rata), incasso rata (1,00 € per ogni rata) sono in righe diverse e nessuno le somma.
4. **Le parole.** «Rate ed, eventualmente, loro ordine di imputazione», «costo totale del credito espresso in percentuale, calcolata su base annua».

**Perché è rilevante:** le informazioni ci sono tutte, ma il conto finale deve farlo lei, prima di firmare, in negozio. Oggi l'alternativa è firmare sulla fiducia o chiedere a qualcuno di leggere il modulo al suo posto. Un «tasso zero» con spese obbligatorie non costa zero: è un concetto finanziario di base (TAN, TAEG, costo del credito) che decide quanto pagherà davvero.

## 02 · Before / After Simplicity Evidence

**La demo:** `cd secci-lens/app && npm install && npm start`, poi <http://localhost:8801/>. Si sceglie un documento di esempio (o si incolla un testo) e la pagina mostra otto schede: In sintesi · TAN e TAEG · Le rate · In cose di tutti i giorni · Controllo dei numeri · Frase per frase · Confronta due offerte · Quiz.

**Prima e dopo, frase per frase** (testi reali mostrati dalla demo con l'esempio «Lavatrice tasso zero»; le frasi semplici sono scritte dalle regole del programma, senza AI):

| Il documento dice | In parole semplici |
|---|---|
| «Importo totale del credito — Limite massimo o somma totale degli importi messi a disposizione del consumatore: 600,00 €» | È la somma che il finanziatore ti presta: 600,00 €. |
| «Rate ed, eventualmente, loro ordine di imputazione — 10 rate mensili da 60,00 €, con addebito diretto sul conto corrente. […] I pagamenti sono imputati prima alle spese, poi agli interessi e infine al capitale.» | Paghi 10 rate, una al mese, da 60,00 €. A ogni rata si aggiungono 1,00 € di spese, quindi paghi 61,00 €. La prima rata è più alta, 87,00 €, perché comprende anche altre spese. |
| «Importo totale dovuto dal consumatore — Importo del capitale preso in prestito, più gli interessi e i costi connessi al credito: 636,00 €» | In tutto restituisci 636,00 €: la somma prestata più interessi e spese. |
| «Tasso fisso. TAN (tasso annuo nominale): 0,00%» | Il TAN è il tasso degli interessi: qui è 0,00%, quindi non paghi interessi. Le spese però si pagano lo stesso. |
| «Tasso annuo effettivo globale (TAEG) — Costo totale del credito espresso in percentuale, calcolata su base annua, dell'importo totale del credito. […] TAEG: 14,19%» | Il TAEG mette insieme interessi e spese obbligatorie, in percentuale all'anno: il documento scrive 14,19%. Per questo è più alto del TAN. |
| «Spese di incasso rata: 1,00 € per ogni rata» | Le spese di incasso si pagano ogni volta che il finanziatore incassa una rata: 1,00 € per rata, 10,00 € in tutto. |

**Prima e dopo, la schermata «In sintesi»:** al posto di quattro sezioni di modulo, quattro numeri: **Ricevi 600,00 € · Restituisci in totale 636,00 € · Il credito ti costa 36,00 € · Per quanto tempo 10 mesi**, ognuno con il brano del documento a un clic. Sotto: «"Tasso zero" vuol dire TAN 0,00%: niente interessi. Ma ci sono 36,00 € di spese obbligatorie. Per questo il TAEG non è zero: calcolato dai dati del documento è 14,19%.»

**Il calcolo deterministico** (`app/public/lib/finance.js`, nessuna AI):

| Passo | Valore | Da dove viene |
|---|---|---|
| Ricevi (t = 0) | 600,00 € | «Importo totale del credito» |
| Rate | 10 × 60,00 € = 600,00 € | «10 rate mensili da 60,00 €» |
| Interessi | 600,00 € − 600,00 € = 0,00 € | TAN 0,00%: coerente con le rate |
| Spese di istruttoria | 10,00 € con la prima rata | «addebitate sulla prima rata» |
| Imposta di bollo | 16,00 € con la prima rata | «addebitata sulla prima rata» |
| Spese di incasso rata | 10 × 1,00 € = 10,00 € | «1,00 € per ogni rata» |
| Pagamenti | mese 1: 87,00 € · mesi 2–10: 61,00 € | somma per mese |
| **Restituisci in totale** | **636,00 €** | coincide con «Importo totale dovuto» |
| **Il credito ti costa** | **636,00 € − 600,00 € = 36,00 €** | totale dovuto − importo del credito |
| **TAEG** | **14,19%** | X tale che 600,00 = 87,00 ÷ (1+X)^(1/12) + 61,00 ÷ (1+X)^(2/12) + … + 61,00 ÷ (1+X)^(10/12), come nella direttiva 2008/48/CE; coincide con il documento |
| In cose di tutti i giorni | 36,00 € ÷ 1,20 € = 30 caffè al bar | prezzo indicativo, modificabile |

**Il controllo dei numeri** (esempio «Lavatrice in 16 rate», scritto apposta con un numero che non torna): «Il TAEG calcolato dai dati del documento è 17,19%, il documento dice 6,08%. Puoi chiedere chiarimenti al finanziatore.» E sotto: «Rifacendo il conto senza le spese, il risultato è 6,08%: lo stesso numero scritto nel documento. Il TAEG, per definizione, comprende anche le spese obbligatorie.» L'importo totale dovuto (667,44 €) invece coincide.

**Il confronto neutro** («Lavatrice tasso zero» contro «Lavatrice in 16 rate»): «Il credito di Faro Finanziaria costa 31,44 € in più di quello di Aurora Credito.» «L'offerta di Faro Finanziaria dura 6 mesi in più di quella di Aurora Credito.» «La rata di Faro Finanziaria è di 20,91 € più bassa di quella di Aurora Credito (spese escluse).» Nessuna classifica: «Quale offerta va bene per te dipende da cose che conosci solo tu, per esempio quanto puoi pagare ogni mese.»

**Misura della comprensione:** prima di leggere la spiegazione la pagina propone 4 domande costruite sui numeri del documento (TAN o TAEG? quanto restituisci in tutto? cosa c'è dentro il TAEG? quanto costa il credito?), senza mostrare le risposte. Alla fine, nella scheda «Quiz», le stesse domande con le risposte, dove trovarle nel modulo e il punteggio prima e dopo. Il punteggio resta nella pagina. **Finora il quiz è stato provato solo dal team durante lo sviluppo: non c'è ancora uno studio con utenti**, e la presentazione mostra valori di esempio dichiarati come tali.

## 03 · Risk & Clarity Note

**Cosa è stato semplificato**
- Quattro sezioni di modulo diventano quattro numeri in euro: ricevi, restituisci, costo del credito, durata.
- TAN, TAEG, istruttoria, imposta di bollo, incasso rata sono spiegati con parole di tutti i giorni, una frase per voce.
- Il costo del credito si vede anche in cose che si comprano spesso (caffè, biglietti dell'autobus, pizze, spesa, pieni di benzina), con prezzi indicativi modificabili.
- Le rate diventano un piano mese per mese, con capitale, interessi e spese separati.

**Cosa non è stato alterato**
- **Il documento.** Ogni frase semplice ha accanto il brano originale; il documento intero resta consultabile con i dati letti evidenziati.
- **I numeri del documento.** Non vengono mai corretti. Se il calcolo non coincide, si mostrano tutti e due i valori con una frase neutra.
- **I calcoli.** Li fa il codice, con la formula della direttiva 2008/48/CE. L'AI non calcola: l'estrazione AI restituisce solo citazioni, che il codice verifica e interpreta (`fromAiFields`), e ogni numero in una spiegazione AI deve comparire nel documento o nei calcoli (`checkNumbers`).

**Come è stata evitata l'ambiguità**
- Ogni ipotesi di calcolo è scritta nella scheda «Controllo dei numeri»: ricevi tutto subito, prima rata dopo un mese, mese = 1/12 di anno, quando si paga ogni spesa.
- Se il documento non dice quando si paga una spesa, l'ipotesi prudente (alla firma, che dà il TAEG più alto) è evidenziata come ipotesi.
- I numeri hanno sempre lo stesso formato italiano (1.234,56 €) in tutte le schede.
- Nel confronto, se le due offerte non riguardano la stessa somma, la prima frase lo dice.

**Nessun consiglio**
- Nessuna frase dice cosa scegliere, firmare o evitare. Il confronto riporta solo fatti, senza classifiche.
- `findAdvice` blocca frasi come «ti conviene», «ti consiglio», «è meglio», «scegli», «dovresti»: una sola frase così fa scartare tutta la risposta dell'AI. I test passano dallo stesso filtro tutti i testi a regole dei tre esempi, e controllano che il confronto non contenga parole da classifica.
- L'unico invito è un diritto: «Puoi chiedere chiarimenti al finanziatore.»

**Limiti che restano**
- Legge solo testo incollato: niente PDF o foto.
- Riconosce le etichette standard del SECCI italiano. Testi molto diversi richiedono l'AI facoltativa, che può non trovare tutti i dati.
- Calcola tasso fisso e rate costanti, con la prima rata un mese dopo l'erogazione. Non gestisce credito revolving, tasso variabile, rate di importo diverso o date precise.
- I tre documenti sono di fantasia, scritti sul modello del SECCI italiano: vanno confrontati con moduli veri.
- Il miglioramento della comprensione non è stato misurato con persone reali.
- La chiamata a Claude è stata provata con un client simulato, non con una chiave vera.

## Dove ha contribuito l'AI e dove la revisione umana

| Area | AI | Revisione umana |
|---|---|---|
| Ricerca di mercato | La sessione principale di Claude Code ha confrontato i prodotti esistenti (5 ottobre 2026) | Il team ha scelto tema e persona; i link vanno riaperti |
| Specifica | Scritta dalla sessione principale di Claude Code | Vincoli del tema riletti dal team |
| Codice e test | Un subagente di Claude Code ha scritto app, server e test, e li ha verificati senza browser | Lettura del codice e prova nel browser, con tastiera e lettore di schermo |
| Calcolo del TAEG | Formula della direttiva, test su casi fatti a mano | Verifica da parte di chi lavora nel credito ai consumatori |
| Documenti di esempio | Tre SECCI di fantasia con TAEG coerenti (e uno volutamente incoerente) | Confronto con moduli SECCI veri |
| Testi per la persona | Skill `spiegare-il-credito`, filtro dei consigli | Lettura da parte di persone come Samira e di un'associazione di consumatori |
| Spiegazioni AI a runtime | Claude riscrive frasi del documento | Nessuna revisione per ogni risposta: i validatori scartano citazioni inventate, numeri non presenti e consigli |

Il dettaglio è in [agents/workflow.md](../agents/workflow.md).
