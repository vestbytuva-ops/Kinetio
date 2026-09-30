import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findStudyQuota, normalizeStudyText, searchStudies, validateStudyDataset } from './study-search.mjs';

const raw = readFileSync(new URL('../../public/data/samordna-opptak-poenggrenser-raw.csv', import.meta.url));
const dataset = JSON.parse(readFileSync(new URL('../../public/data/studies-2026.json', import.meta.url), 'utf8'));
const { programs } = dataset;
const ids = values => values.map(value => value.id);

test('the bundled download retains the verified source file and all 2026 records', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), dataset.meta.rawSha256);
  assert.equal(validateStudyDataset(dataset), true);
  assert.equal(programs.length, 1369);
  assert.equal(new Set(programs.map(program => program.institution)).size, 27);
  assert.equal(programs.flatMap(program => program.quotas).length, 5412);
  assert.ok(programs.every(program => program.year === 2026));
});

test('every downloaded CSV record maps to the same program, quota and admission round', () => {
  const csv = raw.toString('utf8').replace(/^\uFEFF/, '').trimEnd();
  // This official export has no quoted cells. Assert that assumption explicitly
  // so a future change in the source format cannot silently corrupt this check.
  assert.ok(!csv.includes('"'));
  const [header, ...records] = csv.split(/\r?\n/).map(line => line.split(';'));
  assert.deepEqual(header, ['Kvote', 'Lærested', 'Opptaksrunde', 'Studiekode', 'Studienavn', 'Studiested', 'Utdanningsområde og -type', 'År', 'Poenggrense']);
  assert.equal(records.length, 5412);
  const byCode = new Map(programs.map(program => [program.code, program]));
  const seen = new Set();
  for (const record of records) {
    assert.equal(record.length, 9);
    const [name, institution, round, code, title, location, field, year, cutoff] = record.map(value => value.trim());
    const program = byCode.get(code);
    assert.ok(program, `Missing program ${code}`);
    assert.equal(program.name, title);
    assert.equal(program.institution, institution);
    assert.equal(program.location, location);
    assert.equal(program.field, field);
    assert.equal(program.year, Number(year));
    const key = `${code}/${name}/${round}`;
    assert.ok(!seen.has(key), `Duplicate source record ${key}`);
    seen.add(key);
    assert.equal(findStudyQuota(program, name, round)?.cutoff, cutoff);
  }
});

test('0 and -1 are preserved as different nonnumeric outcomes, never as admission scores', () => {
  const counts = { threshold: 0, 'all-qualified': 0, 'not-published': 0 };
  for (const quota of programs.flatMap(program => program.quotas)) {
    counts[quota.status] += 1;
    if (Number(quota.cutoff) > 0) {
      assert.equal(quota.status, 'threshold');
      assert.equal(quota.value, Number(quota.cutoff));
    } else {
      assert.equal(quota.value, null);
      assert.equal(quota.status, quota.cutoff === '0' ? 'all-qualified' : 'not-published');
    }
  }
  assert.deepEqual(counts, { threshold: 1835, 'all-qualified': 3490, 'not-published': 87 });
});

test('cutoff lookup never borrows a different quota or round when an entry is absent', () => {
  const program = programs.find(study => study.code === '203 162');
  assert.equal(findStudyQuota(program, 'Førstegangsvitnemålskvote', 'Hovedopptak').value, 31.8);
  assert.equal(findStudyQuota(program, 'Ordinær kvote', 'Hovedopptak').value, 44.4);
  assert.equal(findStudyQuota(program, 'Førstegangsvitnemålskvote', 'Suppleringsopptak').status, 'all-qualified');
  const incomplete = programs.find(study => study.quotas.length === 2);
  const absentQuota = ['Førstegangsvitnemålskvote', 'Ordinær kvote'].find(name => !incomplete.quotas.some(quota => quota.name === name));
  assert.ok(absentQuota);
  assert.equal(findStudyQuota(incomplete, absentQuota, 'Hovedopptak'), null);
  assert.equal(findStudyQuota(null, 'Ordinær kvote', 'Hovedopptak'), null);
});

