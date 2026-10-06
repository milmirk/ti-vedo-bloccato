# Analisi funzionale — "Fortuna in Chiaro"

Specifica per lo sviluppo UI. Persona di default per tutti gli input: **Salvatore, 10 €/giorno**. Tono: mai consigli, mai "smetti/gioca meno/conviene" (BR-11). Header e footer di ogni schermata: barra fissa con disclaimer e numero verde (BR-08), sempre visibile.

**Disclaimer (testo fisso)**: "Strumento educativo: mostra numeri e significati, non dà consigli."
**Numero verde (testo fisso, fonte §6)**: "Hai domande o preoccupazioni sul gioco? Telefono Verde Nazionale ISS: 800 55 88 22 — gratuito, anonimo, lun-ven 10:00-16:00."
**Nota privacy (BR-12, visibile in Benvenuto e a fine cruscotto)**: "I tuoi dati restano nel tuo browser: nessuna informazione viene salvata o inviata altrove."

## 1. Mappa delle 7 schermate e navigazione

| # | Schermata | BR coperti |
|---|---|---|
| 1 | Benvenuto | BR-01, BR-08, BR-10, BR-12 |
| 2 | Quiz prima | BR-02, BR-08 |
| 3 | La mia abitudine | BR-03, BR-08, BR-09 |
| 4 | Un anno in 10 secondi | BR-04, BR-08, BR-10 |
| 5 | Capire i numeri | BR-05, BR-08, BR-09, BR-11 |
| 6 | Quiz dopo + trasferimento | BR-06, BR-08 |
| 7 | Cruscotto prima/dopo | BR-07, BR-08, BR-11, BR-12 |

Navigazione: flusso lineare 1→7. "Avanti" valida lo stato corrente prima di procedere; "Indietro" torna alla schermata precedente senza perdere i dati inseriti; "Ricomincia" (bottone in header da schermata 4 in poi, oltre che in schermata 7) azzera tutto lo stato e torna a schermata 1. Nessun dato persiste oltre la sessione del browser (BR-12).

## 2. Giochi selezionabili (nomi generici, dati da `ricerca-azzardo.md`)

**Aggiornamento (checkpoint 14:30, decisione utente)**: il Lotto (ex G3 ambo, G4 terno) è tolto dal perimetro dell'app. Restano solo le due lotterie istantanee da 5 €, modello A e modello B. Il simulatore dei "ritardatari" resta come concetto didattico autonomo nella scheda "estrazioni indipendenti" (schermata 5, Scheda C), non più agganciato a un gioco Lotto selezionabile.

| ID | Nome in app | Costo | Payout | Prob. premio massimo | Premio massimo | Fonte |
|---|---|---|---|---|---|---|
| G1 | Lotteria istantanea da 5 € (modello A) | 5 € | 71,2% | 1 su 12.480.000 | 500.000 € | §1.1 |
| G2 | Lotteria istantanea da 5 € (modello B) | 5 € | 60,1% | 1 su 7.680.000 | 500.000 € | §1.2 |

Ogni scheda gioco in app mostra costo, payout, probabilità del premio massimo e la citazione fonte ("ADM, struttura premi [modello], 2024"), coerente con BR-09.

## 3. Schermate — elementi, input, output, calcoli, stati vuoti/errori

### 1. Benvenuto
- **Elementi**: titolo **"Fortuna in Chiaro"** (correzione nome progetto, checkpoint 14:30); sottotitolo "Un anno di gioco in 10 secondi, con le probabilità ufficiali."; toggle "Modalità demo" (BR-10, default: spento); pulsante "Inizia".
- **Input**: `modalitaDemo` (booleano, default `false`). Se `true`: seme RNG fisso dichiarato e animazione schermata 4 accelerata (≈3 secondi invece di ≈10).
- **Output/calcolo**: nessuno.
- **Stati**: nessuno stato vuoto; pulsante "Inizia" sempre attivo.

