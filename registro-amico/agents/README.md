# Struttura agentica

La struttura ha due livelli:

1. **L'agente che accompagna chi impara** (runtime): vive nel browser e nel server, decide quanto aiuto dare e quando, e spiega le comunicazioni della scuola.
2. **Gli agenti che hanno costruito il prodotto** (sviluppo): le istruzioni, i subagenti, i comandi e la skill usati con Claude Code durante l'hackathon.

```
agents/
├── README.md                          questa mappa
├── CLAUDE.md                          istruzioni di progetto per Claude Code
├── workflow.md                        come è stato costruito: fasi, contributo AI, revisione umana
├── prompts/
│   └── spiega-comunicazione.md        system prompt dell'agente di runtime (letto dal server)
├── subagents/
│   ├── translation-fidelity-reviewer.md   rivede i testi in arabo, inglese e italiano semplice
│   └── learner-path-tester.md             percorre i 4 esercizi "da Fatima" e misura i livelli
├── commands/
│   ├── demo-check.md                  /demo-check: test + server + percorso adattivo nel browser
│   └── nuovo-compito.md               /nuovo-compito: aggiunge un esercizio con passi, testi e test
└── skills/
    └── istruzioni-multilingue-semplici/
        └── SKILL.md                   regole per scrivere istruzioni e suggerimenti in 3 lingue
```

## 1. L'agente di runtime

Ciclo **osserva → valuta → adatta → spiega**. La parte che decide è codice deterministico e testato; il modello AI interviene solo per spiegare le comunicazioni, e la sua risposta passa da controlli automatici.

| Fase | Dove | Cosa fa |
|---|---|---|
| Osserva | `app/public/lib/tasks.js` | Ogni click sul registro diventa un evento `{ action, value }`. La macchina a stati del compito dice se è il passo giusto, un passo già fatto (neutro) o un errore, e con quale feedback mirato. |
| Valuta | `app/public/lib/coach.js` (`createSession`) | Conta tempo, click sbagliati e suggerimenti. Rileva il blocco al livello 2: ferma da 10 secondi, oppure 2 click sbagliati sullo stesso passo. |
| Adatta | `app/public/lib/coach.js` (`nextLevel`) | Livello 1 Guidato → 2 Suggerimento → 3 In autonomia. Torna al 2 se al livello 3 ci sono 3 errori o più, o se la persona non finisce. |
| Spiega | `app/server/agent.mjs` + `prompts/spiega-comunicazione.md` | «Spiegami questa comunicazione»: Claude scrive una spiegazione in JSON vincolato da schema. Il server la scarta se contiene una data, un orario, un numero, un mese o un giorno che non sono nell'originale (`app/public/lib/facts.js`). Senza AI, o se la risposta viene scartata, si usa la spiegazione già pronta. |

Modello: `claude-opus-5-5`, effort `low`, fallback lato server `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). Si può cambiare con `RA_MODEL`; `RA_AI=off` spegne l'AI.

## 2. La struttura di sviluppo (Claude Code)

I file sono nel formato di Claude Code (frontmatter YAML). Per usarli in una sessione, copiali nella cartella `.claude/` alla radice del repository:

```bash
mkdir -p .claude/agents .claude/commands .claude/skills
cp registro-amico/agents/subagents/*.md .claude/agents/
cp registro-amico/agents/commands/*.md .claude/commands/
cp -r registro-amico/agents/skills/* .claude/skills/
cp registro-amico/agents/CLAUDE.md registro-amico/CLAUDE.md
```

Quando usarli è descritto in [workflow.md](workflow.md).
