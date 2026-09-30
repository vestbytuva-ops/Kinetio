import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_CATALOG, calculateSubjectPoints, certificatePoints, confirmSubject, coursePoints, getCourse, languageComponentFromSubject, suggestSubjects } from './admission.mjs';

const row = (courseId, grade = '5', extra = {}) => ({ courseId, grade, bonusConfirmed: true, ...extra });
const languagePair = (courseId, oralGrade = '5', writtenGrade = '5') => [
  row(courseId, oralGrade, { languageComponent: 'oral' }),
  row(courseId, writtenGrade, { languageComponent: 'written' }),
];
const sum = (ids, options) => calculateSubjectPoints(ids.flatMap(id => getCourse(id)?.requiresLanguagePair ? languagePair(id) : [row(id)]), options);

test('only confirmed courses award points; text guesses, unknown IDs and common subjects do not', () => {
  assert.equal(calculateSubjectPoints([
    { subject: 'R2', grade: 6 }, row('r2', 6, { bonusConfirmed: false }),
    row('made-up'), row('common-engelsk'), row('fransk-common'), row('math-1T'), row('tofx'),
  ]).points, 0);
});

test('all catalog IDs are unique and all science rates are represented', () => {
  assert.equal(new Set(COURSE_CATALOG.map(item => item.id)).size, COURSE_CATALOG.length);
  assert.equal(COURSE_CATALOG.filter(item => item.type === 'science').length, 16);
  assert.equal(coursePoints(getCourse('r2'), 2027), 1);
  assert.equal(coursePoints(getCourse('fysikk2'), 2027), 1);
  assert.equal(coursePoints(getCourse('r1'), 2027), .5);
});

test('standing and exam grades count once for bonus but each remains in the grade average', () => {
  const rows = [row('r2', '4'), row('r2', '6')];
  assert.equal(calculateSubjectPoints(rows).points, 1);
  assert.equal(calculateSubjectPoints(rows).items.length, 1);
  assert.equal(certificatePoints(rows), 50);
});

test('all confirmed grades for a course must pass before its bonus is included', () => {
  for (const grade of ['1', '', 'IV', '7', '5.5', null, true]) {
    const result = calculateSubjectPoints([row('fysikk2', 5), row('fysikk2', grade)]);
    assert.equal(result.points, 0, String(grade));
    assert.equal(result.warnings.length, 1);
  }
  assert.equal(calculateSubjectPoints([row('fysikk2', ' 2 ')]).points, 1);
});

test('ungdomsskole never awards VGS bonus even when stored confirmations remain', () => {
  assert.equal(sum(['r2', 'fransk-3', 'samisk-first'], { schoolLevel: 'ungdomsskole', year: 2028 }).points, 0);
  assert.equal(suggestSubjects('R2', { schoolLevel: 'ungdomsskole' }).length, 0);
  assert.ok(suggestSubjects('matematikk', { schoolLevel: 'ungdomsskole' }).some(item => item.label === 'Matematikk'));
});

test('2026 and 2027 apply the combined four-point ceiling', () => {
  for (const year of [2026, 2027]) {
    const result = sum(['r1', 'r2', 'fysikk1', 'fysikk2', 'kjemi1', 'fransk-2', 'fransk-3'], { year });
    assert.equal(result.uncapped, 5);
    assert.equal(result.points, 4);
  }
});

test('R/S mathematics receives at most 1.5 points under 2026/2027 rules', () => {
  const result = sum(['s1', 's2', 'r1', 'r2'], { year: 2027 });
  assert.equal(result.points, 1.5);
  assert.equal(result.requiresReview, false);
  assert.ok(result.warnings.some(warning => warning.includes('1,5')));
});

test('two language levels can award 1.5 and separate languages remain separate', () => {
  assert.equal(sum(['fransk-2', 'fransk-3']).points, 1.5);
  assert.equal(sum(['fransk-2', 'fransk-3', 'tysk-2', 'tysk-3']).points, 3);
  assert.equal(sum(['latin-1', 'latin-2', 'gresk-1', 'gresk-2']).points, 2);
});

test('foreign language programme levels keep their official rates and common courses award zero', () => {
  for (const year of [2026, 2027]) {
    assert.equal(sum(['fransk-1'], { year }).points, .5);
    assert.equal(sum(['fransk-2'], { year }).points, .5);
    assert.equal(sum(['fransk-3'], { year }).points, 1);
    assert.equal(sum(['fransk-common', 'fransk-common-1', 'fransk-common-2'], { year }).points, 0);
  }
  assert.equal(getCourse('fransk-3').requiresLanguagePair, true);
  assert.notEqual(getCourse('latin-1').requiresLanguagePair, true);
  assert.notEqual(getCourse('gresk-2').requiresLanguagePair, true);
});