test('search accepts Norwegian accents, mixed case, punctuation and both code formats', () => {
  assert.equal(normalizeStudyText('  Ærlig, Økonomi – ÅS  '), 'aerlig okonomi as');
  assert.deepEqual(ids(searchStudies(programs, 'Tromso')), ids(searchStudies(programs, 'TROMSØ')));
  assert.deepEqual(ids(searchStudies(programs, 'okonomi')), ids(searchStudies(programs, 'økonomi')));
  assert.ok(searchStudies(programs, 'Tromso').length > 0);
  assert.deepEqual(ids(searchStudies(programs, '203162')), ['so-2026-203162']);
  assert.deepEqual(ids(searchStudies(programs, '203 162')), ['so-2026-203162']);
  assert.deepEqual(ids(searchStudies(programs, 'Øst Europa')), ids(searchStudies(programs, 'Øst-Europa')));
});

test('full institution names and abbreviations can be combined with subject or city', () => {
  const medicine = searchStudies(programs, 'Universitetet i Oslo medisin');
  assert.ok(medicine.length > 0);
  assert.ok(medicine.every(program => program.institution === 'UIO' && normalizeStudyText(program.name).includes('medisin')));
  const trondheim = searchStudies(programs, 'NTNU Trondheim');
  assert.ok(trondheim.length > 0);
  assert.ok(trondheim.every(program => program.institution === 'NTNU' && `${program.name} ${program.location}`.includes('Trondheim')));
  assert.deepEqual(ids(searchStudies(programs, 'Samisk høgskole')), ids(programs.filter(program => program.institution === 'SA/SH')));
  assert.deepEqual(ids(searchStudies(programs, 'Universitetet i Innlandet')), ids(programs.filter(program => program.institution === 'INN')));
});

test('search preserves all records for an empty query, returns no invented matches and prioritizes exact titles', () => {
  assert.equal(searchStudies(programs, '  '), programs);
  assert.deepEqual(searchStudies(programs, 'xyz-nonexistent-study'), []);
  const before = JSON.stringify(programs);
  const found = searchStudies(programs, 'Administrasjon og ledelse');
  assert.equal(found[0].name, 'Administrasjon og ledelse');
  assert.equal(JSON.stringify(programs), before);
});

test('dataset validation rejects damaged records, incorrect totals and contradictory cutoff states', () => {
  const validFixture = () => ({
    meta: { ...dataset.meta, programCount: 1, institutionCount: 1, rowCount: programs[0].quotas.length },
    programs: [structuredClone(programs[0])],
  });
  assert.equal(validateStudyDataset(validFixture()), true);
  const mutations = [
    data => { data.programs[0].quotas[0] = null; },
    data => { data.programs[0].quotas.push({ ...data.programs[0].quotas[0] }); data.meta.rowCount += 1; },
    data => { data.programs[0].quotas[0].value = 50; },
    data => { data.programs[0].quotas[0] = { name: 'Ordinær kvote', round: 'Hovedopptak', cutoff: '-1', value: null, status: 'all-qualified' }; },
    data => { data.programs[0].quotas[0].status = 'unknown'; },
    data => { data.programs[0].code = ''; },
    data => { data.programs[0].year = 2025; },
    data => { data.meta.rowCount = 1; },
    data => { data.meta.institutionCount = 2; },
    data => { data.meta.downloadedAt = 'not a date'; },
  ];
  for (const mutate of mutations) {
    const data = validFixture();
    mutate(data);
    assert.equal(validateStudyDataset(data), false);
  }
  for (const malformed of [null, {}, { programs: [] }, { meta: {}, programs: [null] }]) {
    assert.equal(validateStudyDataset(malformed), false);
  }
});
