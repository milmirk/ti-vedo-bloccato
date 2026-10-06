# Idee valutate — Hagenthon

> 6 idee, 2 per tema, scelte per essere diverse tra loro (persona, tipo di barriera, capability).
> Tutte le persone sono **fittizie**. Tutti i servizi sono **repliche realistiche** costruite dal team: niente dati reali, niente loghi o marchi di terzi.

## Assunzioni trasversali (da verificare)

- **A1 — LLM a runtime:** non sappiamo se durante l'hackathon e in demo potremo chiamare API di un LLM. Per questo ogni idea è pensata con un **nucleo deterministico** (regole, calcoli, contenuti preparati in fase di build con Claude Code e rivisti da noi). L'LLM a runtime è un **di più**, con fallback dichiarato.
- **A2 — Criteri di valutazione:** quelli ufficiali mancano. Usiamo criteri proxy (sotto) e **ricalcoleremo la matrice** quando arriveranno.
- **A3 — Preparazione:** assumiamo che si possano preparare prima dell'hackathon solo le idee, non il codice. Se fosse vietato anche preparare i contenuti (testi, dataset di esempio), la fattibilità di 1A, 2A e 3B scende.
- **A4 — Ambiente:** laptop con browser Chrome/Edge e connessione internet; demo dal vivo con eventuale video di backup.

---

## Tema 01 — Accessibilità Digitale

### 1A — "Modulo Amico": un campo alla volta

- **Persona:** **Marco, 42 anni**, magazziniere, padre separato, ha una **dislessia** mai certificata da adulto. Deve iscrivere il figlio Luca (8 anni) alla **mensa scolastica** sul portale del Comune. Il modulo ha 23 campi su una sola pagina, con sigle come "DSU", "protocollo INPS-ISEE-2026-…", "fascia tariffaria". Al momento dell'invio compare "Errore: formato non valido nel campo 14" e la pagina si ricarica con alcuni campi svuotati. Al secondo tentativo Marco chiude e chiede all'ex moglie di farlo, perdendo la scadenza.
- **Servizio:** replica realistica di un modulo comunale "Iscrizione al servizio di refezione scolastica" (campi tipici: dati genitore e alunno, scuola e classe, ISEE/DSU, diete speciali, delega SEPA).
- **Cosa fa:** trasforma il modulo in un **percorso guidato, un campo alla volta**, con carattere leggibile, frasi brevi e lettura ad alta voce. Per ogni campo dice *cosa serve, dove trovarlo* (es. "il numero di protocollo è in alto a destra sulla ricevuta della DSU") e *un esempio*. Traduce gli errori in parole semplici ("Il codice fiscale ha 16 caratteri: ne hai scritti 15. Manca probabilmente l'ultima lettera"). Alla fine mostra un riepilogo da controllare e compila il modulo originale.
- **Capability software/agentica:** macchina a stati sui campi; validazione in tempo reale con spiegazione dell'errore; **rilevamento del blocco** (inattività, 2+ errori sullo stesso campo) con aiuto mirato; mappatura 1:1 tra percorso guidato e modulo originale (stessi dati, stesso significato).
- **Demo prima/dopo:** *Prima*: Marco sul modulo originale si ferma al campo DSU e all'errore generico. *Dopo*: stesso compito con Modulo Amico, completato, riepilogo e ricevuta.
- **MVP in 3 ore:** 1 modulo replica (circa 12 campi rappresentativi), percorso guidato, 5 tipi di validazione con messaggi in chiaro, sintesi vocale (Web Speech API), riepilogo finale.
- **LLM a runtime:** opzionale, per rispondere a domande libere su un campo ("cos'è la DSU?"). **Fallback:** spiegazioni per campo scritte in fase di build con Claude Code e **rivisti da noi** (meglio anche per il vincolo "semplificare senza tradire").
- **Rischi:** è molto vicino a un esempio citato nel tema, quindi poco sorprendente. Rischio "restyling" se il guadagno di autonomia non si vede bene in demo. Dislessia: servono scelte tipografiche corrette, non solo un font "speciale".

### 1B — "Slot Parlante": prenotare quando lo screen reader legge solo "pulsante"

