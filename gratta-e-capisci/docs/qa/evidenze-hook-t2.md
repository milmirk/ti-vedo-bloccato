# Evidenze — Hook guardrail T2-V3 (leva L4, `Fortuna in Chiaro`)

Script: `.claude/hooks/guardrail-t2.ps1`, registrato in `.claude/settings.json` come secondo hook
PreToolUse (dopo `guard.ps1`) sul matcher `Write|Edit|MultiEdit`.

Ambito: si applica solo a percorsi sotto `app/`, escludendo `app/tests/` e i file `.md`.

Lista stretta delle formule vietate (case-insensitive): "conviene", "ti consiglio",
"ti consigliamo", "smetti", "gioca meno", "dovresti smettere", "dovresti giocare",
"non giocare", "faresti meglio".

## Verifica preliminare (prima di attivare l'hook)

Comando eseguito sui file attuali di `app/` (index.html, src/*.js, data/*.js):

```
grep -niE "conviene|ti consiglio|ti consigliamo|smetti|gioca meno|dovresti smettere|dovresti giocare|non giocare|faresti meglio" app/index.html app/src/*.js app/data/*.js
```

Risultato: **nessuna corrispondenza** (grep exit code 1). Nessun file esistente contiene le
formule vietate: l'hook e' stato attivato in sicurezza, senza bloccare il lavoro in corso degli
altri agenti.

## Caso positivo — bloccato

Input JSON simulato (come lo riceverebbe l'hook da PreToolUse):

```json
{"tool_input":{"file_path":"app/src/ui.js","new_string":"document.body.textContent = \"Ti consiglio di giocare meno\";"}}
```

Comando:

```powershell
echo '<json sopra>' | powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/guardrail-t2.ps1
```

Esito: **exit code 2** (bloccato). Messaggio su stderr:

```
BLOCCATO da guardrail-t2.ps1: il testo contiene la formula vietata 'ti consiglio'. Vincolo T2-V3
(Tema 02): l'app informa con dati e scale di confronto, non da' consigli ne' giudizi su smettere
o giocare meno. Riformula in modo neutro (es. 'servirebbero...', 'in media...').
```

## Caso negativo — lasciato passare

Input JSON simulato (testo neutro, stile L3):

```json
{"tool_input":{"file_path":"app/src/ui.js","new_string":"Servirebbero 208 stadi pieni perche vinca una sola persona."}}
```

Esito: **exit code 0** (passa). Nessun output su stderr.

## Casi di eccezione verificati

- `app/tests/testi.test.js` con la parola "smetti" nel testo (commento del test che verifica
  l'assenza della formula): **exit code 0** — l'eccezione `app/tests/` funziona, non blocca il
  test stesso che deve poter citare le formule vietate per cercarle.
- `docs/business/note.md` con "ti consiglio": **exit code 0** — l'eccezione sui file `.md`
  funziona, la documentazione di processo non e' soggetta al guardrail (che riguarda i testi
  rivolti all'utente finale dell'app).

## Conclusione

L'hook funziona come previsto: blocca le formule da consiglio/giudizio nei file applicativi di
`app/`, lascia passare formulazioni neutre e le eccezioni documentate (`app/tests/`, `*.md`).
Nessun falso positivo riscontrato sui file esistenti.
