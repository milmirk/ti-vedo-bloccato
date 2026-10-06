/*
 * Registro amico — dati del registro di prova.
 *
 * Tutto è INVENTATO: scuola, docenti, voti e comunicazioni non esistono.
 * Il registro resta in italiano, come quelli veri: le etichette sono in `L`
 * e sono le stesse parole che l'aiuto cita tra «» (i test lo verificano).
 *
 * Modulo puro (nessun DOM): lo usano il browser, il server e i test.
 */

export const SCHOOL = {
  register: "Registro scuola – ambiente di prova",
  institute: "Istituto comprensivo «Via dei Tigli» (scuola inventata)",
  student: "Youssef",
  className: "1ª B",
  year: "2026/27",
  lastAccess: "05/10/2026 ore 19.42",
};

// Etichette del registro (pulsanti, colonne, stati). Una sola fonte di verità.
export const L = {
  nav: { home: "Home", assenze: "Assenze", voti: "Voti", colloqui: "Colloqui", bacheca: "Bacheca", pagella: "Pagella" },
  menu: "Menu del registro",
  open: "Apri",
  types: { assenza: "Assenza", ritardo: "Ritardo", uscita: "Uscita anticipata" },
  status: { pending: "Da giustificare", doneF: "Giustificata", doneM: "Giustificato" },
  justify: "Giustifica",
  reasonLegend: "Motivo",
  reasons: { salute: "Motivi di salute", famiglia: "Motivi di famiglia", altro: "Altro motivo" },
  notes: "Note (facoltative)",
  confirmJustify: "Conferma giustificazione",
  cancel: "Annulla",
  seeSlots: "Vedi orari",
  free: "Libero",
  full: "Completo",
  booked: "Prenotato",
  confirmBooking: "Conferma prenotazione",
  myMeetings: "I miei colloqui",
  read: "Leggi",
  toRead: "Da leggere",
  readDone: "Letta",
  ack: "Presa visione",
  ackRequired: "Presa visione richiesta",
  ackDone: "Presa visione effettuata",
  backToBoard: "Torna alla bacheca",
  seeGrades: "Vedi voti",
  allSubjects: "Tutte le materie",
  col: {
    date: "Data", type: "Tipo", detail: "Dettaglio", status: "Stato", action: "Azione",
    subject: "Materia", average: "Media", grade: "Voto", description: "Descrizione",
    teacher: "Docente", subjects: "Materie", reception: "Ricevimento", title: "Titolo", from: "Da",
  },
};

// Assenze, ritardi e uscite anticipate (dal più recente).
export const EVENTS = [
  { id: "ev-1005", date: "05/10/2026", type: "ritardo", detail: "Ingresso alle ore 8.25", justified: false },
  { id: "ev-1001", date: "01/10/2026", type: "assenza", detail: "Tutto il giorno", justified: false },
  { id: "ev-0924", date: "24/09/2026", type: "assenza", detail: "Tutto il giorno", justified: true },
  { id: "ev-0918", date: "18/09/2026", type: "uscita", detail: "Uscita alle ore 11.15", justified: true },
];

// Genere grammaticale del tipo di evento, per «Giustificata» / «Giustificato».
export function statusLabel(ev) {
  if (!ev.justified) return L.status.pending;
  return ev.type === "ritardo" ? L.status.doneM : L.status.doneF;
}

