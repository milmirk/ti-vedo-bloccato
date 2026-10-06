# Review di governance — consegna (15:12)

## 1. Consegna
- Struttura repo conforme a R-02: `app/`, `agents/`, `presentation/`, `docs/`, `README.md` (verificato in `docs/qa/verdetto-qa.md` §6.1 e QA-001).
- **Bloccante**: `git remote -v` **vuoto** (verificato ora, 15:12). Senza remote pubblico non si può fare il push richiesto da R-01/R-11. Serve URL del repo GitHub dai docenti, poi `git remote add origin <url>` e push di prova.
- **R-12 (caricamento sul portale)**: azione fuori dal repository, non delegabile a QA. Segnalo all'utente: da fare il caricamento del pacchetto (probabilmente lo zip `fortuna-in-chiaro-e2a4a31.zip` presente in radice, non tracciato — va escluso dal repo/commit, è solo materiale per il portale).
- Dopo il push: l'utente deve comunicare l'URL del repository nel canale dei docenti (azione dell'utente, non automatizzabile da qui).

## 2. Processo
- Verifiche umane registrate: idea 12:45 (approvata), checkpoint valore 14:30 (svolto). Conferma consegna 15:10 **ancora "In attesa"** in `stato-avanzamento.md` — da chiudere con l'utente prima del push.
- Flusso idea → BR → sviluppo ⇄ test → presentazione → QA → consegna rispettato; passaggi tracciati nei commit (git log) e nei verdetti QA (6 riesami: 14:15, 14:20, 14:41, 15:00, 15:11).
- **Gap corretto in questo giro**: le modifiche demo 14:50-15:10 (scelta importo, differenza A/B, linguaggio semplice, anno simulato vs media, schedina importo×frequenza) erano tracciate solo nei commit e nei riesami QA 15:00/15:11, non ancora come "richieste dell'utente" in `stato-avanzamento.md`. Aggiunte ora (vedi file).
- **README §9 disallineato**: cita ancora il verdetto delle 14:41, non i riesami 15:00/15:11 (PASS) né l'assenza di remote attuale. Da aggiornare subito prima del push (QA-019 ancora aperto).

## 3. Criteri di valutazione — punteggio atteso (1-5) ed evidenza più forte
| Criterio | Punteggio | Evidenza più forte |
|---|---|---|
| Innovatività dell'idea | 4 | `docs/idea/idea-selezionata.md` (leve L1-L4, CR1/CR2, "vista dal banco") |
| Messa a terra / concretezza | 4 | `app/` funzionante, 40 test verdi, UAT 24/24 (`docs/business/test-report.md`) |
| Efficacia della demo | 3 | Scaletta 5'00" esatti in `presentation/index.html`, ma QA-017/QA-020 ancora aperti (note non riallineate a BR-17 attivo) |
| Efficacia uso dei token | 4 | README §8 (modelli per ruolo, Sonnet/Opus/Haiku), CLAUDE.md "Uso consapevole dei token" |
| Qualità tecnica | 4 | Motore con valore atteso esatto, 40 test automatici, hook guardrail verificato (`docs/qa/evidenze-hook-t2.md`) |
| Uso consapevole AI | 4 | Logica deterministica nel motore, AI solo dove serve (dichiarato in CLAUDE.md e README) |
| Verifica umana | 3 | Due verifiche fatte e registrate, ma la terza (consegna) è ancora "In attesa" al momento di questa review |
| Pattern skill/rules/hooks | 5 | `.claude/skills/presentazioni-accenture/`, hook `guardrail-t2.ps1` con evidenze positive/negative in `docs/qa/evidenze-hook-t2.md` |
| Strategia applicazione AI | 4 | Flusso multi-agente con stanze agile, tracciato nei commit |

**2 punti deboli su cui insistere a voce nel pitch**:
1. Remote GitHub non ancora attivo al momento di questa review: va chiarito a voce che il push è l'ultimo passo pianificato, non un problema di esecuzione (il prodotto è pronto, QA PASS su 15:11).
2. La scaletta della demo (slide 04/06) non è stata riallineata al 100% alle ultime decisioni (BR-17 attivo di default, importo/schedina): se un valutatore legge le note della presentazione invece di guardare la demo live, può percepire un disallineamento minore — da anticipare a voce ("la demo live è la versione corrente, le note testuali sono in fase di refresh").
