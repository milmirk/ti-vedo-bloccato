# Review approfondita QA: demo e presentazione (commit e2a4a31, 15:12)

Ambito: `app/` (index.html, src/ui.js, README.md) e `presentation/index.html`, confrontati con `00_input/temi-sfida.md` Tema 02 e `00_input/regolamento.md`.
Limite: review fatta in 7 minuti per lettura del codice. Edge headless `--dump-dom` non eseguito; i criteri di valutazione del regolamento non sono stati riletti in questo passaggio (restano valide le verifiche delle review QA precedenti).

## Esito sintetico
Nessun rilievo bloccante. Due rilievi maggiori sul copione della demo, che non corrisponde più alla demo attuale. Verdetto: **PASS con riserva**.

## Rilievi (ordinati per gravità)

| ID | Gravità | Rilievo | Requisito | Correzione proposta | File | Min |
|---|---|---|---|---|---|---|
| QA-R01 | Maggiore | La nota della slide 04 (copione della demo, 2'30") descrive la demo di prima: non cita la schedina importo × frequenza, il confronto "Quest'anno simulato (un caso)" contro "In media, su tantissimi anni" né il pulsante "Simula un altro anno". Il presentatore rischia di improvvisare e di andare oltre i 5'00". | Regolamento: 5 minuti, demo compresa | Riscrivere il passo (2): "scelgo 5 € × 2 al giorno = 3.650 € l'anno; a sinistra un anno simulato, a destra la media (≈1.051 €); Simula un altro anno mostra che il caso cambia, la media no". Tempi invariati. | presentation/index.html, riga 352 | 3 |
| QA-R02 | Maggiore | Il copione tratta "Pausa e Conto" come condizionale ("Se BR-17 è approvato…"), ma nell'app è attiva di default (app/README.md riga 11, ui.js riga 850). Il passo non ha un tempo assegnato. | Coerenza demo e pitch; 5'00" | Decidere: o il passo (4) "Dalla parte del banco" diventa "Pausa e Conto" (30"), o si toglie dal copione e si dichiara di riserva. Scriverlo nella nota. | presentation/index.html, riga 352 | 2 |
| QA-R03 | Minore | Il commento "TARATURA DEMO DA FARE A PRODOTTO FINITO" (righe 27-40) è rimasto: è una nota di lavoro, non più attuale. Anche la nota A7 (riga 715) e la tabella A6 (riga 669, "se approvata") parlano di BR-17 come ancora da approvare. | Qualità, coerenza | Togliere il commento; sostituire "se approvata" con "attiva nell'MVP". | presentation/index.html, righe 27-40, 669, 715 | 2 |
| QA-R04 | Minore | Slide 05: "perdita attesa ≈ 1.051 €" è il valore "In media". In demo il pannello "Quest'anno simulato" mostra un'altra cifra. Senza una frase di raccordo, chi valuta vede due numeri diversi. | Coerenza dei numeri tra demo e slide | Aggiungere alla nota della slide 05: "1.051 € è la media; l'anno simulato in demo è un caso". | presentation/index.html, riga 387 | 1 |
| QA-R05 | Minore | Copione: "(2) Abitudine (2 biglietti da 5 € al giorno…)". Va verificato che con `?demo=1` la schedina parta già da 5 € × 2 al giorno, oppure che il presentatore la imposti a mano. Non verificato per mancanza di tempo. | Coerenza demo e slide | Aprire `app/index.html?demo=1` e controllare il valore iniziale, poi allineare la nota. | app/src/ui.js; presentation riga 352 | 2 |

## Verifiche passate (nessun rilievo)
- Numeri: 3.650 €, ≈1.051 € (3.650 × 28,8%), 208 stadi (12.480.000 / 60.000), ≈17.096 anni (12.480.000 / 730), 174/10.000 (1,7%), 38,5% (4.576.000 / 11.893.456). Sono coerenti tra slide 02, 05, A1, A2, A3 e A7 e hanno la fonte in `.src` (UFF ADM + DERIV, seme 20261005).
- I 3 deliverable del Tema 02 sono nella parte parlata: D01 slide 02, D02 slide 05, D03 slide 06.
- Durata della parte parlata: 10+25+20+150+20+15+35+15+10 = 300" = 5'00".
- Il nome "Fortuna in Chiaro" è coerente tra title, slide 01, slide 09, A1 e app.
- Numero verde 800 55 88 22: nell'app sempre visibile (index.html riga 185 e testata), nelle slide 06 e 09.
- Lotto: non è selezionabile. Resta solo come esempio nel quiz (quiz.js riga 36) e nei ritardatari (ui.js riga 776): accettabile, come dichiara app/README.md riga 13.
- Vincolo T2-V3: nei testi letti non ci sono consigli. "La scelta è tua." è neutro. Guardrail L4 attivo.
- Linguaggio: "Restituisce in media X € ogni 100 € giocati" e "In media, su 100 € giocati, te ne tornano…" sono comprensibili. Il termine "payout" compare solo nelle `.src` delle slide, non nell'app.
