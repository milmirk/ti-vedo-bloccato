# Idee sul target NEET — Hagenthon

| Campo | Valore |
|---|---|
| Data | 2026-10-05 |
| Owner | Esperto di Innovazione |
| Stato | **PROPOSTA — in attesa di conferma utente** |
| Base dati | `docs/idea/ricerca-neet.md` (i codici [UFF], [DERIV], [TERZI] rimandano a quella legenda) |
| Vincoli considerati | `00_input/temi-sfida.md`, `00_input/regolamento.md`, `docs/qa/checklist-conformita.md` v2 |
| Non sostituisce | `idee-valutate.md` e `idea-selezionata.md` (idee precedenti, non modificate) |

> Le persone sono **fittizie**, ma ognuna è costruita su un numero reale del sottosegmento. I servizi sono **repliche realistiche senza marchi**.

## Vincoli trasversali che pesano su tutte le idee

- **App statica HTML/CSS/JS** (niente Node né Python) e freeze alle 15:00. Quindi **niente LLM a runtime**: senza backend la chiave API finirebbe nel browser. Ogni idea ha un **nucleo deterministico**: regole, dati JSON preparati prima e rivisti da noi. Questo aiuta anche sul criterio "efficienza nell'utilizzo dei token" (V-04, V-06).
- **5 minuti in totale, demo compresa** (R-10). La demo deve stare in circa **2'30"**, quindi il momento "wow" deve arrivare entro 60–90 secondi. Il **replay** di sessioni registrate è la rete di sicurezza.
- I **3 deliverable del tema** vanno **dentro** presentazione e demo (R-09).
- **Profili del Tema 03**: se l'elenco sia tassativo resta un punto aperto (A-01 nella checklist v2). "NEET" **non è** un profilo dell'elenco: ogni idea si aggancia a **uno** dei profili ammessi e usa il NEET come **contesto e motivazione**. Va dichiarato così, non presentato come "profilo NEET".
- **Catena di impatto onesta.** Se un inattivo comincia a cercare, passa a disoccupato e **resta NEET**. Il tasso scende solo con l'ingresso in lavoro, istruzione o formazione. 1 punto di tasso corrisponde a circa 89 mila giovani [DERIV]. Nessuna idea promette di "ridurre il tasso": ognuna mostra un **miglioramento misurabile sul singolo** e la **leva documentata** a cui si collega.

---

## N1 — "Prova Generale": allenarsi all'adesione a Garanzia Giovani senza paura di sbagliare

- **Tema: 03 Educazione Digitale Inclusiva.** Profilo: **nuovo utente di un processo digitale**. L'aggancio è **diretto**: il profilo è nell'elenco e il processo è reale.
  - Rischio di ibrido (C-01): **basso**. È apprendimento di un processo, non assistenza alla compilazione reale (che sarebbe Tema 01). Va detto esplicitamente: "ci si allena su una replica, poi si fa da soli sul portale vero".
- **Persona: Gabriele, 23 anni, Palermo.** Diploma tecnico nel 2021, due stagioni estive in un lido, poi più niente da 2 anni. Vorrebbe lavorare ma non cerca. Un anno fa ha provato ad aderire a Garanzia Giovani dal telefono: alla scelta della "condizione occupazionale" e della regione del servizio non sapeva cosa rispondere, ha avuto paura di "sbagliare e perdere il diritto" e ha chiuso. Da allora non ci ha più provato.
  - **Numeri che lo rendono rappresentativo**: Sicilia **22,8%** NEET (2025) [UFF]. **Circa 440 mila** NEET sono inattivi che vorrebbero lavorare ma non cercano (5,0 punti, 38% dei NEET, 2025) [DERIV su UFF]. Il 73% dei NEET italiani vorrebbe lavorare [UFF/DERIV].
