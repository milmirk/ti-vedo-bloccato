# Workflow — Hagenthon

Non toccato da `agents/sync.ps1` (che rigenera solo `agents/agents/`, `agents/skills/`,
`agents/hooks/`, `agents/commands/`, `agents/settings.json`, `agents/CLAUDE.md`).

## Flusso

```
idea → [conferma umana] → BR → sviluppo ⇄ test (business) → presentazione → QA → [conferma umana] → push
```

## Chi fa cosa, dove si passa il lavoro

| Passo | Agente | Input (legge) | Output (scrive) |
|---|---|---|---|
| 1. Idea | `innovazione` | `00_input/temi-sfida.md`, ricerca | `docs/idea/idea-selezionata.md`, `docs/idea/idee-valutate.md` |
| 2. Conferma umana | orchestratore + utente | `docs/idea/idea-selezionata.md` | `docs/governance/stato-avanzamento.md` (verifica registrata) |
| 3. BR | `business` | idea confermata | `docs/business/business-requirements.md`, `analisi-funzionale.md`, `piano-test.md` |
| 4. Sviluppo ⇄ test | `sviluppo` ⇄ `business` | BR, piano-test | `app/` (codice); `docs/business/test-report.md`, `defect-log.md` (stato aggiornato anche da `sviluppo`) |
| 5. Presentazione | `innovazione` | soluzione in `app/`, BR | `presentation/` (skill `agents/skills/presentazioni-accenture/`) |
| 6. QA | `qa` | tutto il repository, `00_input/regolamento.md` | `docs/qa/checklist-conformita.md`, `docs/qa/evidenze-hook-t2.md`, `docs/qa/verdetto-qa.md` |
| 7. Conferma umana | orchestratore + utente | verdetto QA | `docs/governance/stato-avanzamento.md` (go al push) |
| 8. Push | `governance` | verdetto PASS + conferma umana | `agents/sync.ps1` eseguito, commit, push entro il freeze |

## Regole

- Ogni agente scrive solo nella propria cartella (eccezione: `sviluppo` aggiorna lo stato in
  `docs/business/defect-log.md`).
- Nessun push senza verdetto QA **PASS** sulla versione corrente.
- Due verifiche umane obbligatorie: scelta dell'idea, consegna finale. Entrambe in
  `docs/governance/stato-avanzamento.md`.

## Stanze agile (sviluppo)

- **Motore** (sviluppo + business): `app/data/*.js`, `app/src/motore.js`, `app/tests/motore.test.js`.
- **Esperienza** (sviluppo): `app/index.html`, `app/style.css`, `app/src/ui.js`.
- Contratto tra le due: `app/ARCHITETTURA.md`.
