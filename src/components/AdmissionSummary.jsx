import { certificatePoints, calculateSubjectPoints } from '../lib/admission.mjs';
const format = n => n == null ? '–' : n.toLocaleString('nb-NO', { maximumFractionDigits: 2 });
export function AdmissionSummary({ rows, schoolLevel, year, weighted }) {
  const gradePoints = certificatePoints(rows);
  const bonus = calculateSubjectPoints(rows, { schoolLevel, year });
  const total = gradePoints == null || bonus.points == null ? null : gradePoints + bonus.points;
  return <div className="admission-summary">
    <div className="admission-heading"><h3>{schoolLevel === 'vgs' ? `Poengoversikt · ${year}` : 'Grunnskolepoeng'}</h3><span>Anslag</span></div>
    <dl className="admission-metrics">
      <div><dt>{schoolLevel === 'vgs' ? 'Karakterpoeng' : 'Grunnskolepoeng'}</dt><dd>{format(gradePoints)}</dd></div>
      {schoolLevel === 'vgs' && <><div><dt>Bekreftede fagpoeng</dt><dd>{format(bonus.points)}</dd></div><div className="admission-total"><dt>Karakter- og fagpoeng</dt><dd>{format(total)}</dd></div></>}
    </dl>
    {schoolLevel === 'vgs' && <>
      <p className="admission-explainer">{year < 2028 ? 'Inntil 4 realfags- og språkpoeng samlet.' : 'Fra 2028: halvparten så mange realfagspoeng, maks 2. Språk- og naturbrukspoeng faller bort. Samisk førstespråk kan gi 1 poeng.'}</p>
      <details className="point-details"><summary>Se fag og beregning</summary>
        {bonus.items.length ? <ul>{bonus.items.map(item => <li key={item.id}><span>{item.label}</span><b>{format(item.awarded)}</b></li>)}</ul> : <p>Ingen beståtte fag med bekreftet fagtype ennå. Velg et forslag under fagnavnet.</p>}
        <p>Beløpene per fag vises før eventuelle grenser for samme språk, overlapp og samlet poengsum.</p>
      </details>
    </>}
    {bonus.warnings.map(text => <p className="admission-warning" key={text}>{text}</p>)}
    {schoolLevel === 'vgs' && <div className="quota-information">
      <p>To veier inn</p>
      <details><summary><span>Førstegangsvitnemål<small>Opprinnelig vitnemål</small></span><span aria-hidden="true">+</span></summary><p>For søkere med førstegangsvitnemål som fyller høyst {year < 2028 ? '21' : '23'} år i opptaksåret. Forbedrede karakterer teller ikke i denne kvoten. Anslaget over forutsetter at du har lagt inn de riktige vitnemålskarakterene.</p></details>
      <details><summary><span>Ordinær kvote<small>Forbedringer kan telle</small></span><span aria-hidden="true">+</span></summary><p>Forbedrede karakterer og andre tilleggspoeng kan inngå. Alderspoeng og flere andre tillegg faller bort fra 2028. Kinetio beregner karakter- og fagpoeng; ordinære konkurransepoeng kan derfor være annerledes.</p></details>
    </div>}
    <p className="admission-explainer">{weighted && 'Poengoversikten bruker lik vekt, selv om snittet over er vektet. '}Bruk alle tellende vitnemålskarakterer, inkludert eksamen. Prøvekarakterer gir bare et øvingsanslag.</p>
    {schoolLevel === 'vgs' && <p className="admission-explainer">Andre tilleggspoeng og opptakskrav er ikke beregnet. <a href="https://www.regjeringen.no/no/aktuelt/slik-blir-de-nye-reglene-for-opptak-til-hoyere-utdanning/id3118553/" target="_blank" rel="noreferrer">Se opptaksreglene ↗</a></p>}
  </div>;
}