- **Persona:** **Lucia, 54 anni**, centralinista, **cieca dalla nascita**, usa NVDA ogni giorno senza problemi. Deve prenotare l'appuntamento per rinnovare la **carta d'identità** sul portale prenotazioni del Comune. Il calendario degli slot è una griglia di riquadri colorati (verde = libero, grigio = pieno) senza testo: NVDA legge "pulsante, pulsante, pulsante…". Lucia non sa quali giorni sono liberi e dipende dalla figlia, che vive in un'altra città.
- **Servizio:** replica realistica di un portale di prenotazione con calendario a griglia non accessibile (pattern molto diffuso nei sistemi di prenotazione).
- **Cosa fa:** legge la struttura della pagina (DOM: colori, classi, posizione) e ne ricava un **modello dei dati** (giorni, orari, stato). Poi offre a Lucia un'**interfaccia alternativa** pilotabile da tastiera e voce: "Ci sono 3 orari liberi martedì 14 mattina: 9:00, 9:20, 10:40. Quale vuoi?". Infine esegue la prenotazione sul portale originale e legge la conferma.
- **Capability software/agentica:** estrazione semantica da un'interfaccia non accessibile; interfaccia alternativa a lista navigabile; dialogo guidato a passi (giorno, ora, conferma); azione sul servizio originale e verifica dell'esito.
- **Demo prima/dopo:** *Prima*: in sala si sente lo screen reader ripetere "pulsante" (momento molto forte). *Dopo*: stessa pagina, Lucia (interpretata da un membro del team, a occhi chiusi) prenota in meno di un minuto.
- **MVP in 3 ore:** 1 portale replica, estrattore costruito su quella replica, interfaccia alternativa con tastiera e sintesi vocale, prenotazione e conferma.
- **LLM a runtime:** utile per generalizzare l'estrazione a pagine qualsiasi (screenshot o DOM). **Fallback:** parser deterministico sulla replica. In demo *non* si dichiara che funziona su qualsiasi sito.
- **Rischi:** il riconoscimento vocale nel browser (SpeechRecognition) dipende dalla rete e dal rumore in sala, quindi in demo meglio tastiera + sintesi vocale. L'effetto "funziona solo sulla nostra replica" va dichiarato con onestà. Lo stile del lavoro con screen reader va rispettato (non sostituire NVDA, affiancarlo).

---

## Tema 02 — Inclusione Finanziaria

### 2A — "Conto in Chiaro": perché il mio saldo scende?