### 2. Quiz prima
- **Elementi**: 3 domande a scelta multipla (radio), pulsanti "Avanti"/"Indietro".
- **Domande** (risposta corretta in **grassetto**, spiegazione mostrata dopo la risposta):
  1. "Se spendi 10 € al giorno in lotterie istantanee, quanto spendi in un anno?"
     A) 365 €  B) 1.825 €  **C) 3.650 €**  D) 7.300 €
     Spiegazione: "10 € × 365 giorni = 3.650 €."
  2. "Qual è la probabilità di vincere il premio massimo (500.000 €) con una lotteria istantanea da 5 € come il modello A?"
     A) 1 su 1.000  B) 1 su 100.000  C) 1 su 1.000.000  **D) 1 su 12.480.000**
     Spiegazione: "La tabella premi ufficiale ADM indica 4 biglietti vincenti su 49.920.000 emessi: 1 su 12.480.000."
  3. "In un'estrazione numerica, un numero che non esce da 100 estrazioni, alla prossima estrazione ha…" (domanda generica su estrazioni indipendenti, non legata a un gioco specifico presente nell'app — vedi aggiornamento §2)
     A) più probabilità di uscire  B) meno probabilità di uscire  **C) la stessa probabilità di sempre**  D) dipende dalla ruota
     Spiegazione: "Ogni estrazione è indipendente dalle precedenti: la probabilità non cambia."
- **Input**: 1 scelta per domanda, nessun default (obbligatorio rispondere).
- **Output**: `punteggioPrima` = numero di risposte corrette (0-3), salvato in stato.
- **Stati vuoti/errori**: "Avanti" disabilitato finché non sono state selezionate tutte e 3 le risposte; nessun messaggio di errore bloccante.

### 3. La mia abitudine
- **Elementi**: elenco dei 2 giochi (G1, G2) con checkbox di selezione; per ogni gioco selezionato, campo numerico "quante volte al giorno"; riepilogo live spesa giornaliera/mensile/annua; fonte citata sotto ogni gioco (BR-09).
- **Input**: `selezione[]` (multi-select, default: solo G1 selezionato); `frequenzaGiorno` per gioco selezionato (intero, 0-20, default G1 = 2/giorno → 10 €/giorno, persona Salvatore).
- **Formula**:
  - `spesaGiornaliera = Σ (costo_i × frequenzaGiorno_i)`
  - `spesaMensile = spesaGiornaliera × 30`
  - `spesaAnnua = spesaGiornaliera × 365`
- **Output**: le tre spese mostrate in tempo reale mentre l'utente modifica le selezioni.
- **Stati vuoti/errori**: se nessun gioco selezionato o tutte le frequenze a 0 → messaggio "Seleziona almeno un gioco per vedere la tua spesa" e "Avanti" disabilitato. Frequenza negativa o non numerica: input bloccato a 0.

### 4. Un anno in 10 secondi
- **Elementi**: animazione giorno-per-giorno (365 "giorni" rappresentati in sequenza rapida); 3 contatori live ("Speso", "Vinto", "Perso"); riquadro "valore atteso esatto" a fianco dell'animazione; messaggio finale; pulsanti "Rivedi", "Avanti", "Indietro".
- **Input**: nessuno (usa `selezione[]` e `frequenzaGiorno` dalla schermata 3); seme pseudo-casuale fisso (es. `42`) per riproducibilità, dichiarato a schermo ("simulazione con seme fisso, riproducibile"); durata animazione ≈10 s normale, ≈3 s in modalità demo.
- **Formula**:
  - `valoreAttesoRestituito = spesaAnnua × payoutMedio` (payoutMedio = media pesata sui giochi selezionati, pesata per spesa)
  - `valoreAttesoPerso = spesaAnnua × (1 − payoutMedio)`
  - `anniAttesiPremioMassimo = 1 / (probabilitaPremioMassimo × giocateAnnue)` dove `giocateAnnue = frequenzaGiorno × 365` del gioco con premio massimo più alto tra quelli selezionati.
- **Output**: contatori finali "Speso: spesaAnnua €", "Vinto: simulazione pseudo-casuale", "Perso: differenza"; testo "In media, su 100 € giocati, te ne tornano {payoutMedio×100} €."; testo finale "Per vincere il premio massimo una volta, in media, dovresti giocare per {anniAttesiPremioMassimo} anni."
- **Stati vuoti/errori**: se `probabilitaPremioMassimo = 0` (non applicabile) il messaggio finale viene omesso con fallback "Il premio massimo di questo gioco non è raggiungibile nella simulazione."; "Rivedi" rilancia la stessa animazione con lo stesso seme (nessuna variazione dei contatori).

