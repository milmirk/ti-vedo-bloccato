# Struttura agentica

La struttura ha due livelli:

1. **L'agente di runtime**: un agente AI facoltativo che legge le email in formati sconosciuti, dentro un ciclo controllato dal codice.
2. **Gli agenti che hanno costruito il prodotto**: istruzioni, subagenti, comandi e skill per Claude Code.

```
agents/
├── README.md                          questa mappa
├── CLAUDE.md                          istruzioni di progetto per Claude Code
├── workflow.md                        come è stato costruito: fasi, contributo AI, revisione umana
├── prompts/
│   └── extract-agent.md               system prompt dell'agente di runtime (letto dal server)
├── subagents/
│   ├── provider-parser-builder.md     aggiunge il parser per un nuovo formato di email, test prima
│   └── neutral-language-reviewer.md   rivede i testi: fatti, non consigli; fedeltà alle email
├── commands/
│   ├── demo-check.md                  /demo-check: test + server + percorso completo
│   └── nuovo-servizio.md              /nuovo-servizio: nuovo formato di email con parser e test
└── skills/
    └── fatti-non-consigli/
        └── SKILL.md                   regole per scrivere di soldi senza consigliare
```

## 1. L'agente di runtime

Il ciclo è **legge → controlla → calcola → mostra**. Solo il primo passo può usare l'AI, e solo se le regole non bastano:

| Fase | Dove | Cosa fa |
|---|---|---|
| Legge | `app/public/lib/parsers.js` | Un parser dedicato per ogni formato noto (Pago3, Rateo, DividiPay, ElettroCasa: inventati) e regole generiche per gli altri. Ogni valore porta la frase esatta dell'email. |
| Legge (AI, facoltativo) | `app/server/agent.mjs` + `prompts/extract-agent.md` | Solo per le email incomplete, se la persona lo chiede: Claude **copia** i valori come sono scritti, in JSON vincolato da schema. Non calcola niente. |
| Controlla | `app/public/lib/verify.js` | Ogni importo, data e numero di rate deve comparire nell'email (varianti di scrittura ammesse). Se non c'è, il campo viene scartato e la persona vede quale e perché. Un consiglio ("ti conviene", "dovresti"…) fa scartare tutta la risposta. |
| Calcola | `app/public/lib/schedule.js`, `insights.js` | Date delle rate, centesimi, totali per mese e per servizio, quota sulle entrate, simulazione. Aritmetica pura, coperta dai test. |
| Mostra | `app/public/app.js` | Il mese prossimo, il grafico con la sua tabella, i prossimi 30 giorni, ogni valore accanto alla sua frase, glossario e quiz. |

Modello: `claude-opus-5-5` con effort `low` e fallback lato server (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). Si cambia con `RNR_MODEL`; `RNR_AI=off` spegne l'AI.

## 2. La struttura di sviluppo (Claude Code)

I file sono nel formato di Claude Code, con frontmatter YAML. Per usarli in una sessione, copiali nella cartella `.claude/` alla radice del repository:

```bash
mkdir -p .claude/agents .claude/commands .claude/skills
cp rata-o-non-rata/agents/subagents/*.md .claude/agents/
cp rata-o-non-rata/agents/commands/*.md .claude/commands/
cp -r rata-o-non-rata/agents/skills/* .claude/skills/
cp rata-o-non-rata/agents/CLAUDE.md ./CLAUDE.md
```

Quando usarli è descritto in [workflow.md](workflow.md).