- **Servizio**: replica senza marchi del flusso di **adesione a Garanzia Giovani**: accesso (identità digitale simulata), dati anagrafici e titolo di studio, condizione attuale, scelta della regione e del servizio, riepilogo e conferma, prenotazione del primo colloquio.
- **Cosa fa**: una palestra in cui il coach **osserva** le azioni (tocchi a vuoto, inattività, avanti e indietro, errori nei campi), **rileva il blocco** passo per passo e dà **aiuti graduati**: livello 1 evidenzia, livello 2 spiega in parole semplici il perché della domanda, livello 3 fa "fallo con me". A ogni tentativo gli aiuti si **riducono** dove Gabriele ha imparato. Si chiude con una **prova da solo** misurata.
  - **Capability agentica**: rilevamento del blocco, feedback mirato sull'errore, adattamento dinamico del livello di aiuto, percorso personalizzato (riduzione per singolo passo), valutazione con prova senza aiuti. Copre **tutte e cinque** le capability di T3-V5.
- **Miglioramento misurabile**: completamento **senza aiuti** (no → sì), errori, aiuti usati, tempo. Atteso: tentativo 1 con 5–6 errori, 4–5 aiuti e circa 4'; prova finale con 0 aiuti, 0–1 errori e meno di 2'. Lo misura il cruscotto dei tentativi, con dati prodotti dal sistema.
- **Catena di impatto**: Gabriele **completa l'adesione da solo** → leva documentata: l'adesione è il primo anello dell'imbuto della Garanzia Giovani (1.717.038 registrati, 85% presi in carico, 64,5% avviati a una misura, **66,4% di inserimento tra chi completa**) [UFF-sec]. La Corte dei conti UE critica proprio la debole intercettazione dei NEET inattivi [UFF-sec] → effetto sul tasso: **solo indiretto**. L'adesione non fa uscire dai NEET. Ne esce chi poi entra in una misura (tirocinio o formazione) o in un lavoro.
- **Demo prima/dopo (circa 2')**: *prima*, il flusso senza coach: Gabriele si ferma alla "condizione occupazionale", il timer corre, abbandona. *Dopo*, il replay di 2 tentativi con il coach e la prova da solo. **Wow**: il cruscotto con la curva "6 errori e 5 aiuti → 0 aiuti", e lo **stesso passo** che riceve un aiuto di livello 3, poi di livello 1, poi nessuno (è la Adaptive Evidence).
- **MVP in 3 ore (statico)**: 5 schermate, un tracciatore di eventi, un motore di aiuti a regole (soglie per passo, 3 livelli), le modalità Allenamento e Prova, il cruscotto, il replay di 3 sessioni salvate in JSON. **LLM a runtime: nessuno.** Circa 15 testi di aiuto scritti in build con Claude Code e rivisti da noi.
- **Rischi**: è **la soluzione più prevedibile del tema** (gli esempi del Tema 03 citano "guida passo-passo per usare uno strumento digitale reale"), quindi l'innovatività è media. È una replica: va dichiarato che il valore è l'allenamento e che poi serve il passaggio al portale vero. Le domande del flusso toccano diritti e obblighi del programma: il coach **spiega che cosa chiede il campo**, non dice "cosa ti conviene rispondere" né che conseguenze legali ha. Per questo c'è un disclaimer con il rimando al CPI. Dati personali: solo fittizi, nulla salvato fuori dal browser.

---

## N2 — "Competenze Nascoste": da "non ho esperienza" a un CV con competenze dimostrate

- **Tema: 03.** Profilo: **nuovo utente di un processo digitale** (la sezione "Esperienze e competenze" del CV online, nel formato del CV del SIISL o di Europass). L'aggancio è **medio**: il profilo è nell'elenco, ma il bisogno di fondo (rientro dopo un periodo di cura) va raccontato come contesto. Rischio A-01 se gli elenchi fossero interpretati in modo restrittivo.
  - Rischio di ibrido (C-01): **basso**. Non è un servizio finanziario e non è accessibilità di un servizio: è un percorso per **imparare a descrivere le proprie competenze**.
- **Persona: Rosaria, 27 anni, Caserta.** Diploma professionale nei servizi commerciali (2017). Per un anno ha aiutato la zia nella merceria (cassa, ordini ai fornitori, vetrina), poi è nata la figlia. Da settembre la bambina va al nido e Rosaria vorrebbe lavorare. Apre il CV online, arriva a "Esperienze lavorative", scrive "nessuna" e chiude: "Ho fatto solo la mamma".
  - **Numeri**: Campania **21,5%** NEET (2025) [UFF]. Donne NEET **14,9%** contro uomini **11,8%**, e donne inattive **10,6%** contro **6,8%** (Italia 2025) [UFF]. Il 37% delle NEET "non vuole o non può lavorare", contro il 16% degli uomini [DERIV]. Il **43,1%** delle donne NEET è al livello di gravità massimo (oltre 12 mesi) [TERZI]. Il lavoro si trova per **conoscenze più che per competenze**: 72% tramite amici, 29% tramite CPI [TERZI].
- **Servizio**: replica della sezione "Esperienze e competenze" di un **CV online** (struttura ispirata al CV SIISL/Europass, senza marchi), con un sottoinsieme di competenze della classificazione europea **ESCO** (dati aperti UE), circa 30 voci preparate in JSON.
- **Cosa fa**:
  1. **Intervista guidata a carte** (niente testo libero all'inizio): "Quali di queste cose hai fatto negli ultimi anni?" (cassa in un negozio, gestione della casa e dei conti, cura di un bambino, organizzazione di eventi, social di un'attività…). Ogni carta apre **domande successive diverse** a seconda delle risposte (quanto spesso, con chi, cosa decidevi tu).
  2. **Mappatura** sulle competenze ESCO. Ogni competenza mostra la **"prova"**, cioè la frase di Rosaria da cui deriva. Regola: **nessuna competenza senza prova**. È il nostro "semplificare senza tradire": non si inventa nulla.
  3. **Esercizio di scrittura con feedback mirato**: Rosaria riscrive con parole sue una riga del CV. Una **rubrica deterministica** controlla 4 elementi: verbo d'azione, compito concreto, quantità o frequenza, contesto o risultato. Il feedback dice quale elemento manca, con un esempio.
  4. **Riduzione degli aiuti**: esempio completo → frase da completare → frase libera.
  5. **Prova di trasferimento**: un'esperienza **nuova**, mai vista nel percorso ("organizzo la festa di fine anno all'asilo"), da descrivere **senza aiuti**.
  - **Capability agentica**: percorso personalizzato (domande ramificate), valutazione della comprensione (rubrica), feedback mirato sugli errori, adattamento dinamico (livello degli aiuti), valutazione finale per trasferimento. Copre tutte le capability di T3-V5.
- **Miglioramento misurabile**: (a) **punteggio della rubrica** sulla frase scritta da Rosaria: prima del percorso 0–1/4 ("ho fatto la mamma"), alla prova di trasferimento 3–4/4; (b) competenze con prova: da 0 a 6–8; (c) sezione del CV completata da sola: no → sì. Il cruscotto mostra le misure prima e dopo.
- **Catena di impatto**: Rosaria ha **una sezione del CV completa e sa descrivere da sola una nuova esperienza** → leva documentata: il CV è il prerequisito di tre canali formali (invio di CV, usato dal 60–62% dei NEET che cercano [TERZI]; CV caricati sul SIISL, 291 mila [UFF-sec]; registrazione al CPI) in un Paese dove le donne inattive sono il 10,6% delle giovani [UFF] → effetto sul tasso: **indiretto**. Esce dai NEET se poi trova un lavoro o un corso. Il CV abbassa la soglia del primo passo, ma **non risolve la barriera strutturale della cura** e va detto.
- **Demo prima/dopo (circa 2'15")**: *prima*, il CV con "Esperienze: nessuna" e il campo vuoto. *Dopo*, 6 carte e 2 domande per carta, e la parete di **7 competenze ESCO, ognuna con la sua prova**. **Wow**: la prova di trasferimento. Rosaria scrive da sola una riga sulla festa all'asilo e la rubrica passa da **1/4 a 4/4**, tutta verde. Adaptive Evidence: la stessa carta "cassa" porta a domande diverse per Rosaria e per un secondo profilo (per esempio un ragazzo che ha fatto consegne).
- **MVP in 3 ore (statico)**: 6 carte con alberi di domande in JSON, circa 30 competenze ESCO con sinonimi, una rubrica a regole (liste di verbi e pattern di quantità e frequenza in italiano), 3 livelli di aiuto, prova di trasferimento, anteprima del CV ed export in stampa/PDF dal browser. **LLM a runtime: nessuno.** Contenuti scritti in build con Claude Code e rivisti da noi.
- **Rischi**:
  - La rubrica a regole è **fragile sul testo libero**. Mitigazione: suggerimenti cliccabili, sinonimi, una frase di prova preparata per la demo e un limite dichiarato nella Learning Outcome Note.
  - Strumenti simili esistono: l'**EU Skills Profile Tool for Third Country Nationals**, i suggerimenti di competenze dei portali di lavoro. La differenza va argomentata (V-01): qui **si impara** a descrivere (rubrica, trasferimento), non si compila al posto della persona.
  - L'esperienza nella merceria era **informale**: lo strumento la descrive come "esperienza" senza alcuna valutazione legale o contributiva. Disclaimer: "per questioni di contratto o contributi rivolgiti a CPI o patronato".
  - Dati personali: il CV contiene dati sensibili per la persona, quindi tutto resta in locale e in demo si usano solo dati fittizi.

---

## N3 — "Annuncio Chiaro": leggere un annuncio di lavoro e capire se fa per me, con italiano A2

- **Tema: 03.** Profilo: **persona con difficoltà linguistiche**. L'aggancio è **diretto**.
  - Rischio di ibrido (C-01): basso. Rischio sulla lista "cosa evitare": **"pura traduzione automatica"**. Il nucleo deve essere l'**esercizio di comprensione con verifica**, non la traduzione.
- **Persona: Nadia, 22 anni, nata in Marocco, a Torino da quando aveva 17 anni.** Italiano **A2**, ha lasciato la scuola dopo un anno di istituto professionale. Cerca lavoro nelle pulizie o nella ristorazione sui portali di annunci. Non distingue i **requisiti obbligatori** da quelli **preferenziali**, non capisce "su turni", "automunita", "part-time verticale", "CCNL livello 2", "tirocinio 6 mesi". Si è candidata ad annunci impossibili per lei e ha scartato quelli adatti.
  - **Numeri**: NEET tra le **donne nate all'estero 35,6%**, contro il 12,7% delle nate in Italia (2025) [UFF]. Abbandono precoce tra chi è **arrivato in Italia tra i 16 e i 24 anni: 38,9%** (2024) [UFF-sec]. Nati all'estero: ELET 21,3% [UFF].
- **Servizio**: 6 annunci di lavoro **realistici** (scritti da noi, nello stile tipico dei portali), annotati in JSON con 5 elementi: mansione, orario, luogo e spostamento, requisiti (obbligatori o preferenziali), tipo di rapporto.
- **Cosa fa**: per ogni annuncio Nadia deve **trovare e marcare** i 5 elementi. Se sbaglia, la soluzione **cambia strategia**: evidenzia la frase, offre una versione A2 dello stesso pezzo (senza cambiarne il significato), mostra un pittogramma e il termine nel glossario. I termini sbagliati **ritornano** negli annunci successivi (ripetizione dilazionata). Alla fine c'è una **checklist personale** ("questo requisito ce l'ho, questo no"): è lei a decidere se candidarsi, lo strumento non lo dice.
  - **Capability agentica**: valutazione della comprensione per elemento, adattamento dinamico del livello del testo, feedback mirato, percorso personalizzato sui termini non acquisiti, prova su annunci nuovi.
- **Miglioramento misurabile**: elementi estratti correttamente da un **annuncio mai visto**: prima 2/5, dopo 5/5. Termini del glossario riconosciuti: da 3/10 a 9/10. Misurati dal motore della prova.
- **Catena di impatto**: Nadia **sa leggere un annuncio e confrontarlo con i propri requisiti** → leva documentata: il divario di NEET tra donne nate all'estero e nate in Italia (35,6% contro 12,7%) e l'abbandono precoce degli arrivati tardi (38,9%) [UFF] → effetto sul tasso: **indiretto**. Candidature più mirate significano più probabilità di colloquio, ma non c'è un dato che quantifichi questo passaggio.
- **Demo prima/dopo (circa 2')**: *prima*, Nadia davanti all'annuncio originale risponde "sì, posso" a un annuncio che richiede patente e auto. *Dopo*, 2 annunci con adattamento, poi il terzo da sola: 5/5. **Wow**: lo **stesso annuncio** mostrato a due livelli (A2 e B1) con aiuti diversi, e la checklist finale che fa emergere da sola il requisito mancante.
- **MVP in 3 ore (statico)**: 6 annunci annotati, testo marcabile (clic sulle frasi), 2 livelli di testo per frase, glossario di 15 termini con pittogrammi, motore di ripetizione, prova finale. **LLM a runtime: nessuno.**
- **Rischi**: vicinanza alla "pura traduzione" (b = 3) e all'idea precedente 3B ("Sicurezza in Parole Mie"). Termini come **CCNL e livello** toccano l'**ambito legale e contrattuale**: lo strumento **spiega cosa vuol dire il termine**, non valuta se il contratto è giusto o conveniente, e rimanda a sindacato, patronato o CPI (T3-V4). Una lingua madre (arabo o francese) nel glossario richiede una **revisione umana** che il team potrebbe non garantire: meglio pittogrammi e italiano semplificato. Il "wow" è meno visivo.

---

## N4 — "Candidatura in 5 mosse": dal "mandami il CV per email" all'email inviata

- **Tema: 03.** Profilo: **persona con bassa alfabetizzazione digitale**. L'aggancio è **diretto**.
  - Rischio di ibrido: basso. **Sovrapposizione con N1** sul meccanismo "sandbox con coach": la differenza è che N4 parte da un **test di posizionamento** e costruisce un **curriculum di micro-abilità**, saltando quelle già possedute, mentre N1 riduce gli aiuti su un unico flusso.
- **Persona: Davide, 20 anni, Catania.** Ha lasciato l'istituto professionale a 17 anni. Usa solo lo smartphone (messaggi, video brevi). Il responsabile di un supermercato gli ha detto "mandami il CV per email": Davide non ha un indirizzo email "presentabile", non sa trasformare il CV in PDF né allegarlo, e non l'ha mai mandato.
  - **Numeri**: abbandono precoce in **Sicilia 15,2%**, maschi 12,2% (2024) [UFF]. Ha competenze digitali di base solo il **47,5% dei disoccupati**, contro il 74,2% degli studenti (2025) [UFF]. Con al più la licenza media si cerca lavoro soprattutto tramite amici (80%) [TERZI].
- **Servizio**: replica in cornice smartphone di un **client email** e di un'app di file e calendario: crea un indirizzo, scrivi l'oggetto, scrivi il testo, allega il CV in PDF (non una foto), controlla l'invio, rispondi alla convocazione e salva l'appuntamento.
- **Cosa fa**: **test di posizionamento** con 5 micro-compiti → percorso **solo** sulle abilità mancanti → feedback **per tipo di errore** (allegata una foto invece del PDF, oggetto vuoto, registro troppo informale, allegato dimenticato) → verifica della padronanza → **ripetizione** il "giorno dopo" (simulato) per misurare la capacità di ripetere l'azione.
  - **Capability agentica**: percorso personalizzato, rilevamento del blocco, feedback mirato sugli errori, valutazione (padronanza e ripetizione).
- **Miglioramento misurabile**: compiti completati senza errori: da 1/5 a 5/5. Tempo per una candidatura completa. Ripetizione riuscita al giorno 2. Misurati dal motore.
- **Catena di impatto**: Davide **sa inviare una candidatura digitale** → leva: l'invio di CV è il canale formale più usato dai NEET che cercano (60–62%) [TERZI], e le competenze digitali dei disoccupati sono basse (47,5%) [UFF] → effetto: **indiretto e debole**. Allarga i canali, ma non c'è un dato sull'effetto di questo passaggio.
- **Demo prima/dopo (circa 2')**: *prima*, l'email inviata con oggetto vuoto e "IMG_2041.jpg". *Dopo*, il percorso salta le 2 abilità che Davide già sa e lavora sulle 3 mancanti, poi la prova: email corretta in 40 secondi. **Wow**: il **feedback sull'errore specifico** ("hai allegato una foto del CV: chi lo riceve non può copiarne il testo né stamparlo bene") e il percorso che **salta** ciò che sa già.
- **MVP in 3 ore (statico)**: cornice smartphone, 3 micro-app replica, 5 compiti con validatori, test di posizionamento, ripetizione simulata, cruscotto. **LLM a runtime: nessuno.**
- **Rischi**: **innovatività bassa** (esistono molti corsi base di email, per esempio quelli di facilitazione digitale) e sovrapposizione con N1. Il "wow" è modesto. La catena di impatto è la più debole fra le idee del Tema 03.

---

## N5 — "Tirocinio in Chiaro": quanto mi resta davvero ogni mese (Tema 02)

- **Tema: 02 Inclusione Finanziaria.** Scenario: **gestione del budget personale** e simulazione di una scelta quotidiana (T2-V1). L'aggancio al tema è **medio**: il tema chiede educazione finanziaria di base, e il legame con il NEET è il contesto, non il cuore.
  - Rischio di ibrido (C-01): **medio**. Va presentata **solo** con i vincoli e i deliverable del Tema 02 (User Difficulty Statement, Before/After Simplicity Evidence, Risk & Clarity Note), senza capability "agentiche" del Tema 03 nei deliverable.
- **Persona: Simone, 21 anni, Bari.** Gli è stato proposto un **tirocinio extracurriculare di 6 mesi** tramite Garanzia Giovani in un'azienda a 25 km. Non sa se l'indennità è "uno stipendio", né quanto gli resta tolti abbonamento e pranzi. Pensa "con quei soldi non ci sto dentro" e sta per rinunciare senza aver fatto i conti.
  - **Numeri**: Puglia **19,0%** NEET (2025) [UFF]. I tirocini sono il **56,8%** delle misure di Garanzia Giovani 2014–2022 [UFF-sec]. Che i costi di spostamento siano una causa documentata di rinuncia: **[NON VERIF.]**.
- **Servizio**: scheda di proposta di tirocinio **realistica** (indennità mensile, ore, sede, durata), con importi **inseriti dall'utente o di esempio**, non presentati come valori normativi regionali.
- **Cosa fa**: simulatore del budget mensile (indennità − trasporto − pasti − spese fisse → disponibile), timeline di 6 mesi, glossario (indennità, rimborso, lordo e netto **solo come concetti**), quiz prima e dopo. **Non dice mai "accetta" o "rifiuta"** (T2-V3).
  - **Capability software**: motore di calcolo e simulazione, controllo di coerenza dei dati, quiz.
- **Miglioramento misurabile**: quiz di comprensione da 1/4 a 4/4. Capacità di calcolare da solo il disponibile di un mese nuovo.
- **Catena di impatto**: Simone **capisce i numeri della proposta** → leva: il tirocinio è la misura dominante della Garanzia Giovani, e chi completa una misura ha il 66,4% di inserimento [UFF-sec] → effetto: **ipotetico**. Il legame "capire il budget → accettare il tirocinio → uscire dai NEET" **non è documentato** dai dati raccolti.
- **Demo prima/dopo (circa 2')**: *prima*, "500 € al mese? non ci sto dentro". *Dopo*, la timeline mostra il disponibile reale mese per mese. **Wow**: lo slider sull'abbonamento che sposta il disponibile in tempo reale.
- **MVP in 3 ore (statico)**: form, motore di calcolo con test, timeline, glossario di 8 termini, quiz. **LLM a runtime: nessuno.**
- **Rischi**: **confine con la consulenza** (decidere se accettare) e con la **fiscalità personalizzata** (tasse sull'indennità, ISEE, assegni), che va **esclusa del tutto**. Gli importi minimi delle indennità sono regionali e vanno trattati come esempi. Il legame con il tasso NEET è debole, ed è la scelta meno coerente con l'obiettivo "ridurre i NEET".

---

## Matrice di valutazione

### Tabella A — Criteri proxy a–f (come in `idee-valutate.md`) più (g) forza dei numeri reali

Scala 1–5, totale massimo 35. Codici: a = aderenza al tema; b = distanza dalla lista "cosa evitare" e dalla soluzione ovvia; c = impatto sulla persona; d = demo prima/dopo e "wow"; e = fattibilità in 3 ore con app statica; f = capability concreta e spiegabile; g = numeri reali a supporto.

| Idea | Tema | a | b | c | d | e | f | g | **Tot.** |
|---|---|---|---|---|---|---|---|---|---|
| N1 Prova Generale | 03 | 5 | 3 | 4 | 4 | 5 | 5 | 5 | **31** |
| N2 Competenze Nascoste | 03 | 4 | 5 | 5 | 5 | 4 | 5 | 4 | **32** |
| N3 Annuncio Chiaro | 03 | 5 | 3 | 5 | 4 | 4 | 4 | 5 | **30** |
| N4 Candidatura in 5 mosse | 03 | 5 | 3 | 4 | 3 | 4 | 4 | 4 | **27** |
| N5 Tirocinio in Chiaro | 02 | 3 | 4 | 3 | 4 | 5 | 3 | 2 | **24** |

### Tabella B — Criteri ufficiali del regolamento più fattibilità e numeri

Criteri ufficiali (`00_input/regolamento.md`): **I** innovatività, **M** messa a terra (concretezza e realizzazione), **D** efficacia della demo (in 5 minuti totali), **T** efficienza nell'uso dei token e uso consapevole dell'AI. Aggiunte interne: **F** fattibilità in 3 ore con app statica, **G** forza dei numeri. Scala 1–5, totale massimo 30.

| Idea | I | M | D | T | F | G | **Tot.** | Solo criteri ufficiali (I+M+D+T, max 20) |
|---|---|---|---|---|---|---|---|---|
| N1 Prova Generale | 3 | 5 | 4 | 5 | 5 | 5 | **27** | 17 |
| N2 Competenze Nascoste | 5 | 4 | 5 | 5 | 4 | 4 | **27** | **19** |
| N3 Annuncio Chiaro | 3 | 4 | 4 | 5 | 4 | 5 | **25** | 16 |
| N4 Candidatura in 5 mosse | 2 | 4 | 3 | 5 | 4 | 4 | **22** | 14 |
| N5 Tirocinio in Chiaro | 3 | 4 | 4 | 5 | 5 | 2 | **23** | 16 |

### Motivazioni sintetiche

- **N1 (27 in B, 31 in A)**: è l'idea più sicura. Il profilo è nell'elenco, il processo è reale, ha tutte le capability, il motore è già progettato per la 3A ed è collegata al segmento più grande e "attivabile" (circa 440 mila). Perde su **innovatività** e su (b): "guida passo-passo per uno strumento reale" è un esempio esplicito del tema, quindi è probabile che più squadre portino una palestra simile.
- **N2 (27 in B, 32 in A)**: la più innovativa e con il "wow" più forte in 2 minuti: "ho fatto solo la mamma" diventa 7 competenze con prova, poi 4/4 da sola. Lega il pitch a un dato memorabile (il lavoro si trova "per conoscenze, non per competenze"). Perde un punto su aderenza (aggancio al profilo medio, A-01), su messa a terra (la rubrica sul testo libero va resa robusta) e su numeri (alcuni dati sulle donne sono di terze parti).
- **N3 (25)**: i numeri più forti (35,6% e 38,9%) e il profilo più netto, ma è vicina alla "pura traduzione" e all'idea 3B già scartata, e la demo è meno visiva.
- **N4 (22)**: solida ma poco originale, si sovrappone a N1 e ha la catena di impatto più debole.
- **N5 (23)**: fattibile e testabile, ma il legame con i NEET non è documentato, è a rischio consulenza e fiscalità, ed è fuori dal tema più naturale.

### Sensibilità

- Se gli elenchi dei profili risultano **tassativi e interpretati in modo stretto** (A-01), N2 diventa più rischiosa e **N1 passa avanti**.
- Se la giuria premia la **concretezza e la sicurezza della demo** più dell'originalità, N1 passa avanti.
- Se il team vuole il **target con i numeri più forti**, N3 sale. Il prezzo è il rischio "traduzione".
- Nessuna idea dipende da un LLM a runtime, quindi il vincolo dell'app statica non cambia il ranking.

---

## Raccomandazione

> **PROPOSTA — in attesa di conferma utente.**

### Top 1: N2 "Competenze Nascoste" (Tema 03, profilo "nuovo utente di un processo digitale")

**Perché**, a parità di totale con N1 nella Tabella B (27–27):
1. **Vince sui criteri ufficiali puri** (19 contro 17): innovatività ed efficacia della demo sono i due criteri su cui le squadre si differenziano. Messa a terra e token saranno alti per tutti quelli che consegnano un prototipo statico.
2. **È lontana dalla soluzione ovvia del tema.** La palestra o guida passo-passo è un esempio citato dal Tema 03: è probabile che la giuria ne veda più d'una.
3. **Ha una storia da pitch che si regge su un dato**: "In Italia il 72% dei NEET cerca lavoro tramite amici e solo il 29% tramite i CPI. Il lavoro passa per le conoscenze, non per le competenze. Noi rendiamo visibili le competenze". Il dato è [TERZI] e va dichiarato così; resta comunque coerente con il dato ISTAT del 76,6% di chi cerca tramite parenti e amici.
4. **Guardrail facile da spiegare** (V-07, V-09): "nessuna competenza senza prova", cioè ogni competenza è collegata a una frase della persona, e la revisione umana è sulla classificazione e sulla rubrica.

**Condizioni per confermarla**: accettare il rischio A-01 sul profilo e investire la prima ora sulla robustezza della rubrica (frase di demo preparata più suggerimenti cliccabili).

### Riserva: N1 "Prova Generale" (Tema 03, profilo "nuovo utente di un processo digitale")

È la scelta da preferire se l'utente vuole **minimizzare il rischio con il tempo che corre** (lo sviluppo è già partito alle 11:53) oppure se A-01 viene interpretato in modo stretto. Riusa quasi per intero il motore progettato per la 3A, con il target NEET e numeri più forti.

### Confronto con la proposta precedente 3A "Palestra Digitale"

- La **3A** (Teresa, 77 anni, biglietto del treno) aveva il profilo più netto ("persona anziana"), tutte le capability e nessun tema sensibile. Rispetto al nuovo obiettivo **non ha però numeri NEET a supporto** (g = 1) e il suo impatto sociale non si aggancia a un indicatore nazionale e a un obiettivo UE.
- **N1** è, di fatto, **la 3A applicata al NEET**: stesso motore (osserva, rileva il blocco, aiuti graduati, riduzione, prova da solo), con un processo più rilevante (adesione a Garanzia Giovani) e un segmento quantificato (circa 440 mila inattivi che vorrebbero lavorare). Costo di cambio: quasi zero.
- **N2** abbandona il pattern "palestra" per un percorso di **scoperta, scrittura e trasferimento**. Si guadagna in innovatività e in impatto emotivo, ma la rubrica sul testo libero è un rischio tecnico nuovo.

---

## Prossimi passi dopo la conferma

1. L'utente sceglie (N2, N1 o altra) e conferma il tema.
2. Stesura di `problem-statement`, `idea-selezionata` e `pitch-narrative` NEET, con nomi nuovi per non toccare i file precedenti.
3. Passaggio ai requisiti di business (BR).
