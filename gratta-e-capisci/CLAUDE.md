# Hagenthon — Hackathon Agentic Coding (Accenture)

Lingua di lavoro: italiano. **Freeze: oggi alle 15:30** (deroga dei docenti; il regolamento riporta 15:00). Il tempo è il vincolo che decide ogni scelta.

## Fonti di verità (sola lettura, protette da un hook)
- `00_input/regolamento.md`: tempi, consegna, criteri di valutazione.
- `00_input/temi-sfida.md`: temi, vincoli e deliverable specifici.

## Struttura del repository (imposta dal regolamento)
```
app/            soluzione: HTML/CSS/JS statico, nessuna build, si apre app/index.html
agents/         struttura agentica consegnata (copia di .claude/ fatta da agents/sync.ps1, più workflow)
presentation/   presentazione HTML con brand Accenture (5 minuti, demo compresa)
docs/           evidenze del processo: governance, idea, business (BR e test), qa
README.md       punto d'ingresso per chi valuta, persona o agente
```
`00_input/` e `kb/` restano **fuori dal repository** (.gitignore).

## Team agentico (`.claude/agents/`)
| Agente | Ruolo | Scrive in | Modello |
|---|---|---|---|
| `governance` | Piano, tempi, deliverable, push finale | `docs/governance/` | Sonnet |
| `innovazione` | Idea, pitch, presentazione | `docs/idea/`, `presentation/` | Opus |
| `business` | Business Requirements, test di accettazione | `docs/business/` | Sonnet |
| `sviluppo` | Architettura e codice | `app/` | inherit |
| `qa` | Conformità al regolamento, verdetto PASS/FAIL | `docs/qa/` | Opus |

La sessione principale fa da **orchestratore**. Gli agenti si passano il lavoro attraverso i file.

## Flusso
idea → **[conferma umana]** → BR → sviluppo ⇄ test (business) → presentazione → review QA → **[conferma umana]** → push

## Regole
- Ogni agente scrive solo nelle proprie cartelle. Unica eccezione: `sviluppo` aggiorna lo stato in `docs/business/defect-log.md`.
- **Nessun push finale senza verdetto PASS di `qa`.**
- **Verifica umana** obbligatoria in due momenti: scelta dell'idea e consegna. Va registrata in `docs/governance/stato-avanzamento.md`.
- Nessuna API key o segreto nei file: un hook blocca la scrittura.
- I dubbi sul regolamento si chiedono all'utente, non si risolvono con un'ipotesi.

## Pattern di validazione (evidenze richieste dalla valutazione)
- **Rules**: questo file e i prompt di ruolo degli agenti.
- **Skills**: `.claude/skills/presentazioni-accenture/` per la presentazione in brand Accenture.
- **Hooks** (`.claude/settings.json`, script in `.claude/hooks/`):
  - `guard.ps1` (PreToolUse): blocca la scrittura in `00_input/` e i contenuti con API key;
  - `guardrail-t2.ps1` (PreToolUse, leva L4): blocca in `app/` (eccetto `app/tests/` e i `.md`) formule da consiglio o giudizio ("ti consiglio", "smetti", ...), vincolo T2-V3 del Tema 02; provato su caso positivo/negativo in `docs/qa/evidenze-hook-t2.md` e verificato da `app/tests/testi.test.js`;
  - `post-edit-tests.ps1` (PostToolUse): dopo ogni modifica a `app/` esegue i test e riporta all'agente quelli falliti.

## Uso consapevole dei token
- **Modello per ruolo**: Sonnet di default, Opus solo dove deve essere giusto (idea, QA), Haiku per i compiti meccanici.
- Agenti con contesto mirato: ognuno riceve solo i file che gli servono e restituisce una sintesi breve, non il file per intero.
- Nella soluzione si usa prima la logica deterministica. L'AI entra solo dove aggiunge valore, con il modello più piccolo adatto, la cache e un ripiego offline.
