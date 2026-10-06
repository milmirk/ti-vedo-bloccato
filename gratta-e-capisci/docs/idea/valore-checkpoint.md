# Checkpoint 14:05 — Fortuna in Chiaro: idea e valore

Fonti: `ricerca-azzardo.md` (§ citati). **[UFF]** fonte ufficiale · **[DERIV]** calcolo nostro su dati ufficiali · **stima nostra** = ipotesi non misurata.

## 1. Il valore per Salvatore (10 €/giorno = 2 biglietti da 5 €, 1.300 €/mese)
| Grandezza | Valore | Come si ottiene |
|---|---|---|
| Spesa annua | **3.650 €** | 10 € × 365 [DERIV] |
| Quota del reddito | **23,4%** | 3.650 / 15.600 € [DERIV] |
| Perdita attesa annua | **1.051 € – 1.456 €** (88–121 € al mese) | 3.650 × (1 − payout); payout 71,2% (modello A) e 60,1% (modello B), tabelle ADM §1 [UFF + DERIV] |
| Perdita attesa sul reddito | **6,7% – 9,3%** | 1.051–1.456 / 15.600 [DERIV] |
| Anni attesi per il premio massimo (500.000 €) | **~17.100 anni** (A) · **~10.500 anni** (B) | 12.480.000 o 7.680.000 / 730 biglietti l'anno [UFF + DERIV] |

Nota: §0 di `ricerca-azzardo.md` riporta "1.060–1.460 €"; il calcolo esatto dà 1.051–1.456 €. Nell'app va il valore esatto.

## 2. Il valore su scala
- **Platea** [ISS, Rapporti ISTISAN 19/28, §5]: **18 milioni** di adulti hanno giocato nell'ultimo anno; **1,4 milioni** a rischio moderato; **1,5 milioni** problematici (questi ultimi vanno al numero verde, non al simulatore).
- **Perdita netta nazionale** [ADM, Bilancio 2024, §4]: **21,5 miliardi €** nel 2024 → circa **1.190 € per giocatore all'anno** (21,5 mld / 18 mln, **stima nostra**: anni e perimetro delle due fonti non coincidono).
- **Ipotesi di impatto (stima nostra)**: *perdita resa visibile = giocatori raggiunti × % che arriva a 3/3 × perdita attesa media*.
  Esempio: 1% dei giocatori raggiunti (180.000) × 70% che capisce (126.000) × 1.190 € = **~150 milioni € l'anno di perdite rese consapevoli**. Non sono risparmi: lo strumento non dà consigli (T2-V3), mostra i numeri.

## 3. KPI
**Misurati nella demo**: quiz da **1/3 a 3/3**; domanda di trasferimento su un biglietto mai visto (**no → sì**); payout calcolato dall'app = tabella ADM (test automatici verdi); percorso completo in meno di 3 minuti.
**Post-hackathon**: delta medio del quiz su utenti reali; tenuta a 30 giorni (stesso quiz); % che completa il percorso; aperture della scheda numero verde (contatore anonimo, nessun dato personale); pilota con un ente (SerD, associazioni di consumatori).

## 4. Autovalutazione sui 4 criteri ufficiali
| Criterio | Atteso (1–5) | Rischio principale | Mitigazione |
|---|---|---|---|
| Innovatività | 3,5 | Esistono già calcolatori di probabilità | Puntare su "un anno in 10 secondi" + quiz prima/dopo con trasferimento |
| Messa a terra | 4 | Lotto non verificato su pagina ADM; manca il biglietto da 10 € | Usare solo i modelli A/B ufficiali, Lotto come principio di indipendenza |
| Efficacia della demo | 4 | Demo stretta nei 5 minuti, animazione che non parte | Seme fisso, modalità demo, video di riserva |
| Uso dei token | 4,5 | Il risparmio in sviluppo non è documentato | Zero token a runtime; mostrare modello per ruolo e hook |

**3 domande per l'utente**
1. **Perimetro**: togliamo il biglietto da 10 € e i numeri del Lotto (non verificati su ADM), tenendo i modelli A/B e il simulatore dei ritardatari?
2. **Enfasi della demo**: puntiamo tutto su "un anno in 10 secondi" e sul confronto prima/dopo, riducendo i ritardatari a 20 secondi?
3. **Valore su scala**: mostriamo nel pitch la stima dei 150 milioni € (dichiarata come stima nostra) o restiamo solo sui numeri di Salvatore?

## 5. Bozza del pitch (5 minuti, demo compresa)
1. **0:00 Titolo** — "Fortuna in Chiaro", Tema 02.
2. **0:15 Salvatore (Deliverable 01)** — chi è, cosa crede, 3.650 € l'anno, il 23% del reddito.
3. **0:45 Il problema** — 18 mln di giocatori, 21,5 mld € persi nel 2024 (ISS, ADM).
4. **1:05 La soluzione** — simulatore + 3 concetti + quiz; solo numeri, nessun consiglio.
5. **1:20 DEMO live (2'10")** — quiz 1/3 → un anno in 10 secondi → ritardatari → quiz 3/3 + trasferimento.
6. **3:30 Prima/Dopo (Deliverable 02)** — "prima o poi vinco" contro "perdo 1.051 €, premio massimo ogni 17.000 anni"; 1/3 → 3/3.
7. **3:50 Risk & Clarity Note (Deliverable 03)** — cosa è semplificato, cosa non è alterato, nessun giudizio.
8. **4:10 Struttura agentica** — 5 agenti, flusso con 2 verifiche umane, rules, skill, hook.
9. **4:40 Token e AI** — modello per ruolo, zero token a runtime, costo per utente nullo.
10. **4:50 Chiusura** — valore su scala, numero verde 800 55 88 22, link al repository.
