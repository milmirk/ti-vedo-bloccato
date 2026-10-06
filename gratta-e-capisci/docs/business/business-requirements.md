# Business Requirements — "Fortuna in Chiaro"

> Fonte: `docs/idea/idea-selezionata.md` (perimetro MVP) e `docs/idea/ricerca-azzardo.md` §0-§3 (numeri, con affidabilità dichiarata).
> Vincoli di tema: `00_input/temi-sfida.md`, Tema 02 — Inclusione Finanziaria (T2-Vx vincoli specifici, T2-Ex deliverable).
> MoSCoW: Must (indispensabile per il freeze), Should (importante ma rinviabile), Could (se avanza tempo), Won't (fuori perimetro).

---

## BR-01 — Benvenuto e tono
**Descrizione**: la schermata iniziale presenta lo strumento con il titolo **"Fortuna in Chiaro"** (nome del progetto, correzione utente) e un sottotitolo educativo e non giudicante, senza riferimenti a marchi commerciali di gioco.
**Motivazione di business**: prima impressione corretta sul tema delicato; evita che l'utente si senta giudicato e abbandoni.
**Priorità**: Must.
**Vincolo di tema**: T2-V3 (vietato dare consigli/giudizi), deliverable T2-E1 (User Difficulty Statement).

**Criteri di accettazione**
- Dato che l'utente apre `app/index.html`, quando la pagina si carica, allora è visibile il titolo **"Fortuna in Chiaro"** con un sottotitolo che richiama lo scopo educativo dello strumento, senza nominare marchi commerciali di gioco.
- Dato il testo di benvenuto, quando viene letto, allora non contiene imperativi di giudizio ("non dovresti", "è sbagliato") né consigli ("dovresti smettere").

---

## BR-02 — Quiz prima (3 domande)
**Descrizione**: prima di ogni altra interazione, l'utente risponde a 3 domande a scelta multipla: (1) spesa annua con 10€/giorno, (2) probabilità di vincere il premio massimo di un biglietto, (3) se un numero "ritardatario" ha più probabilità di uscire. Il punteggio viene registrato per il confronto finale.
**Motivazione di business**: misura la comprensione "prima", necessaria per dimostrare il miglioramento (T2-V2, Before/After).
**Priorità**: Must.
**Vincolo di tema**: T2-V2 (miglioramento misurabile), T2-E2 (Before/After Simplicity Evidence).

**Criteri di accettazione**
- Dato l'utente all'inizio del percorso, quando visualizza il quiz, allora vede esattamente 3 domande a scelta multipla, una delle quali chiede quanto si spende in un anno giocando 10€/giorno con risposta corretta attesa **3.650 €**.
- Dato che l'utente risponde alle 3 domande, quando conferma, allora l'app salva un punteggio (0-3) senza inviarlo fuori dal browser (vedi BR-12).
- Dato il quiz completato, quando l'utente prosegue, allora il punteggio "prima" resta disponibile per il cruscotto finale (BR-07).

---

## BR-03 — La mia abitudine (scelta giochi e frequenza → spesa giorno/mese/anno)
**Descrizione**: l'utente sceglie uno o più giochi tra le due lotterie istantanee da 5€ (modello A, modello B) e la frequenza (volte al giorno/settimana); l'app calcola spesa giornaliera, mensile, annuale. **Aggiornamento (checkpoint 14:30, decisione utente)**: il Lotto (G3 ambo, G4 terno) è tolto dal perimetro dell'app; restano solo le due lotterie istantanee da 5 €. Il riferimento al biglietto da 10€ "da fonte" non verificata resta solo come esempio di etichettatura di stima (BR-09), non come gioco effettivamente proposto.
**Motivazione di business**: rende concreta e personale la spesa di Salvatore, base per la simulazione.
**Priorità**: Must.
**Vincolo di tema**: T2-V1 (simulazione di una scelta quotidiana), T2-E4 (nessun marchio commerciale, struttura premi ufficiale citata come fonte).

