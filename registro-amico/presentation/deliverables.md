# Deliverable · Tema 03 Educazione Digitale Inclusiva

## 01 · Learner Profile Statement

**Chi:** Fatima, 38 anni. Madrelingua araba, italiano livello A2: capisce frasi brevi e quotidiane, non il linguaggio amministrativo della scuola. Il figlio Youssef frequenta la prima media (classe 1ª B). Profilo del tema: persona con difficoltà linguistiche, nuova utente di un processo digitale essenziale.

**Lo scenario di apprendimento:** il registro elettronico della scuola. La scuola chiede alle famiglie di fare online quattro cose:

1. **giustificare un'assenza** (Assenze → scegliere l'assenza → «Giustifica» → motivo → conferma);
2. **prenotare un colloquio** con un insegnante (Colloqui → docente → orario libero → conferma);
3. **leggere una comunicazione** e mettere la **presa visione** (Bacheca → aprire → «Presa visione»);
4. **trovare un voto** (Voti → materia → leggere il voto del giorno giusto).

**La difficoltà, nel momento esatto:**

- **Le parole.** «Giustifica», «Da giustificare», «Uscita anticipata», «Presa visione richiesta», «Completo», «Scrutinio»: nessuna è spiegata, e il registro è solo in italiano.
- **La paura di sbagliare.** Sul registro vero ogni clic arriva alla scuola: una giustificazione con il motivo sbagliato è già inviata. Non c'è un posto per provare.
- **La dipendenza.** Oggi Fatima chiede a Youssef di tradurre, oppure rimanda. La volta dopo è di nuovo da capo: non impara a farlo da sola.

**Perché è rilevante:** la persona deve imparare a usare uno strumento digitale essenziale, per un processo concreto e ricorrente, partendo da uno svantaggio linguistico.

## 02 · Adaptive Evidence

**La capacità agentica:** un percorso adattivo con rilevamento del blocco e feedback mirato sugli errori. Le regole sono codice deterministico e testato (`app/public/lib/coach.js`), non decisioni del modello AI.

**Come cambia la soluzione in base al livello.** Stesso compito, stesso passo (premere «Giustifica»), testi reali mostrati dalla demo in arabo:

| Livello | Cosa vede Fatima | Quando cambia |
|---|---|---|
| **1 · Guidato** | L'istruzione del passo («الخطوة 3 من 5 · يُرجى الضغط على «Giustifica».») e un riquadro viola con «هنا» sul pulsante. Se sbaglia, un feedback sull'errore: «هذا «Ritardo»، أي تأخّر … المطلوب هو «Assenza» بتاريخ 01/10/2026.» | Compito completato → livello 2 |
| **2 · Suggerimento** | Nessuna istruzione, solo «عند التوقّف، أساعدك.». Se resta ferma **10 secondi** o sbaglia **2 volte** sullo stesso passo compare **un** suggerimento, che parte dal suo ultimo errore se c'è. Al secondo suggerimento compare anche il riquadro viola. | Completato con al massimo 1 errore → livello 3 |
| **3 · In autonomia** | Nessun aiuto: «محاولة بدون مساعدة. بالتوفيق!». Se un'azione viene bloccata, solo «هذا لا يُكمل التمرين. لم يُرسَل أيّ شيء.». Alla fine: «لقد نجحت بدون مساعدة!». | 3 errori o più, oppure non finito («Chiedo aiuto») → torna al livello 2 |

**Altri adattamenti:**

