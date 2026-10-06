# Verdetto QA pre-rilascio: "Fortuna in Chiaro" (Tema 02)

> **Verdetto corrente (Riesame finale 14:41, commit `ae31895`): PASS con riserva. Condizioni per il push: QA-002 (remote e URL pubblico), conferma umana di consegna, QA-019 (README §9).** Vedi la sezione 6 "Riesame finale 14:41" in fondo. Le sezioni 1-5 restano come registro delle review delle 14:15 e delle 14:20.

| Campo | Valore |
|---|---|
| Data e ora review | 2026-10-05, 14:10-14:15 |
| Versione revisionata | commit `3be27c3` (14:09) + working tree: `README.md` non tracciato, `agents/` modificata e non committata |
| Riferimenti | `docs/qa/checklist-conformita.md` v2; `00_input/regolamento.md`; `00_input/temi-sfida.md` (Tema 02) |
| Freeze | 15:30 (deroga registrata in `docs/governance/stato-avanzamento.md` r.5 e r.19) |
| Fuori ambito in questo giro | durata della presentazione, 5 minuti (R-10, V-03): da rivalutare a presentazione completa |
| Reviewer | Team QA |

## Verdetto: **FAIL**

Il prodotto è solido: app funzionante, 41/41 test verdi, vincoli T2-V1, V2, V3, E4 rispettati, guardrail L4 verificato. Il rilascio però oggi non è possibile. Ci sono 4 rilievi bloccanti, tutti di consegna o documentazione, che si chiudono in circa 30 minuti: README non tracciato e con contenuti errati, nessun remote GitHub, `agents/` non committata, DEF-001 ancora "Fail/Aperto" nei documenti. Quando i rilievi da QA-001 a QA-004 sono chiusi, QA può emettere **PASS con riserva**: la riserva riguarda R-10, la durata della presentazione.

---

## 1. Verifiche eseguite (evidenze)

