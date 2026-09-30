// Rules and scope are documented in ADMISSION-RULES.md. Confirmation is required.
export const normalize = value => String(value).toLocaleLowerCase('nb-NO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
const course = (id, label, type, points, extra = {}) => ({ id, label, type, points, ...extra });
const ordinary = ['Norsk', 'Engelsk', 'Matematikk', 'Naturfag', 'Historie', 'Samfunnsfag', 'Samfunnskunnskap', 'KRLE', 'Religion og etikk', 'Kroppsøving', 'Kunst og håndverk', 'Musikk', 'Mat og helse', 'Utdanningsvalg'];
const science = [
  ['s1', 'Matematikk S1', .5], ['s2', 'Matematikk S2', .5], ['r1', 'Matematikk R1', .5], ['r2', 'Matematikk R2', 1],
  ['fysikk1', 'Fysikk 1', .5], ['fysikk2', 'Fysikk 2', 1], ['kjemi1', 'Kjemi 1', .5], ['kjemi2', 'Kjemi 2', .5],
  ['biologi1', 'Biologi 1', .5], ['biologi2', 'Biologi 2', .5], ['geofag1', 'Geofag 1', .5], ['geofag2', 'Geofag 2', .5],
  ['it1', 'Informasjonsteknologi 1', .5], ['it2', 'Informasjonsteknologi 2', .5],
  ['tof1', 'Teknologi og forskningslære 1', .5], ['tof2', 'Teknologi og forskningslære 2', .5],
];
const languages = ['Albansk', 'Amharisk', 'Arabisk', 'Bosnisk', 'Bulgarsk', 'Dari', 'Estisk', 'Filipino', 'Finsk', 'Fransk', 'Hebraisk', 'Hindi', 'Islandsk', 'Italiensk', 'Japansk', 'Kantonesisk', 'Kinesisk', 'Koreansk', 'Kroatisk', 'Kurdisk (sorani)', 'Kurdisk (kurmanji)', 'Kvensk', 'Latvisk', 'Litauisk', 'Lulesamisk', 'Nederlandsk', 'Nordsamisk', 'Nygresk', 'Oromo', 'Panjabi', 'Pashto', 'Persisk', 'Polsk', 'Portugisisk', 'Rumensk', 'Russisk', 'Serbisk', 'Somali', 'Spansk', 'Sørsamisk', 'Tamil', 'Tegnspråk', 'Thai', 'Tigrinja', 'Tyrkisk', 'Tysk', 'Ukrainsk', 'Ungarsk', 'Urdu', 'Vietnamesisk'];
export const COURSE_CATALOG = [
  ...ordinary.map(label => course(`common-${normalize(label)}`, label, 'common', 0)),
  ...['1P', '1T', '2P', '2P-Y', 'X'].map(level => course(`math-${level}`, `Matematikk ${level}`, 'common', 0, { vgs: true })),
  course('geofagx', 'Geofag X', 'common', 0, { vgs: true }),
  course('tofx', 'Teknologi og forskningslære X', 'common', 0, { vgs: true }),
  ...science.map(([id, label, points]) => course(id, label, 'science', points, { vgs: true, family: /^[rs][12]$/.test(id) ? 'math' : id, aliases: `${id} ${label.startsWith('Matematikk') ? 'matte math' : ''} ${id.startsWith('it') ? 'IT' : ''}` })),
  ...languages.flatMap(language => [
    course(`${normalize(language)}-common`, `${language} · fellesfag`, 'common', 0, { language }),
    ...['I', 'II'].map((level, i) => course(`${normalize(language)}-common-${i + 1}`, `${language} ${level} · fellesfag`, 'common', 0, { vgs: true, language, level, aliases: `${language} ${i + 1}` })),
    ...['I', 'II', 'III'].map((level, i) => course(`${normalize(language)}-${i + 1}`, `${language} ${level} · programfag`, 'language', i === 2 ? 1 : .5, { vgs: true, language, level, requiresLanguagePair: true, aliases: `${language} ${i + 1} språk fremmedspråk` })),
  ]),
  ...['Latin', 'Gresk'].flatMap(language => ['I', 'II'].map((level, i) => course(`${language.toLowerCase()}-${i + 1}`, `${language} ${level} · programfag`, 'language', .5, { vgs: true, language, level, aliases: `${language} ${i + 1} språk` }))),
  course('naturbruk-vg3', 'Studieforberedende Vg3 naturbruk', 'naturbruk', .5, { vgs: true }),
  course('samisk-first', 'Samisk som førstespråk', 'samisk', 0, { vgs: true }),
];
export const getCourse = id => COURSE_CATALOG.find(item => item.id === id);
// Used only to prefill a choice; text never confirms a component or awards points.
export function languageComponentFromSubject(subject) {
  const text = normalize(subject);
  const oral = /\bmuntlig\b/.test(text);
  const written = /\bskriftlig\b/.test(text);
  return oral === written ? null : oral ? 'oral' : 'written';
}
export function confirmSubject(row, item, component) {
  const languageComponent = item.requiresLanguagePair && ['oral', 'written'].includes(component) ? component : null;
  const suffix = item.requiresLanguagePair
    ? [languageComponent === 'oral' ? 'muntlig' : languageComponent === 'written' ? 'skriftlig' : '', ...(row.subject.match(/\b(eksamen|standpunkt)\b/gi) || [])].filter(Boolean).join(' ')
    : (row.subject.match(/\b(muntlig|skriftlig|eksamen|standpunkt)\b/gi) || []).join(' ');
  return { ...row, subject: `${item.label}${suffix ? ` · ${suffix}` : ''}`, courseId: item.id, bonusConfirmed: true, language: item.language || null, languageComponent };
}
export function coursePoints(item, year) {
  if (!item || ![2026, 2027, 2028].includes(Number(year))) return 0;
  if (Number(year) < 2028) return item.points;
  if (item.type === 'science') return item.points / 2;
  return item.type === 'samisk' ? 1 : 0;
}
export function suggestSubjects(query, { schoolLevel = 'vgs' } = {}) {
  const clean = normalize(query).replace(/\b(muntlig|skriftlig|eksamen|standpunkt)\b/g, '').trim();
  if (!clean) return [];
  const tokens = clean.split(/\s+/);
  return COURSE_CATALOG.filter(item => (schoolLevel === 'vgs' || !item.vgs) && tokens.every(token => normalize(`${item.label} ${item.aliases || ''}`).includes(token)))
    .sort((a, b) => Number(normalize(b.label) === clean) - Number(normalize(a.label) === clean));
}
function numericGrade(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 6 ? grade : null;
}
export function certificatePoints(rows) {
  const grades = (Array.isArray(rows) ? rows : []).map(r => numericGrade(r?.grade)).filter(n => n !== null);
  return grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length + Number.EPSILON) * 100) / 10 : null;
}
export function calculateSubjectPoints(rows, { schoolLevel = 'vgs', year = 2027, studyHasSamiskQuota } = {}) {
  const warnings = [];
  const items = [];
  if (schoolLevel !== 'vgs') return { points: 0, uncapped: 0, cap: 0, items, warnings, requiresReview: false };
  if (![2026, 2027, 2028].includes(Number(year))) return { points: null, uncapped: null, cap: null, items, warnings: ['Velg et støttet opptaksår.'], requiresReview: true };
  const groups = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const item = row?.bonusConfirmed === true && getCourse(row.courseId);
    if (!item || item.type === 'common') continue;
    if (!groups.has(item.id)) groups.set(item.id, { item, rows: [] });
    groups.get(item.id).rows.push(row);
  }
  for (const { item, rows: group } of groups.values()) {
    if (item.requiresLanguagePair && coursePoints(item, year) > 0) {
      const components = new Set(group.map(r => r.languageComponent));
      if (components.has(undefined) || components.has(null) || [...components].some(value => !['oral', 'written'].includes(value))) {
        warnings.push(`${item.label}: bekreft om hver karakter gjelder muntlig eller skriftlig. Faget gir ikke poeng før begge delene er registrert og bestått.`);
        continue;
      }
      if (!components.has('oral') || !components.has('written')) {
        warnings.push(`${item.label}: legg også inn og bekreft ${components.has('oral') ? 'skriftlig' : 'muntlig'} karakter. Språkpoeng gis samlet når begge delene er bestått.`);
        continue;
      }
    }
    if (!group.every(r => (numericGrade(r.grade) ?? 0) >= 2)) {
      warnings.push(`${item.label}: poeng tas med når de bekreftede karakterene er bestått (2–6).`);
      continue;
    }
    items.push({ ...item, awarded: item.type === 'samisk' && Number(year) === 2028
      ? (typeof studyHasSamiskQuota === 'boolean' ? (studyHasSamiskQuota ? 0 : 1) : null)
      : coursePoints(item, year) });
  }
  let requiresReview = false;
  const math = items.filter(item => item.family === 'math');
  const mixedMath = math.some(item => item.id.startsWith('r')) && math.some(item => item.id.startsWith('s'));
  if (Number(year) === 2028 && mixedMath) {
    warnings.push('Du har både R- og S-matematikk. Overlappende fag må vurderes av Samordna opptak etter 2028-reglene; samlet fagpoeng vises derfor ikke.');
    requiresReview = true;
  }
  let scienceTotal = items.filter(i => i.type === 'science' && i.family !== 'math').reduce((sum, i) => sum + i.awarded, 0);
  const mathSum = math.reduce((sum, i) => sum + i.awarded, 0);
  scienceTotal += Number(year) < 2028 ? Math.min(1.5, mathSum) : mathSum;
  if (Number(year) < 2028 && mathSum > 1.5) warnings.push('Matematikkfag med overlapp er begrenset til 1,5 poeng.');
  const languageGroups = new Map();
  items.filter(i => i.type === 'language').forEach(i => languageGroups.set(i.language, (languageGroups.get(i.language) || 0) + i.awarded));
  const languageLevels = new Map();
  items.filter(i => i.type === 'language').forEach(i => languageLevels.set(i.language, (languageLevels.get(i.language) || 0) + 1));
  if (Number(year) < 2028 && [...languageLevels.values()].some(n => n > 2)) {
    warnings.push('Du har bekreftet tre nivå i samme språk. Bare to nivå kan telle i rangeringen. Avklar hvilke karakterer som skal med før du bruker samlet poengsum.');
    requiresReview = true;
  }
  const languageTotal = [...languageGroups.values()].reduce((sum, n) => sum + Math.min(1.5, n), 0);
  if ([...languageGroups.values()].some(n => n > 1.5)) warnings.push('Hvert språk gir maksimalt 1,5 poeng.');
  const naturbruk = items.filter(i => i.type === 'naturbruk').reduce((sum, i) => sum + i.awarded, 0);
  const hasSamisk = items.some(i => i.type === 'samisk') && Number(year) === 2028;
  if (hasSamisk && typeof studyHasSamiskQuota !== 'boolean') {
    warnings.push('Samisk førstespråk kan gi 1 poeng i 2028, men ikke ved studier med samisk kvote. Studiets kvoter må avklares før samlet fagpoeng kan vises.');
    requiresReview = true;
  } else if (hasSamisk && studyHasSamiskQuota) {
    warnings.push('Studier med samisk kvote gir ikke tilleggspoeng for samisk førstespråk.');
  }
  const samisk = hasSamisk && studyHasSamiskQuota === false ? 1 : 0;
  const uncapped = scienceTotal + languageTotal + naturbruk + samisk;
  const cap = Number(year) < 2028 ? 4 : 2;
  const points = Number(year) < 2028 ? Math.min(4, uncapped) : Math.min(2, scienceTotal) + samisk;
  if (points < uncapped) warnings.push(Number(year) < 2028 ? 'Realfags- og språkpoeng er begrenset til 4 samlet.' : 'Realfagspoeng er begrenset til 2. Samisk førstespråk kan gi 1 poeng i tillegg.');
  return { points: requiresReview ? null : points, uncapped: requiresReview ? null : uncapped, cap, items, warnings, requiresReview };
}