export const SUBJECTS = [
  { id: "italiano", name: "Italiano", grades: [
    { date: "25/09/2026", kind: "Orale", grade: "7", value: 7, desc: "Lettura ad alta voce" },
    { date: "03/10/2026", kind: "Scritto", grade: "8", value: 8, desc: "Tema: la mia nuova scuola" },
  ] },
  { id: "matematica", name: "Matematica", grades: [
    { date: "22/09/2026", kind: "Scritto", grade: "6½", value: 6.5, desc: "Verifica: i numeri naturali" },
    { date: "29/09/2026", kind: "Orale", grade: "6", value: 6, desc: "Interrogazione sulle potenze" },
    { date: "03/10/2026", kind: "Scritto", grade: "7", value: 7, desc: "Verifica: le potenze" },
  ] },
  { id: "inglese", name: "Inglese", grades: [
    { date: "30/09/2026", kind: "Orale", grade: "8", value: 8, desc: "Presentarsi in inglese" },
  ] },
  { id: "storia", name: "Storia", grades: [
    { date: "26/09/2026", kind: "Orale", grade: "6", value: 6, desc: "Il Medioevo" },
  ] },
  { id: "scienze", name: "Scienze", grades: [
    { date: "02/10/2026", kind: "Scritto", grade: "7½", value: 7.5, desc: "Verifica: la cellula" },
  ] },
  { id: "tecnologia", name: "Tecnologia", grades: [] },
];

export function average(subject) {
  if (!subject.grades.length) return "—";
  const avg = subject.grades.reduce((s, g) => s + g.value, 0) / subject.grades.length;
  return (Math.round(avg * 10) / 10).toString().replace(".", ",");
}

// Domanda del compito T4 e possibili risposte.
export const GRADE_QUESTION = { subject: "matematica", date: "03/10/2026", answer: "7", options: ["6", "6½", "7", "8"] };

export const TEACHERS = [
  { id: "t-conti", name: "Prof.ssa Laura Conti", subjects: "Italiano, Storia", role: "Coordinatrice di classe",
    day: "Lunedì 12/10/2026", start: "9.00", slots: [false, true, true, false, true, false] },
  { id: "t-bianchi", name: "Prof. Marco Bianchi", subjects: "Matematica, Scienze", role: "",
    day: "Martedì 13/10/2026", start: "10.00", slots: [false, false, true, false, true, true] },
  { id: "t-ferri", name: "Prof.ssa Giulia Ferri", subjects: "Inglese", role: "",
    day: "Mercoledì 14/10/2026", start: "11.00", slots: [true, false, true, true, false, true] },
  { id: "t-greco", name: "Prof. Paolo Greco", subjects: "Tecnologia", role: "",
    day: "Giovedì 15/10/2026", start: "8.00", slots: [false, true, false, true, true, false] },
];

// Ogni colloquio dura 10 minuti; `slots[i]` = true se l'orario è libero.
export function slotsOf(teacher) {
  const [h, m] = teacher.start.split(".").map(Number);
  return teacher.slots.map((free, i) => {
    const total = h * 60 + m + i * 10;
    const time = `${Math.floor(total / 60)}.${String(total % 60).padStart(2, "0")}`;
    return { id: `s-${teacher.id.slice(2)}-${time.replace(".", "")}`, teacher: teacher.id, time, free };
  });
}

export const FREE_SLOTS_BIANCHI = slotsOf(TEACHERS[1]).filter((s) => s.free).map((s) => s.id);

/*
 * Comunicazioni della bacheca. Ogni comunicazione ha una spiegazione già
 * scritta nelle 3 lingue: la app funziona anche senza AI. Le spiegazioni
 * passano dallo stesso controllo usato per l'AI (date, orari e numeri
 * uguali all'originale): lo verifica app/test/agent.test.mjs.
 * L'ARABO VA RIVISTO DA UNA PERSONA MADRELINGUA prima di un uso reale.
 */
