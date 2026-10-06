---
name: istruzioni-multilingue-semplici
description: Regole per scrivere istruzioni, suggerimenti e spiegazioni per genitori che imparano il registro elettronico - italiano semplice, arabo standard moderno e inglese a livello A2, con le parole del registro citate in italiano e forme neutre rispetto al genere. Usala quando scrivi o rivedi i18n.js, glossary.js, le spiegazioni delle comunicazioni o il system prompt di "Registro amico".
---

# Scrivere un aiuto che insegna, in tre lingue

Chi legge sta imparando due cose insieme: **a usare il registro** e **le parole della scuola italiana**. L'aiuto è nella sua lingua; il registro resta in italiano. Il testo deve fare da ponte.

## Le regole

1. **Una sola azione per frase, la prossima.** "Premi «Assenze» nel menu del registro." Non "Vai su Assenze, poi scegli…, poi…".
2. **La parola del registro tra «», in italiano, sempre.** Anche dentro l'arabo e l'inglese: «Giustifica», «Presa visione», «Completo». È così che la persona la ritrova sullo schermo. Le tre versioni hanno le stesse parole tra «».
3. **Spiega la parola la prima volta.** "«Ritardo», أي تأخّر" · "«Libero» (free)". Poi basta la parola italiana.
4. **Livello A2.** Frasi brevi, parole comuni, presente indicativo. Niente burocratese: "consegnare il modulo", non "provvedere alla consegna della modulistica".
5. **Feedback sugli errori senza colpa.** Di' cosa è successo e cosa serve: "Questo è un «Ritardo»: Youssef è entrato tardi. Serve l'«Assenza» del 01/10/2026." Mai "hai sbagliato".
6. **Neutralità di genere** (l'app è per madri e padri):
   - arabo: «يُرجى» + nome verbale per le istruzioni ("يُرجى الضغط على «Assenze»"), frasi descrittive per i suggerimenti ("زرّ «Giustifica» تحت الجدول"), forme che si scrivono uguali al maschile e al femminile (يمكنك، لقد نجحت). Evita اضغط / اضغطي;
   - italiano: forme senza genere ("Ce l'hai fatta senza aiuto", "In autonomia");
   - inglese: già neutro.
7. **Date, orari e numeri identici all'originale**, in cifre 0-9 anche in arabo, orari a 24 ore. In arabo i mesi come «أكتوبر».
8. **Fedeltà.** Non aggiungere obblighi, scadenze, costi o conseguenze. Se la comunicazione dice "possono votare", non scrivere "devi votare".
9. **Nessuna consulenza.** Si spiega il registro e la comunicazione, non si consiglia cosa decidere su salute, legge o burocrazia.
10. **Arabo da far rivedere.** Ogni testo arabo nuovo è una bozza finché una persona madrelingua non l'ha letto.

## Esempi

| Situazione | Da evitare | Meglio |
|---|---|---|
| Istruzione, livello 1 (ar) | "اضغط على الغيابات" (maschile, e traduce il pulsante) | "يُرجى الضغط على «Assenze» في قائمة السجلّ." |
| Errore: orario pieno (it) | "Errore: slot non disponibile." | "Questo orario è «Completo»: lo ha già preso un altro genitore. Scegli un orario «Libero»." |
| Suggerimento, livello 2 (en) | "Click the button to proceed." | "Below the table you can see the absence details. The button is «Giustifica»." |
| Spiegazione di una comunicazione (ar) | "الرحلة في 21 أكتوبر" (data cambiata) | "يوم الثلاثاء 20 أكتوبر 2026 … اللقاء أمام المدرسة الساعة 8:00." |
| Fine al livello 3 (it) | "Brava, sei stata bravissima!" | "Ce l'hai fatta senza aiuto!" |

## Il controllo automatico

`npm test` verifica che ogni chiave esista nelle tre lingue, che le parole tra «» siano uguali e presenti nel registro, che i testi arabi siano in caratteri arabi e che le spiegazioni non contengano date o numeri assenti dall'originale. Non verifica la grammatica né il tono: per quello servono il subagente `translation-fidelity-reviewer` e, per l'arabo, una persona madrelingua.