### 5. Capire i numeri
- **Elementi**: 3 schede, ciascuna con titolo, testo breve e un mini-esperimento interattivo; fonte citata in calce a ogni scheda (BR-09).
- **Scheda A — "La probabilità, vista"** (fonte §1.1): "Immagina 12.480.000 biglietti allineati: solo 4 vincono il premio massimo. È come scegliere a caso una sola persona tra tutti gli abitanti di una grande città europea." Mini-esperimento: griglia di punti (es. 10.000 puntini), un cursore "ingrandisci" che mostra quante griglie come questa servono per trovare un puntino vincente (1.248 griglie).
- **Scheda B — "Perché 'in media' si perde"** (fonte §1.1/§1.2): "Il valore atteso è la media di ciò che torna indietro se giochi tante volte. Su un biglietto con payout 71,2%: ogni 100 € giocati, in media 71,20 € tornano indietro, 28,80 € restano al banco." Mini-esperimento: slider "numero di giocate" (10 / 100 / 1.000 / 10.000) che aggiorna spesa totale e vincita attesa totale, mostrando la convergenza verso il payout dichiarato.
- **Scheda C — "I ritardatari non esistono"** (fonte §2; concetto generale di estrazioni indipendenti, non legato a un gioco specifico presente nell'app — aggiornamento checkpoint 14:30): "Ogni estrazione numerica è indipendente dalle precedenti: un numero fermo da 100 estrazioni ha la stessa probabilità di uscire di uno uscito ieri." Mini-esperimento: simulatore con seme fisso che lancia estrazioni pseudo-casuali e mostra che la frequenza di uscita di un numero "ritardatario" resta costante nel tempo (non aumenta).
- **Input**: interazione libera con gli slider dei mini-esperimenti (nessun valore obbligatorio per procedere).
- **Output**: nessun dato salvato in stato.
- **Stati vuoti/errori**: nessuno; "Avanti" sempre attivo.

### 6. Quiz dopo + trasferimento
- **Elementi**: stesse 3 domande della schermata 2 (ordine delle opzioni mescolato) + 1 domanda di trasferimento su un biglietto mai visto; pulsanti "Avanti"/"Indietro".
- **Fonte testi quiz**: `app/data/quiz.js` (oggetto `window.QUIZ`, domande q1-q4; q1-q3 fase "entrambi", q4 fase "dopo").
- **Domanda 4 (trasferimento, da `app/data/quiz.js` id `q4`)**: "Un biglietto ipotetico da 2 € restituisce in media il 70% di quanto si gioca. Quanto perdi in media su 100 giocate?"
  A) Niente, prima o poi si vince  B) 20 €  **C) 60 €**  D) 140 €
  Spiegazione: "Giochi 2 € × 100 = 200 €; in media ne tornano il 70% (140 €): perdi 60 €. Biglietto inventato per l'esercizio, non è un gioco reale."
- **Formula generale trasferimento**: `perditaAttesa = (nGiocate × costoBiglietto) × (1 − payoutDichiarato)` → con prezzo 2€, payout 70%, 100 giocate: 60 €.
- **Output**: `punteggioDopo` (0-3 sulle prime 3 domande, confrontabile con `punteggioPrima`); `trasferimentoCorretto` (booleano, risposta D4).
- **Stati vuoti/errori**: "Avanti" disabilitato finché non sono state risposte tutte e 4 le domande.

### 7. Cruscotto prima/dopo
- **Elementi**: confronto punteggi quiz ("Prima: {punteggioPrima}/3" vs "Dopo: {punteggioDopo}/3"); indicatore `trasferimentoCorretto` ("Hai calcolato da solo la perdita attesa di un biglietto nuovo: Sì/No"); riepilogo numeri personali da schermata 3-4 (spesa annua, valore atteso perso, anni attesi per il premio massimo); pulsante "Ricomincia"; disclaimer e numero verde sempre visibili.
- **Calcolo miglioramento**: `miglioramento = punteggioDopo − punteggioPrima` (mostrato come "+{N} risposte corrette in più"); se `miglioramento ≤ 0`, testo neutro senza giudizio: "Il tuo punteggio prima e dopo è {X}/3 in entrambi i casi." (mai consigli, BR-11).
- **Input**: nessuno, solo lettura dello stato accumulato.
- **Stati vuoti/errori**: se l'utente arriva qui tramite "Indietro" senza aver completato il quiz dopo, il cruscotto mostra "Completa il quiz dopo per vedere il confronto" al posto dei punteggi.

