import { useRef } from 'react';
import { Command } from 'cmdk';
import { ArrowRight, GraduationCap, MagnifyingGlass, X } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import './apple-spotlight.css';

/**
 * Inline, controlled study search. Items arrive filtered by the caller.
 * cmdk owns the input's generated id and accessible label; inputId identifies
 * the surrounding panel and its descriptive text without breaking that link.
 */
export function AppleSpotlight({
  items = [],
  value = '',
  onValueChange,
  onSelect,
  label = 'Søk etter studier',
  placeholder = 'Studium, lærested eller sted …',
  loading = false,
  error = null,
  inputId = 'study-search',
  maxResults = 8,
  totalCount,
  emptyMessage = 'Ingen studier passer til søket. Prøv et annet fag, lærested eller sted.',
  children,
}) {
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const limit = Number.isFinite(maxResults) ? Math.max(1, Math.floor(maxResults)) : 8;
  const visibleItems = loading || error ? [] : items.slice(0, limit);
  const count = Number.isFinite(totalCount) ? Math.max(items.length, totalCount) : items.length;
  const statusId = `${inputId}-status`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Studiene kunne ikke lastes. Prøv igjen senere.';
  const resultStatus = loading
    ? 'Laster studier …'
    : error
      ? 'Studiene kunne ikke lastes.'
      : count === 0
        ? 'Ingen studier funnet.'
        : visibleItems.length < count
          ? `Viser ${visibleItems.length} av ${count} studier. Avgrens søket for å finne flere.`
          : `${count} ${count === 1 ? 'studium' : 'studier'} funnet.`;

  function clearSearch() {
    onValueChange?.('');
    inputRef.current?.focus();
  }

  return <motion.div
    id={inputId}
    className="apple-spotlight"
    initial={reduceMotion ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: reduceMotion ? 0 : 0.16 }}
  >
    <Command className="spotlight-command" label={label} shouldFilter={false} vimBindings={false}>
      <div className="spotlight-field">
        <MagnifyingGlass className="spotlight-search-icon" size={25} weight="light" aria-hidden="true" />
        <Command.Input
          ref={inputRef}
          className="spotlight-input"
          value={value}
          onValueChange={onValueChange}
          placeholder={placeholder}
          aria-describedby={`${hintId} ${statusId}${error ? ` ${errorId}` : ''}`}
          aria-busy={loading}
        />
      </div>

      <Command.List className="spotlight-results" label="Studier" aria-busy={loading}>
        {loading && <Command.Loading label="Laster studier" className="spotlight-message">Laster studier …</Command.Loading>}
        {!loading && error && <div id={errorId} className="spotlight-message spotlight-error">{errorMessage}</div>}
        {!loading && !error && <>
          <Command.Empty className="spotlight-message">{emptyMessage}</Command.Empty>
          {visibleItems.map(item => <Command.Item
            key={item.id}
            value={String(item.id)}
            className="spotlight-result"
            onSelect={() => onSelect?.(item)}
          >
            <span className="spotlight-result-icon" aria-hidden="true"><GraduationCap size={23} weight="light" /></span>
            <span className="spotlight-result-copy">
              <span className="spotlight-result-label">{item.label}</span>
              <span className="spotlight-result-description">{item.description}</span>
            </span>
            {item.detail != null && <span className="spotlight-result-detail">{item.detail}</span>}
            <ArrowRight size={18} className="spotlight-result-arrow" aria-hidden="true" />
          </Command.Item>)}
        </>}
      </Command.List>
    </Command>

    {value && <button type="button" className="spotlight-clear" aria-label="Tøm studiesøket" onClick={clearSearch}>
      <X size={18} aria-hidden="true" />
    </button>}

    <div className="spotlight-footer">
      <p id={statusId} className="spotlight-status" role="status" aria-live="polite" aria-atomic="true">{resultStatus}</p>
      <p id={hintId} className="spotlight-hint">Bruk piltastene og Enter for å velge.</p>
      {children && <div className="spotlight-footer-content">{children}</div>}
    </div>
  </motion.div>;
}

export default AppleSpotlight;
