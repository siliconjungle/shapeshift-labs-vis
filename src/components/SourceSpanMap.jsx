'use client';

import { useState } from 'react';

const sourceSpanMapExamples = {
  'display-name': {
    eyebrow: 'Source Span Map',
    title: 'Text To Semantic Records',
    source: [
      'export interface User {',
      '  id: string;',
      '  fullName: string;',
      '  nickname?: string;',
      '}',
      '',
      'export function displayName(user: User) {',
      '  return user.nickname ?? user.fullName;',
      '}',
    ],
    spans: [
      {
        id: 's1',
        label: 'exported type',
        line: 1,
        text: 'User',
        offset: '0..93',
        record: 'type declaration',
        claim: 'public User shape is the contract surface',
        tone: 'base',
      },
      {
        id: 's2',
        label: 'field',
        line: 3,
        text: 'fullName',
        offset: '46..54',
        record: 'property symbol',
        claim: 'renamed public field current at head',
        tone: 'rename',
      },
      {
        id: 's3',
        label: 'helper',
        line: 7,
        text: 'displayName',
        offset: '112..123',
        record: 'function declaration',
        claim: 'worker helper is preserved in output',
        tone: 'add',
      },
      {
        id: 's4',
        label: 'read',
        line: 8,
        text: 'fullName',
        offset: '169..177',
        record: 'use site',
        claim: 'helper read was rebased through the rename',
        tone: 'rename',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const normalizeSource = (source = []) =>
  Array.isArray(source) ? source : String(source).replace(/\n$/, '').split('\n');

const normalizeSpans = (spans = []) =>
  spans.map((span, index) => ({
    ...span,
    id: span.id ?? `s${index + 1}`,
    label: span.label ?? `span ${index + 1}`,
    tone: span.tone ?? 'base',
  }));

const findLineRanges = (line, spans) => {
  let cursor = 0;
  return spans
    .map((span, index) => {
      const start =
        Number.isInteger(span.start) && Number.isInteger(span.end)
          ? span.start
          : line.indexOf(span.text, cursor);
      const end =
        Number.isInteger(span.start) && Number.isInteger(span.end)
          ? span.end
          : start + String(span.text ?? '').length;
      if (start < cursor || end <= start) return null;
      cursor = end;
      return { ...span, start, end, index };
    })
    .filter(Boolean);
};

const renderSourceLine = (line, lineNumber, spans, activeSpanId, setActiveSpanId) => {
  const ranges = findLineRanges(
    line,
    spans.filter((span) => span.line === lineNumber)
  );
  if (!ranges.length) return line || ' ';

  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(line.slice(cursor, range.start));
    parts.push(
      <mark
        className={classNames(
          'source-span-map__mark',
          `source-span-map__mark--${range.tone}`,
          activeSpanId === range.id && 'source-span-map__mark--active'
        )}
        data-span={range.id}
        key={`${lineNumber}-${range.id}-${range.start}`}
        onBlur={() => setActiveSpanId(null)}
        onClick={() => setActiveSpanId(range.id)}
        onFocus={() => setActiveSpanId(range.id)}
        onMouseEnter={() => setActiveSpanId(range.id)}
        onMouseLeave={() => setActiveSpanId(null)}
        onMouseOver={() => setActiveSpanId(range.id)}
        onPointerEnter={() => setActiveSpanId(range.id)}
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

export default function SourceSpanMap({
  example = 'display-name',
  source,
  spans,
  caption,
  className = '',
}) {
  const preset = sourceSpanMapExamples[example] || sourceSpanMapExamples['display-name'];
  const resolvedSource = normalizeSource(source ?? preset.source);
  const resolvedSpans = normalizeSpans(spans ?? preset.spans);
  const [activeSpanId, setActiveSpanId] = useState(null);

  return (
    <div className={classNames('source-span-map', className)}>
      <figure className="source-span-map__code" data-rehype-pretty-code-figure="">
        <pre aria-label="source text with highlighted spans">
          <code data-language="typescript">
            {resolvedSource.map((line, index) => (
              <span data-line="" key={`${index}-${line}`}>
                {renderSourceLine(line, index + 1, resolvedSpans, activeSpanId, setActiveSpanId)}
              </span>
            ))}
          </code>
        </pre>
      </figure>
      <div className="source-span-map__records-scroll">
        <table className="admission-checklist__rows source-span-map__records" aria-label="source span records">
          <colgroup>
            <col className="source-span-map__col-span" />
            <col className="source-span-map__col-record" />
            <col className="source-span-map__col-offset" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Span</th>
              <th>Record</th>
              <th>Offset</th>
              <th>Claim</th>
            </tr>
          </thead>
          <tbody>
            {resolvedSpans.map((span) => (
              <tr
                className={classNames(
                  'source-span-map__record',
                  `source-span-map__record--${span.tone}`,
                  activeSpanId === span.id && 'source-span-map__record--active'
                )}
                key={span.id}
                onBlur={() => setActiveSpanId(null)}
                onClick={() => setActiveSpanId(span.id)}
                onFocus={() => setActiveSpanId(span.id)}
                onMouseEnter={() => setActiveSpanId(span.id)}
                onMouseLeave={() => setActiveSpanId(null)}
                onMouseOver={() => setActiveSpanId(span.id)}
                onPointerEnter={() => setActiveSpanId(span.id)}
                tabIndex={0}
              >
                <td className="source-span-map__record-id">{span.id}</td>
                <td className="source-span-map__record-main">
                  <strong>{span.label}</strong>
                  <small>{span.record}</small>
                </td>
                <td className="source-span-map__record-offset">{span.offset}</td>
                <td className="source-span-map__record-claim">{span.claim}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <p className="workflow-chart-caption source-span-map__caption">{caption}</p> : null}
    </div>
  );
}
