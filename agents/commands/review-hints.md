---
description: Revisione dei testi rivolti alla persona (prompt dell'agente, regole, interfaccia)
---

Lancia il subagente `hint-copy-reviewer` su tutti i testi rivolti alla persona.

Poi, per le correzioni che approvo, applica le modifiche e rilancia `cd app && npm test`: alcuni test controllano il testo esatto dei suggerimenti a regole e vanno aggiornati insieme.

Se cambia il system prompt (`agents/prompts/hint-agent.md`), riavvia il server: il prompt viene letto all'avvio.

$ARGUMENTS