test('oral and written language grades both count in the average but give one course bonus', () => {
  const rows = languagePair('fransk-3', '4', '6');
  assert.equal(certificatePoints(rows), 50);
  assert.equal(calculateSubjectPoints(rows).points, 1);
  assert.equal(calculateSubjectPoints(rows).items.length, 1);
  rows.push(row('fransk-3', '6', { languageComponent: 'written' }));
  assert.equal(certificatePoints(rows), 53.3);
  assert.equal(calculateSubjectPoints(rows).points, 1);
  assert.equal(calculateSubjectPoints(rows).items.length, 1);
});

test('an incomplete, repeated or legacy language component never earns partial points', () => {
  const incompleteGroups = [
    [row('fransk-3', '5', { languageComponent: 'oral' })],
    [row('fransk-3', '5', { languageComponent: 'written' })],
    [row('fransk-3', '5', { languageComponent: 'oral' }), row('fransk-3', '6', { languageComponent: 'oral' })],
    [row('fransk-3')],
    [row('fransk-3', '5', { languageComponent: 'complete' })],
    [row('fransk-3', '5', { subject: 'Fransk III muntlig' }), row('fransk-3', '6', { subject: 'Fransk III skriftlig' })],
    [...languagePair('fransk-3'), row('fransk-3', '5', { languageComponent: 'unknown' })],
  ];
  for (const rows of incompleteGroups) {
    const result = calculateSubjectPoints(rows);
    assert.equal(result.points, 0, JSON.stringify(rows));
    assert.ok(result.warnings.length > 0, JSON.stringify(rows));
  }
});

test('language pairs require explicitly confirmed and passing grades for both components', () => {
  const unconfirmedWritten = languagePair('fransk-3');
  unconfirmedWritten[1].bonusConfirmed = false;
  assert.equal(calculateSubjectPoints(unconfirmedWritten).points, 0);
  for (const invalid of ['1', '', 'IV', '7', null, true]) {
    for (const componentIndex of [0, 1]) {
      const rows = languagePair('fransk-3');
      rows[componentIndex].grade = invalid;
      const result = calculateSubjectPoints(rows);
      assert.equal(result.points, 0, `${componentIndex}: ${String(invalid)}`);
      assert.ok(result.warnings.length > 0);
    }
  }
  assert.equal(calculateSubjectPoints(languagePair('fransk-3', '2', '2')).points, 1);
});

test('language components cannot pair across levels, languages or common and programme courses', () => {
  for (const otherId of ['fransk-2', 'tysk-3', 'fransk-common-2']) {
    const rows = [row('fransk-3', '5', { languageComponent: 'oral' }), row(otherId, '6', { languageComponent: 'written' })];
    assert.equal(calculateSubjectPoints(rows).points, 0, otherId);
  }
});

test('2028 does not ask for missing language components when language points no longer apply', () => {
  for (const rows of [[row('fransk-3')], [row('fransk-3', '5', { languageComponent: 'oral' })]]) {
    const result = calculateSubjectPoints(rows, { year: 2028 });
    assert.equal(result.points, 0);
    assert.deepEqual(result.warnings, []);
  }
});

test('language component detection preselects only an unambiguous full-word label', () => {
  assert.equal(languageComponentFromSubject('Fransk III MUNTLIG eksamen'), 'oral');
  assert.equal(languageComponentFromSubject('Fransk III · skriftlig standpunkt'), 'written');
  assert.equal(languageComponentFromSubject('Fransk III muntlig og skriftlig'), null);
  assert.equal(languageComponentFromSubject('Fransk III'), null);
  assert.equal(languageComponentFromSubject('Fransk III muntligskriftlig'), null);
});

test('course confirmation stores the selected component and preserves grades and assessment markers', () => {
  const original = { id: 'my-row', subject: 'fransk 3 muntlig eksamen', grade: '4', weight: 2 };
  const confirmed = confirmSubject(original, getCourse('fransk-3'), 'written');
  assert.equal(confirmed.id, original.id);
  assert.equal(confirmed.grade, '4');
  assert.equal(confirmed.weight, 2);
  assert.equal(confirmed.courseId, 'fransk-3');
  assert.equal(confirmed.bonusConfirmed, true);
  assert.equal(confirmed.languageComponent, 'written');
  assert.match(confirmed.subject, /Fransk III/);
  assert.match(confirmed.subject, /skriftlig/);
  assert.match(confirmed.subject, /eksamen/);
  assert.doesNotMatch(confirmed.subject, /muntlig/);
  assert.notEqual(confirmSubject(original, getCourse('fransk-3'), 'invalid').languageComponent, 'invalid');
  const science = confirmSubject({ ...original, subject: 'R2 skriftlig eksamen', languageComponent: 'oral' }, getCourse('r2'), 'written');
  assert.match(science.subject, /Matematikk R2/);
  assert.match(science.subject, /skriftlig/);
  assert.match(science.subject, /eksamen/);
  assert.ok(!science.languageComponent);
});

