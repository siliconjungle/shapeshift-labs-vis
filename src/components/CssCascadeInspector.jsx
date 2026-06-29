'use client';

import { useState } from 'react';

const cssCascadeInspectorExamples = {
  'button-color': {
    language: 'css',
    target: '.card .button.primary',
    property: 'color',
    activeState: 'viewport >= 48rem, not disabled',
    computedValue: '#1f2937',
    source: [
      '@layer reset, theme, components;',
      '',
      '@layer theme {',
      '  :root { --accent-fg: #315a45; }',
      '}',
      '',
      '@layer components {',
      '  .card .button { color: var(--accent-fg); }',
      '  .button.primary { color: #f7efe3; }',
      '}',
      '',
      '@media (min-width: 48rem) {',
      '  .button.primary { color: #1f2937; }',
      '}',
      '',
      '.button[aria-disabled="true"] { color: #8a8178; }',
    ],
    candidates: [
      {
        id: 'c1',
        selector: '.card .button',
        label: 'Base component rule',
        line: 8,
        text: 'color: var(--accent-fg)',
        position: 'components layer, specificity 0-2-0, order 1',
        applies: 'matches target; variable resolves from theme layer',
        result: 'loses to later equal-specificity rule',
        tone: 'overridden',
      },
      {
        id: 'c2',
        selector: '.button.primary',
        label: 'Variant rule',
        line: 9,
        text: 'color: #f7efe3',
        position: 'components layer, specificity 0-2-0, order 2',
        applies: 'matches target; same layer as base rule',
        result: 'loses while media rule is active',
        tone: 'overridden',
      },
      {
        id: 'c3',
        selector: '@media .button.primary',
        label: 'Responsive rule',
        line: 13,
        text: 'color: #1f2937',
        position: 'unlayered author rule, specificity 0-2-0, order 3',
        applies: 'matches target; viewport condition is true',
        result: 'wins computed color',
        tone: 'winner',
      },
      {
        id: 'c4',
        selector: '[aria-disabled="true"]',
        label: 'State rule',
        line: 16,
        text: 'color: #8a8178',
        position: 'unlayered author rule, specificity 0-2-0, order 4',
        applies: 'selector does not match current state',
        result: 'ignored for this target',
        tone: 'inactive',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const normalizeSource = (source = []) =>
  Array.isArray(source) ? source : String(source).replace(/\n$/, '').split('\n');

const normalizeCandidates = (candidates = []) =>
  candidates.map((candidate, index) => ({
    ...candidate,
    id: candidate.id ?? `c${index + 1}`,
    tone: candidate.tone ?? 'overridden',
  }));

const findLineRanges = (line, candidates) => {
  let cursor = 0;
  return candidates
    .map((candidate, index) => {
      const start =
        Number.isInteger(candidate.start) && Number.isInteger(candidate.end)
          ? candidate.start
          : line.indexOf(candidate.text, cursor);
      const end =
        Number.isInteger(candidate.start) && Number.isInteger(candidate.end)
          ? candidate.end
          : start + String(candidate.text ?? '').length;
      if (start < cursor || end <= start) return null;
      cursor = end;
      return { ...candidate, start, end, index };
    })
    .filter(Boolean);
};

const renderSourceLine = (line, lineNumber, candidates, activeCandidateId, setActiveCandidateId) => {
  const ranges = findLineRanges(
    line,
    candidates.filter((candidate) => candidate.line === lineNumber)
  );
  if (!ranges.length) return line || ' ';

  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(line.slice(cursor, range.start));
    parts.push(
      <mark
        className={classNames(
          'css-cascade-inspector__mark',
          `css-cascade-inspector__mark--${range.tone}`,
          activeCandidateId === range.id && 'css-cascade-inspector__mark--active'
        )}
        data-candidate={range.id}
        key={`${lineNumber}-${range.id}-${range.start}`}
        onBlur={() => setActiveCandidateId(null)}
        onClick={() => setActiveCandidateId(range.id)}
        onFocus={() => setActiveCandidateId(range.id)}
        onMouseEnter={() => setActiveCandidateId(range.id)}
        onMouseLeave={() => setActiveCandidateId(null)}
        tabIndex={0}
      >
        {line.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
};

export default function CssCascadeInspector({
  example = 'button-color',
  source,
  candidates,
  language,
  target,
  property,
  activeState,
  computedValue,
  caption,
  className = '',
}) {
  const preset = cssCascadeInspectorExamples[example] || cssCascadeInspectorExamples['button-color'];
  const resolvedSource = normalizeSource(source ?? preset.source);
  const resolvedCandidates = normalizeCandidates(candidates ?? preset.candidates);
  const resolvedLanguage = language ?? preset.language ?? 'css';
  const resolvedTarget = target ?? preset.target;
  const resolvedProperty = property ?? preset.property;
  const resolvedActiveState = activeState ?? preset.activeState;
  const resolvedComputedValue = computedValue ?? preset.computedValue;
  const [activeCandidateId, setActiveCandidateId] = useState(null);

  return (
    <figure className={classNames('css-cascade-inspector', className)}>
      <figure className="css-cascade-inspector__code" data-rehype-pretty-code-figure="">
        <pre aria-label="css source with highlighted cascade candidates">
          <code data-language={resolvedLanguage}>
            {resolvedSource.map((line, index) => (
              <span data-line="" key={`${index}-${line}`}>
                {renderSourceLine(line, index + 1, resolvedCandidates, activeCandidateId, setActiveCandidateId)}
              </span>
            ))}
          </code>
        </pre>
      </figure>
      <div className="css-cascade-inspector__table-scroll">
        <table className="admission-checklist__rows css-cascade-inspector__table" aria-label="css cascade candidates">
          <colgroup>
            <col className="css-cascade-inspector__col-rule" />
            <col className="css-cascade-inspector__col-position" />
            <col className="css-cascade-inspector__col-applies" />
            <col className="css-cascade-inspector__col-result" />
          </colgroup>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Cascade position</th>
              <th>Applies</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {resolvedCandidates.map((candidate) => (
              <tr
                className={classNames(
                  'css-cascade-inspector__row',
                  `css-cascade-inspector__row--${candidate.tone}`,
                  activeCandidateId === candidate.id && 'css-cascade-inspector__row--active'
                )}
                key={candidate.id}
                onBlur={() => setActiveCandidateId(null)}
                onClick={() => setActiveCandidateId(candidate.id)}
                onFocus={() => setActiveCandidateId(candidate.id)}
                onMouseEnter={() => setActiveCandidateId(candidate.id)}
                onMouseLeave={() => setActiveCandidateId(null)}
                tabIndex={0}
              >
                <td data-label="Rule">
                  <span className="css-cascade-inspector__rule">
                    <strong>{candidate.selector}</strong>
                    <small>{candidate.label}</small>
                  </span>
                </td>
                <td data-label="Cascade position">{candidate.position}</td>
                <td data-label="Applies">{candidate.applies}</td>
                <td data-label="Result">
                  <span className="css-cascade-inspector__result">{candidate.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="css-cascade-inspector__summary-scroll">
        <table className="admission-checklist__rows css-cascade-inspector__summary" aria-label="computed style result">
          <thead>
            <tr>
              <th>Target</th>
              <th>Property</th>
              <th>State</th>
              <th>Computed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Target">{resolvedTarget}</td>
              <td data-label="Property">{resolvedProperty}</td>
              <td data-label="State">{resolvedActiveState}</td>
              <td data-label="Computed">{resolvedComputedValue}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className="workflow-chart-caption css-cascade-inspector__caption">{caption}</figcaption> : null}
    </figure>
  );
}
