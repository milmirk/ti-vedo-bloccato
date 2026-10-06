# Idea selezionata: "Fortuna in Chiaro"

> **CONFERMATA dall'utente il 05/10/2026 alle 12:45** (verifica umana registrata in `docs/governance/stato-avanzamento.md`).
> Percorso di scelta: 6 idee iniziali (`idee-valutate.md`), 5 idee sul target NEET (`idee-neet.md`, con dati in `ricerca-neet.md`), rivalutazione finale sui 4 criteri ufficiali con 2 idee nuove. La proposta precedente (3A "Palestra Digitale") è nello storico git.
> Numeri e tabelle premi: `ricerca-azzardo.md` (in corso di verifica). **Nessun numero entra nell'app o nel pitch se non è lì con fonte.**

## In una frase
Un simulatore educativo che mostra a chi gioca ogni giorno **quanto costa davvero sperare**: un anno di gioco in 10 secondi, con le probabilità ufficiali, e i concetti per capirlo da solo.

## Tema e scenario
- **Tema 02 — Inclusione Finanziaria.** Scenari del vincolo T2-V1: **simulazione di una scelta quotidiana** (la spesa giornaliera di gioco) e **comprensione di costi** (quanto si perde in media).
- Un solo tema (C-01): niente capability o deliverable presi da altri temi.

## Persona (User Difficulty Statement)
**Salvatore, 52 anni, autista, circa 1.300 € al mese.** Ogni giorno spende circa 10 € tra lotterie istantanee e lotto: "prima o poi tocca a me", "quel numero è in ritardo, deve uscire". Non ha mai fatto il conto di quanto spende in un anno, non sa che probabilità ha di vincere il premio massimo e crede che un numero "ritardatario" sia più probabile. **Difficoltà**: bassa alfabetizzazione finanziaria e statistica su una spesa quotidiana che pesa sul suo budget. **Perché è rilevante**: il gioco pesa di più su redditi e titoli di studio bassi (dati in `ricerca-azzardo.md`).