test('three language levels require review of which grades belong in the ranking', () => {
  const result = sum(['fransk-1', 'fransk-2', 'fransk-3']);
  assert.equal(result.points, null);
  assert.equal(result.requiresReview, true);
  assert.ok(result.warnings.some(warning => warning.includes('Bare to nivå')));
});

test('2028 halves science rates and removes foreign language and naturbruk bonus', () => {
  assert.equal(sum(['r1', 'r2', 'fysikk1', 'fysikk2'], { year: 2028 }).points, 1.5);
  assert.equal(sum(['fransk-2', 'fransk-3', 'naturbruk-vg3', 'latin-1'], { year: 2028 }).points, 0);
  assert.equal(sum(['naturbruk-vg3'], { year: 2027 }).points, .5);
  assert.equal(coursePoints(getCourse('it2'), 2028), .25);
});

test('2028 science ceiling is two; mixed mathematics is explicitly unresolved', () => {
  assert.equal(sum(['r1', 'r2', 'fysikk1', 'fysikk2', 'kjemi1', 'kjemi2', 'biologi1'], { year: 2028 }).points, 2);
  const mixed = sum(['s1', 's2', 'r2'], { year: 2028 });
  assert.equal(mixed.points, null);
  assert.equal(mixed.requiresReview, true);
});

test('samisk first language in 2028 depends on whether the study has a samisk quota', () => {
  assert.equal(sum(['samisk-first'], { year: 2027 }).points, 0);
  const unknown = sum(['samisk-first', 'r2'], { year: 2028 });
  assert.equal(unknown.points, null);
  assert.equal(unknown.requiresReview, true);
  assert.equal(unknown.items.find(item => item.type === 'samisk').awarded, null);
  const quota = sum(['samisk-first', 'r2'], { year: 2028, studyHasSamiskQuota: true });
  assert.equal(quota.points, .5);
  assert.equal(quota.items.find(item => item.type === 'samisk').awarded, 0);
  assert.equal(sum(['samisk-first', 'r2'], { year: 2028, studyHasSamiskQuota: false }).points, 1.5);
});

test('samisk is at most one in addition to the two-point science ceiling, never per grade', () => {
  const rows = ['r1', 'r2', 'fysikk1', 'fysikk2', 'kjemi1', 'kjemi2', 'biologi1', 'samisk-first', 'samisk-first'].map(id => row(id));
  assert.equal(calculateSubjectPoints(rows, { year: 2028, studyHasSamiskQuota: false }).points, 3);
});

test('unsupported years fail closed rather than silently applying another rule set', () => {
  assert.equal(coursePoints(getCourse('r2'), 2030), 0);
  assert.equal(sum(['r2'], { year: 2030 }).points, null);
  assert.equal(sum(['r2'], { year: '2028' }).points, .5);
});

test('certificate estimate rounds the average to two decimals before multiplying by ten', () => {
  assert.equal(certificatePoints([{ grade: 5 }, { grade: 5 }, { grade: 6 }]), 53.3);
  assert.equal(certificatePoints([{ grade: 4 }, { grade: 5 }, { grade: 5 }]), 46.7);
  assert.equal(certificatePoints([{ grade: 1 }, { grade: 6 }]), 35);
});

test('certificate estimate rejects malformed rows and does not coerce booleans into grades', () => {
  assert.equal(certificatePoints([{ grade: true }, null, { grade: '' }, { grade: 'IV' }, { grade: 6.5 }]), null);
  assert.equal(certificatePoints(null), null);
  assert.equal(calculateSubjectPoints(null).points, 0);
  assert.equal(calculateSubjectPoints([null, true]).points, 0);
  assert.equal(certificatePoints([{ grade: '5', weight: 100 }, { grade: 3, weight: 1 }]), 40);
});

test('subject suggestions recognize ordinary aliases and Norwegian characters without awarding anything', () => {
  assert.ok(suggestSubjects('matte').some(item => item.id === 'r2'));
  assert.ok(suggestSubjects('IT 2').some(item => item.id === 'it2'));
  assert.ok(suggestSubjects('Fransk 2 muntlig').some(item => item.id === 'fransk-2'));
  assert.ok(suggestSubjects('sorsamisk').some(item => item.language === 'Sørsamisk'));
  assert.equal(suggestSubjects('skriftlig').length, 0);
  assert.equal(suggestSubjects('not a subject').length, 0);
});

test('numeric and Roman language queries offer both common and programme course choices', () => {
  for (const query of ['Fransk 2', 'Fransk II', 'Fransk 2 muntlig']) {
    const suggestions = suggestSubjects(query);
    assert.ok(suggestions.some(item => item.id === 'fransk-common-2'), query);
    assert.ok(suggestions.some(item => item.id === 'fransk-2'), query);
    assert.equal(suggestions.find(item => item.id === 'fransk-common-2').points, 0);
  }
});