- **Persona:** **Ilenia, 23 anni**, commessa al primo contratto, primo conto corrente aperto per ricevere lo stipendio. Ogni mese il saldo scende anche se "non ha speso niente": canone, commissione per il bonifico al padrone di casa, prelievo da un ATM di un'altra banca. Non capisce la differenza tra **saldo contabile e disponibile** né cosa siano "data valuta" e "competenze". Due volte la carta è stata rifiutata al supermercato.
- **Servizio:** estratto conto mensile **sintetico ma realistico** (CSV/PDF generato da noi) con le voci tipiche di un conto retail.
- **Cosa fa:** legge l'estratto conto, **classifica ogni movimento** (entrata, spesa, costo del conto), **calcola** quanto le è costato il conto nel mese e nell'anno, evidenzia ogni voce di gergo con una spiegazione cliccabile e mostra la linea saldo contabile/disponibile nel tempo. Chiude con 3 domande per verificare se Ilenia ha capito.
- **Capability software:** parser dell'estratto conto + motore di regole per riconoscere i costi + calcoli + glossario contestuale + quiz prima/dopo.
- **Demo prima/dopo:** *Prima*: l'estratto conto grezzo e la domanda "quanto ti costa il conto?" a cui Ilenia non sa rispondere. *Dopo*: "Questo mese il conto ti è costato 7,40 €: ecco le 3 voci". Quiz: da 1/3 a 3/3.
- **MVP in 3 ore:** 1 formato di estratto conto (CSV), circa 10 regole di classificazione, dashboard, glossario di 12 termini, quiz di 3 domande.
- **LLM a runtime:** opzionale, per voci sconosciute o domande libere. **Fallback:** regole + glossario rivisto.
- **Rischi:** **consigli finanziari**. La tentazione di dire "cambia banca" o "conviene il conto online" va bloccata (vietato dal tema). Rischio di sembrare "pura riscrittura" se il calcolo non è al centro della demo. Le informazioni su commissioni e imposte vanno verificate (es. l'imposta di bollo sui conti correnti dipende dalla giacenza media).

### 2B — "Rata Vera": cosa c'è dietro "10 comode rate a tasso zero"

- **Persona:** **Gennaro, 38 anni**, magazziniere, 2 figli, entrate di circa 1.450 € al mese. La lavatrice si è rotta. In negozio gli propongono "**10 rate da 60 € — TAN 0%**". Firma il foglio informativo senza leggerlo. Non sa cosa sia il **TAEG**, non vede le spese di istruttoria e di incasso rata, e non si chiede cosa succede se a dicembre salta una rata.
- **Servizio:** il foglio informativo standard sul credito ai consumatori (**SECCI**, "Informazioni europee di base sul credito ai consumatori"), ricreato in modo realistico con valori di esempio.
- **Cosa fa:** prende i dati dell'offerta (importo, numero rate, TAN, spese) e **ricalcola tutto**: rata reale, totale da pagare, costo del credito, **TAEG ricalcolato dai flussi**, e confronta i valori con quelli dichiarati. Mostra una timeline mese per mese della rata dentro il budget che Gennaro inserisce (entrate, spese fisse) e simula "cosa succede se salto una rata" con gli interessi di mora indicati nel foglio. Ogni termine ha una spiegazione in parole semplici. Chiude con un mini quiz.
- **Esempio di effetto "wow" (numeri di esempio da ricontrollare nel prototipo):** 600 € in 10 rate da 60 € con TAN 0%, ma con 30 € di istruttoria e 1,50 € di incasso per rata: totale 645 €, **TAEG circa 18%**. "Tasso zero" non vuol dire "costo zero".
- **Capability software:** motore di calcolo finanziario (piano di ammortamento, TAEG calcolato come tasso interno sui flussi), simulatore del budget nel tempo, controllo di coerenza tra valori dichiarati e valori ricalcolati, quiz prima/dopo.
- **Demo prima/dopo:** *Prima*: il volantino "10 rate da 60 €" e Gennaro che pensa "pago 600 €". *Dopo*: slider e timeline, "pagherai 645 €, ecco dove sono i 45 € in più", e il mese in cui la rata pesa di più sul budget. Quiz: da 0/3 a 3/3.
- **MVP in 3 ore:** form SECCI precompilato e modificabile, motore di calcolo con test, timeline del budget, scenario "rata saltata", glossario di 8 termini, quiz di 3 domande.
- **LLM a runtime:** **non necessario** (tutto deterministico). Opzionale per "spiegamelo con parole mie". **Fallback:** glossario scritto e rivisto.
- **Rischi:** **confine con la consulenza**. La soluzione non deve mai dire "conviene / non conviene / scegli X" né confrontare offerte classificandole: mostra solo numeri e significati di **una** offerta. Il guardrail diventa parte della "Risk & Clarity Note". La correttezza delle formule va testata (un errore di calcolo in demo sarebbe fatale).

---

## Tema 03 — Educazione Digitale Inclusiva

### 3A — "Palestra Digitale": imparare a comprare il biglietto del treno da sola

- **Persona:** **Teresa, 77 anni**, ex sarta, vedova, vive a Salerno. Una volta al mese va a Roma dalla figlia. Gli sportelli in stazione hanno orari ridotti e la coda è lunga. Il nipote le ha installato l'app ma lei **si blocca sempre negli stessi punti**: la scelta della tariffa (non capisce la differenza tra le tre opzioni), il tasto "Continua" fuori dallo schermo e il pagamento. Ha paura di "sbagliare e pagare due volte" e alla fine chiama il nipote, che compra il biglietto per lei. Non ha mai imparato.
- **Servizio:** replica realistica e **senza marchi** ("TrenoFacile") del flusso di acquisto di un'app ferroviaria: tratta, data e ora, scelta del treno, tariffa, passeggero, pagamento simulato, biglietto.
- **Cosa fa:** è una **palestra sicura** dove Teresa si allena sul flusso vero senza rischiare soldi. Un **coach osserva cosa fa** (tocchi sui punti sbagliati, inattività, avanti e indietro, errori di compilazione), **capisce dove si blocca** e interviene con aiuti graduati: livello 1 *evidenzia* il punto, livello 2 *spiega* in parole semplici e dice perché, livello 3 *mostra* ("fallo con me"). A ogni nuovo tentativo **gli aiuti diminuiscono** sui passi che Teresa ha imparato e restano su quelli dove sbaglia ancora. Alla fine c'è una **"prova da sola"** senza aiuti, con un cruscotto che misura completamento, errori, aiuti usati e tempo.
- **Capability agentica:** tutte e cinque quelle citate nel tema: **rilevamento del blocco**, **feedback mirato sull'errore**, **adattamento dinamico** del livello di aiuto, **percorso personalizzato** (fading per singolo passo), **valutazione** della capacità (prova senza aiuti).
- **Demo prima/dopo:** *Prima*: Teresa (interpretata da un membro del team) sul flusso senza coach si ferma alla tariffa, il timer corre e lei abbandona. *Dopo*: 2 tentativi con il coach e poi la prova da sola, completata. Il cruscotto mostra la curva: **tentativo 1: 6 errori, 5 aiuti, 4'30" → prova finale: 0 aiuti, 1'40"**.
- **MVP in 3 ore:** 5–6 schermate del flusso, tracciamento eventi, motore di aiuti a regole (soglie per passo, 3 livelli), modalità Allenamento e Prova, cruscotto con le metriche di ogni tentativo. Backup: **replay** di sessioni registrate per una demo sicura.
- **LLM a runtime:** **non necessario**. Opzionale per adattare il testo dell'aiuto a ciò che Teresa ha appena fatto. **Fallback:** aiuti scritti per ogni passo e livello (circa 15 testi), preparati con Claude Code e rivisti da noi.
- **Rischi:** è una replica, non l'app vera: va dichiarato che l'apprendimento va poi "trasferito" sull'app reale. Le metriche in demo vengono da una persona che interpreta Teresa: va detto con onestà, proponendo un test con utenti reali dopo l'hackathon. Proprietà intellettuale: niente marchi, loghi o nomi commerciali delle tariffe reali. Tema non sensibile (nessuna sanità, fisco o legale), con pagamento solo simulato.

### 3B — "Sicurezza in Parole Mie": capire il corso obbligatorio sulla sicurezza in italiano A2

- **Persona:** **Oksana, 45 anni**, ucraina, in Italia da 2 anni, ex contabile, livello di italiano **A2**. Sta facendo una **riqualificazione come addetta di magazzino**. Prima di iniziare deve seguire la formazione generale sulla sicurezza (D.Lgs. 81/08) su una piattaforma e-learning: testi densi, termini come "DPI", "preposto", "RSPP", "near miss". Passa da un traduttore all'altro, perde il senso delle frasi lunghe e al test finale sbaglia le domande più importanti.
- **Servizio:** 3–4 moduli realistici di un corso e-learning di formazione generale sulla sicurezza.
- **Cosa fa:** lettore adattivo. Ogni blocco di testo è disponibile in 2 livelli (B1 originale e A2 semplificato) con **glossario bilingue** sui termini chiave. Dopo ogni blocco fa 1–2 domande di comprensione. Se Oksana sbaglia, cambia strategia: livello più semplice, esempio concreto di magazzino, termine nella sua lingua. Tiene traccia dei termini imparati e li ripropone.
- **Capability agentica:** valutazione della comprensione, percorso adattivo, ripetizione mirata dei termini non ancora acquisiti.
- **Demo prima/dopo:** *Prima*: Oksana legge il testo originale e risponde 2/5. *Dopo*: dopo il percorso adattivo risponde 5/5 e spiega con parole sue cosa sono i DPI.
- **MVP in 3 ore:** 3 blocchi di testo × 2 livelli, glossario di 10 termini, 6 domande, regole di adattamento, tracciamento dei termini.
- **LLM a runtime:** utile per riscrivere dinamicamente qualsiasi testo. **Fallback:** livelli e glossario preparati in fase di build e rivisti.
- **Rischi:** molto vicino a "pura traduzione" e "generatore di lezioni" (lista "cosa evitare"). La **revisione umana delle traduzioni** in ucraino non è garantita dal team. La sicurezza sul lavoro è un ambito normativo: deve essere chiaro che lo strumento aiuta a capire e **non sostituisce la formazione obbligatoria né ha valore legale**. Il prima/dopo è meno visibile sul palco.

---

## Matrice di valutazione

### Criteri proxy (in attesa dei criteri ufficiali)

| Cod. | Criterio | Da dove viene |
|---|---|---|
| a | Aderenza a obiettivo, focus e vincoli del tema | vincoli specifici di ogni tema |
| b | Distanza dalla lista "cosa evitare" | sezione "Cosa evitare" |
| c | Impatto concreto su una persona specifica | vincoli su persona/profilo |
| d | Forza della demo prima/dopo e del momento "wow" | deliverable "prima/dopo" presenti in tutti i temi |
| e | Fattibilità in 3 ore con 2 persone + Claude Code | formato dell'hackathon |
| f | Capability software/agentica concreta e spiegabile | vincoli "capability concreta" e "AI spiegabile" |

Scala 1–5 (5 = ottimo). **Pesi uguali** (totale massimo 30). Per la regola interna "la fattibilità pesa quanto l'originalità", (e) ha lo stesso peso di (d). Non usiamo un criterio "originalità" separato: è coperto in parte da (b) e (d).

### Punteggi

| Idea | a | b | c | d | e | f | **Totale** |
|---|---|---|---|---|---|---|---|
| 1A Modulo Amico | 5 | 4 | 5 | 4 | 4 | 4 | **26** |
| 1B Slot Parlante | 5 | 5 | 5 | 5 | 3 | 4 | **27** |
| 2A Conto in Chiaro | 5 | 4 | 4 | 4 | 4 | 4 | **25** |
| 2B Rata Vera | 5 | 4 | 5 | 5 | 4 | 4 | **27** |
| 3A Palestra Digitale | 5 | 5 | 5 | 5 | 4 | 5 | **29** |
| 3B Sicurezza in Parole Mie | 4 | 3 | 4 | 3 | 4 | 4 | **22** |

### Motivazioni sintetiche

- **1A Modulo Amico (26):** aderenza piena (è quasi l'esempio "un campo alla volta"), persona forte. Perde su (b) e (d) perché è l'idea più prevedibile del tema e il prima/dopo è meno spettacolare.
- **1B Slot Parlante (27):** il momento "pulsante, pulsante, pulsante" è la demo più emotiva di tutte (d = 5) e la barriera è reale e precisa. Perde su (e): estrazione robusta, sintesi vocale e audio in sala sono rischi concreti in 3 ore. Su (f) resta a 4 perché in modo onesto funziona solo sulla replica.
- **2A Conto in Chiaro (25):** scenario citato esplicitamente dal vincolo 1 del tema. Il calcolo c'è ma il "wow" è moderato (pochi euro di costi) e c'è il rischio di scivolare nel consiglio ("cambia conto") o nella riscrittura.
- **2B Rata Vera (27):** "tasso zero ma TAEG circa 18%" è un momento wow comprensibile da tutti, e il motore di calcolo è una capability vera, testabile e non dipendente dall'LLM. (b) = 4 per il confine con la consulenza: gestibile ma va presidiato.
- **3A Palestra Digitale (29):** è l'unica idea che porta in demo **tutte** le capability agentiche richieste dal tema. Il miglioramento è **misurato dal sistema stesso** (cruscotto tentativo 1 → prova finale), non solo raccontato. Non serve un LLM a runtime, il tema non è sensibile e la persona è molto riconoscibile. (e) = 4 e non 5 perché servono 5–6 schermate più il motore di aiuti più il cruscotto: denso ma realistico con Claude Code.
- **3B Sicurezza in Parole Mie (22):** utile e concreto, ma troppo vicino a "traduzione/riscrittura" (b = 3), demo poco visiva (d = 3) e la revisione delle traduzioni non è garantita.

### Sensibilità del ranking

- Se i criteri ufficiali premiano molto **innovazione o impatto emotivo**, 1B sale (d e c al massimo) e può pareggiare 3A.
- Se premiano **correttezza tecnica e testabilità**, 2B si avvicina a 3A (il motore di calcolo è il più facile da verificare con test automatici).
- Se viene **vietato preparare contenuti prima** dell'hackathon, scendono 1A, 2A e 3B. 3A e 2B restano solidi (pochi contenuti, molta logica).
- Se le **API LLM non sono consentite** a runtime, nessuna delle prime tre (3A, 2B, 1B con fallback) cambia punteggio. 3B perde 1 punto su (e).

> **Da rifare:** quando arriveranno regolamento e criteri ufficiali, sostituire i criteri a–f con quelli ufficiali (e i loro pesi) e ricalcolare la tabella.