**Criteri di accettazione**
- Dato che l'utente seleziona "lotteria istantanea da 5€" con frequenza 2 volte al giorno, quando l'app calcola, allora mostra spesa giornaliera **10 €**, mensile **≈ 304,17 €** (10×365/12), annuale **3.650 €** (10×365).
- Dato un'altra combinazione (es. 1 biglietto da 5€ al giorno), quando calcolata, allora la spesa annua è **1.825 €** (5×365), verificabile a mano.
- Dato nessun gioco con marchio commerciale reale, quando l'utente vede le opzioni, allora i nomi sono generici ("lotteria istantanea modello A/B") con ADM citata come fonte della struttura premi.
- Dato il perimetro aggiornato al checkpoint delle 14:30, quando l'utente apre la schermata "La mia abitudine", allora trova solo le due lotterie istantanee da 5€ (modello A, modello B) come giochi selezionabili: nessuna opzione Lotto (ambo/terno) è presente.

---

## BR-04 — Un anno in 10 secondi (simulazione con seme fisso, contatori, valore atteso esatto, "N anni per il premio massimo")
**Descrizione**: simulazione animata di un anno di gioco (365 giorni) con generatore pseudo-casuale a seme fisso, basata sulle probabilità ufficiali del gioco scelto. Mostra contatori "speso / vinto / perso" aggiornati in tempo reale, il valore atteso esatto calcolato matematicamente (non dalla simulazione), e il messaggio "per vincere il premio massimo una volta, in media, dovresti giocare per N anni".
**Motivazione di business**: è il cuore dell'evidenza Before/After: rende visibile e viscerale un concetto altrimenti astratto.
**Priorità**: Must.
**Vincolo di tema**: T2-V1, T2-V2, T2-E2; rischio "simulazione percepita come truccata" mitigato dal valore atteso esatto accanto (vedi Risk & Clarity Note, T2-E3).