export const NOTICES = [
  {
    id: "n-uscita",
    date: "06/10/2026",
    from: "Dirigenza scolastica",
    title: "Uscita didattica al Museo di Storia Naturale – classi prime",
    body: [
      "Si comunica che martedì 20 ottobre 2026 le classi prime parteciperanno a un'uscita didattica al Museo di Storia Naturale.",
      "Ritrovo davanti alla scuola alle ore 8.00. Il rientro è previsto per le ore 13.30.",
      "La quota di partecipazione è di 12 euro. Il modulo di autorizzazione firmato e la quota vanno consegnati al coordinatore di classe entro mercoledì 14 ottobre 2026.",
      "Si chiede ai genitori di confermare la lettura della presente comunicazione con la presa visione sul registro elettronico.",
    ],
    attachment: "Modulo_autorizzazione_uscita.pdf",
    ackRequired: true,
    ackDone: false,
    read: false,
    explanations: {
      it: {
        explanation: "Martedì 20 ottobre 2026 le classi prime, quindi anche la classe di Youssef, vanno al Museo di Storia Naturale con la scuola. Ci si trova davanti alla scuola alle ore 8.00. Il ritorno è alle ore 13.30. La gita costa 12 euro.",
        what_to_do: "Entro mercoledì 14 ottobre 2026 consegna al coordinatore di classe il modulo di autorizzazione firmato e i 12 euro. Poi premi «Presa visione» nel registro.",
        quotes: ["uscita didattica", "quota di partecipazione", "modulo di autorizzazione firmato", "presa visione"],
      },
      ar: {
        explanation: "يوم الثلاثاء 20 أكتوبر 2026 تذهب الصفوف الأولى، ومنها صفّ يوسف، في رحلة مدرسية إلى متحف التاريخ الطبيعي. اللقاء أمام المدرسة الساعة 8:00، والعودة الساعة 13:30. تكلفة الرحلة 12 يورو.",
        what_to_do: "المطلوب في موعد أقصاه يوم الأربعاء 14 أكتوبر 2026: تسليم ورقة الإذن الموقَّعة ومبلغ 12 يورو إلى منسّق الصفّ، ثم الضغط على «Presa visione» في السجلّ.",
        quotes: ["uscita didattica", "quota di partecipazione", "modulo di autorizzazione firmato", "presa visione"],
      },
      en: {
        explanation: "On Tuesday 20 October 2026 the first-year classes, including Youssef's class, go on a school trip to the Natural History Museum. Meet in front of the school at 8:00. The return is at 13:30. The trip costs 12 euros.",
        what_to_do: "By Wednesday 14 October 2026, give the signed permission form and the 12 euros to the class coordinator. Then press «Presa visione» in the register.",
        quotes: ["uscita didattica", "quota di partecipazione", "modulo di autorizzazione firmato", "presa visione"],
      },
    },
  },
  {
    id: "n-sciopero",
    date: "05/10/2026",
    from: "Dirigenza scolastica",
    title: "Sciopero del personale scolastico – venerdì 9 ottobre 2026",
    body: [
      "Si informano le famiglie che per venerdì 9 ottobre 2026 è stato indetto uno sciopero del personale della scuola.",
      "Non è possibile garantire il regolare svolgimento delle lezioni.",
      "I genitori sono invitati ad accompagnare i figli a scuola alle ore 8.00 e a verificare la presenza dei docenti. Le lezioni potrebbero terminare prima dell'orario consueto.",
    ],
    attachment: "",
    ackRequired: false,
    ackDone: false,
    read: false,
    explanations: {
      it: {
        explanation: "Venerdì 9 ottobre 2026 c'è uno sciopero: alcune persone che lavorano nella scuola possono non venire. Le lezioni possono essere diverse dal solito e finire prima.",
        what_to_do: "Venerdì 9 ottobre 2026 accompagna Youssef a scuola alle ore 8.00 e controlla se ci sono i docenti.",
        quotes: ["sciopero", "regolare svolgimento delle lezioni", "presenza dei docenti"],
      },
      ar: {
        explanation: "يوم الجمعة 9 أكتوبر 2026 يوجد إضراب لموظّفي المدرسة. قد لا تسير الدروس بشكل عادي، وقد تنتهي قبل الموعد المعتاد.",
        what_to_do: "المطلوب يوم الجمعة 9 أكتوبر 2026: مرافقة يوسف إلى المدرسة الساعة 8:00 والتأكّد من حضور الأساتذة.",
        quotes: ["sciopero", "regolare svolgimento delle lezioni", "presenza dei docenti"],
      },
      en: {
        explanation: "On Friday 9 October 2026 there is a strike of school staff. Lessons may not run as usual and may end earlier than normal.",
        what_to_do: "On Friday 9 October 2026, take Youssef to school at 8:00 and check that the teachers are there.",
        quotes: ["sciopero", "regolare svolgimento delle lezioni", "presenza dei docenti"],
      },
    },
  },
  {
    id: "n-assemblea",
    date: "02/10/2026",
    from: "Dirigenza scolastica",
    title: "Elezione dei rappresentanti dei genitori nei consigli di classe",
    body: [
      "Giovedì 22 ottobre 2026 si svolgeranno le elezioni dei rappresentanti dei genitori nei consigli di classe.",
      "Dalle ore 17.00 alle ore 18.00 si terrà l'assemblea dei genitori di ogni classe con il coordinatore di classe.",
      "Dalle ore 18.00 alle ore 19.00 si svolgeranno le votazioni nell'aula della classe.",
      "Possono votare tutti i genitori degli alunni della classe.",
    ],
    attachment: "",
    ackRequired: true,
    ackDone: true,
    read: true,
    explanations: {
      it: {
        explanation: "Giovedì 22 ottobre 2026 i genitori scelgono i rappresentanti dei genitori della classe. Dalle ore 17.00 alle ore 18.00 c'è una riunione dei genitori con il coordinatore di classe. Dalle ore 18.00 alle ore 19.00 si vota nell'aula della classe.",
        what_to_do: "Se vuoi, vai a scuola giovedì 22 ottobre 2026 e vota. Possono votare tutti i genitori della classe.",
        quotes: ["rappresentanti dei genitori", "consigli di classe", "assemblea dei genitori", "votazioni"],
      },
      ar: {
        explanation: "يوم الخميس 22 أكتوبر 2026 تُجرى انتخابات ممثّلي أولياء الأمور في مجالس الصفوف. من الساعة 17:00 إلى الساعة 18:00 اجتماع لأولياء أمور كلّ صفّ مع منسّق الصفّ. من الساعة 18:00 إلى الساعة 19:00 التصويت في قاعة الصفّ.",
        what_to_do: "يحقّ لجميع أولياء أمور تلاميذ الصفّ التصويت. يمكنك الحضور إلى المدرسة يوم الخميس 22 أكتوبر 2026 للتصويت.",
        quotes: ["rappresentanti dei genitori", "consigli di classe", "assemblea dei genitori", "votazioni"],
      },
      en: {
        explanation: "On Thursday 22 October 2026 parents elect their representatives in the class councils. From 17:00 to 18:00 there is a meeting of each class's parents with the class coordinator. From 18:00 to 19:00 parents vote in the classroom.",
        what_to_do: "All parents of the pupils in the class can vote. You can come to school on Thursday 22 October 2026 to vote.",
        quotes: ["rappresentanti dei genitori", "consigli di classe", "assemblea dei genitori", "votazioni"],
      },
    },
  },
];

export function noticeById(id) {
  return NOTICES.find((n) => n.id === id) || null;
}

// Il testo che la persona vede: è la base di ogni controllo di fedeltà.
export function noticeText(notice) {
  return [notice.title, `Pubblicata il ${notice.date}`, `${L.col.from}: ${notice.from}`, ...notice.body].join("\n");
}

// Tutte le parole del registro che l'aiuto può citare tra «».
export function registerLabels() {
  const out = new Set();
  const walk = (v) => {
    if (typeof v === "string") out.add(v);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(L);
  SUBJECTS.forEach((s) => out.add(s.name));
  TEACHERS.forEach((t) => { out.add(t.name); out.add(t.subjects); if (t.role) out.add(t.role); });
  NOTICES.forEach((n) => out.add(n.title));
  return [...out];
}

// Stato modificabile del registro: ogni tentativo riparte da qui.
export function freshRegisterState() {
  return {
    events: EVENTS.map((e) => ({ ...e })),
    notices: NOTICES.map((n) => ({ id: n.id, ackDone: n.ackDone, read: n.read })),
    bookings: [],
  };
}
