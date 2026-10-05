---
name: plain-italian-hints
description: Regole per scrivere un suggerimento rivolto a una persona bloccata su un servizio digitale - italiano semplice, una sola azione, fedele alla pagina. Usala quando scrivi o rivedi il system prompt dell'agente, i suggerimenti a regole o i testi dell'interfaccia di "Ti vedo bloccato".
---

# Scrivere un suggerimento che sblocca

Chi lo legge è già in difficoltà: stanco, distratto o confuso. Ogni parola in più è un ostacolo.

## Le regole

1. **Una sola azione, la prossima.** "Spunta la casella «Dichiaro…»", non "Controlla i dati, poi spunta…, poi premi…".
2. **Il nome esatto, tra «».** Chiama gli elementi come la pagina: «Mese successivo», non "la freccetta". Così la persona li ritrova, e il server può verificare che esistano.
3. **Prima cosa fare, poi perché.** "Premi «Mese successivo»: questo mese non ha posti liberi" funziona meglio della versione rovesciata quando il perché è lungo.
4. **Massimo circa 30 parole**, frasi brevi, dai del tu.
5. **Mai colpevolizzare.** "Il campo non è ancora giusto", non "hai sbagliato".
6. **Linguaggio neutro** rispetto al genere: "Eccoti di nuovo", non "Bentornato".
7. **Niente etichette sulla persona.** Non nominare diagnosi o difficoltà (ADHD, stanchezza): si parla della pagina, non di chi la usa.
8. **Fedeltà.** Non aggiungere requisiti, documenti, scadenze o promesse che la pagina non riporta. Spiega solo formati universali (16 caratteri del codice fiscale, la @ dell'email) e solo se riguardano quel campo.
9. **Nessuna consulenza.** Aiuta a usare la pagina, non a decidere questioni legali, sanitarie, fiscali o finanziarie.

## Esempi

| Segnale | Da evitare | Meglio |
|---|---|---|
| dead_click su «Conferma prenotazione» | "Il pulsante è disabilitato perché il form non è valido." | "«Conferma prenotazione» si attiva solo dopo che spunti la casella «Dichiaro di aver preso visione…»." |
| field_error sul codice fiscale | "ERR_CF_016: formato non conforme." | "Il campo «Codice fiscale» non è ancora giusto. Ha 16 caratteri: copialo dalla tessera sanitaria, senza spazi." |
| return_after_away | "Bentornato! Ecco i passi rimanenti: 1)… 2)… 3)…" | "Eccoti di nuovo! Eri a «Dati del richiedente». Ora compila «Cognome»." |
| dead_click su un giorno grigio | "Selezionare una data disponibile." | "Questo giorno non ha posti liberi. Premi «Mese successivo» per vedere altre date." |

## Il "perché" (campo `why`)

Una frase rivolta alla persona che spiega cosa abbiamo notato, senza giudizio: "Hai cliccato più volte «Avanti», ma è ancora disattivato." Serve alla trasparenza: la persona deve sempre poter capire perché il compagno è intervenuto.