**Criteri di accettazione**
- Dato il default Salvatore — "lotteria istantanea modello A" (payout 71,2% arrotondato, fonte `ricerca-azzardo.md` §1.1), 2 biglietti al giorno = 10 €/giorno, 365 giorni — quando la simulazione gira con seme fisso, allora il valore atteso esatto mostrato, calcolato sulla tabella premi completa del modello A (non sul payout arrotondato), è **perdita attesa ≈ 1.051 € (tolleranza ±1 €, arrotondamento dichiarato)** — valore esatto 1.050,83 €/anno; 1.051,20 € (3.650 € × 28,8%) è solo l'approssimazione ottenuta dal payout arrotondato al decimale — calcolato analiticamente e non dal campionamento casuale.
- Dato lo stesso default (2 biglietti/giorno = 730 biglietti/anno), quando viene mostrato "N anni per il premio massimo", allora il numero è calcolato come 1 / (probabilità vincita premio massimo × biglietti giocati all'anno); con probabilità 1/12.480.000 (fonte §1.1 [UFF]) e 730 biglietti/anno, il risultato è **N ≈ 17.096 anni** [DERIV, calcolo nostro, coerente con `docs/business/analisi-funzionale.md` §4 — da segnalare come stima derivata, non dato di fonte diretta].
- Dato che la modalità demo è attiva (BR-10), quando si lancia la simulazione, allora il seme è fisso e il risultato (contatori finali) è identico ad ogni esecuzione in demo.
- Dato la simulazione in corso, quando l'utente la osserva, allora i contatori "speso/vinto/perso" si aggiornano progressivamente senza bloccare l'interfaccia per più di ~10-15 secondi totali.

---

## BR-05 — Capire i numeri (3 schede con mini-esperimento, incluso il simulatore dei ritardatari)
**Descrizione**: 3 schede brevi con mini-esperimento interattivo: probabilità ("1 su N" reso visibile), valore atteso (perché "in media" si perde), estrazioni indipendenti (simulatore dei "ritardatari": la probabilità resta uguale ad ogni estrazione).
**Motivazione di business**: trasferisce i concetti statistici di base richiesti dal Tema 02 (comprensione di un concetto finanziario/di rischio di base).
**Priorità**: Must.
**Vincolo di tema**: Tema 02 vincolo 1 (scenario educativo preciso: comprensione di un concetto di base).

**Criteri di accettazione**
- Dato la scheda "probabilità", quando l'utente la apre, allora vede una rappresentazione visiva di "1 su 12.480.000" (es. proporzione, griglia) riferita al premio massimo del modello A (fonte §1.1).
- Dato la scheda "estrazioni indipendenti" (concetto generale di indipendenza statistica, non legato a un gioco specifico tolto dal perimetro — **aggiornamento checkpoint 14:30**: il Lotto non è più un gioco selezionabile nell'app, il simulatore dei ritardatari resta come mini-esperimento didattico autonomo), quando l'utente lancia il simulatore dei ritardatari per un numero "in ritardo da 100 estrazioni", allora la probabilità mostrata di uscita alla prossima estrazione resta uguale a quella di un numero appena uscito (principio di indipendenza, `ricerca-azzardo.md` §2 — dichiarato come principio matematico standard, non attribuito a uno studio specifico).
- Dato la scheda "valore atteso", quando l'utente interagisce, allora viene mostrato un esempio numerico (es. "su 100 € giocati nel modello A, in media ne tornano 71,2 €, cioè ne restano persi 28,8 €", fonte §1.1).

---

## BR-06 — Quiz dopo + domanda di trasferimento
**Descrizione**: le stesse 3 domande del quiz iniziale, più 1 domanda di trasferimento su un biglietto mai visto in precedenza ("biglietto da 2€ con payout X%: quanto perdi in media su 100 giocate?"); confronto punteggio prima/dopo.
**Motivazione di business**: dimostra il miglioramento misurabile richiesto dal Tema 02 (vincolo 2) e dall'idea (T2-V2).
**Priorità**: Must.
**Vincolo di tema**: Tema 02 vincolo 2 (miglioramento tangibile dimostrato), T2-V2.

**Criteri di accettazione**
- Dato l'utente ha completato le schermate precedenti, quando arriva al quiz finale, allora rivede le stesse 3 domande iniziali (stesso testo, ordine eventualmente mescolato) più 1 domanda di trasferimento su un biglietto con parametri diversi da quelli mostrati prima.
- Dato il biglietto didattico da 2€ con payout 70% (fonte: `app/data/quiz.js`, domanda q4 — esempio inventato per l'esercizio, dichiarato come tale, non un gioco reale, nessun dato da `ricerca-azzardo.md`), quando l'utente risponde "quanto perdi in media su 100 giocate", allora l'app verifica il calcolo (100 × 2€ × (1 − 70%) = **60 €**) e segna corretto/errato.
- Dato il quiz dopo completato, quando il punteggio viene calcolato, allora è confrontabile 1:1 con il punteggio "prima" (stessa scala 0-3 sulle prime 3 domande).

---

## BR-07 — Cruscotto prima/dopo
**Descrizione**: schermata finale che mostra affiancati il punteggio quiz prima e dopo, l'esito della domanda di trasferimento, e un riepilogo dei numeri chiave della simulazione (spesa annua, perdita attesa, N anni per il premio massimo).
**Motivazione di business**: è l'evidenza sintetica richiesta dal deliverable "Before/After Simplicity Evidence" (T2-E2) e dalla demo.
**Priorità**: Must.
**Vincolo di tema**: T2-E2.

**Criteri di accettazione**
- Dato i due punteggi quiz registrati, quando l'utente arriva al cruscotto, allora vede entrambi affiancati (es. "prima: 1/3 — dopo: 3/3").
- Dato l'esito della domanda di trasferimento, quando mostrato, allora indica esplicitamente se l'utente ha calcolato correttamente la perdita attesa del biglietto nuovo.
- Dato i numeri della simulazione (BR-04), quando il cruscotto li riepiloga, allora sono identici (stessi valori) a quelli mostrati nella schermata di simulazione, senza ricalcoli divergenti.

---

## BR-08 — Sempre visibili: disclaimer e numero verde ISS
**Descrizione**: in ogni schermata restano visibili il disclaimer "Strumento educativo: mostra numeri e significati, non dà consigli" e il numero verde nazionale ISS per il gioco d'azzardo.
**Motivazione di business**: obbligo del vincolo di tema (T2-V3) e responsabilità verso un pubblico fragile.
**Priorità**: Must.
**Vincolo di tema**: T2-V3 (vietato dare consigli), responsabilità verso persone con gioco problematico.

**Criteri di accettazione**
- Dato qualunque schermata dell'app (benvenuto, quiz, abitudine, simulazione, schede, cruscotto), quando l'utente la visualizza, allora il disclaimer "Strumento educativo: mostra numeri e significati, non dà consigli" è presente e leggibile (non nascosto in un menu).
- Dato qualunque schermata, quando l'utente la visualizza, allora il numero verde **800 55 88 22** (ISS, TVNGA, fonte §6 [UFF]) è visibile, con indicazione "gratuito, anonimo, lun-ven 10:00-16:00".

---

## BR-09 — Dati ufficiali con fonte e arrotondamenti dichiarati
**Descrizione**: tutti i numeri usati nell'app (probabilità, payout, premi, spesa) provengono da `ricerca-azzardo.md` con fonte citata o sono esplicitamente dichiarati come stima/esempio didattico; eventuali arrotondamenti sono indicati.
**Motivazione di business**: vincolo esplicito dell'idea (T2-E4: probabilità e premi identici alla fonte ufficiale) e credibilità verso la giuria.
**Priorità**: Must.
**Vincolo di tema**: T2-E4, Risk & Clarity Note (T2-E3).

**Criteri di accettazione**
- Dato un numero mostrato nell'app (es. payout 71,2%, probabilità 1/12.480.000), quando l'utente verifica in `ricerca-azzardo.md`, allora il valore coincide con quello di fonte (§1.1/§1.2), senza alterazioni.
- Dato un numero arrotondato (es. mensile 304,17€ invece di 304,1666...€), quando mostrato, allora è presente un'indicazione di arrotondamento (anche solo nel numero di decimali coerente).
- Dato un numero non presente in `ricerca-azzardo.md` (es. tabella del biglietto da 10€, payout del biglietto di trasferimento da 2€), quando usato nell'app, allora è esplicitamente etichettato come "esempio/stima, non dato ufficiale" e non presentato come fatto verificato.

---

## BR-10 — Modalità demo (seme fisso, animazione rapida)
**Descrizione**: una modalità attivabile che forza il seme pseudo-casuale a un valore fisso e accelera l'animazione della simulazione, per garantire una demo ripetibile in ~2'30".
**Motivazione di business**: la demo dal vivo deve essere affidabile e rientrare nel tempo assegnato (regolamento).
**Priorità**: Should — utile per la demo ma l'app può funzionare (in modo più lento/variabile) anche senza; se il tempo manca, si implementa il seme fisso come default unico piuttosto che un vero toggle.
**Vincolo di tema**: supporta la demo richiesta dal regolamento, non è un vincolo di tema diretto.

**Criteri di accettazione**
- Dato che la modalità demo è attiva, quando la simulazione (BR-04) viene eseguita più volte di seguito, allora produce sempre lo stesso identico risultato finale (stesso seme).
- Dato la modalità demo attiva, quando la simulazione gira, allora l'animazione completa dura indicativamente 10 secondi o meno.

---

## BR-11 — Nessun consiglio né giudizio (T2-V3)
**Descrizione**: in nessun punto dell'app compaiono frasi che consigliano di smettere, giocare meno, o che esprimono un giudizio di valore sulla scelta dell'utente; solo numeri e significati. **Rafforzamento L4 (approvato dall'utente, 13:10)**: il vincolo non è affidato solo alla revisione umana dei testi, ma a un controllo automatico. Un hook PreToolUse (`.claude/hooks/`) blocca la scrittura/modifica di file in `app/` quando il contenuto corrisponde a una lista chiusa di formule da consiglio o giudizio (es. "conviene", "ti consiglio", "dovresti smettere", "dovresti giocare meno", "gioca meno", "smetti"). In aggiunta, un test automatico scansiona tutti i testi dell'app (file HTML/JS visibili all'utente) cercando le stesse formule.
**Motivazione di business**: vincolo esplicito e non negoziabile del tema e dell'idea; la violazione squalifica la soluzione. Il controllo automatico rende il vincolo verificabile e dimostrabile (pattern "hooks" richiesto dalla valutazione), non solo affidato alla lettura manuale.
**Priorità**: Must.
**Vincolo di tema**: T2-V3 (esplicito), Tema 02 vincolo 3 ("vietato fornire raccomandazioni... o indicazioni su cosa fare").

**Criteri di accettazione**
- Dato tutti i testi dell'app (benvenuto, schede, quiz, cruscotto), quando vengono letti integralmente, allora non contengono imperativi o consigli del tipo "dovresti smettere", "gioca meno", "non conviene", "ti consiglio di...".
- Dato il disclaimer (BR-08), quando confrontato con il resto dei testi, allora è l'unico riferimento esplicito a un comportamento esterno (il numero verde), presentato come informazione e non come raccomandazione.
- **[L4]** Dato l'hook PreToolUse attivo, quando si tenta di scrivere in un file sotto `app/` un testo contenente una formula vietata (es. "ti consiglio di giocare meno") — **caso positivo (da bloccare)** — allora la scrittura viene rifiutata e l'agente riceve un messaggio di blocco.
- **[L4]** Dato l'hook PreToolUse attivo, quando si scrive in un file sotto `app/` un testo neutro equivalente (es. "in media servirebbero 17.096 anni per vincere il premio massimo") — **caso negativo (da consentire)** — allora la scrittura viene eseguita senza blocchi (nessun falso positivo).
- **[L4]** Dato il test automatico che scansiona i testi dell'app, quando eseguito su tutti i file HTML/JS visibili all'utente, allora restituisce esito verde (nessuna formula vietata trovata) prima del verdetto QA.

---

## BR-12 — Privacy: nessun dato fuori dal browser
**Descrizione**: nessun dato inserito dall'utente (scelte di gioco, risposte al quiz, punteggi) viene inviato a un server esterno o salvato fuori dal browser (localStorage/sessionStorage locali ammessi, nessuna chiamata di rete con dati personali).
**Motivazione di business**: vincolo esplicito dell'idea ("nessun dato personale salvato fuori dal browser") e requisito etico su un tema sensibile.
**Priorità**: Must.
**Vincolo di tema**: vincolo esplicito dell'idea (sezione "Vincoli e guardrail"), coerente con "zero token a runtime / nessuna chiave API nel browser".

**Criteri di accettazione**
- Dato l'utente che compila quiz e abitudine, quando si ispeziona il traffico di rete del browser (devtools), allora non risultano richieste HTTP in uscita contenenti le risposte o le scelte dell'utente.
- Dato il codice dell'app, quando ispezionato, allora non contiene chiavi API né chiamate a servizi esterni per elaborare i dati dell'utente (logica interamente deterministica/locale, coerente con la Strategia AI dell'idea).

---

## BR-13 — L1: le vincite che non sono vincite
**Descrizione**: quando nella simulazione (schermata 4) o altrove un biglietto simulato "vince", l'app distingue il saldo reale: se il premio coincide con il rimborso della giocata (es. vincita di 5 € su una giocata da 5 €), il messaggio non è "HAI VINTO 5 €" ma segnala che si tratta del recupero della spesa, con guadagno netto 0 €. A fine simulazione, un riepilogo mostra quante vincite erano solo rimborso, quante erano piccole vincite reali, quante erano vincite reali superiori alla giocata.
**Motivazione di business**: leva di innovazione L1, approvata dall'utente; rende visibile un'illusione cognitiva comune (percepire come "vincita" ciò che è solo un rimborso), rafforzando l'evidenza Before/After con un dato specifico e sorprendente.
**Priorità**: Must.
**Vincolo di tema**: T2-V1 (comprensione di un costo quotidiano), T2-E4 (dati ufficiali, nessuna alterazione), coerente con BR-11 (nessun giudizio: solo classificazione oggettiva del saldo).

**Criteri di accettazione**
- Dato il modello A (G1) usato nella simulazione, quando un biglietto estratto ha un premio pari esattamente alla giocata (es. premio 5 € su giocata 5 €), allora l'app mostra un messaggio che indica il recupero della spesa e un guadagno netto di 0 €, non "hai vinto".
- Dato l'anno di simulazione completato, quando il riepilogo delle vincite viene mostrato, allora indica la quota di vincite che sono rimborso (coerente con il dato di fonte: **38,5%** delle vincite è un rimborso da 5 €, cioè 4.576.000 vincite su 11.893.456 vincite totali del modello A) e la quota di vincite da 5 € o 10 € (**79,4%** del totale).
- Dato il riepilogo delle vincite, quando confrontato con la fonte, allora i due valori percentuali (38,5% e 79,4%) coincidono con `ricerca-azzardo.md` §1, senza arrotondamenti ulteriori non dichiarati.
- Dato il messaggio "hai recuperato la giocata", quando letto, allora non contiene giudizi né consigli (coerente con BR-11): è una descrizione neutra del saldo.

---

## BR-14 — L2: dalla parte del banco, 10.000 persone
**Descrizione**: un tasto nella simulazione passa dalla vista individuale di Salvatore alla vista aggregata di **10.000 persone** con la stessa abitudine di gioco, per un anno, usando lo stesso motore di calcolo e lo stesso seme fisso in modalità demo. L'app mostra quante persone (su 10.000) finiscono in attivo (vincite nette positive) e quanto incassa complessivamente il banco. Una seconda vista mostra la scala Italia (perdita netta nazionale 2024).
**Motivazione di business**: leva di innovazione L2, approvata dall'utente; sposta la prospettiva dal singolo giocatore al sistema, rendendo visibile che il gioco è strutturalmente a favore del banco su grandi numeri, senza bisogno di giudicare la scelta individuale.
**Priorità**: Must.
**Vincolo di tema**: T2-V1 (scala del costo quotidiano), T2-E4 (dati ufficiali con fonte), coerente con BR-11 (nessun consiglio: solo numeri aggregati).

**Criteri di accettazione**
- Dato il tasto "Dalla parte del banco" nella schermata 4, quando l'utente lo attiva, allora l'app simula 10.000 persone con la stessa abitudine di gioco di Salvatore per un anno, usando lo stesso motore (stessa logica di BR-04) e, in modalità demo, lo stesso seme fisso ad ogni esecuzione.
- Dato il risultato della simulazione aggregata, quando mostrato, allora indica quante delle 10.000 persone (in numero e percentuale) terminano l'anno con vincite nette positive (in attivo) e quante no.
- Dato il risultato aggregato, quando mostrato, allora indica l'incasso netto complessivo del banco sulle 10.000 persone, coerente con il payout del gioco selezionato (71,2% per il modello A, 60,1% per il modello B).
- Dato la vista "scala Italia", quando mostrata, allora riporta la perdita netta nazionale 2024 di **21,5 miliardi di euro**, etichettata con la fonte (`ricerca-azzardo.md`, dato [UFF-sec]).

---

## BR-15 — L3: probabilità in cose fisiche
**Descrizione**: ogni probabilità "1 su N" mostrata nell'app (schermata 4 "Un anno in 10 secondi" e scheda "Capire i numeri" → probabilità) è tradotta in un confronto fisico tangibile: per il premio massimo del modello A, "servirebbero 208 stadi da 60.000 posti pieni, e in tutti vincerebbe una sola persona"; per la frequenza di gioco di Salvatore (2 biglietti/giorno), "in media una vincita del premio massimo ogni circa 17.096 anni".
**Motivazione di business**: leva di innovazione L3, approvata dall'utente; rende percepibile su scala umana una probabilità altrimenti astratta (1 su 12.480.000), rafforzando la comprensione richiesta dal Tema 02 senza ricorrere a consigli o giudizi.
**Priorità**: Must.
**Vincolo di tema**: T2-V1 (comprensione di un concetto di rischio/probabilità di base), coerente con BR-11 (formulazione con "servirebbero…"/"in media…", mai "dovresti").

**Criteri di accettazione**
- Dato il premio massimo del modello A (probabilità 1 su 12.480.000, fonte §1.1 [UFF]), quando l'app lo traduce in scala fisica, allora mostra "208 stadi da 60.000 posti pieni, e in tutti vincerebbe una sola persona" (12.480.000 / 60.000 = 208, calcolo verificabile).
- Dato la frequenza di gioco di Salvatore (2 biglietti/giorno = 730 biglietti/anno) e la probabilità del premio massimo del modello A, quando l'app mostra la scala temporale, allora riporta "in media, una vincita del premio massimo ogni circa 17.096 anni" (12.480.000 / 730 ≈ 17.096, etichettato come stima derivata [DERIV], coerente con BR-04/TC-08).
- Dato i due confronti fisici (stadi e anni), quando letti, allora sono formulati senza imperativi o consigli ("servirebbero…", "in media…"), mai "dovresti", coerente con il rafforzamento BR-11/L4 (nessun falso positivo dell'hook).
- Dato la scheda "Capire i numeri" → probabilità (BR-05), quando l'utente la apre, allora il confronto fisico "208 stadi" è presente accanto alla rappresentazione visiva "1 su 12.480.000" già prevista da BR-05.

---

## BR-16 — CR1: "Vuoi parlarne con qualcuno?"
**Descrizione**: nella schermata "La mia abitudine", l'utente sceglie autonomamente una soglia di spesa mensile personale (es. 100 €, valore di default suggerito ma modificabile). Se la spesa mensile calcolata dall'abitudine inserita supera la soglia scelta dall'utente, compare un pannello con: (a) il numero verde ISS 800 55 88 22 con link `tel:` per chiamare direttamente dal dispositivo; (b) un messaggio già scritto, neutro, da inviare a una persona di fiducia tramite link WhatsApp o `mailto:` precompilato, che **l'utente sceglie se inviare e invia personalmente** (nessun invio automatico, nessun contatto salvato dall'app).
**Motivazione di business**: change request CR1, approvata dall'utente; introduce un'escalation leggera verso un supporto umano, attivata da una soglia di budget scelta dall'utente (non da una diagnosi di rischio), compatibile con il perimetro educativo del Tema 02 e con il divieto di consigli/giudizi (BR-11).
**Priorità**: Should.
**Vincolo di tema**: T2-V3 (la soglia è un budget personale scelto dall'utente, non una valutazione clinica), BR-12 (nessun dato salvato o inviato dall'app), coerente con BR-11/L4 (testo del messaggio precompilato verificato dall'hook).

**Criteri di accettazione**
- Dato la schermata "La mia abitudine", quando l'utente la visualizza, allora può impostare una soglia di spesa mensile personale (campo numerico, default proposto, es. 100 €, modificabile liberamente).
- Dato che la spesa mensile calcolata (BR-03) supera la soglia scelta dall'utente, quando il confronto viene valutato, allora compare il pannello "Vuoi parlarne con qualcuno?" con il numero verde 800 55 88 22 in forma di link `tel:800558822`.
- Dato il pannello visibile, quando l'utente lo apre, allora trova anche un messaggio precompilato per una persona di fiducia, disponibile come link WhatsApp (`https://wa.me/?text=...`) e come link `mailto:` con oggetto e corpo precompilati; l'invio avviene solo se l'utente tocca il link e conferma nell'app esterna (nessun invio automatico da parte dell'app).
- Dato il testo del messaggio precompilato, quando letto, allora è formulato in modo neutro (nessun giudizio, nessun riferimento a "dipendenza" o diagnosi), supera la scansione dell'hook L4 (BR-11) e non contiene formule da consiglio.
- Dato l'attivazione del pannello o l'eventuale invio del messaggio, quando ispezionato il comportamento dell'app (DevTools → Network, storage), allora nessun dato (soglia, importo, contatto, esito dell'invio) viene salvato fuori dal browser o inviato a un server dell'app (coerente con BR-12): solo l'app esterna (client email/WhatsApp) scelta dall'utente riceve il messaggio, e solo per sua azione diretta.
- Dato che la spesa mensile non supera la soglia scelta, quando l'utente naviga nella schermata, allora il pannello non compare.

---

## BR-17 — CR2: "Pausa e Conto"
**Descrizione**: un tasto "Sto per comprare un biglietto" avvia una pausa di 30 secondi durante la quale l'app mostra i numeri specifici del biglietto scelto: perdita media attesa su quella giocata, quota delle vincite di quel gioco che sono solo rimborso (BR-13), e la probabilità del premio massimo tradotta in scala fisica (BR-15). Al termine, il messaggio "La scelta è tua" chiude la pausa senza indicare una decisione.
**Motivazione di business**: change request CR2, approvata dall'utente come versione educativa (non clinica) di un intervento nel momento della scelta; rinforza la decisione informata richiesta dal Tema 02 senza diventare un esercizio contro l'impulso o un'indicazione di cosa fare (T2-V3, BR-11).
**Priorità**: Should — **decisione dell'utente al checkpoint delle 14:30**: la funzionalità è attiva di default (non più dietro un flag opzionale `?pausa=1`); resta Should (non Must) perché non è il cuore della simulazione Before/After, ma deve essere presente e funzionante nel perimetro consegnato.
**Vincolo di tema**: T2-V3 (nessuna indicazione su cosa fare, solo numeri), coerente con BR-11, BR-13, BR-15.

**Criteri di accettazione**
- Dato l'app aperta senza alcun parametro opzionale, quando l'utente arriva alla schermata della simulazione (schermata 4), allora il tasto "Sto per comprare un biglietto" è presente e attivo di default, senza necessità di flag o parametro d'attivazione.
- Dato il tasto "Sto per comprare un biglietto" attivato, quando la pausa parte, allora dura 30 secondi e mostra: perdita media attesa per quella giocata, quota di vincite rimborso/piccole per quel gioco (coerente con BR-13), probabilità del premio massimo in scala fisica (coerente con BR-15).
- Dato il termine della pausa di 30 secondi, quando l'app mostra il messaggio finale, allora il testo è "La scelta è tua" (o equivalente neutro), senza alcuna indicazione su cosa fare, coerente con BR-11/L4.
- Dato il testo mostrato durante la pausa, quando scansionato dall'hook L4 e dal test automatico (BR-11), allora non contiene formule da consiglio o giudizio.