## Caso d'uso (cosa sviluppiamo)
1. **Benvenuto** — "Fortuna in Chiaro" (nome del progetto, scelto dall'utente). Tono non giudicante.
2. **Quiz prima** (3 domande a scelta multipla, punteggio registrato):
   - quanto spendi in un anno giocando 10 € al giorno;
   - che probabilità hai di vincere il premio massimo di un biglietto;
   - un numero che non esce da 100 estrazioni ha più probabilità di uscire?
3. **La mia abitudine** — scelgo i giochi (lotteria istantanea da 5 €, da 10 €, lotto) e quante volte al giorno/settimana → spesa giornaliera, mensile, annuale.
4. **Un anno in 10 secondi** — simulazione animata giorno per giorno con le **probabilità ufficiali** e generatore pseudo-casuale con seme fisso (riproducibile in demo). Contatori: speso, vinto, perso. In parallelo il **valore atteso esatto** ("in media, su 100 € giocati ne tornano X"). Messaggio finale: "Per vincere il premio massimo una volta, in media, dovresti giocare per N anni".
5. **Capire i numeri** — 3 schede brevi, ciascuna con un mini-esperimento:
   - probabilità ("1 su N" reso visibile);
   - valore atteso (perché "in media" si perde);
   - estrazioni indipendenti (simulatore dei "ritardatari": la probabilità resta uguale).
6. **Quiz dopo** (stesse 3 domande + 1 di trasferimento su un biglietto **mai visto**: "un biglietto da 2 € con payout X%: quanto perdi in media su 100 giocate?") → confronto prima/dopo.
7. **Sempre visibili**: "Strumento educativo: mostra numeri e significati, non dà consigli" + numero verde nazionale per il gioco d'azzardo (dato verificato in `ricerca-azzardo.md`).

## Leve di innovazione (approvate dall'utente, circa 13:00)

Aggiunte al caso d'uso per rafforzare innovatività, impatto e narrativa. Dati già disponibili in `ricerca-azzardo.md` §1 (tabelle ADM complete). BR proposti in continuità con BR-01..BR-12 (da formalizzare a cura di `business`).

| Leva | Cosa fa | Dato ufficiale (ricalcolato) | BR proposto |
|---|---|---|---|
| **L1 — Le vincite che non sono vincite** | Quando un biglietto simulato "vince", l'app mostra il saldo reale: se il premio è il rimborso della giocata, "HAI VINTO 5 €" diventa "hai recuperato la giocata: guadagno 0 €". Riepilogo: quante vincite erano solo rimborso o poco più | Modello A: vince il 23,8% dei biglietti (1 su 4,2); il **38,5%** delle vincite è il rimborso da 5 € (4.576.000 su 11.893.456) e il **79,4%** è da 5 o 10 € | **BR-13** (motore: classificazione vincite rimborso / piccole / reali; UI: messaggio e riepilogo) |
| **L2 — Dalla parte del banco** | Un tasto passa dalla vista di Salvatore a **10.000 persone come lui** per un anno (stesso motore, seme fisso): quante finiscono in attivo, quanto incassa il banco. Poi la scala Italia: 21,5 miliardi persi nel 2024 | Payout A 71,2%, B 60,1%; perdita netta Italia 2024: 21,5 mld € [UFF-sec] | **BR-14** (motore: simulazione multi-giocatore; UI: vista aggregata) |
| **L3 — Probabilità in cose fisiche** | Ogni "1 su N" è tradotto in una scala tangibile: "servirebbero **208 stadi da 60.000 posti** pieni, e in tutti vincerebbe **una sola persona**"; "con 2 biglietti al giorno, in media **una vincita del premio massimo ogni circa 17.000 anni**" | 12.480.000 / 60.000 = 208; 12.480.000 / 730 ≈ 17.096 anni (modello A) | **BR-15** (motore: conversioni; UI: nel passo "Un anno in 10 secondi" e nella scheda Probabilità) |
| **L4 — Hook guardrail del Tema 02** | Un hook PreToolUse blocca la scrittura in `app/` di testi con formule da consiglio o giudizio (es. "conviene", "ti consiglio", "smetti", "gioca meno", "dovresti smettere/giocare meno"). Il divieto T2-V3 diventa un **controllo automatico** dimostrabile nella presentazione (pattern hooks richiesto dalla valutazione) | — | Rafforza **BR-11** (criterio di accettazione: hook attivo e provato; test che scansiona i testi dell'app) |

Note:
- **L3 e L4**: le frasi dell'app vanno formulate senza "dovresti" ("servirebbero…", "in media…"), così il guardrail non dà falsi positivi. La lista delle formule vietate va tenuta stretta e provata su un caso positivo e uno negativo.
- **Fuori**: L5 (test di verifica incrociata sui dati ufficiali) solo se avanza tempo, come criterio aggiuntivo di BR-09; L6 ("Il mio conto" stampabile) non adottata.

## Change request (approvate dall'utente, circa 13:10)

| CR | Cosa fa | Perché è compatibile con il Tema 02 | BR proposto | Priorità |
|---|---|---|---|---|
| **CR1 — "Vuoi parlarne con qualcuno?"** | Nel passo "La mia abitudine" Salvatore **sceglie lui** una soglia di spesa mensile (es. 100 €). Se la sua abitudine la supera compare il pannello: **numero verde ISS 800 55 88 22** (tocco per chiamare, `tel:`) e un **messaggio già scritto per una persona di fiducia** (link WhatsApp/`mailto:` con testo precompilato) che **invia solo lui**, se vuole | La soglia è un **budget scelto dall'utente**, non una diagnosi di rischio. Nessun invio automatico, nessun contatto di terzi salvato, nessun dato fuori dal browser (BR-12). Testo neutro, verificato dall'hook L4 | **BR-16** | Should |
| **CR2 — "Pausa e Conto"** (versione educativa dell'agente del craving) | Un tasto **"Sto per comprare un biglietto"**: per 30 secondi l'app mostra i numeri **di quel biglietto** (perdita media attesa, quota di vincite che sono solo rimborso, probabilità del premio massimo in scala L3). Poi "La scelta è tua" | È una **decisione informata** (focus del Tema 02), non un esercizio clinico contro l'impulso e non un'indicazione su cosa comprare (T2-V3, BR-11) | **BR-17** | Could: **go/no-go al checkpoint delle 14:05** |

### Visione "Fase 2" (solo slide, fuori dal MVP)
L'architettura multi-agente **del prodotto** proposta dal team va nella presentazione come **visione**, in una slide separata e chiaramente distinta dalla **struttura agentica di sviluppo** (`agents/`), che è quella valutata dall'hackathon.

| Agente proposto | Nel MVP | In Fase 2 |
|---|---|---|
| Analista (quadro economico) | **Sì**: è il motore deterministico (spesa, perdita attesa, quota del reddito) | Aggiornamento sui movimenti reali, con consenso |
| Escalation verso un umano | **In forma leggera**: CR1, attivata da Salvatore | Passaggio a SerD, psicologo, Telefono Verde ISS con protocollo clinico |
| Craving | **In forma educativa**: CR2 "Pausa e Conto", attivata da Salvatore | Interventi nei momenti a rischio (venerdì sera, partite, giorno di paga) con esercizi validati clinicamente |
| Coach (colloquio motivazionale) | No | Con supervisione clinica |
| Debiti (piano di rientro, composizione della crisi) | No: sarebbe consulenza finanziaria e legale personalizzata (T2-V3) | Con sportelli e organismi competenti |
| Barriere (autoesclusione ADM, blocchi bancari, rimozione app) | No: il gioco online è fuori perimetro | Guida passo passo alle procedure ufficiali |

**Prerequisiti dichiarati per la Fase 2**: backend e modello AI a runtime, partnership clinica (SerD, ISS), validazione dell'efficacia, consenso esplicito al trattamento di dati sanitari (GDPR art. 9), valutazione del costo in token.

## Miglioramento misurabile (T2-V2)
- Quiz: da 0–1/3 prima a 3/3 dopo.
- Trasferimento: calcola da solo la perdita attesa di un biglietto nuovo (no → sì).
- Il cruscotto finale mostra i due punteggi a confronto.

## Mappatura sui deliverable del tema (dentro presentazione e demo, R-09)
| Deliverable | Come lo copriamo |
|---|---|
| 01 User Difficulty Statement | Salvatore: chi è, cosa crede, quanto spende, perché conta (numeri ufficiali) |
| 02 Before / After Simplicity Evidence | Prima: "10 € al giorno, prima o poi vinco". Dopo: "3.650 € in un anno, me ne tornano in media X, premio massimo 1 volta ogni N anni" + quiz 1/3 → 3/3 |
| 03 Risk & Clarity Note | Cosa è semplificato (un anno simulato, giochi selezionati), cosa non è alterato (probabilità e premi ufficiali, citati), come si evita ambiguità (valore atteso esatto accanto alla simulazione; nessun consiglio; nessun giudizio) |

## Vincoli e guardrail
- **T2-V3**: mai consigli, mai "smetti", "gioca meno" o "conviene": solo numeri e significati. La decisione resta a Salvatore.
- **Non è un servizio clinico**: nessuna valutazione di dipendenza; solo il rimando al numero verde ufficiale.
- **Nessun marchio commerciale**: "lotteria istantanea da 5 €" con struttura premi ufficiale citata come fonte.
- **T2-E4**: probabilità e premi identici alla fonte ufficiale; arrotondamenti dichiarati.
- **Nessun dato personale** salvato fuori dal browser.

## Perimetro MVP
**Dentro**: le 7 schermate sopra; modulo di calcolo (spesa, valore atteso, probabilità) e simulatore con seme fisso, entrambi con test; dati dei giochi in JSON con fonte; quiz con punteggio; cruscotto prima/dopo; modalità demo (seme fisso, animazione rapida).
**Dentro anche**: leve L1–L4 e CR1 (BR-13..BR-16); CR2 (BR-17) se approvata al checkpoint delle 14:05.
**Fuori**: slot e gioco online, scommesse sportive, dati reali dell'utente, profilazione del rischio di dipendenza, invii automatici a terzi, account, LLM a runtime, agenti runtime della "Fase 2".

## Strategia AI
Claude Code (team agentico in `.claude/agents/`) usato in fase di sviluppo per ricerca, codice, testi e test; **zero token a runtime**: l'app è logica deterministica su dati ufficiali, quindi nessuna chiave API nel browser e costo per utente nullo. Revisione umana su numeri, testi e tono.

## Demo (circa 2'30", aggiornata con le leve L1–L3)
1. 0:00–0:15 — Salvatore e il quiz prima (1/3).
2. 0:15–0:50 — La sua abitudine e **un anno in 10 secondi**: i contatori corrono; "208 stadi, una sola persona vince" (L3).
3. 0:50–1:15 — **"HAI VINTO!"… era solo il rimborso**: saldo reale e riepilogo delle vincite finte (L1).
4. 1:15–1:45 — **Dalla parte del banco**: 10.000 Salvatori, quanti in attivo, quanto incassa il banco; 21,5 miliardi in Italia (L2).
5. 1:45–2:20 — Quiz dopo 3/3 + trasferimento sul biglietto nuovo; cruscotto prima/dopo; Risk & Clarity Note.
6. 2:20–2:30 — Chiusura con CR1: la soglia scelta da Salvatore è superata, compare "Vuoi parlarne con qualcuno?" con il numero verde. (Se BR-17 è approvato, "Pausa e Conto" si mostra al posto del passo 4 o in 10 secondi prima della chiusura.)
- Il simulatore dei ritardatari resta nella scheda "Capire i numeri" ma esce dal copione della demo per tempo.
- Nella parte di presentazione sulla struttura agentica: **L4**, il guardrail del Tema 02 applicato da un hook.

## Rischi
| Rischio | Mitigazione |
|---|---|
| Tema delicato davanti alla giuria | Tono educativo e non giudicante; dati ufficiali; rimando al numero verde |
| Tabella premi ufficiale non reperibile per intero | Usare payout medio e probabilità del premio massimo ufficiali, dichiarando la semplificazione nella Risk & Clarity Note |
| Simulazione percepita come "truccata" | Valore atteso esatto mostrato accanto; seme fisso dichiarato; test automatici sui calcoli |
