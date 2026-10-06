/*
 * Registro amico — glossario delle parole della scuola.
 *
 * Ogni voce: la parola come appare nel registro (`term`), le forme da
 * riconoscere nel testo (`forms`), e la spiegazione in italiano semplice,
 * arabo e inglese. Le spiegazioni sono brevi (livello A2) e descrivono la
 * parola, non danno consigli.
 *
 * L'ARABO VA RIVISTO DA UNA PERSONA MADRELINGUA prima di un uso reale.
 * In arabo usiamo forme neutre (nomi verbali, terza persona) per rivolgerci
 * a qualsiasi genitore, madre o padre.
 *
 * Modulo puro (nessun DOM): lo usano il browser e i test.
 */

export const GLOSSARY = [
  {
    id: "registro-elettronico", term: "registro elettronico", forms: ["registro elettronico"],
    it: { def: "Il sito della scuola per le famiglie: assenze, voti e comunicazioni." },
    ar: { term: "السجلّ الإلكتروني", def: "موقع المدرسة للعائلات: الغيابات والعلامات والإعلانات." },
    en: { term: "electronic register", def: "The school's website for families: absences, marks and notices." },
  },
  {
    id: "assenza", term: "assenza", forms: ["assenza", "assenze"],
    it: { def: "Un giorno in cui lo studente non va a scuola." },
    ar: { term: "غياب", def: "يوم لا يذهب فيه التلميذ إلى المدرسة." },
    en: { term: "absence", def: "A day when the pupil does not go to school." },
  },
  {
    id: "ritardo", term: "ritardo", forms: ["ritardo", "ritardi"],
    it: { def: "Lo studente entra a scuola dopo l'inizio delle lezioni." },
    ar: { term: "تأخّر", def: "دخول التلميذ إلى المدرسة بعد بداية الدروس." },
    en: { term: "late arrival", def: "The pupil arrives at school after lessons have started." },
  },
  {
    id: "uscita-anticipata", term: "uscita anticipata", forms: ["uscita anticipata", "uscite anticipate"],
    it: { def: "Lo studente esce da scuola prima della fine delle lezioni." },
    ar: { term: "خروج مبكّر", def: "خروج التلميذ من المدرسة قبل نهاية الدروس." },
    en: { term: "early exit", def: "The pupil leaves school before lessons end." },
  },
  {
    id: "da-giustificare", term: "da giustificare", forms: ["da giustificare"],
    it: { def: "La scuola aspetta ancora la giustificazione del genitore." },
    ar: { term: "بحاجة إلى تبرير", def: "المدرسة ما زالت تنتظر التبرير من وليّ الأمر." },
    en: { term: "to be justified", def: "The school is still waiting for the parent's justification." },
  },
  {
    id: "giustificazione", term: "giustificazione",
    forms: ["giustificazione", "giustificazioni", "giustificata", "giustificato", "giustificare"],
    it: { def: "Il messaggio del genitore che spiega alla scuola il motivo di un'assenza, di un ritardo o di un'uscita anticipata." },
    ar: { term: "تبرير الغياب", def: "رسالة من وليّ الأمر تشرح للمدرسة سبب الغياب أو التأخّر أو الخروج المبكّر." },
    en: { term: "justification (excuse note)", def: "A message from the parent that tells the school the reason for an absence, a late arrival or an early exit." },
  },
  {
    id: "colloquio", term: "colloquio", forms: ["colloquio", "colloqui"],
    it: { def: "Un incontro breve tra genitore e insegnante per parlare dello studente." },
    ar: { term: "لقاء مع الأستاذ", def: "لقاء قصير بين وليّ الأمر والأستاذ للحديث عن التلميذ." },
    en: { term: "parent–teacher meeting", def: "A short meeting between a parent and a teacher to talk about the pupil." },
  },
  {
    id: "presa-visione", term: "presa visione", forms: ["presa visione"],
    it: { def: "Un clic per dire alla scuola che hai letto la comunicazione." },
    ar: { term: "تأكيد الاطّلاع", def: "نقرة واحدة لإبلاغ المدرسة بأن الإعلان قد قُرئ." },
    en: { term: "read confirmation", def: "One click to tell the school that you have read the notice." },
  },
  {
    id: "bacheca", term: "bacheca", forms: ["bacheca"],
    it: { def: "La pagina con le comunicazioni della scuola per le famiglie." },
    ar: { term: "لوحة الإعلانات", def: "صفحة فيها إعلانات المدرسة للعائلات." },
    en: { term: "noticeboard", def: "The page with the school's notices for families." },
  },
  {
    id: "comunicazione", term: "comunicazione", forms: ["comunicazione", "comunicazioni"],
    it: { def: "Un avviso scritto della scuola." },
    ar: { term: "إعلان", def: "رسالة مكتوبة من المدرسة." },
    en: { term: "notice", def: "A written message from the school." },
  },
  {
    id: "pagella", term: "pagella", forms: ["pagella"],
    it: { def: "Il documento con i voti finali di ogni materia." },
    ar: { term: "كشف العلامات", def: "وثيقة فيها العلامات النهائية لكلّ مادة." },
    en: { term: "school report", def: "The document with the final marks for each subject." },
  },
  {
    id: "scrutinio", term: "scrutinio", forms: ["scrutinio", "scrutini"],
    it: { def: "La riunione degli insegnanti che decide i voti della pagella." },
    ar: { term: "اجتماع التقييم", def: "اجتماع الأساتذة لتحديد العلامات النهائية في كشف العلامات." },
    en: { term: "assessment meeting", def: "The teachers' meeting that decides the marks in the school report." },
  },
  {
    id: "quadrimestre", term: "quadrimestre", forms: ["quadrimestre", "quadrimestri"],
    it: { def: "Metà dell'anno scolastico. L'anno ha 2 quadrimestri." },
    ar: { term: "الفصل الدراسي", def: "نصف السنة الدراسية. في السنة فصلان دراسيان." },
    en: { term: "term (half of the school year)", def: "Half of the school year. The year has 2 terms." },
  },
  {
    id: "voto", term: "voto", forms: ["voto", "voti"],
    it: { def: "Un numero che dice com'è andata una prova. Da 6 in su è sufficiente." },
    ar: { term: "العلامة", def: "رقم يبيّن نتيجة الاختبار. العلامة 6 أو أكثر تعني النجاح." },
    en: { term: "mark", def: "A number that shows how a test went. 6 or more is a pass." },
  },
  {
    id: "media", term: "media", forms: ["media"],
    it: { def: "Il voto medio di una materia: si calcola con tutti i voti." },
    ar: { term: "المعدّل", def: "متوسّط كلّ العلامات في مادة واحدة." },
    en: { term: "average", def: "The average of all the marks in one subject." },
  },
  {
    id: "verifica", term: "verifica", forms: ["verifica", "verifiche", "scritto"],
    it: { def: "Un compito in classe, di solito scritto, per controllare cosa ha imparato lo studente." },
    ar: { term: "اختبار كتابي", def: "اختبار في الصفّ، كتابي في العادة، لمعرفة ما تعلّمه التلميذ." },
    en: { term: "written test", def: "A test in class, usually written, to check what the pupil has learned." },
  },
  {
    id: "interrogazione", term: "interrogazione", forms: ["interrogazione", "interrogazioni", "orale"],
    it: { def: "Lo studente risponde a voce alle domande dell'insegnante." },
    ar: { term: "اختبار شفهي", def: "يجيب التلميذ شفهيًّا عن أسئلة الأستاذ." },
    en: { term: "oral test", def: "The pupil answers the teacher's questions out loud." },
  },
  {
    id: "compiti", term: "compiti", forms: ["compiti per casa", "compiti"],
    it: { def: "Gli esercizi che lo studente deve fare a casa." },
    ar: { term: "الواجبات المنزلية", def: "تمارين يقوم بها التلميذ في البيت." },
    en: { term: "homework", def: "Exercises that the pupil has to do at home." },
  },
  {
    id: "nota-disciplinare", term: "nota disciplinare", forms: ["nota disciplinare", "note disciplinari"],
    it: { def: "Un messaggio scritto dell'insegnante quando lo studente non rispetta le regole della scuola." },
    ar: { term: "ملاحظة تأديبية", def: "رسالة مكتوبة من الأستاذ عندما لا يحترم التلميذ قواعد المدرسة." },
    en: { term: "disciplinary note", def: "A written note from a teacher when the pupil does not follow the school rules." },
  },
  {
    id: "coordinatore-di-classe", term: "coordinatore di classe", forms: ["coordinatore di classe", "coordinatrice di classe"],
    it: { def: "L'insegnante di riferimento della classe: tiene i contatti con le famiglie." },
    ar: { term: "منسّق الصفّ", def: "الأستاذ المسؤول عن الصفّ، وهو الذي يتواصل مع العائلات." },
    en: { term: "class coordinator", def: "The teacher in charge of the class, who keeps in touch with families." },
  },
  {
    id: "docente", term: "docente", forms: ["docente", "docenti"],
    it: { def: "Un insegnante della scuola." },
    ar: { term: "الأستاذ", def: "شخص يدرّس في المدرسة." },
    en: { term: "teacher", def: "A person who teaches at the school." },
  },
  {
    id: "uscita-didattica", term: "uscita didattica", forms: ["uscita didattica", "uscite didattiche"],
    it: { def: "Una gita con la classe, di solito di un giorno, per imparare fuori dalla scuola." },
    ar: { term: "رحلة مدرسية", def: "خروج مع الصفّ، ليوم واحد في العادة، للتعلّم خارج المدرسة." },
    en: { term: "school trip", def: "A trip with the class, usually for one day, to learn outside school." },
  },
  {
    id: "autorizzazione", term: "autorizzazione", forms: ["autorizzazione"],
    it: { def: "Il permesso scritto e firmato del genitore." },
    ar: { term: "إذن", def: "موافقة مكتوبة وموقَّعة من وليّ الأمر." },
    en: { term: "permission form", def: "Written, signed permission from the parent." },
  },
  {
    id: "rappresentante-genitori", term: "rappresentante dei genitori",
    forms: ["rappresentanti dei genitori", "rappresentante dei genitori"],
    it: { def: "Un genitore scelto dagli altri genitori per parlare con la scuola a nome di tutti." },
    ar: { term: "ممثّل أولياء الأمور", def: "وليّ أمر يختاره أولياء الأمور الآخرون للتحدّث مع المدرسة باسمهم." },
    en: { term: "parents' representative", def: "A parent chosen by the other parents to speak to the school for everyone." },
  },
  {
    id: "consiglio-di-classe", term: "consiglio di classe", forms: ["consiglio di classe", "consigli di classe"],
    it: { def: "La riunione degli insegnanti di una classe, a volte con i rappresentanti dei genitori." },
    ar: { term: "مجلس الصفّ", def: "اجتماع أساتذة الصفّ، وأحيانًا مع ممثّلي أولياء الأمور." },
    en: { term: "class council", def: "The meeting of a class's teachers, sometimes with the parents' representatives." },
  },
  {
    id: "sciopero", term: "sciopero", forms: ["sciopero"],
    it: { def: "Un giorno in cui alcune persone non lavorano per protesta. A scuola le lezioni possono cambiare." },
    ar: { term: "إضراب", def: "يوم يتوقّف فيه بعض العاملين عن العمل احتجاجًا. قد تتغيّر الدروس في المدرسة." },
    en: { term: "strike", def: "A day when some workers stop working as a protest. School lessons may change." },
  },
];

const BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));

export function termById(id) {
  return BY_ID.get(id) || null;
}

// La parola nella lingua scelta (in italiano: la parola del registro).
export function termIn(entry, lang) {
  if (lang === "it") return entry.term;
  return (entry[lang] && entry[lang].term) || entry.term;
}

export function defIn(entry, lang) {
  return (entry[lang] && entry[lang].def) || entry.it.def;
}

const FORM_TO_ID = new Map();
GLOSSARY.forEach((g) => g.forms.forEach((f) => FORM_TO_ID.set(f.toLowerCase(), g.id)));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALTS = [...FORM_TO_ID.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
const TERM_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${ALTS})(?![\\p{L}\\p{N}])`, "giu");

/*
 * Divide un testo in pezzi: { text } oppure { text, termId } per le parole
 * del glossario. `seen` evita di evidenziare la stessa parola più volte nella
 * stessa pagina (troppi link stancano).
 */
export function findTerms(text, seen = new Set()) {
  const s = String(text ?? "");
  const out = [];
  let last = 0;
  for (const m of s.matchAll(TERM_RE)) {
    const id = FORM_TO_ID.get(m[1].toLowerCase());
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[0], termId: id });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
