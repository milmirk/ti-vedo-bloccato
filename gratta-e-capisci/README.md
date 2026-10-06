# Fortuna in Chiaro — Hackathon Hagenthon (Tema 02)

> **Gratta e Capisci · in questo repository.** Progetto di alcuni colleghi, nato nel repository
> [armandopierri-cell/Fortuna-in-Chiaro](https://github.com/armandopierri-cell/Fortuna-in-Chiaro) e
> importato qui così com'è. L'unico intervento è estetico, il 06/10/2026:
> - `app/style.css` riscritto, con un nuovo sistema visivo: schermate a schede, quiz e giochi selezionabili come riquadri, contatori e cruscotto più leggibili, finestra «Pausa e Conto» rinnovata. Contrasto AA e focus sempre visibile.
> - `app/index.html`: nel primo schermo è stata aggiunta un'illustrazione decorativa (`aria-hidden`).
>
> Testi, dati ADM, motore di calcolo e test sono invariati: dopo la modifica passano ancora tutti i 40 test di `app/tests/run-tests.ps1`.


## 1. Cos'è

Simulatore educativo sul gioco d'azzardo: in 7 schermate mostra quanto costa un'abitudine
di gioco quotidiana (persona Salvatore, ~10 €/giorno), con probabilità ufficiali ADM, valore
atteso esatto e quiz prima/dopo. Non dà consigli né giudizi: solo numeri e significati.

## 2. Come aprire la demo

- Standard: apri `app/index.html` nel browser.
- Demo con seme fisso e animazione rapida: `app/index.html?demo=1`.
- "Pausa e Conto" (BR-17) è attiva di default; per nasconderla: `app/index.html?demo=1&pausa=0`.

## 3. Presentazione

`presentation/index.html`: brand Accenture, soluzione,
struttura agentica, demo compresa.

## 4. Test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File app/tests/run-tests.ps1
```

Esegue `app/tests/tests.html` in Edge headless (unità in `app/tests/motore.test.js`,
scansione statica dei testi in `app/tests/testi.test.js`); exit 0 = tutti verdi.

## 5. Mappa del repository (file reali)

```
app/
├── index.html, style.css          Punto d'ingresso e stili
├── ARCHITETTURA.md, README.md     Note tecniche, tracciabilita.md (BR → verifica)
├── data/giochi.js, data/quiz.js   Dati ufficiali ADM e domande del quiz
├── src/motore.js, src/ui.js       Motore di calcolo e interfaccia
└── tests/                         tests.html, motore.test.js, testi.test.js, run-tests.ps1

agents/                            Struttura agentica consegnata (copia di .claude/, via sync.ps1)
├── agents/*.md                    Prompt di ruolo (business, governance, innovazione, qa, sviluppo)
├── hooks/                         guard.ps1, guardrail-t2.ps1, post-edit-tests.ps1
├── skills/presentazioni-accenture/ SKILL.md, reference.md, assets/template.html
├── settings.json, CLAUDE.md       Config hook/agenti e regole
├── sync.ps1                        Script di allineamento da .claude/
└── WORKFLOW.md                     Flusso idea → BR → sviluppo ⇄ test → presentazione → QA → push

presentation/
└── index.html                     Slide Accenture

docs/
├── governance/stato-avanzamento.md   Decisioni, verifiche umane, rischi, piano residuo
├── idea/                          idea-selezionata, idee-valutate, idee-neet, problem-statement,
│                                   ricerca-azzardo, ricerca-neet, numeri-business-case, valore-checkpoint
├── business/                      business-requirements, analisi-funzionale, piano-test,
│                                   test-report, defect-log
└── qa/                            checklist-conformita, evidenze-hook-t2, verdetto-qa

.claude/                           Configurazione agentica in uso (tracciata in git): agents/, hooks/,
                                    skills/presentazioni-accenture/, settings.json
CLAUDE.md                          Regole del progetto (ruoli, flusso, pattern di validazione)
.gitignore                         Esclude 00_input/, kb/, settings.local.json, .env, *.key
```
`00_input/` e `kb/` sono fuori dal repository (hook `guard.ps1` ne blocca la scrittura).

## 6. Criterio di valutazione → evidenza

| Criterio (regolamento / CLAUDE.md) | Dove trovarlo |
|---|---|
| Innovatività dell'idea | `docs/idea/idea-selezionata.md`, `docs/idea/idee-valutate.md` |
| Messa a terra / concretezza | `app/` funzionante, `docs/business/test-report.md`, `app/tracciabilita.md` |
| Efficacia della demo | `app/index.html?demo=1`, `presentation/index.html` (sezione demo) |
| Uso consapevole dei token | Sezione 8 qui sotto; `CLAUDE.md` ("Uso consapevole dei token") |
| Qualità tecnica | `app/ARCHITETTURA.md`, test in `app/tests/`, `docs/qa/checklist-conformita.md` |
| Verifica umana | `docs/governance/stato-avanzamento.md` (sezione "Verifiche umane") |
| Pattern **Rules** | `CLAUDE.md`, `agents/agents/*.md` (prompt di ruolo) |
| Pattern **Skills** | `agents/skills/presentazioni-accenture/` (usata per `presentation/`) |
| Pattern **Hooks** | `agents/hooks/*.ps1`; prova indipendente in `docs/qa/evidenze-hook-t2.md` e `docs/qa/verdetto-qa.md` |
| Strategia di applicazione AI | `CLAUDE.md`, `docs/governance/stato-avanzamento.md` |
| Conformità al regolamento / verdetto QA | `docs/qa/checklist-conformita.md`, `docs/qa/verdetto-qa.md` (stato in sezione 9 qui sotto) |

## 7. Team agentico e stanze agile

| Agente | Ruolo | Scrive in | Modello |
|---|---|---|---|
| `governance` | Piano, tempi, deliverable, push finale | `docs/governance/` | Sonnet |
| `innovazione` | Idea, pitch, presentazione | `docs/idea/`, `presentation/` | Opus |
| `business` | Business Requirements, test di accettazione | `docs/business/` | Sonnet |
| `sviluppo` | Architettura e codice | `app/` | inherit |
| `qa` | Conformità al regolamento, verdetto PASS/FAIL | `docs/qa/` | Opus |

Flusso e stanze (Motore, Esperienza) dettagliati in `agents/WORKFLOW.md`.

## 8. Uso dei token

- Modello per ruolo: Sonnet di default, Opus su idea e QA, inherit su sviluppo (vedi tabella sopra).
- L'app a runtime è logica deterministica (motore JS su dati ADM in `app/data/`): zero token,
  nessuna API key, nessun LLM richiesto per funzionare nel browser.
- In sviluppo, Claude Code è stato usato con contesto mirato per agente (ognuno riceve solo i
  file del proprio dominio) e con gli hook per automatizzare controlli ripetitivi.

## 9. Stato della consegna (onesto, a questo istante)

- Ultimo verdetto QA: **PASS** (`docs/qa/verdetto-qa.md`, riesame 15:11 su `786ad9a`; review approfondita 15:18 senza rilievi bloccanti in `docs/qa/review-approfondita.md`): UAT 24/24, 40 test automatici verdi, `agents/` allineata a `.claude/`.
- Checkpoint idea e valore: **svolto con l'utente alle 14:30** (decisioni in `docs/governance/stato-avanzamento.md`).
- **Consegna confermata dall'utente** alle 15:27. Repository: https://github.com/armandopierri-cell/Fortuna-in-Chiaro
- Push eseguito al freeze (commit finale di consegna).

---
**Aggiornato:** 05/10/2026, 14:45 — orchestratore. **Freeze:** 15:30 (deroga; regolamento riporta 15:00).
