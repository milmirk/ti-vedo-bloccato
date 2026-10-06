# Fortuna in Chiaro — l'app

Simulatore educativo sul gioco d'azzardo: in 7 schermate mostra quanto costa un'abitudine di gioco, cosa succede in un anno simulato (in 10 secondi), il valore atteso esatto calcolato dalle tabelle premi ufficiali ADM e quanto cambia la comprensione con un quiz prima e dopo. Non dà consigli: mostra numeri e significati.

## Prerequisiti
- Un browser moderno (Microsoft Edge o Chrome). Nient'altro: niente Node, Python, server, build o connessione di rete.

## Come si apre
1. Doppio click su `app/index.html`.
2. Modalità demo (seme fisso, animazione di circa 3 secondi, soglia mensile precompilata a 100 €): aprire `app/index.html?demo=1`, oppure attivare il toggle "Modalità demo" nella schermata di benvenuto.
3. "Pausa e Conto" (BR-17) è attiva di default. Per nasconderla, ad esempio per tarare i tempi della demo, aggiungere `pausa=0`: `app/index.html?demo=1&pausa=0`.

Giochi selezionabili: due lotterie istantanee da 5 € (modello A e B), con tabella premi ufficiale ADM. Il Lotto non è un gioco selezionabile. Compare solo come esempio nella scheda dei ritardatari ("un'estrazione di 5 numeri su 90, come nel Lotto").

Da PowerShell, nella cartella del repository:
```powershell
Start-Process msedge ("file:///" + ((Resolve-Path app\index.html).Path -replace '\\','/') + "?demo=1")
```

## Percorso
1. Benvenuto → 2. Quiz prima (3 domande) → 3. La mia abitudine (default: Salvatore, 2 biglietti da 5 € al giorno = 10 €/giorno) → 4. Un anno in 10 secondi → 5. Capire i numeri (3 schede con mini-esperimento) → 6. Quiz dopo + domanda di trasferimento → 7. Cruscotto prima/dopo.

Novità della seconda versione:
- **Le vincite che non sono vincite** (schermata 4): ogni vincita compare come "HAI VINTO 5 €" e diventa il saldo reale ("Hai recuperato la giocata: guadagno netto 0 €."); a fine anno il riepilogo per classe (rimborso, piccole, più grandi del doppio).
- **Probabilità in cose fisiche** (schermata 4 e scheda A): "208 stadi da 60.000 posti pieni — e in tutti vincerebbe una sola persona", con la griglia degli stadi.
- **Dalla parte del banco** (pulsante in schermata 4): 10.000 persone con la stessa abitudine per un anno, quante in attivo, incasso del banco, perdita media e mediana; scala Italia 2024 (21,5 miliardi €, fonte ADM).
- **Vuoi parlarne con qualcuno?** (schermata 3): campo facoltativo per una soglia mensile scelta dall'utente; se la spesa la supera compaiono il Telefono Verde (`tel:800558822`) e un messaggio già scritto per una persona di fiducia (WhatsApp o email), che l'utente invia solo se vuole. Nulla viene salvato.
- **Pausa e Conto** (attiva di default, `?pausa=0` la nasconde): pulsante "Sto per comprare un biglietto" in testata; per 30 secondi (10 in demo) i numeri del biglietto scelto, poi "La scelta è tua."

Disclaimer e Telefono Verde Nazionale ISS (800 55 88 22) sono sempre visibili in testata e a piè di pagina.

## Test
```powershell
powershell -ExecutionPolicy Bypass -File app\tests\run-tests.ps1
```
Esegue `app/tests/tests.html` (test della logica di `src/motore.js`) in Edge headless; exit code diverso da 0 se un test fallisce (oggi 40 test, tutti verdi). In alternativa si apre `app/tests/tests.html` nel browser.

## Configurazione e segreti
Nessuna API key, nessuna variabile d'ambiente, nessun servizio esterno: tutti i calcoli sono deterministici e locali (zero token a runtime). I dati inseriti restano in memoria nella pagina e si perdono alla chiusura.

## Struttura
Vedi `ARCHITETTURA.md` (componenti e contratto API) e `tracciabilita.md` (BR → file → stato).
