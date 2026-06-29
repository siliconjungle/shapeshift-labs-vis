'use client';

import { useState } from 'react';

const regionOverlapExamples = {
  'user-contract': {
    language: 'typescript',
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
      '',
      'export function greet(user: User) {',
      '  return `Hello ${displayName(user)}`;',
      '}',
    ],
    regions: [
      {
        id: 'r1',
        label: 'User',
        kind: 'public type',
        line: 1,
        text: 'User',
        agentA: 'Adds nickname',
        agentB: 'Renames name to fullName',
        relationship: 'Same public contract',
        route: 'Review or typed rebase',
        tone: 'review',
      },
      {
        id: 'r2',
        label: 'fullName',
        kind: 'field',
        line: 3,
        text: 'fullName',
        agentA: 'Reads old name',
        agentB: 'Owns rename',
        relationship: 'Dependency overlap',
        route: 'Rebase helper read',
        tone: 'rebase',
      },
      {
        id: 'r3',
        label: 'displayName',
        kind: 'function',
        line: 7,
        text: 'displayName',
        agentA: 'Adds helper',
        agentB: 'Changes dependency',
        relationship: 'Compatible after adaptation',
        route: 'Gate output',
        tone: 'apply',
      },
      {
        id: 'r4',
        label: 'greet',
        kind: 'caller',
        line: 11,
        text: 'greet',
        agentA: 'Switches to helper',
        agentB: 'Preserves behavior',
        relationship: 'Shared behavior surface',
        route: 'Run focused test',
        tone: 'gate',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const normalizeSource = (source = []) =>
  Array.isArray(source) ? source : String(source).replace(/\n$/, '').split('\n');

const normalizeRegions = (regions = []) =>
  regions.map((region, index) => ({
    ...region,
    id: region.id ?? `r${index + 1}`,
    label: region.label ?? `region ${index + 1}`,
    tone: region.tone ?? 'review',
  }));

const findLineRanges = (line, regions) => {
  let cursor = 0;
  return regions
    .map((region, index) => {
      const start =
        Number.isInteger(region.start) && Number.isInteger(region.end)
          ? region.start
          : line.indexOf(region.text, cursor);
      const end =
        Number.isInteger(region.start) && Number.isInteger(region.end)
          ? region.end
          : start + String(region.text ?? '').length;
      if (start < cursor || end <= start) return null;
      cursor = end;
      return { ...region, start, end, index };
    })
    .filter(Boolean);
};

const renderSourceLine = (line, lineNumber, regions, activeRegionId, setActiveRegionId) => {
  const ranges = findLineRanges(
    line,
    regions.filter((region) => region.line === lineNumber)
  );
  if (!ranges.length) return line || ' ';

  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(line.slice(cursor, range.start));
    parts.push(
      <mark
        className={classNames(
          'region-overlap-map__mark',
          `region-overlap-map__mark--${range.tone}`,
          activeRegionId === range.id && 'region-overlap-map__mark--active'
        )}
        data-region={range.id}
        key={`${lineNumber}-${range.id}-${range.start}`}
        onBlur={() => setActiveRegionId(null)}
        onClick={() => setActiveRegionId(range.id)}
        onFocus={() => setActiveRegionId(range.id)}
        onMouseEnter={() => setActiveRegionId(range.id)}
        onMouseLeave={() => setActiveRegionId(null)}
        onMouseOver={() => setActiveRegionId(range.id)}
        onPointerEnter={() => setActiveRegionId(range.id)}
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

export default function RegionOverlapMap({
  example = 'user-contract',
  source,
  regions,
  language,
  caption,
  className = '',
}) {
  const preset = regionOverlapExamples[example] || regionOverlapExamples['user-contract'];
  const resolvedSource = normalizeSource(source ?? preset.source);
  const resolvedRegions = normalizeRegions(regions ?? preset.regions);
  const resolvedLanguage = language ?? preset.language ?? 'typescript';
  const [activeRegionId, setActiveRegionId] = useState(null);

  return (
    <div className={classNames('region-overlap-map', className)}>
      <figure className="region-overlap-map__code" data-rehype-pretty-code-figure="">
        <pre aria-label="source text with highlighted semantic regions">
          <code data-language={resolvedLanguage}>
            {resolvedSource.map((line, index) => (
              <span data-line="" key={`${index}-${line}`}>
                {renderSourceLine(line, index + 1, resolvedRegions, activeRegionId, setActiveRegionId)}
              </span>
            ))}
          </code>
        </pre>
      </figure>
      <div className="region-overlap-map__table-scroll">
        <table className="admission-checklist__rows region-overlap-map__table" aria-label="semantic region overlaps">
          <colgroup>
            <col className="region-overlap-map__col-region" />
            <col className="region-overlap-map__col-agent" />
            <col className="region-overlap-map__col-agent" />
            <col className="region-overlap-map__col-relationship" />
            <col className="region-overlap-map__col-route" />
          </colgroup>
          <thead>
            <tr>
              <th>Region</th>
              <th>Agent A</th>
              <th>Agent B</th>
              <th>Relationship</th>
              <th>Route</th>
            </tr>
          </thead>
          <tbody>
            {resolvedRegions.map((region) => (
              <tr
                className={classNames(
                  'region-overlap-map__row',
                  `region-overlap-map__row--${region.tone}`,
                  activeRegionId === region.id && 'region-overlap-map__row--active'
                )}
                key={region.id}
                onBlur={() => setActiveRegionId(null)}
                onClick={() => setActiveRegionId(region.id)}
                onFocus={() => setActiveRegionId(region.id)}
                onMouseEnter={() => setActiveRegionId(region.id)}
                onMouseLeave={() => setActiveRegionId(null)}
                onMouseOver={() => setActiveRegionId(region.id)}
                onPointerEnter={() => setActiveRegionId(region.id)}
                tabIndex={0}
              >
                <td className="region-overlap-map__region">
                  <strong>{region.label}</strong>
                  <small>{region.kind}</small>
                </td>
                <td>{region.agentA}</td>
                <td>{region.agentB}</td>
                <td>{region.relationship}</td>
                <td className="region-overlap-map__route">{region.route}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <p className="workflow-chart-caption region-overlap-map__caption">{caption}</p> : null}
    </div>
  );
}
