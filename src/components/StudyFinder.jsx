import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, CheckCircle, Info, MapPin } from '@phosphor-icons/react';
import { AppleSpotlight } from './ui/apple-spotlight';
import { findStudyQuota, searchStudies, validateStudyDataset } from '../lib/study-search.mjs';
import './study-finder.css';

const DATA_URL = '/data/studies-2026.json';
const RAW_URL = '/data/samordna-opptak-poenggrenser-raw.csv';
const SOURCE_URL = 'https://rapport-dv.educloud.no/t/SO-datavarehus/views/Poenggrenserogventelistetallhovedopptaksuppleringsopptak_16275618215770/Poenggrenser';
const QUOTAS = ['Førstegangsvitnemålskvote', 'Ordinær kvote'];
const ROUNDS = ['Hovedopptak', 'Suppleringsopptak'];
const formatScore = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** onSelectionChange receives {program, quota, round}; children may be a render function with the same argument. */
export function StudyFinder({ onSelectionChange, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [quotaName, setQuotaName] = useState(QUOTAS[0]);
  const [round, setRound] = useState(ROUNDS[0]);
  const headingRef = useRef(null);
  const selectionCallback = useRef(onSelectionChange);
  selectionCallback.current = onSelectionChange;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await fetch(DATA_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const dataset = await response.json();
        if (!validateStudyDataset(dataset)) throw new Error('Invalid study dataset');
        if (active) setData(dataset);
      } catch {
        if (active) {
          setData(null);
          setError('Studiesøket kunne ikke lastes. Prøv igjen, eller åpne den offisielle rapporten.');
        }
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [retry]);

  const results = useMemo(() => searchStudies(data?.programs ?? [], query), [data, query]);
  const items = useMemo(() => results.map(program => ({
    id: program.id,
    label: program.name,
    description: [program.institution, program.location].filter(Boolean).join(' · '),
    detail: program.code,
  })), [results]);
  const program = data?.programs.find(study => study.id === selectedId) ?? null;
  const quota = findStudyQuota(program, quotaName, round);

  useEffect(() => {
    selectionCallback.current?.({ program, quota, round });
  }, [program, quota, round]);

  useEffect(() => {
    if (selectedId) headingRef.current?.focus();
  }, [selectedId]);

  const selection = { program, quota, round };
  const selectedContent = typeof children === 'function' ? children(selection) : children;
  const downloadedDate = data?.meta.downloadedAt ? new Date(data.meta.downloadedAt).toLocaleDateString('nb-NO') : null;

  return <section className="study-finder" id="studier" aria-labelledby="studies-heading">
    <div className="study-finder-intro">
      <p className="eyebrow">FINN DIN RETNING</p>
      <h2 id="studies-heading">Hva vil du studere?</h2>
      <p>Søk etter et studium, lærested eller sted. Se poenggrensene fra Samordna opptak.</p>
    </div>

    <AppleSpotlight
      items={items}
      value={query}
      onValueChange={setQuery}
      onSelect={item => {
        if (item.id === selectedId) headingRef.current?.focus();
        else setSelectedId(item.id);
      }}
      loading={loading}
      error={error}
      totalCount={results.length}
      emptyMessage="Ingen studier passer til søket. Prøv et annet fag, sted eller lærestedets forkortelse."
    >
      {error && <button className="study-retry" type="button" onClick={() => setRetry(attempt => attempt + 1)}>Prøv igjen</button>}
    </AppleSpotlight>

    <div className="study-data-note">
      <p>{data ? `${data.meta.programCount.toLocaleString('nb-NO')} studier · ${data.meta.institutionCount} læresteder · Opptaket ${data.meta.latestYear}` : 'Offentlige poenggrenser fra Samordna opptak'}</p>
      <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Se offisiell rapport <ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>

    {program && <article className="study-selection" aria-labelledby="selected-study-heading">
      <div className="study-selection-heading">
        <div>
          <p className="study-selection-code">{program.institution} / {program.code}</p>
          <h3 id="selected-study-heading" ref={headingRef} tabIndex={-1}>{program.name}</h3>
          {program.location && <p className="study-location"><MapPin size={15} aria-hidden="true" />{program.location}</p>}
        </div>
        <span className="study-year">Opptaket {program.year}</span>
      </div>

      <div className="study-quota-controls">
        <label htmlFor="study-quota">Kvote<select id="study-quota" value={quotaName} onChange={event => setQuotaName(event.target.value)}>
          {QUOTAS.map(name => <option key={name} value={name}>{name}</option>)}
        </select></label>
        <label htmlFor="study-round">Opptaksrunde<select id="study-round" value={round} onChange={event => setRound(event.target.value)}>
          {ROUNDS.map(name => <option key={name} value={name}>{name}</option>)}
        </select></label>
      </div>

      <div className="study-cutoff" aria-live="polite" aria-atomic="true">
        <span className="study-cutoff-label">Poenggrense · {quotaName} · {round}</span>
        {quota?.status === 'threshold' ? <>
          <p className="study-cutoff-number">{formatScore.format(quota.value)}<span> poeng</span></p>
          <p>Laveste poengsum som fikk tilbud i denne kvoten og opptaksrunden.</p>
        </> : quota?.status === 'all-qualified' ? <>
          <p className="study-cutoff-state"><CheckCircle size={23} aria-hidden="true" /> Alle kvalifiserte fikk tilbud</p>
          <p>Det var ingen poenggrense i denne kvoten og opptaksrunden. Opptakskravene måtte likevel være oppfylt.</p>
        </> : <>
          <p className="study-cutoff-state"><Info size={23} aria-hidden="true" /> Poenggrensen er ikke oppgitt</p>
          <p>{quota ? 'Rapporten oppgir ingen poenggrense for denne kvoten. Det betyr ikke at alle kom inn.' : 'Rapporten har ingen oppføring for denne kombinasjonen av kvote og opptaksrunde.'}</p>
        </>}
      </div>

      {selectedContent && <div className="study-selection-extra">{selectedContent}</div>}
      <p className="study-comparison-note"><Info size={16} aria-hidden="true" /><span>Historiske grenser gir ingen garanti om opptak. {program.institution === 'AHO' ? 'Ved AHO inngår opptaksprøvepoeng, så grensen kan ikke sammenlignes direkte med vanlige skolepoeng.' : 'Enkelte studier har spesielle opptakskrav eller poeng fra opptaksprøver. Kontroller kravene hos lærestedet.'}</span></p>
    </article>}

    <div className="study-source-footer">
      <p>Omfatter Samordna opptak. Lokale opptak er ikke med.{downloadedDate ? ` Data hentet ${downloadedDate}.` : ''}</p>
      {data && <a href={RAW_URL} download>Last ned alle studier (CSV) <ArrowDown size={14} aria-hidden="true" /></a>}
    </div>
  </section>;
}

export default StudyFinder;
