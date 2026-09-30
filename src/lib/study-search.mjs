export function normalizeStudyText(value) {
  return String(value ?? '').toLocaleLowerCase('nb-NO').normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').replace(/ø/g, 'o').replace(/æ/g, 'ae')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim();
}

// Search aliases only: preserve the source's institution code in every record.
// Names follow Samordna opptak's institution list; INN's current name is
// confirmed by inn.no and Sámi allaskuvla's Norwegian name by samas.no.
const INSTITUTION_NAMES = {
  AHO: 'Arkitektur- og designhøgskolen i Oslo',
  AHS: 'Ansgar høyskole',
  DMMH: 'Dronning Mauds Minne Høgskole for barnehagelærerutdanning',
  FIH: 'Fjellhaug Internasjonale Høgskole',
  HIM: 'Høgskolen i Molde',
  'HIØ': 'Høgskolen i Østfold',
  HVL: 'Høgskulen på Vestlandet',
  HVO: 'Høgskulen i Volda',
  INN: 'Universitetet i Innlandet|Høgskolen i Innlandet|HINN',
  LDH: 'Lovisenberg diakonale høgskole',
  MF: 'MF vitenskapelig høyskole',
  NHH: 'Norges Handelshøyskole',
  NIH: 'Norges idrettshøgskole',
  NLA: 'NLA Høgskolen',
  NMBU: 'Norges miljø- og biovitenskapelige universitet',
  NORD: 'Nord universitet',
  NTNU: 'Norges teknisk-naturvitenskapelige universitet',
  OSLOMET: 'OsloMet storbyuniversitetet',
  PHS: 'Politihøgskolen',
  'SA/SH': 'Sámi allaskuvla|Samisk høgskole|Sámi University of Applied Sciences|SASH',
  UIA: 'Universitetet i Agder',
  UIB: 'Universitetet i Bergen',
  UIO: 'Universitetet i Oslo',
  UIS: 'Universitetet i Stavanger',
  UIT: 'UiT Norges arktiske universitet|Universitetet i Tromsø',
  USN: 'Universitetet i Sørøst-Norge',
  VID: 'VID vitenskapelige høgskole',
};

/** Search all supplied studies without changing their source records. */
export function searchStudies(programs, query = '') {
  const normalized = normalizeStudyText(query);
  if (!normalized) return programs;
  const tokens = normalized.split(/\s+/);
  const namedInstitutions = Object.entries(INSTITUTION_NAMES)
    .filter(([, aliases]) => aliases.split('|').some(alias => ` ${normalized} `.includes(` ${normalizeStudyText(alias)} `)))
    .map(([code]) => code);
  return programs.map((program, index) => {
    if (namedInstitutions.length && !namedInstitutions.includes(program.institution)) return null;
    const name = normalizeStudyText(program.name);
    const searchable = normalizeStudyText([
      program.name, program.institution, program.location, program.field,
      program.code, program.code.replace(/\s/g, ''), INSTITUTION_NAMES[program.institution],
    ].join(' '));
    if (!tokens.every(token => searchable.includes(token))) return null;
    const exactCode = program.code.replace(/\s/g, '') === normalized.replace(/\s/g, '');
    const rank = exactCode || name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
    return { program, index, rank };
  }).filter(Boolean).sort((a, b) => a.rank - b.rank || a.index - b.index).map(({ program }) => program);
}

export function findStudyQuota(program, name, round) {
  return program?.quotas?.find(quota => quota.name === name && quota.round === round) ?? null;
}

export function validateStudyDataset(data) {
  if (!data || !data.meta || !Array.isArray(data.programs) || !data.programs.length ||
      data.meta.programCount !== data.programs.length || !Number.isInteger(data.meta.latestYear) ||
      !Number.isInteger(data.meta.institutionCount) || !Number.isInteger(data.meta.rowCount) ||
      typeof data.meta.downloadedAt !== 'string' || !Number.isFinite(Date.parse(data.meta.downloadedAt))) return false;
  const ids = new Set();
  const codes = new Set();
  const institutions = new Set();
  let rowCount = 0;
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const valid = data.programs.every(program => {
    if (!program || !nonempty(program.id) || ids.has(program.id) ||
        !nonempty(program.code) || !nonempty(program.name) ||
        !nonempty(program.institution) || program.year !== data.meta.latestYear ||
        typeof program.location !== 'string' || typeof program.field !== 'string' ||
        !Array.isArray(program.quotas) || !program.quotas.length || codes.has(program.code)) return false;
    ids.add(program.id);
    codes.add(program.code);
    institutions.add(program.institution);
    const quotaKeys = new Set();
    return program.quotas.every(quota => {
      if (!quota || !['Førstegangsvitnemålskvote', 'Ordinær kvote'].includes(quota.name) ||
          !['Hovedopptak', 'Suppleringsopptak'].includes(quota.round) || !nonempty(quota.cutoff)) return false;
      const key = `${quota.name}/${quota.round}`;
      if (quotaKeys.has(key)) return false;
      quotaKeys.add(key);
      rowCount += 1;
      const sourceValue = Number(quota.cutoff);
      return quota.status === 'threshold'
        ? Number.isFinite(quota.value) && quota.value > 0 && quota.value === sourceValue
        : quota.status === 'all-qualified'
          ? quota.value === null && sourceValue === 0
          : quota.status === 'not-published' && quota.value === null && sourceValue === -1;
    });
  });
  return valid && institutions.size === data.meta.institutionCount && rowCount === data.meta.rowCount;
}