| Verifica | Esito | Evidenza |
|---|---|---|
| Test automatici `powershell -NoProfile -ExecutionPolicy Bypass -File app/tests/run-tests.ps1` | **41 passati, 0 falliti, exit 0** | Output della run delle 14:11. La scansione statica T2-V3 passa su 5 file (index.html, src/*.js, data/*.js) |
| App si apre da `app/index.html` | Sì | Edge headless `--dump-dom` su `file:///.../app/index.html`: DOM renderizzato, titolo "Quanto ti costa sperare?" e numero verde 800 55 88 22 presenti. Gli script referenziati (`data/giochi.js`, `data/quiz.js`, `src/motore.js`, `src/ui.js`, `style.css`) esistono tutti |
| Hook `guardrail-t2.ps1`: prova indipendente QA | Funziona | Write su `app/src/ui.js` "Ti Consiglio..." → exit 2. MultiEdit "ti conviene" → exit 2. Write `app/index.html` "dovresti smettere" → exit 2. Testo neutro "In media si perde il 28%" → exit 0. Registrato in `.claude/settings.json` come PreToolUse `Write\|Edit\|MultiEdit` |
| Scansione statica in `run-tests.ps1` | Funziona | La stessa logica `Select-String` su un file di prova (scratchpad) con "NON CONVIENE" rileva la formula: il controllo non distingue maiuscole e minuscole. La scansione viene eseguita anche dall'hook PostToolUse `post-edit-tests.ps1` |
| Grep QA allargata su `app/` (devi, meglio, evita, consigl*, suggeri*, dovresti, smettere, riduci, investi*, risparmia) | Nessuna occorrenza | Testi applicativi neutri. CR1 "Vuoi parlarne con qualcuno?" (`ui.js` r.377-396) è informativo e attivato da una soglia scelta dall'utente; nessun invio automatico |
| Segreti (working tree + tutta la history git) | Nessuno | Grep `sk-ant-`, `ghp_`, `AKIA`, `password=`, `Bearer`: solo il pattern di controllo dentro `guard.ps1` |
| `00_input/`, `kb/` | Non tracciati | `git ls-files` non contiene nessun file di queste cartelle, né ora né nella history. `.gitignore` li esclude (`kb/` oggi è vuota) |
| File di prova o di debug in `app/` | Nessuno | Nessun `console.log`, `debugger`, TODO o FIXME. `app/tests/` contiene solo la suite |
| `agents/` contro `.claude/` | Allineata **solo nel working tree** | Alle 14:10 mancavano `agents/hooks/guardrail-t2.ps1` e c'erano differenze in `settings.json`, `CLAUDE.md` e `agents/governance.md`. Alle 14:11 il contenuto è allineato (sync eseguito da altri), ma `git status` mostra ` M agents/CLAUDE.md`, ` M agents/agents/governance.md`, ` M agents/settings.json`, `?? agents/hooks/guardrail-t2.ps1`: **non committato** |
| `README.md` alla radice | Presente su disco, **non tracciato** (`?? README.md`) | Vedi QA-001 |
| Remote GitHub | **Assente** | `git remote -v` non restituisce nulla |

## 2. Esito checklist punto per punto

Legenda: Sì = conforme · No = non conforme · Rif. = con riserva · N.V. = non verificabile dal repository · Fuori giro = escluso su richiesta.

| ID | Esito | Nota |
|---|---|---|
| C-01 Un solo tema | Sì | Tema 02 in idea, BR, README e presentazione |
| C-02 Tema dichiarato uguale ovunque | Sì | |
| C-03 Problema specifico | Sì | Salvatore, 10 €/giorno, non converte "1 su 12.480.000" in conseguenze |
| C-04 / R-07 Prototipo end-to-end | Sì | Smoke test headless + 41 test + UAT end-to-end (`test-report.md`) |
| C-05 Demo pronta | Sì | `?demo=1` con seme fisso; video di riserva dichiarato nella slide 05 (da verificare che esista) |
| C-06 Team da 2 | N.V. | Da confermare a cura di governance |
| C-07 Logica sviluppata nelle 3 ore | Sì | Commit della giornata a partire dalla scelta dell'idea (12:45) |
| C-08 / R-08 Claude Code | Sì | `.claude/` (agenti, hook, skill), `CLAUDE.md` |
| C-09 / R-09 3 deliverable con il nome del tema, dentro la presentazione | Sì | `presentation/index.html` r.261 (D1), r.395 (D2), r.430 (D3) |
| T2-F1 Educazione, non consulenza | Sì | |
| T2-V1 Scenario educativo preciso | Rif. | Dichiarati due scenari, "simulazione di una scelta quotidiana" e "comprensione di costi" (`idea-selezionata.md` r.11); BR-05 ne cita un terzo. Vedi QA-011 |
| T2-V2 Miglioramento dimostrato | Sì | Quiz prima/dopo 1/3 → 3/3 + domanda di trasferimento. Test automatico `verificaQuiz e confrontaQuiz`, cruscotto (TC-13), slide D2 |
| T2-V3 Nessun consiglio | Sì | Hook PreToolUse + scansione statica + grep QA allargata. Chiusura neutra "La scelta è tua." |
| T2-V4 Capability software | Sì | Motore: valore atteso, simulazione con PRNG a seme, simulazione di 10.000 persone, combinatoria del Lotto |
| T2-D1 User Difficulty Statement | Sì | Slide 02 + 03 (difficoltà, processo, rilevanza) |
| T2-D2 Before / After Simplicity Evidence | Sì | Slide 07 prima/dopo affiancati |
| T2-D3 Risk & Clarity Note | Rif. | "Semplificato" e "Non alterato" ci sono; "come è stata evitata l'ambiguità" è solo implicito. Vedi QA-012 |
| T2-E1 Non chatbot generico | Sì | Flusso guidato a 7 schermate |
| T2-E2 Non pura riscrittura | Sì | |
| T2-E3 Nessun consiglio finanziario | Sì | Come T2-V3 |
| T2-E4 Significato invariato | Sì | Test: probabilità calcolate = tabella ufficiale; payout = dichiarati; tetto 75%; 3.650 € × 28,79% = 1.050,83 € coerente con il "≈ 1.051 €" della slide; biglietto da 2 € del quiz dichiarato "inventato" |
| T2-E5 Processo reale | Sì | Spesa quotidiana su tabelle ADM reali |
| R-01 Repo GitHub pubblico | **No** | Nessun remote. QA-002 |
| R-02 Struttura minima | **No** (ora) | `README.md` non tracciato. QA-001 |
| R-03 `app/` codice del prototipo | Sì | |
| R-04 `agents/` completa (agenti, istruzioni, prompt, skill, workflow) | Rif. | Contenuto allineato ma non committato (QA-003); workflow solo come sezione "Flusso" di `CLAUDE.md` (QA-007) |
| R-05 Presentazione HTML in brand Accenture con soluzione + struttura agentica | Sì (esistenza) | Slide 09 "struttura agentica di sviluppo". Il controllo brand completo si fa nel giro finale |
| R-06 README adeguato | **No** | QA-001 |
| R-10 5 minuti | Fuori giro | |
| R-11 Push entro le 15:30 | Da verificare | Prerequisito: QA-002 |
| R-12 Caricamento sul portale | N.V. | Azione di governance fuori dal repository |
| H-01 / H-02 `00_input/`, `kb/` fuori dal repo | Sì | |
| H-03 Nessun segreto | Sì | Anche nella history |
| H-04 `agents/` allineata e consegnata | **No** (ora) | QA-003 |
| H-05 `.gitignore` | Sì | |
| V-10 README mappa i criteri alle evidenze | No | Incluso in QA-001 |
| V-11 Nomi chiari | Sì | |
| V-12 Nessun file inutile | Sì | |

## 3. Rilievi

### Bloccanti (da chiudere prima del push)

| ID | Regola violata | Rilievo | Azione | Owner |
|---|---|---|---|---|
| QA-001 | R-02, R-06 (Bloccante); V-10, V-11 | `README.md` **non è tracciato** da git (`?? README.md`). Inoltre orienta male chi valuta, persona o agente. (a) La struttura di `app/` cita file inesistenti: `src/quiz.js`, `src/data/giochi.json`, `src/simulatore.js`, `tests/test-data.js`; quelli reali sono `data/giochi.js`, `data/quiz.js`, `tests/motore.test.js`, `tests/testi.test.js`. Anche la FAQ "Dove stanno i dati" indica `app/src/data/giochi.json`. (b) La struttura di `agents/` elenca cartelle `governance/`, `innovazione/` ecc. che non esistono; quelle reali sono `agents/agents/*.md`, `hooks/`, `skills/`, `settings.json`, `CLAUDE.md`, `sync.ps1`. (c) Cita in `docs/` file inesistenti: `piano-progetto.md`, `deliverable-register.md`, `release-log.md`, `BR-01..BR-17.md`, `analisi-tecnica.md`, `test-accettazione.md`, `verdetto-*.md`; mancano invece quelli reali (`business-requirements.md`, `piano-test.md`, `test-report.md`, `problem-statement.md`, `numeri-business-case.md`, `verdetto-qa.md`). (d) Afferma ".claude/ [Locale, non in git]", ma `.claude/` è tracciata. Descrive `.gitignore` con voci (`node_modules/`, `.claude/`, `venduto/`, `*.pyc`) che non ci sono. Dice che `CLAUDE.md` è "questo file". Scrive "6 schermate" invece di 7. (e) Nella sezione conformità dà per fatti, con il segno di spunta, "Verdetto QA PASS" e "Repository pubblico", che oggi sono falsi: sono affermazioni non supportate. (f) La FAQ sull'hook elenca formule ("meglio", "non conviene", "prova a smettere") che non sono nella lista reale. (g) Manca la mappa criterio di valutazione → file di evidenza (V-01…V-09). | Riscrivere le sezioni struttura e FAQ sui file reali (`git ls-files`). Togliere le spunte non vere o trasformarle in stato verificabile. Aggiungere una tabella criterio → percorso di evidenza (per esempio V-08 → `.claude/hooks/`, `docs/qa/evidenze-hook-t2.md`; V-07 → `docs/governance/stato-avanzamento.md`). Poi `git add README.md` | governance |
| QA-002 | R-01, R-11 (Bloccante) | Il repository locale **non ha remote** (`git remote -v` vuoto): oggi il push su GitHub pubblico non è possibile | Creare il repository GitHub **pubblico**, `git remote add origin ...`, fare una prova di push subito (non alle 15:25), verificare la visibilità pubblica da una sessione non autenticata | governance (con l'utente per le credenziali) |
| QA-003 | H-04, R-04 (Bloccante) | `agents/` è allineata a `.claude/` solo nel working tree. Le modifiche (`agents/hooks/guardrail-t2.ps1` nuovo, `settings.json`, `CLAUDE.md`, `agents/governance.md`) **non sono committate**. Nel commit `3be27c3` `agents/` non contiene l'hook L4 che la presentazione e il README dichiarano | Rieseguire `agents/sync.ps1` **subito prima** del commit finale (dopo eventuali ultime modifiche a `.claude/` o `CLAUDE.md`) e committare `agents/`. QA non sincronizza | governance |
| QA-004 | Requisito QA "BR Must coperti e testati"; BR-11 (Must) | **DEF-001 è risolto tecnicamente**: hook `guardrail-t2.ps1` attivo e verificato da QA (exit 2 su Write, Edit e MultiEdit con formule vietate, exit 0 su testo neutro), evidenze in `docs/qa/evidenze-hook-t2.md`, scansione statica in `run-tests.ps1` che gira anche via PostToolUse. I deliverable però dicono il contrario: `test-report.md` riporta **TC-22 Fail**, "38 test", "23/24"; `defect-log.md` riporta DEF-001 **Aperto** e descrive solo `guard.ps1`. Chi valuta legge un Must non superato | **business**: rieseguire TC-22 (hook + `run-tests.ps1`), aggiornare il test-report (TC-22 Pass con evidenze, 41 test, 24/24, nuovo "Impatto sul verdetto Must"). **sviluppo**: aggiornare DEF-001 in `defect-log.md` a "Risolto", indicando `guardrail-t2.ps1`, la registrazione in `settings.json` e la scansione in `run-tests.ps1` | business (TC-22, test-report), sviluppo (stato in defect-log) |

### Non bloccanti

| ID | Gravità | Riferimento | Rilievo | Azione | Owner |
|---|---|---|---|---|---|
| QA-005 | Maggiore | Requisito QA tracciabilità BR → test → codice | `app/tracciabilita.md`: manca la colonna BR → TC. Riga 3 dice "27/27 verdi" (oggi 41). BR-11 non cita hook e scansione L4. BR-17 risulta "Parziale, in attesa del go/no-go delle 14:05", mentre il test-report (TC-24) dice "go raggiunto". BR-13 ha una nota aperta "da confermare" (toast "HAI VINTO" contro analisi funzionale §5 "mai HAI VINTO") | Aggiungere la colonna TC (TC-01…TC-24), aggiornare i conteggi, BR-11 e BR-17. Chiudere la decisione su BR-13 con l'orchestratore e registrarla | sviluppo (tabella), business (decisione BR-13 e allineamento analisi funzionale) |
| QA-006 | Maggiore (diventa Bloccante al push) | CLAUDE.md "Verifica umana obbligatoria: scelta dell'idea e consegna"; V-07 | `stato-avanzamento.md`: il checkpoint delle 14:20 (go/no-go CR2) e la conferma di consegna (15:10) sono "In attesa". Il test-report dà CR2 come "go" senza una decisione registrata | Registrare il go/no-go CR2 e, alla fine, la conferma umana di consegna con ora e decisore. Allineare slide 06 e tracciabilità BR-17 | governance |
| QA-007 | Maggiore | R-04 ("agenti, istruzioni, comandi, prompt, skills, workflow") | In `agents/` il workflow esiste solo come sezione "Flusso" di `agents/CLAUDE.md`. Manca un punto d'ingresso che spieghi a chi valuta come si leggono `agents/` e i passaggi tra agenti (file in input e in output) | Aggiungere `agents/README.md` (o `agents/workflow.md`) alla radice di `agents/`, che `sync.ps1` non cancella: flusso, chi passa cosa a chi, hook e skill usati | governance |
| QA-008 | Maggiore | V-03 efficacia della demo; DEF-002 | DEF-002 ("Script error." in headless con `?pausa=1`) è ancora aperto e non riconfermato in un browser reale | Prova manuale in Edge non headless con DevTools: `app/index.html?demo=1&pausa=1`, percorso completo. Aggiornare DEF-002 (chiuso o confermato) | business (prova), sviluppo (eventuale fix e stato) |
| QA-009 | Minore | Qualità dei test | `testi.test.js`: due test (index.html, src/ui.js) risultano "ok" anche se dichiarano "verifica NON eseguita". Contano tra i 41 passati senza verificare nulla | Segnarli come "skip" (non nel totale dei passati) o rimuoverli, visto che la copertura è nella scansione statica di `run-tests.ps1` | sviluppo |
| QA-010 | Minore | T2-V3, manutenibilità | La lista delle formule vietate è duplicata in 3 punti (hook, `run-tests.ps1`, `testi.test.js`), con rischio di disallineamento. La lista è stretta e non copre per esempio "ti suggerisco", "meglio se", "evita di" | Lasciare com'è per il freeze (grep QA allargata pulita). Dichiarare il limite nella Risk & Clarity Note o nel README | sviluppo |
| QA-011 | Minore | T2-V1 ("uno scenario educativo preciso") | Gli scenari dichiarati sono più di uno: scelta quotidiana + costi (idea) e concetto di base (BR-05) | Dichiarare in README e presentazione uno scenario principale ("simulazione di una scelta quotidiana") e gli altri come supporto | innovazione |
| QA-012 | Minore | T2-D3 (c); qualità della presentazione | Slide D3: manca una voce esplicita "Come abbiamo evitato l'ambiguità" (etichette [UFF]/[DERIV]/[TERZI], valore atteso accanto alla simulazione, quiz inventato dichiarato). Slide 06 ancora "Opzionale · go/no-go 14:05". Due slide con commento "07" | Aggiungere la riga "Ambiguità evitata", aggiornare il badge di BR-17 dopo la decisione, rinumerare. Durata da verificare nel prossimo giro | innovazione |
| QA-013 | Minore | Coerenza tra ID | `business-requirements.md` usa "T2-E2" per Before/After e "T2-E3" per Risk & Clarity: nella checklist sono T2-D2 e T2-D3 (T2-E2 e T2-E3 sono "cosa evitare") | Correggere i riferimenti | business |
| QA-014 | Minore | Fonti QA; V-11 | `docs/governance/deliverable-register.md` non esiste, ma è citato dal README e indicato come fonte QA | Crearlo (anche minimo) oppure togliere i riferimenti | governance |
| QA-015 | Minore | Refuso | `stato-avanzamento.md` r.74 cita `data/giochi.json` (il file è `giochi.js`) | Correggere | governance |

## 4. Condizioni per il PASS

1. QA-001, QA-002, QA-003 e QA-004 chiusi e committati.
2. QA-006: conferma umana di consegna registrata.
3. Nuovo giro QA, breve, su: README, `git status` pulito, `git remote -v`, test-report e defect-log aggiornati, durata della presentazione (R-10).

Con queste condizioni il verdetto atteso è **PASS con riserva**; la riserva cade se in quel giro vengono chiusi anche QA-005, QA-007 e QA-008.

---

## 5. Riesame 14:20 (solo differenze)

| Campo | Valore |
|---|---|
| Data e ora | 2026-10-05, 14:20 |
| Versione revisionata | commit `c485ab5` (HEAD di `main`), `git status` pulito. Commit esaminati dopo la review delle 14:15: `e22b6ff`, `4a385b7`, `99454b4`, `c485ab5` (`git diff --stat 3be27c3 HEAD`: 12 file) |
| Ambito | Solo QA-001, QA-003, QA-004, la presentazione v4 (R-09, R-10) e i punti in attesa dell'utente. `app/` non è cambiata da `3be27c3` |
| Ripetizione dei test | `run-tests.ps1` → **41 passati, 0 falliti, exit 0** (14:20) |

### 5.1 Esito dei rilievi rivisti

| ID | Esito | Evidenza |
|---|---|---|
| QA-001 README (R-02, R-06, V-10) | **Chiuso, con un residuo minore (QA-016)** | `README.md` tracciato (`git ls-files`). Ho confrontato ogni percorso citato con `git ls-files`: `app/` (index.html, style.css, ARCHITETTURA.md, README.md, tracciabilita.md, data/giochi.js, data/quiz.js, src/motore.js, src/ui.js, tests/tests.html, motore.test.js, testi.test.js, run-tests.ps1), `agents/` (agents/*.md ×5, hooks ×3, skills/presentazioni-accenture/SKILL.md, reference.md, assets/template.html, settings.json, CLAUDE.md, sync.ps1, WORKFLOW.md), `docs/` (tutti i file elencati in idea, business, qa, governance), `.claude/`, `CLAUDE.md`, `.gitignore`: **esistono tutti**. La descrizione di `.gitignore` coincide con il file reale. Le spunte non supportate sono state tolte (§9 "Stato della consegna" è onesto). La mappa criterio → evidenza c'è (§6). **Unica eccezione**: `presentation/sezioni/` e `presentation/sezioni/business-case.html`, citati alle r.17 e r.49, **non esistono**: il file è stato cancellato nel commit `4a385b7`. Vedi QA-016 |
| QA-003 `agents/` (H-04, R-04) | **Chiuso** | Confronto per hash di tutti i file di `.claude/` con `agents/`: identici. L'unico file assente in `agents/` è `.claude/settings.local.json`, escluso a ragione (gitignored, locale). Ci sono solo in `agents/`, come previsto: `CLAUDE.md` (hash identico al `CLAUDE.md` di radice), `sync.ps1`, `WORKFLOW.md`. Tutto committato, `git status` pulito. **Nota**: se si modifica `.claude/` o `CLAUDE.md` prima del push, va rieseguito `agents/sync.ps1` |
| QA-007 workflow in `agents/` | **Chiuso** | `agents/WORKFLOW.md` presente e committato (`99454b4`), citato dal README §7 |
| QA-004 TC-22 / DEF-001 (BR-11 Must) | **Chiuso** | `test-report.md`: TC-22 (ritest) **Pass** con evidenze (hook exit 2/0, scansione statica, 41/0), esito complessivo **24/24**, "Impatto sul verdetto Must" aggiornato. `defect-log.md`: DEF-001 **"Chiuso (ritestato)"**. Residuo minore: QA-018 |
| QA-008 DEF-002 | **Aperto** (Maggiore, non bloccante) | `defect-log.md`: DEF-002 "Aperto", ritest solo parziale in headless. La prova in un browser reale non è stata fatta |
| QA-012 Risk & Clarity Note (T2-D3 c) | **Aperto** (Minore) | La slide 06 v4 ha 6 righe (Semplificato, Non alterato, Lotto, Quiz didattico, Nessun consiglio, Se serve aiuto). L'ambiguità evitata è coperta di fatto (fonte del Lotto dichiarata, quiz inventato dichiarato), ma non c'è una voce con quel titolo. Il badge "Opzionale 14:05" non c'è più |

### 5.2 Presentazione v4 (`presentation/index.html`)

| Controllo | Esito | Evidenza |
|---|---|---|
| Struttura | Sì | 9 `<section class="slide">` parlate (01-09) e un'appendice di 9 slide (divisore 10 + A1-A8), tutte con note "(non parlata)" |
| R-09 / C-09: i 3 deliverable del Tema 02 nella parte parlata | **Sì** | D1 "User Difficulty Statement · Deliverable 01" = slide 02 (r.268); D2 "Before/After Simplicity Evidence · Deliverable 02" = slide 05 (r.344); D3 "Risk & Clarity Note · Deliverable 03" = slide 06 (r.379). Tutte e tre stanno prima della chiusura (slide 09) |
| R-10 / V-03: 5 minuti, demo compresa | **Sì** | Note del relatore: 01 10" + 02 25" + 03 20" + 04 2'30" (150") + 05 20" + 06 15" + 07 35" + 08 15" + 09 10" = **300" = 5'00"**. Gli intervalli sono contigui (0:00→5:00) e coincidono con la scaletta di testa (r.15-25). I passi della demo (0:55-3:25) sono anch'essi contigui. Riserva minore: la nota della demo prevede, se BR-17 viene approvato, "Pausa e Conto" al posto del passo 4 **oppure** 10" prima della chiusura. La seconda opzione porterebbe il totale a 5'10": va usata solo la prima (QA-017) |
| R-05 struttura agentica | Sì | Slide 07 "Struttura agentica di sviluppo" (5 agenti, 2 verifiche umane, rules, skill, hook L4). Il commento duplicato "07" del giro precedente non c'è più |

### 5.3 Nuovi rilievi (non bloccanti)

| ID | Gravità | Riferimento | Rilievo | Azione | Owner |
|---|---|---|---|---|---|
| QA-016 | Minore | R-06, V-11 (README: percorsi verificabili) | Il `README.md` cita `presentation/sezioni/` (r.17) e `presentation/sezioni/business-case.html` (r.49), che non esistono più (cancellati in `4a385b7`). Inoltre r.27 attribuisce la "scansione statica dei testi" a `testi.test.js`, mentre la scansione che verifica davvero è in `run-tests.ps1` | Togliere i due riferimenti a `sezioni/`. Scrivere: "scansione statica in `run-tests.ps1`, controlli sui dati in `testi.test.js`". Lavoro di un minuto | governance |
| QA-017 | Minore | R-10 | Nota della slide 04: l'opzione "10" prima della chiusura" per BR-17 fa sforare i 5'00" | Se BR-17 è "go", tenere solo "al posto del passo 4" | innovazione |
| QA-018 | Minore | Coerenza interna | `test-report.md` r.7 ("Metodo di verifica") dice ancora "**38 test passati**", ma r.43 dice 41 | Allineare a 41 | business |
| QA-019 | Minore | R-06 (README onesto *alla consegna*) | README §9 descrive lo stato prima di questo riesame ("Ultimo verdetto QA: FAIL", remote assente, push non eseguito). Al push sarà superato | Subito prima del push finale aggiornare §9: verdetto QA corrente, URL del repository, conferma umana registrata | governance |

Restano aperti senza modifiche: QA-005 (tracciabilità BR → TC), QA-009, QA-010, QA-011, QA-013, QA-014 (`deliverable-register.md` non esiste; il README non lo cita più), QA-015. Sono tutti non bloccanti.

### 5.4 In attesa dell'utente (fuori dal controllo dei team)

| Punto | Regola | Stato | Cosa serve |
|---|---|---|---|
| QA-002 Remote e URL GitHub pubblico | R-01, R-11 | **In attesa dell'utente**: `git remote -v` è ancora vuoto | Creare il repository **pubblico**, `git remote add origin`, push di prova, verificare l'URL da una sessione non autenticata, poi riportarlo nel README §9 |
| Verifica umana di consegna (QA-006) | CLAUDE.md "Verifica umana obbligatoria"; V-07 | **In attesa dell'utente**: `stato-avanzamento.md` r.27-28 dice "In attesa" | Registrare ora, decisore e "go al push" |
| Go/no-go BR-17 "Pausa e Conto" (CR2) | CLAUDE.md (verifica umana sullo scope); QA-006 | **In attesa dell'utente**: `stato-avanzamento.md` r.26 e r.76 dicono "In attesa/Provvisoria" | Decidere e registrare. Se "go": BR-17 nella demo al posto del passo 4 (QA-017). Se "no-go": togliere flag e bottone, oppure dichiararli fuori scope; aggiornare TC-24 e la tracciabilità |

### 5.5 Verdetto del riesame 14:20: **PASS con riserva, condizionato ai soli punti in attesa dell'utente**

I bloccanti in carico ai team (QA-001, QA-003, QA-004) sono chiusi e committati in `c485ab5`. La presentazione rispetta R-09 e R-10 (5'00" esatti). I test sono verdi (41/0). Non ci sono violazioni del regolamento rimaste in carico ai team.

**Condizioni per il push**, nessuna eccezione:
1. QA-002: remote GitHub **pubblico** creato e URL verificato.
2. Go/no-go BR-17 registrato in `stato-avanzamento.md`.
3. Conferma umana di consegna registrata in `stato-avanzamento.md`.

**Riserve, consigliate prima del push (circa 5 minuti, non bloccanti)**: QA-016 (percorso inesistente `presentation/sezioni/` nel README), QA-019 (§9 del README aggiornato con verdetto e URL), QA-018, QA-017. Prima della demo dal vivo: QA-008, cioè la prova di DEF-002 in un browser reale.

Se dopo questo riesame si modifica `.claude/`, `CLAUDE.md`, `app/` o `presentation/`, bisogna rieseguire `agents/sync.ps1` e `run-tests.ps1`. Se le modifiche toccano qualcosa oltre README, stato-avanzamento e defect-log, serve un nuovo giro QA rapido.

## 6. Riesame finale 14:41 (solo differenze)

| Campo | Valore |
|---|---|
| Versione revisionata | commit `ae31895` ("UAT v3: TC-01/06/24 Pass (24/24), DEF-002 chiuso"), `git status` pulito |
| Decisioni dell'utente verificate | checkpoint 14:30 (`stato-avanzamento.md` r.23 e r.30): Lotto tolto; BR-17 attivo di default; nome "Fortuna in Chiaro"; stima ~150 mln € e biglietto didattico da 2 € mantenuti |
| Freeze | 15:30 (deroga; `CLAUDE.md` e `stato-avanzamento.md` r.5) |

### 6.1 Verifiche eseguite

| Verifica | Esito | Evidenza |
|---|---|---|
| Test automatici | **OK** | `run-tests.ps1` rieseguito da QA alle 14:4x: `RISULTATO: 40 passati, 0 falliti`, exit 0 |
| Lotto non più gioco selezionabile (app) | **OK** | `app/index.html` non contiene "Lotto". `motore.test.js` r.67 verifica "nessun Lotto" tra i giochi selezionabili. In app il Lotto resta solo come esempio nel concetto dei ritardatari (`ui.js` r.719, `motore.js` r.288, `giochi.js` r.73) e nella domanda del quiz sulla fallacia del giocatore (`quiz.js` r.36). È coerente con la decisione |
| Lotto (BR, tracciabilità, README) | **OK** | `business-requirements.md` r.44 (criterio "nessuna opzione Lotto"), `analisi-funzionale.md` r.25, `app/tracciabilita.md` r.5 e r.11, `app/README.md` r.13, `app/ARCHITETTURA.md` r.35 sono allineati. Il README di radice non nomina il Lotto |
| Lotto (presentazione) | **OK** | `presentation/index.html` non contiene "Lotto", "ambo" né "terno". La slide 06 ora ha 5 righe, senza la riga Lotto |
| Nome del progetto | **OK** | "Quanto costa sperare?" non compare più come nome. "Fortuna in Chiaro" compare in README r.1, `<title>` e slide 01, 09 e appendice della presentazione, `app/index.html`, BR e test. L'unica occorrenza simile è una frase del parlato nella nota della slide 09 ("quanto gli costa sperare"): è una frase, non il nome. Accettabile |
| BR-17 attivo di default | **OK** | `ui.js` r.19 (`?pausa=0` lo disattiva), BR-17 r.226-230, README r.13. DEF-002 è chiuso nel `defect-log.md`, TC-24 è Pass (24/24) |
| Stima ~150 mln € | **OK** | Slide 18 (A8) con badge "Stima nostra", calcolo e "Ipotesi non misurata" dichiarati. È in appendice, non nel parlato |
| R-10: 5'00" demo compresa | **OK, con riserva** | La scaletta (commento r.15-25 e note delle slide 01-09) somma 300" = 5'00". Pausa e Conto è un tasto: compare solo se lo si preme, quindi non allunga la demo da solo. Riserva: le note non sono state riallineate alla decisione (QA-017, QA-020) |
| R-09: i 3 deliverable | **OK** | Slide 02 "Deliverable 01" (User Difficulty Statement), slide 05 "Deliverable 02" (Before/After), slide 06 "Deliverable 03" (Risk & Clarity Note) |
| `agents/` allineata a `.claude/` | **OK** | Confronto per hash di tutti i file di `.claude/` (escluso `settings.local.json`): nessuna differenza e nessun file mancante. L'ultimo commit su `.claude/` (`ecf4a34`, 13:15) precede l'ultimo sync in `agents/` (`99454b4`, 14:19). `CLAUDE.md` e `agents/CLAUDE.md` coincidono (freeze 15:30). Non serve un nuovo sync |
| Igiene del repository | **OK** | `.gitignore` esclude `00_input/`, `kb/`, `.claude/settings.local.json`, `.env`, `*.key`. `git ls-files` (61 file) non contiene nulla di `00_input/` o `kb/`. Nessun pattern di segreto (`sk-…`, `AKIA…`, `ghp_…`, `xox…`) nei file di lavoro. Nessun file di prova o temporaneo tracciato: gli unici `*.test.js` sono la suite ufficiale in `app/tests/` |

### 6.2 Stato dei rilievi precedenti

| Rilievo | Stato | Nota |
|---|---|---|
| QA-008 DEF-002 | **Chiuso** | `defect-log.md` DEF-002 chiuso; TC-24 Pass nel `test-report.md` (UAT v3) |
| QA-006 Go/no-go BR-17 | **Chiuso** | Decisione dell'utente registrata al checkpoint delle 14:30 (`stato-avanzamento.md` r.23 e r.30) |
| QA-012 Slide 06 | **Aperto** (Minore) | La riga Lotto è stata tolta. Manca ancora una voce esplicita "Ambiguità evitata" |
| QA-017 Nota della slide 04 | **Aperto** (Minore) | La nota dice ancora "Se BR-17 è approvato: ... al posto del passo 4 **o 10" prima della chiusura**". La seconda opzione porta sopra i 5'00" (R-10) |
| QA-018 Conteggio dei test | **Aperto** (Minore) | `test-report.md` r.7 dice ancora "41 test passati", mentre r.43 dice 40. Va allineato a 40 |
| QA-019 README §9 | **Aperto** (Maggiore, condizione al push) | Il §9 dice ancora "Ultimo verdetto QA: FAIL con condizioni", "verifiche umane (14:20) In attesa" e ha data 14:25. È in contrasto con R-06 (README onesto alla consegna) |
| QA-005, 009, 010, 011, 013, 014, 015 | Invariati | Non bloccanti. Per QA-009: i 40 "passati" comprendono ancora 2 test che dichiarano "verifica NON eseguita" |

### 6.3 Nuovi rilievi (non bloccanti)

| ID | Gravità | Regola | Rilievo | Cosa correggere | Owner |
|---|---|---|---|---|---|
| QA-020 | Minore | Coerenza tra BR e presentazione; R-10 | La presentazione non è stata riallineata a BR-17 "attivo di default". (a) Slide 17 (A7): badge "Opzionale · BR-17" e testo "Attivata solo da Salvatore (BR-17, Could). Se approvata al checkpoint…". Ora BR-17 è Should e attivo. (b) Il commento in testa al file (r.27-40) dice ancora "TARATURA DEMO DA FARE A PRODOTTO FINITO" | (a) Cambiare il badge in "BR-17 · attivo" e togliere "Could" e "se approvata". (b) Dopo la prova della demo dell'utente, fissare il copione della slide 04 (Pausa e Conto al posto del passo 4, oppure fuori dal copione) e togliere il commento "DA FARE". Insieme a QA-017 sono circa 3 minuti di lavoro | innovazione |
| QA-021 | Minore | Coerenza tra deliverable dopo la rimozione del Lotto | Restano riferimenti al Lotto come gioco: `analisi-funzionale.md` r.45 (domanda "tra lotterie istantanee e lotto"); `stato-avanzamento.md` r.75 ("Lotto mantenuto con etichetta fonte terzi … Provvisoria", contraddice r.30). `idea-selezionata.md` r.23 è un documento storico dell'idea, accettabile | Correggere r.45 e chiudere r.75 come "Superata: Lotto tolto al checkpoint 14:30" | business (r.45), governance (r.75) |

Nota: le righe 55 e 136 di questo file (sezioni 2 e 5) descrivono lo stato precedente al checkpoint delle 14:30. Restano come registro storico. Vale la sezione 6.

### 6.4 Verdetto del riesame finale 14:41: **PASS con riserva**

Non restano violazioni del regolamento in carico ai team. App, BR, test, README e presentazione sono coerenti con le decisioni delle 14:30: niente Lotto selezionabile, nome "Fortuna in Chiaro", BR-17 attivo. R-09 e R-10 sono rispettati (300" = 5'00"). I test sono verdi (40/0), l'UAT è 24/24, `agents/` è allineata e il repository è pulito.

**Condizioni per il push**, nessuna eccezione:
1. QA-002: remote GitHub **pubblico** creato e URL verificato da una sessione non autenticata (in attesa dell'utente).
2. Conferma umana di consegna registrata in `stato-avanzamento.md` (r.31-32 ora "In attesa").
3. QA-019: §9 del README aggiornato con il verdetto corrente (questo), l'URL del repository e la conferma umana. Il README è il punto d'ingresso di chi valuta e oggi dichiara un FAIL.

**Riserve, consigliate prima del push (circa 5 minuti in tutto)**: QA-017 e QA-020 (innovazione), QA-018 e QA-021 (business, governance).

Se dopo questo riesame si modificano solo README, `stato-avanzamento.md`, `test-report.md`, `analisi-funzionale.md` o le note e i badge della presentazione, non serve un nuovo giro QA. Se si modifica `app/`, bisogna rieseguire `run-tests.ps1`. Se si modifica `.claude/` o `CLAUDE.md`, bisogna rieseguire `agents/sync.ps1`.

## 7. Riesame 15:00 (c69aa32)

| Campo | Valore |
|---|---|
| Versione revisionata | commit `c69aa32` rispetto a `e92fb39`; `git diff e92fb39 c69aa32 --stat`: `app/index.html` (+6/-2), `app/src/ui.js` (+85/-25 circa), `app/style.css` (+6), `app/tracciabilita.md` (+2) |
| Ambito | Solo le modifiche UI richieste dall'utente: scelta dell'importo (al posto di "quante volte"), frase di confronto esplicito A/B nella schermata abitudine, linguaggio semplice al posto di "payout/valore atteso/seme", box "Quest'anno simulato (un caso)" vs "In media, su tantissimi anni", pulsante "Simula un altro anno" |

### 7.1 Verifiche eseguite

| Verifica | Esito | Evidenza |
|---|---|---|
| Test automatici | **OK** | `run-tests.ps1`: `RISULTATO: 40 passati, 0 falliti`, incluso il guardrail statico T2-V3 ("nessuna formula vietata... 5 file") |
| T2-V3 nessun consiglio/giudizio nei testi nuovi | **OK** | Lettura diretta del diff: i nuovi testi ("Due biglietti reali... restituisce in media X centesimi", "Quest'anno hai perso X in più/meno della media: è il caso", "Restituisce in media... € ogni 100 € giocati") sono descrittivi, non prescrittivi. Nessuna formula tipo "conviene/dovresti/meglio". La scansione statica della suite (che copre `index.html`, `src/*.js`, `data/*.js`) resta verde dopo le modifiche |
| T2-E4 i numeri vengono da GIOCHI/Motore, non scritti a mano | **OK** | Il confronto A/B usa `payoutDichiarato(g)` sui due oggetti gioco reali (`istantanea-5-a`/`-b`) letti da `G.giochi`, non costanti hardcoded. Il box "In media" e "Quest'anno simulato" derivano da `M.simulaAnno`, `M.perditaAttesa`, `r.perditaAnno` già calcolati dal motore. La nuova funzione `confrontoAnnoHtml` fa solo la differenza tra `t.perso` (esito della simulazione) e `r.perditaAnno` (esito del motore): nessun valore scritto a mano. "Simula un altro anno" introduce `semeAnno()` che somma un contatore (`state.altroAnno`) al seme esistente (demo o normale): il seme resta governato dalla logica esistente, non da un valore arbitrario nuovo |
| Nessun file di prova nel repository | **OK** | `git status --porcelain` vuoto: working tree pulito, nessun file non tracciato o residuo di debug |

### 7.2 Verdetto del riesame 15:00: **PASS**

Le modifiche sono circoscritte alla UI richiesta, non toccano il motore né le tabelle dati, non introducono testi di consiglio/giudizio e non introducono numeri scritti a mano: tutti i valori mostrati restano derivati da `G.giochi` e da `M.*` (Motore). I 40 test automatici restano verdi (40/40) e il repository è pulito. Nessun nuovo rilievo bloccante o maggiore. Restano valide, invariate, le condizioni per il push già registrate nella sezione 6 (remote pubblico, conferma umana di consegna, README §9).

## Riesame 15:11 (786ad9a)

**Verdetto: PASS.** Diff 052545..786ad9a (pp/src/ui.js): schedina con importo per giocata x quante volte x periodo. T2-V3 rispettato: testi nuovi (etichette, conversione biglietti) sono descrittivi, nessuna formula da consiglio/giudizio. I numeri derivano da G (prezzo del gioco in data/giochi.js) e dal Motore (M.trovaGioco, calcolo biglietti/importi); nessun valore inventato nella UI. Test: powershell -NoProfile -ExecutionPolicy Bypass -File app/tests/run-tests.ps1 -> **40 passati, 0 falliti**.