## 4. Payout medio pesato (uso in schermata 4)
`payoutMedio = Σ(spesaAnnua_i × payout_i) / Σ(spesaAnnua_i)` sui soli giochi selezionati in schermata 3. Default Salvatore (solo G1, 2×/giorno = 10 €/giorno): `payoutMedio = 71,2%`, `spesaAnnua = 3.650 €`, `valoreAttesoPerso ≈ 1.051,20 €/anno`, `anniAttesiPremioMassimo = 1 / (1/12.480.000 × 730) ≈ 17.096 anni`.

## 5. Leve L1, L2, L3 e CR1 — testi definitivi (BR-13..BR-16)

Testi verificati contro l'hook L4 (nessuna formula da consiglio o giudizio: niente "dovresti", "conviene", "ti consiglio", "smetti", "gioca meno").

**L1 — vincita che è solo rimborso (BR-13)**, mostrato in schermata 4 quando il premio estratto coincide con la giocata:
- Messaggio singolo biglietto: "Hai recuperato la giocata: guadagno netto 0 €." (mai "HAI VINTO").
- Riepilogo fine anno: "Su tutte le tue vincite di quest'anno, il 38,5% era solo il rimborso della giocata (5 €) e il 79,4% era una vincita da 5 € o 10 €." (fonte §1, modello A: 4.576.000 su 11.893.456 vincite totali = rimborso; 79,4% da 5 o 10 €).

**L2 — dalla parte del banco (BR-14)**, tasto "Guarda dalla parte del banco" in schermata 4:
- Vista 10.000 persone: "Su 10.000 persone con la tua stessa abitudine, in un anno, {N} finiscono con vincite nette positive; il banco incassa in totale {importo} €." (N e importo calcolati dal motore sul payout del gioco selezionato: 71,2% modello A, 60,1% modello B).
- Vista scala Italia: "In Italia, nel 2024, la perdita netta complessiva al gioco è stata di 21,5 miliardi di euro." (fonte `ricerca-azzardo.md`, [UFF-sec]).

**L3 — probabilità in cose fisiche (BR-15)**, mostrato in schermata 4 e nella scheda A di "Capire i numeri":
- Scala spaziale: "Per trovare un biglietto vincente il premio massimo, servirebbero 208 stadi da 60.000 posti pieni — e in tutti vincerebbe una sola persona." (12.480.000 ÷ 60.000 = 208).
- Scala temporale: "Giocando 2 biglietti al giorno come nel tuo caso, in media una vincita del premio massimo capiterebbe ogni circa 17.096 anni." (12.480.000 ÷ 730 ≈ 17.096, stima derivata [DERIV]).

**CR1 — "Vuoi parlarne con qualcuno?" (BR-16)**, pannello in schermata 3 quando la spesa mensile supera la soglia scelta dall'utente:
- Titolo pannello: "Vuoi parlarne con qualcuno?"
- Corpo: "La tua spesa mensile stimata ({importo} €) supera la soglia che hai scelto ({soglia} €). Qui trovi il Telefono Verde Nazionale ISS, gratuito e anonimo, e un messaggio pronto per una persona di fiducia, se vuoi inviarlo tu."
- Link numero verde: `tel:800558822` con etichetta "Chiama il Telefono Verde ISS — 800 55 88 22".
- Messaggio precompilato per la persona di fiducia (testo neutro, nessuna menzione di diagnosi o dipendenza), usato sia nel link WhatsApp sia nel `mailto:`: "Ciao, volevo condividere con te due numeri sulla mia spesa di gioco di questo mese: {importo} € su una soglia personale di {soglia} € che mi ero dato. Se hai cinque minuti mi farebbe piacere parlarne con te."
- Link WhatsApp: `https://wa.me/?text=` + testo sopra con URL-encoding.
- Link mailto: `mailto:?subject=Una%20cosa%20di%20cui%20parlare&body=` + testo sopra con URL-encoding.
- Nota tecnica: nessun contatto, importo o esito di invio viene salvato o inviato dall'app (BR-12); l'app compone solo il link, l'invio è un'azione dell'utente nell'app esterna scelta (WhatsApp o client email).
