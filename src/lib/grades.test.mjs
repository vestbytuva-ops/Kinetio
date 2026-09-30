import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAverage, projectAverage, requiredGrade } from './grades.mjs';

const row = (grade, weight) => ({ grade, weight });
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≈ ${expected}`);

test('an empty calculator returns null averages and zero counts', () => {
  const empty = { average: null, count: 0, totalWeight: 0, gradePoints: null, distribution: [0, 0, 0, 0, 0, 0] };
  assert.deepEqual(calculateAverage([]), empty);
  assert.deepEqual(calculateAverage(undefined), empty);
  assert.deepEqual(calculateAverage(null), empty);
});

test('only whole grades from 1 through 6 count; empty values never become zero', () => {
  const invalid = ['', '  ', null, undefined, false, true, 0, '0', 7, -1, 2.5, '3.5', NaN, Infinity, 'abc', [], {}];
  const result = calculateAverage([null, ...invalid.map((grade) => row(grade)), row('1'), row(' 6 ')]);
  assert.deepEqual(result, {
    average: 3.5, count: 2, totalWeight: 2, gradePoints: 35, distribution: [1, 0, 0, 0, 0, 1],
  });
});

test('the ordinary average ignores stored weights and counts distribution rows', () => {
  assert.deepEqual(calculateAverage([row(4, 0), row('5', 1000), row(6, null)]), {
    average: 5, count: 3, totalWeight: 3, gradePoints: 50, distribution: [0, 0, 0, 1, 1, 1],
  });
});

test('weighted averages accept decimal weights and default an omitted weight to one', () => {
  const result = calculateAverage([row(2, '0.5'), row(6, 2), row(4)], { weighted: true });
  closeTo(result.average, 17 / 3.5);
  closeTo(result.gradePoints, (17 / 3.5) * 10);
  assert.equal(result.totalWeight, 3.5);
  assert.equal(result.count, 3);
  assert.deepEqual(result.distribution, [0, 1, 0, 1, 0, 1]);
});

test('weighted mode excludes invalid weights but includes the maximum and a small positive weight', () => {
  const invalid = [null, '', ' ', 0, -1, 100.01, Infinity, NaN, 'bad', false];
  const result = calculateAverage([...invalid.map((weight) => row(6, weight)), row(1, 100), row(6, 0.01)], { weighted: true });
  assert.equal(result.count, 2);
  closeTo(result.average, 100.06 / 100.01);
  assert.deepEqual(result.distribution, [1, 0, 0, 0, 0, 1]);
  assert.equal(calculateAverage(invalid.map((weight) => row(6, weight)), { weighted: true }).average, null);
});

test('projection adds one hypothetical grade without changing input rows', () => {
  const rows = Object.freeze([Object.freeze(row(3)), Object.freeze(row(5))]);
  closeTo(projectAverage(rows).average, 14 / 3);
  assert.equal(projectAverage(rows).count, 3);
  assert.equal(rows.length, 2);
  assert.equal(calculateAverage(rows).average, 4);
  assert.equal(projectAverage([], { grade: 2 }).average, 2);
});

test('projection applies the same validation and weighting rules as real grades', () => {
  assert.equal(projectAverage([row(2, 1)], { weighted: true, grade: 6, weight: 3 }).average, 5);
  assert.equal(projectAverage([row(2, 1)], { weighted: true, grade: 6, weight: 0 }).count, 1);
  assert.equal(projectAverage([row(2)], { grade: '' }).count, 1);
});

test('an empty calculator requires the target itself, including fractional targets', () => {
  for (const target of [1, 2, 3, 4, 4.75, 5, 6]) {
    assert.deepEqual(requiredGrade([], { target }), { required: target, possible: true });
    assert.deepEqual(requiredGrade([], { target, weighted: true, weight: 100 }), { required: target, possible: true });
  }
});

test('required grade solves attainable, fractional and impossible targets without rounding', () => {
  assert.deepEqual(requiredGrade([row(4), row(5)], { target: 5 }), { required: 6, possible: true });
  closeTo(requiredGrade([row(4), row(5)], { target: 4.4 }).required, 4.2);
  assert.deepEqual(requiredGrade([row(2), row(3)], { target: 5 }), { required: 10, possible: false });
  assert.deepEqual(requiredGrade([row(6)], { target: 3 }), { required: 0, possible: true });
  assert.deepEqual(requiredGrade([row(6)], { target: 1 }), { required: -4, possible: true });
});

test('required grade accounts for the proposed next weight and ignores incomplete rows', () => {
  assert.deepEqual(requiredGrade([row(2, 2), row('', 10), row(6, 0)], { weighted: true, target: 4, weight: 4 }), {
    required: 5, possible: true,
  });
  assert.deepEqual(requiredGrade([row(4)], { target: 5, weight: 0 }), { required: 6, possible: true });
  assert.equal(requiredGrade([row(1, 100)], { weighted: true, target: 6, weight: 0.01 }).possible, false);
  assert.deepEqual(requiredGrade([row(6, 100)], { weighted: true, target: 6, weight: 0.01 }), { required: 6, possible: true });
});

test('decimal rounding noise does not mark an attainable grade of six as impossible', () => {
  const rows = [row(1, 4.9)];
  const options = { weighted: true, target: 1.1, weight: 0.1 };
  const result = requiredGrade(rows, options);
  assert.equal(result.possible, true);
  closeTo(result.required, 6);
  assert.equal(projectAverage(rows, { ...options, grade: 6 }).average, options.target);
  // The calculation remains unrounded, and genuinely higher goals fail.
  assert.equal(result.required, options.target + (options.target - 1) * 4.9 / 0.1);
  assert.equal(requiredGrade(rows, { ...options, target: 1.10000001 }).possible, false);
});

test('invalid targets and invalid next weights return null instead of a misleading grade', () => {
  for (const target of [undefined, null, '', ' ', 0, 7, -1, NaN, Infinity, false]) {
    assert.deepEqual(requiredGrade([row(4)], { target }), { required: null, possible: false });
  }
  for (const weight of [null, '', 0, -1, 101, Infinity]) {
    assert.deepEqual(requiredGrade([row(4)], { weighted: true, target: 5, weight }), { required: null, possible: false });
  }
});
