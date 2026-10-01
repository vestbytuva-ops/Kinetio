import { useEffect, useRef, useState } from 'react';
import { AlertDialog, Switch, Tabs } from 'radix-ui';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCircle, Info, Moon, Plus, Sun, Trash, X } from '@phosphor-icons/react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { calculateAverage, projectAverage, requiredGrade } from './lib/grades.mjs';
import { confirmSubject } from './lib/admission.mjs';
import { cn } from './lib/utils';
import { InView } from './components/InView';
import { SubjectInput } from './components/SubjectInput';
import { AdmissionSummary } from './components/AdmissionSummary';
import { StudyFinder } from './components/StudyFinder';

const STORE = 'kinetio-grades-v1';
const exampleRows = () => [
  { id: 'norsk', subject: 'Norsk', grade: '5', weight: '1' },
  { id: 'matematikk', subject: 'Matematikk', grade: '4', weight: '1' },
  { id: 'engelsk', subject: 'Engelsk', grade: '5', weight: '1' },
  { id: 'naturfag', subject: 'Naturfag', grade: '6', weight: '1' },
  { id: 'historie', subject: 'Historie', grade: '4', weight: '1' },
];
const blankRow = () => ({ id: crypto.randomUUID(), subject: '', grade: '', weight: '1' });
const format = (n, digits = 2) => n == null ? '–' : n.toLocaleString('nb-NO', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function loadData() {
  try {
    const value = JSON.parse(localStorage.getItem(STORE));
    if (value?.version === 1 && Array.isArray(value.rows) && value.rows.length <= 100 &&
      value.rows.every(r => typeof r.id === 'string' && typeof r.subject === 'string' && (r.grade === '' || /^[1-6]$/.test(String(r.grade))))) {
      return { rows: value.rows, weighted: value.weighted === true, example: value.example === true,
        schoolLevel: value.schoolLevel === 'ungdomsskole' ? 'ungdomsskole' : 'vgs',
        admissionYear: [2026, 2027, 2028].includes(value.admissionYear) ? value.admissionYear : 2027 };
    }
  } catch { /* Storage can be unavailable in private browsing. */ }
  return { rows: exampleRows(), weighted: false, example: true, schoolLevel: 'vgs', admissionYear: 2027 };
}

function ClearDialog({ onClear }) {
  return <AlertDialog.Root>
    <AlertDialog.Trigger className="text-button reset-button"><Trash size={15} aria-hidden="true" /> Start på nytt</AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="dialog-overlay" />
      <AlertDialog.Content className="dialog-content">
        <AlertDialog.Title>Vil du starte på nytt?</AlertDialog.Title>
        <AlertDialog.Description>Fagene og karakterene i denne kalkulatoren blir fjernet fra denne enheten.</AlertDialog.Description>
        <div className="dialog-actions">
          <AlertDialog.Cancel className="button secondary">Behold karakterene</AlertDialog.Cancel>
          <AlertDialog.Action className="button primary" onClick={onClear}>Start på nytt</AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}

function GradeRow({ row, index, weighted, onChange, onRemove, schoolLevel, year, onConfirmCourse }) {
  const weightValid = Number(row.weight) > 0 && Number(row.weight) <= 100;
  return <div className={cn('grade-row', weighted && 'is-weighted')}>
    <span className="row-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
    <SubjectInput row={row} index={index} schoolLevel={schoolLevel} year={year}
      onChange={value => onChange(row.id, 'subject', value)} onConfirm={(course, component) => onConfirmCourse(row.id, course, component)} />
    <select className={cn('grade-select', `grade-${row.grade || 'empty'}`)} aria-label={`Karakter i ${row.subject || `fag ${index + 1}`}`}
      value={row.grade} onChange={e => onChange(row.id, 'grade', e.target.value)}>
      <option value="">Velg</option>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
    {weighted && <div className="weight-wrap">
      <input type="number" inputMode="decimal" className="weight-input" min="0.1" max="100" step="0.1" aria-label={`Vekt for ${row.subject || `fag ${index + 1}`}`}
        value={row.weight} onChange={e => onChange(row.id, 'weight', e.target.value)} aria-invalid={!weightValid} aria-describedby={!weightValid ? `weight-error-${row.id}` : undefined} />
      {!weightValid && <small id={`weight-error-${row.id}`} className="field-error">Over 0, maks 100</small>}
    </div>}
    <button className="icon-button remove-button" onClick={() => onRemove(row.id)} aria-label={`Fjern ${row.subject || `fag ${index + 1}`}`}><X size={16} aria-hidden="true" /></button>
  </div>;
}

function Results({ result, projected, isPlanning, weighted, rows, schoolLevel, year }) {
  const shown = isPlanning ? projected : result;
  return <aside className="result-panel" aria-label="Beregnet resultat">
    <div className="result-heading"><span>{isPlanning ? 'Ditt mulige snitt' : 'Ditt karaktersnitt'}</span><ArrowUpRight size={24} aria-hidden="true" /></div>
    <div className="average-wrap" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{isPlanning ? 'Mulig karaktersnitt: ' : 'Karaktersnitt: '}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={format(shown.average)} className="average" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.12 }}>{format(shown.average)}</motion.span>
      </AnimatePresence>
      <span className="average-max">av 6,00</span>
    </div>
    <p className="result-caption">{isPlanning ? result.average !== null ? <>Fra {format(result.average)} med én ny karakter</> : 'Med én ny, hypotetisk karakter' : result.count ? <>Basert på {result.count} {result.count === 1 ? 'karakter' : 'karakterer'}{weighted ? ' med vekting' : ' med lik vekt'}</> : 'Legg til en karakter for å se snittet ditt.'}</p>
    <div className="result-rule" />
    <div className="distribution-heading"><h3>Karakterfordeling</h3><span>{result.count} totalt</span></div>
    <div className="distribution" role="img" aria-label={result.distribution.map((count, i) => `${count} karakterer med ${i + 1}`).join(', ')}>
      {result.distribution.map((count, i) => <div className="distribution-column" key={i}>
        <span className="bar-count">{count || ''}</span>
        <div className="bar-space"><div className={`bar bar-${i + 1}`} style={{ height: `${count ? Math.max(15, count / Math.max(...result.distribution, 1) * 68) : 3}px` }} /></div>
        <span className="bar-label">{i + 1}</span>
      </div>)}
    </div>
    {!isPlanning && <AdmissionSummary rows={rows} schoolLevel={schoolLevel} year={year} weighted={weighted} />}
    <div className="result-note"><span className="mini-mark" aria-hidden="true">k.</span><p>Du er mer enn et tall.<br /><strong>Dette er bare oversikten din.</strong></p></div>
  </aside>;
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('average');
  const [nextGrade, setNextGrade] = useState(5);
  const [nextWeight, setNextWeight] = useState('1');
  const [target, setTarget] = useState('5.0');
  const [removed, setRemoved] = useState(null);
  const [storageOk, setStorageOk] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('kinetio-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch { return 'light'; }
  });
  const focusId = useRef(null);
  const { rows, weighted, example, schoolLevel, admissionYear } = data;
  const result = calculateAverage(rows, { weighted });
  const projected = projectAverage(rows, { weighted, grade: nextGrade, weight: nextWeight });
  const needed = requiredGrade(rows, { weighted, target, weight: nextWeight });
  const targetValid = target.trim() !== '' && Number(target) >= 1 && Number(target) <= 6;
  const nextWeightValid = !weighted || (Number(nextWeight) > 0 && Number(nextWeight) <= 100);

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ version: 1, ...data })); setStorageOk(true); }
    catch { setStorageOk(false); }
  }, [data]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('kinetio-theme', theme); } catch { /* Nonessential preference. */ }
  }, [theme]);
  useEffect(() => {
    if (focusId.current) { document.getElementById(`subject-${focusId.current}`)?.querySelector('input')?.focus(); focusId.current = null; }
  }, [rows]);

  const update = (id, key, value) => setData(d => ({ ...d, rows: d.rows.map(r => r.id === id ? { ...r, [key]: value,
    ...(key === 'subject' ? { courseId: null, bonusConfirmed: false, language: null, languageComponent: null } : {}) } : r) }));
  const confirmCourse = (id, course, component) => setData(d => ({ ...d, rows: d.rows.map(r => r.id === id
    ? confirmSubject(r, course, component)
    : r) }));
  function addRow() {
    if (rows.length >= 100) return;
    const row = blankRow(); focusId.current = row.id;
    setData(d => ({ ...d, rows: [...d.rows, row] }));
    setAnnouncement('Et nytt fag er lagt til.');
  }
  function removeRow(id) {
    const index = rows.findIndex(r => r.id === id);
    setRemoved({ row: rows[index], index });
    setData(d => ({ ...d, rows: d.rows.filter(r => r.id !== id) }));
    setAnnouncement(`${rows[index].subject || 'Faget'} er fjernet. Du kan angre.`);
  }
  function undoRemove() {
    if (!removed || rows.length >= 100) return;
    setData(d => { const list = [...d.rows]; list.splice(removed.index, 0, removed.row); return { ...d, rows: list }; });
    setRemoved(null); setAnnouncement('Faget er gjenopprettet.');
  }
  function clear() {
    const row = blankRow(); focusId.current = row.id;
    setData(d => ({ ...d, rows: [row], weighted: false, example: false }));
    setRemoved(null); setTab('average'); setAnnouncement('Kalkulatoren er tømt.');
  }

  return <MotionConfig reducedMotion="user">
    <a className="skip-link" href="#kalkulator">Hopp til kalkulatoren</a>
    <nav className="navigation" aria-label="Hovedmeny">
        <a href="#topp" className="nav-brand" aria-label="Kinetio, til toppen">kinetio</a>
        <div className="nav-links"><a href="#kalkulator">Kalkulator <ArrowDown size={13} aria-hidden="true" /></a><a href="#studier">Finn studier</a><a className="nav-guide" href="#slik-fungerer-det">Slik fungerer det</a></div>
        <button className="icon-button theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Bruk lyst tema' : 'Bruk mørkt tema'}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
    </nav>
    <header className="brand-panel" id="topp">
      <img className="brand-texture" src="/kinetio-meadow-hero.png" alt="" width="1672" height="941" fetchPriority="high" />
      <div className="brand-baseline"><h1>Kinetio</h1><a href="#kalkulator" className="hero-link" aria-label="Gå til karakterkalkulatoren"><ArrowDown size={29} aria-hidden="true" /></a></div>
    </header>

    <main>
      <section id="kalkulator" className="calculator-section">
        <InView className="intro">
          <div><p className="eyebrow">DIN KARAKTERKALKULATOR</p><h2>Mer oversikt. Mindre stress.</h2><p className="intro-copy">Samle karakterene dine, finn snittet og se hva neste steg kan bety.</p></div>
          <div className="palette" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        </InView>

        <InView className="calculator-shell" delay={0.05}>
          <div className="calculator-main">
            <Tabs.Root value={tab} onValueChange={setTab}>
              <div className="calculator-toolbar"><Tabs.List className="tabs" aria-label="Kalkulatormodus">
                <Tabs.Trigger className="tab" value="average">Mitt karaktersnitt</Tabs.Trigger>
                <Tabs.Trigger className="tab" value="planning">Hva hvis? <ArrowUpRight size={14} aria-hidden="true" /></Tabs.Trigger>
              </Tabs.List><span className="scale-label">Skala 1–6</span></div>
              <div className="calculator-settings">
                <label>Skolenivå<select value={schoolLevel} onChange={e => setData(d => ({ ...d, schoolLevel: e.target.value }))}>
                  <option value="ungdomsskole">Ungdomsskole</option><option value="vgs">Videregående</option>
                </select></label>
                {schoolLevel === 'vgs' && <label>Opptaksår<select value={admissionYear} onChange={e => setData(d => ({ ...d, admissionYear: Number(e.target.value) }))}>
                  <option value={2026}>2026</option><option value={2027}>2027</option><option value={2028}>2028</option>
                </select></label>}
                <p>{schoolLevel === 'vgs' ? 'Velg fagforslag og bekreft nivået for å ta med tilleggspoeng.' : 'Vanlig snitt og grunnskolepoeng. Ingen realfags- eller språkpoeng.'}</p>
              </div>

              <Tabs.Content value="average" className="editor" tabIndex={-1}>
                <div className="editor-top"><div className="editor-title"><h3>Dine fag</h3><span className="count-chip">{rows.length}</span></div>
                  <label className="switch-label" htmlFor="weight-switch">Bruk vekting<Switch.Root id="weight-switch" className="switch" checked={weighted} onCheckedChange={checked => setData(d => ({ ...d, weighted: checked }))}><Switch.Thumb className="switch-thumb" /></Switch.Root></label>
                </div>
                {example && <p className="example-note"><Info size={14} aria-hidden="true" /> Eksempelkarakterer. Endre dem eller start på nytt.</p>}
                {weighted && <p className="weight-help" id="weight-help">Vekt 2 teller dobbelt så mye som vekt 1. Bruk lik vekt for et vanlig fagsnitt.</p>}
                <div className={cn('table-heading', weighted && 'is-weighted')} aria-hidden="true"><span>Fag / vurdering</span><span>Karakter</span>{weighted && <span>Vekt</span>}<span /></div>
                <div className="grade-list">
                  {rows.map((row, i) => <GradeRow key={row.id} row={row} index={i} weighted={weighted} onChange={update} onRemove={removeRow} schoolLevel={schoolLevel} year={admissionYear} onConfirmCourse={confirmCourse} />)}
                  {!rows.length && <div className="empty-state"><h4>Plass til en ny start.</h4><p>Legg til ditt første fag og velg en karakter fra 1 til 6.</p></div>}
                </div>
                <div className="list-actions"><button className="add-button" onClick={addRow} disabled={rows.length >= 100}><Plus size={17} aria-hidden="true" /> Legg til fag</button><ClearDialog onClear={clear} /></div>
                {rows.every(row => !row.subject.trim() && !row.grade) && <button className="text-button" onClick={() => { setData(d => ({ ...d, rows: exampleRows(), weighted: false, example: true })); setRemoved(null); }}>Prøv eksempelkarakterer <ArrowUpRight size={14} aria-hidden="true" /></button>}
                {rows.length >= 100 && <p className="field-error">Du kan ha opptil 100 fag i én beregning.</p>}
                {removed && <div className="undo-notice"><span>{rows.length >= 100 ? 'Fjern et fag for å kunne angre.' : `${removed.row.subject || 'Fag'} er fjernet.`}</span><button onClick={undoRemove} disabled={rows.length >= 100}>Angre</button><button aria-label="Lukk angremelding" className="icon-button" onClick={() => setRemoved(null)}><X size={14} /></button></div>}
                <p className="editor-hint"><Info size={15} aria-hidden="true" /> Tomme karakterfelt tas ikke med i snittet.</p>
              </Tabs.Content>

              <Tabs.Content value="planning" className="planner" tabIndex={-1}>
                <h3>Se hva neste karakter kan bety.</h3><p>Prøv deg frem. Fagene dine blir ikke endret.</p>
                <fieldset className="grade-options"><legend>Hvis neste karakter blir</legend><div className="grade-options-row">{[1,2,3,4,5,6].map(n => <label className={cn('grade-option', nextGrade === n && 'selected')} key={n}><input type="radio" name="next-grade" value={n} checked={nextGrade === n} onChange={() => setNextGrade(n)} /><span>{n}</span></label>)}</div></fieldset>
                {weighted && <label className="planner-weight">Vekt på neste karakter<input type="number" min="0.1" max="100" step="0.1" value={nextWeight} onChange={e => setNextWeight(e.target.value)} aria-invalid={!nextWeightValid} aria-describedby={!nextWeightValid ? 'next-weight-error' : undefined} /></label>}
                {!nextWeightValid && <p className="field-error" id="next-weight-error">Velg en vekt over 0 og opptil 100.</p>}
                <div className="target-block"><div><label htmlFor="target">Har du et snitt du sikter mot?</label><span>Se hva du trenger på neste karakter.</span></div><input id="target" type="number" min="1" max="6" step="0.1" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} aria-invalid={!targetValid} aria-describedby="target-answer" /></div>
                <p className={cn('target-answer', !targetValid && 'field-error')} id="target-answer" aria-live="polite">{!targetValid ? 'Skriv inn et mål mellom 1 og 6.' : !nextWeightValid ? 'Legg inn en gyldig vekt for å beregne målet.' : needed.required === null ? 'Legg til karakterene dine først.' : needed.possible ? <><CheckCircle size={19} aria-hidden="true" /><span>Du trenger minst <strong>{Math.max(1, Math.ceil(needed.required - 1e-9))}</strong> på neste karakter for å nå {format(Number(target))} i snitt.</span></> : <><Info size={19} aria-hidden="true" /><span>Én ny karakter er ikke nok til å nå {format(Number(target))}. En 6-er gir {format(projectAverage(rows, { weighted, grade: 6, weight: nextWeight }).average)} i snitt.</span></>}</p>
                <button className="text-button back-to-grades" onClick={() => setTab('average')}>Tilbake til fagene mine <ArrowRight size={16} aria-hidden="true" /></button>
              </Tabs.Content>
            </Tabs.Root>
          </div>
          <Results result={result} projected={projected} isPlanning={tab === 'planning' && nextWeightValid} weighted={weighted} rows={rows} schoolLevel={schoolLevel} year={admissionYear} />
        </InView>
        <div className="below-calculator"><span role="status">{storageOk ? <><Check size={15} aria-hidden="true" /> Lagret automatisk på denne enheten</> : <><Info size={15} aria-hidden="true" /> Nettleseren tillater ikke lagring. Karakterene beholdes bare mens siden er åpen.</>}</span><span>Ingen konto. Bare oversikt.</span></div>
      </section>

      <StudyFinder />

      <section className="guide-section" id="slik-fungerer-det">
        <InView className="guide-intro"><span className="guide-symbol" aria-hidden="true">k.</span><h2>Et lite regnestykke.<br /><em>Litt mer ro.</em></h2><p>Kinetio hjelper deg å forstå tallene, så du kan bruke mer tid på alt det andre.</p></InView>
        <div className="guide-questions">
          <details open><summary>Hvordan regnes snittet ut?<Plus size={19} aria-hidden="true" /></summary><p>Vi legger sammen karakterene og deler på antallet. Med karakterene 4, 5 og 6 blir snittet 5,00. Tomme felt holdes utenfor.</p></details>
          <details><summary>Når skal jeg bruke vekting?<Plus size={19} aria-hidden="true" /></summary><p>Når vurderinger skal telle ulikt. Vi multipliserer hver karakter med vekten og deler summen på total vekt. En karakter med vekt 2 teller dobbelt så mye som en med vekt 1.</p></details>
          <details><summary>Er dette de endelige poengene mine?<Plus size={19} aria-hidden="true" /></summary><p>Dette er et anslag basert på karakterene og fagene du har lagt inn. Prøvekarakterer er ikke det samme som vitnemålskarakterer. Fagpoeng krever riktig nivå og godkjent dokumentasjon. Samordna opptak vurderer opptaksgrunnlag, kvote og endelige poeng.</p></details>
          <details><summary>Hvem kan se karakterene mine?<Plus size={19} aria-hidden="true" /></summary><p>Karakterene lagres bare i denne nettleseren på denne enheten. De sendes ikke til en server. På en delt enhet bør du velge «Start på nytt» når du er ferdig.</p></details>
        </div>
      </section>
    </main>
    <footer className="site-footer" id="footer">
      <div className="footer-scene">
        <img className="footer-landscape" src="/kinetio-lake-footer.png" alt="" width="1774" height="887" loading="lazy" decoding="async" />
        <div className="footer-shade" aria-hidden="true" />
        <div className="footer-identity">
          <a href="#topp" className="footer-brand" aria-label="Kinetio, tilbake til toppen">Kinetio</a>
          <p>Rom for å lære. Rom for å vokse.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <nav className="footer-links" aria-label="Bunnmeny">
          <a href="#kalkulator">Kalkulator</a>
          <a href="#studier">Finn studier</a>
          <a href="#slik-fungerer-det">Slik fungerer det</a>
        </nav>
        <a href="#topp" className="back-top">Til toppen <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>
    </footer>
    <div className="sr-only" role="status">{announcement}</div>
  </MotionConfig>;
}
