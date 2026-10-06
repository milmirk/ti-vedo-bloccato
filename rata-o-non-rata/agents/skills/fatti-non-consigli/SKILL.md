---
name: fatti-non-consigli
description: Regole per scrivere testi sui soldi rivolti a una persona con poca dimestichezza finanziaria - fatti verificabili, nessun consiglio, fedeltà alle email, italiano semplice e neutro. Usala quando scrivi o rivedi frasi generate, glossario, quiz, testi dell'interfaccia o il prompt dell'agente di "Rata o non rata".
---

# Scrivere di rate senza consigliare

Chi legge è giovane, con un primo lavoro e poca esperienza di finanza. Vuole sapere **quanto e quando**, non sentirsi giudicata. Lo strumento è educativo: mostra i fatti e lascia la scelta alla persona.

## Le regole

1. **Un fatto alla volta, con il suo numero.** "A novembre paghi 245,37 € in 8 rate." Non "novembre è un mese difficile".
2. **Mai dire cosa fare con i soldi.** Vietati: "ti conviene", "ti consiglio", "è meglio", "dovresti", "evita", "valuta se". Vale anche per le domande retoriche ("Sei sicura?").
3. **Niente giudizi.** Niente "troppo", "tanto", "rischioso", "attenzione", né colori da allarme. Un mese sopra la soglia è "sopra il tuo avviso", non "in rosso".
4. **La soglia è della persona.** Si scrive "Hai scelto un avviso sopra il 20%", mai "la soglia consigliata". Di base nessun avviso.
5. **Fedeltà alle email.** Penali, costi e condizioni si riportano solo copiando la frase dell'email, tra virgolette. Se le email non ne parlano, si dice proprio questo: "Nelle email di DividiPay che hai caricato non si parla di penali."
6. **Precisione delle parole.** "Ogni 30 giorni" non è "ogni mese"; "importo totale dovuto" non è "importo finanziato" se l'email li distingue.
7. **Parole semplici.** Frasi brevi; un termine tecnico solo con la sua spiegazione accanto.
8. **Linguaggio neutro** rispetto al genere: "Hai scelto", "Quanto ti entra".
9. **La simulazione è una simulazione.** "Le rate sarebbero…", al condizionale, e mai una conclusione.

## Esempi

| Situazione | Da evitare | Meglio |
|---|---|---|
| Mese sopra la soglia | "Attenzione! A novembre spendi troppo." | "A novembre le rate sono il 34% di quello che entra. Hai scelto un avviso sopra il 20%." |
| Nessuna soglia scelta | "Ti consigliamo un limite del 20%." | "Scegli tu se e quando avere un avviso." |
| Simulazione | "Meglio aspettare dicembre." | "A novembre le rate sarebbero 285,37 € invece di 245,37 € (+40,00 €)." |
| Penale | "Se paghi in ritardo ti costa 5 €." | «In caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.» (email di Rateo) |
| Quiz, risposta sbagliata | "Sbagliato!" | "Non ancora. Il mese con più rate è novembre 2026: 245,37 € in 8 rate." |

## Come si controlla

`app/test/insights.test.mjs` cerca le espressioni vietate nelle frasi generate, nel quiz, nel glossario e nei testi dell'interfaccia. Il subagente `neutral-language-reviewer` controlla anche i casi che un test non può vedere (tono, giudizi impliciti, precisione).