- **Lingua dell'aiuto:** arabo (da destra a sinistra), inglese o italiano semplice, da cambiare in qualsiasi momento. Il registro resta in italiano e l'aiuto cita le sue parole tra «» in italiano: Fatima impara a riconoscerle sul registro vero.
- **Feedback mirato:** ogni errore tipico ha la sua spiegazione (ritardo invece di assenza, assenza già giustificata, motivo sbagliato, orario «Completo», docente di un'altra materia, comunicazione sbagliata, voto di un altro giorno).
- **Glossario:** 26 parole della scuola. Si tocca la parola sottolineata nel registro e si legge la spiegazione in italiano semplice, arabo e inglese.
- **«Spiegami questa comunicazione»:** spiegazione semplice di un avviso della bacheca nella lingua scelta. Il testo originale resta sopra. Con la chiave AI la scrive Claude, e il server la scarta se contiene una data, un orario o un numero che non sono nell'originale. Senza chiave, si usa la spiegazione già pronta, che passa dagli stessi controlli.

**Come si verifica:** `app/test/coach.test.mjs` (14 test con orologio finto: regole di livello, blocco dopo 10 s, blocco dopo 2 errori, secondo suggerimento con evidenziazione, livello 3 senza aiuto, ritorno al livello 2) e `app/test/tasks.test.mjs` (13 test sui passi e sui feedback).

## 03 · Learning Outcome Note

**Cosa sa fare Fatima alla fine che prima non sapeva fare:**

- completare da sola le quattro azioni sul registro: giustificare un'assenza, prenotare un colloquio, mettere la presa visione, trovare un voto;
- riconoscere le parole della scuola che bloccavano (presa visione, giustificazione, colloquio, uscita anticipata, bacheca);
- capire una comunicazione della scuola, con il testo originale sotto gli occhi.

**Come viene verificato dall'app** (pagina «I tuoi progressi»):

| Criterio del tema | Cosa misura l'app |
|---|---|
| Completamento del task | Esito di ogni tentativo: completato o non completato |
| Riduzione degli errori | Errori per tentativo, e la frase «Errori: N al primo tentativo, M all'ultimo» |
| Capacità di ripetere un'azione | Lo stesso compito ripetuto con meno aiuto; la frase «Ce l'hai fatta senza aiuto» quando lo completa al livello 3 |
| Comprensione | Verifica delle parole: 5 domande a scelta multipla prima e dopo gli esercizi, stesse domande, punteggio a confronto |

Per ogni tentativo l'app registra **tempo, click sbagliati, suggerimenti mostrati e livello**. I dati restano sul dispositivo (localStorage).

**Esempio di cosa registra** (scenario simulato nel test automatico «scenario della presentazione», `app/test/coach.test.mjs`, con orologio finto; **non è una misura su persone**):

| Tentativo | Livello | Tempo | Errori | Suggerimenti | Esito |
|---|---|---|---|---|---|
| 1 | 1 · Guidato | 38 s | 2 | guida completa | Completato |
| 2 | 2 · Suggerimento | 28 s | 0 | 1 | Completato |
| 3 | 3 · In autonomia | 14 s | 0 | 0 | Completato · «Ce l'hai fatta senza aiuto» |

**Cosa non è ancora verificato:** finora i percorsi sono stati provati solo in automatico (test e prova scriptata nel browser). I numeri veri vanno raccolti con genitori reali, anche per tarare le soglie (10 secondi, 2 errori, 3 errori), che oggi sono ipotesi.

**Cosa è stato semplificato senza alterarne il senso:**

- il registro non viene riscritto: resta in italiano, con le stesse parole di un registro vero;
- l'aiuto spiega le parole e indica l'azione, non decide al posto della persona;
- le spiegazioni delle comunicazioni non possono cambiare date, orari, importi o numeri (controllo automatico) e l'originale resta sempre visibile;
- nessun consiglio legale, sanitario o amministrativo.

## Dove ha contribuito l'AI e dove la revisione umana

| Area | AI | Revisione umana |
|---|---|---|
| Idea e verifica di mercato | Ricerche web (5 ottobre 2026) e confronto con i prodotti esistenti | Scelta dell'idea, della persona e dei 4 compiti da parte del team |
| Specifica | Scritta dalla sessione principale di Claude Code | Approvata dal team |
| Codice e test | Scritti da un subagente di Claude Code; 64 test `node:test`, prova scriptata nel browser | Lettura del codice e prova nel browser della sessione principale |
| Testi in arabo | Bozza in arabo standard moderno, con forme neutre per madri e padri | **Da far rivedere a una persona madrelingua prima di qualsiasi uso reale** |
| Testi in inglese e italiano semplice | Scritti con la skill `istruzioni-multilingue-semplici` | Rilettura pensando a un livello A2 |
| Glossario (26 parole) | Spiegazioni in 3 lingue | Verifica di mediatori culturali e del personale della scuola |
| Regole di livello e soglie | Implementate e testate come da specifica | Da tarare con genitori veri |
| Spiegazioni AI a runtime | Claude spiega la comunicazione | Il validatore scarta date e numeri diversi dall'originale; da provare con una chiave vera |

Il dettaglio è in [agents/workflow.md](../agents/workflow.md).
