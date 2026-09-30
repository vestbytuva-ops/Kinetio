import { useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Dialog } from 'radix-ui';
import { Check, CaretDown } from '@phosphor-icons/react';
import { getCourse, suggestSubjects, coursePoints, languageComponentFromSubject } from '../lib/admission.mjs';
const number = n => n.toLocaleString('nb-NO', { maximumFractionDigits: 2 });

export function SubjectInput({ row, index, schoolLevel, year, onChange, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [component, setComponent] = useState(null);
  const input = useRef(null);
  const suggestions = suggestSubjects(row.subject, { schoolLevel });
  const confirmed = row.bonusConfirmed && getCourse(row.courseId);
  function select(item) {
    setOpen(false);
    if (item.type === 'common') onConfirm(item);
    else {
      setComponent(item.id === row.courseId && ['oral', 'written'].includes(row.languageComponent)
        ? row.languageComponent : languageComponentFromSubject(row.subject));
      setPending(item);
    }
  }
  return <div id={`subject-${row.id}`} className="subject-field">
    <Command shouldFilter={false} label={`Fag ${index + 1}`} vimBindings={false}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
      onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } }}>
      <Command.Input asChild ref={input} className="subject-input" value={row.subject}
        onValueChange={value => { onChange(value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="Skriv fag eller vurdering" maxLength={100}>
        <input aria-expanded={open && suggestions.length > 0} aria-describedby={schoolLevel === 'vgs' ? `subject-status-${row.id}` : undefined} {...(!open ? { 'aria-activedescendant': undefined } : {})} />
      </Command.Input>
      <Command.List className="subject-suggestions" label="Fagforslag" hidden={!open || suggestions.length === 0}>
        {suggestions.slice(0, 9).map(item => <Command.Item key={item.id} value={item.id} onSelect={() => select(item)} onMouseDown={e => e.preventDefault()}>
          <span>{item.label}</span><small>{schoolLevel === 'vgs' && coursePoints(item, year) > 0 ? `+${number(coursePoints(item, year))}` : 'Uten fagpoeng'}</small>
        </Command.Item>)}
        {suggestions.length > 9 && <p className="subject-search-hint">Skriv språk eller nivå for å avgrense forslagene.</p>}
      </Command.List>
    </Command>
    {schoolLevel === 'vgs' && <div className="subject-status" id={`subject-status-${row.id}`}>
      {confirmed?.requiresLanguagePair && coursePoints(confirmed, year) > 0 ? <button type="button" onClick={() => select(confirmed)}>
        {['oral', 'written'].includes(row.languageComponent) ? <><Check size={12} aria-hidden="true" /><span>{row.languageComponent === 'oral' ? 'Muntlig' : 'Skriftlig'} bekreftet · poeng krever begge deler</span></> : <>Bekreft muntlig eller skriftlig <CaretDown size={12} aria-hidden="true" /></>}
      </button> : confirmed ? <span><Check size={12} aria-hidden="true" />{coursePoints(confirmed, year) === 0 ? 'Fag bekreftet · ingen fagpoeng' : `Fag bekreftet · inntil ${number(coursePoints(confirmed, year))} poeng`}</span>
        : suggestions.some(i => coursePoints(i, year) > 0) && <button type="button" onClick={() => { input.current?.focus(); setOpen(true); }}>Velg fag og nivå <CaretDown size={12} aria-hidden="true" /></button>}
    </div>}
    <Dialog.Root open={Boolean(pending)} onOpenChange={value => { if (!value) setPending(null); }}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content course-dialog" onCloseAutoFocus={e => { e.preventDefault(); input.current?.focus(); setOpen(false); }}>
        <Dialog.Title>Bekreft fag og nivå</Dialog.Title>
        <Dialog.Description>Er «{pending?.label}» riktig fag på vitnemålet ditt?</Dialog.Description>
        {pending?.type === 'language' && <p>Dette må være et programfag, ikke et obligatorisk fellesfag. Språk som også er første- eller andrespråket ditt må være godkjent som fremmedspråk.</p>}
        {pending?.requiresLanguagePair && <fieldset className="language-component" aria-describedby={`language-help-${row.id}`}>
          <legend>Hvilken karakter er dette?</legend>
          <div>{[['oral', 'Muntlig'], ['written', 'Skriftlig']].map(([value, label]) => <label key={value}>
            <input type="radio" name={`language-component-${row.id}`} value={value} checked={component === value} onChange={() => setComponent(value)} />{label}
          </label>)}</div>
        </fieldset>}
        {pending?.type === 'naturbruk' && <p>Bekreft bare dersom du har fullført hele studieforberedende Vg3 naturbruk. Én enkelt fagkarakter er ikke nok.</p>}
        {pending?.type === 'samisk' && <p>Dette gjelder samisk som førstespråk på videregående. I 2028 kan det gi 1 poeng, men ikke ved opptak til studier som har samisk kvote. Samisk som fremmedspråk er et annet fag.</p>}
        <p className="confirm-points">{pending?.type === 'samisk' && year === 2028 ? 'Kan gi ' : ''}{number(coursePoints(pending, year))} fagpoeng {pending?.requiresLanguagePair ? 'samlet for hele faget ' : ''}etter reglene for {year}.</p>
        {pending?.requiresLanguagePair ? <p id={`language-help-${row.id}`}>Legg inn muntlig og skriftlig på hver sin rad. Begge må være bestått på samme nivå, også for privatister. Poengene telles én gang per fag. <a href="https://www.udir.no/lk20/psp01-04/vurderingsordning" target="_blank" rel="noreferrer">Se Udirs krav ↗</a></p>
          : <p>Poeng tas med når karakteren er bestått. Du må ha dokumentasjon, og samme fag teller bare én gang.</p>}
        <div className="dialog-actions"><Dialog.Close className="button secondary">Behold det jeg skrev</Dialog.Close><button className="button primary" disabled={pending?.requiresLanguagePair && !component} onClick={() => { onConfirm(pending, component); setPending(null); }}>Bekreft fag</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
