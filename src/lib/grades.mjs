/** Parse form values without treating an empty input, null, or a boolean as 0. */
function numericValue(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validWeight(value = 1) {
  const weight = numericValue(value);
  return weight !== null && weight > 0 && weight <= 100 ? weight : null;
}

function includedRows(rows, weighted) {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const grade = numericValue(row.grade);
    if (grade === null || !Number.isInteger(grade) || grade < 1 || grade > 6) return [];
    const weight = weighted ? validWeight(row.weight) : 1;
    return weight === null ? [] : [{ grade, weight }];
  });
}

/**
 * Only complete, valid rows contribute to the result. In unweighted mode each
 * grade counts once, regardless of its stored weight. gradePoints is simply
 * average × 10; it does not include admission rules or additional points.
 */
export function calculateAverage(rows, { weighted = false } = {}) {
  const included = includedRows(rows, weighted);
  const distribution = [0, 0, 0, 0, 0, 0];
  let totalWeight = 0;
  let weightedSum = 0;

  for (const { grade, weight } of included) {
    distribution[grade - 1] += 1;
    totalWeight += weight;
    weightedSum += grade * weight;
  }

  const average = included.length ? weightedSum / totalWeight : null;
  return {
    average,
    count: included.length,
    totalWeight,
    gradePoints: average === null ? null : average * 10,
    distribution,
  };
}

/** Recalculate with one hypothetical grade, leaving the original rows intact. */
export function projectAverage(rows, { weighted = false, grade = 6, weight = 1 } = {}) {
  return calculateAverage([...(Array.isArray(rows) ? rows : []), { grade, weight }], { weighted });
}

/**
 * Solve the minimum next grade needed to reach at least target. The raw result
 * is not rounded: e.g. 4.2 means a whole-number grade of 5 is needed. A result
 * below 1 means any valid next grade will reach the target. Invalid inputs have
 * required: null, while valid but unreachable targets have possible: false.
 */
export function requiredGrade(rows, { weighted = false, target, weight = 1 } = {}) {
  const goal = numericValue(target);
  const nextWeight = weighted ? validWeight(weight) : 1;
  if (goal === null || goal < 1 || goal > 6 || nextWeight === null) {
    return { required: null, possible: false };
  }

  const included = includedRows(rows, weighted);
  // Accumulate the deficit directly instead of reconstructing the sum from a
  // rounded display average. This also preserves exact attainable boundaries.
  let deficit = 0;
  for (const row of included) deficit += (goal - row.grade) * row.weight;
  const required = goal + deficit / nextWeight;
  // Decimal weights can produce 6.000000000000005 at an attainable boundary.
  // Preserve the raw answer and tolerate only numerical noise in this flag.
  return { required, possible: required <= 6 + 1e-9 };
}
