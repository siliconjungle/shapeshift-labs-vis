'use client';

import { useId, useState } from 'react';

const semanticCodeDiffExamples = {
  'import-set': {
    title: 'Same Line, Different Facts',
    defaultPane: 'Base',
    panes: [
      {
        label: 'Base',
        role: 'base',
        code: 'import { readUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        note: {
          kind: 'base',
          label: 'Base fact',
          detail: 'readUser is the existing import and call-site dependency.',
        },
        highlights: [
          { line: 1, text: 'readUser', kind: 'base', label: 'base symbol' },
        ],
      },
      {
        label: 'Agent A',
        role: 'worker',
        code: 'import { readUser, writeUser } from "./api";',
        note: {
          kind: 'add',
          label: 'Agent A changed',
          detail: 'writeUser is added to the import set while readUser stays intact.',
        },
        highlights: [
          { line: 1, text: 'readUser', kind: 'base', label: 'kept' },
          { line: 1, text: 'writeUser', kind: 'add', label: 'add' },
        ],
      },
      {
        label: 'Agent B',
        role: 'worker',
        code: 'import { readUser, deleteUser } from "./api";',
        note: {
          kind: 'add-alt',
          label: 'Agent B changed',
          detail: 'deleteUser is added to the same import set without removing readUser.',
        },
        highlights: [
          { line: 1, text: 'readUser', kind: 'base', label: 'kept' },
          { line: 1, text: 'deleteUser', kind: 'add-alt', label: 'add' },
        ],
      },
      {
        label: 'Output',
        role: 'output',
        code: 'import { readUser, deleteUser, writeUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        note: {
          kind: 'admit',
          label: 'Admitted merge',
          detail: 'Both additions survive because the imported local names are unique and the base binding remains.',
        },
        highlights: [
          { line: 1, text: 'readUser', kind: 'base', label: 'base' },
          { line: 1, text: 'deleteUser', kind: 'add-alt', label: 'B add' },
          { line: 1, text: 'writeUser', kind: 'add', label: 'A add' },
        ],
      },
    ],
    annotations: [
      { kind: 'base', label: 'base binding', detail: 'readUser remains present' },
      { kind: 'add', label: 'agent A span', detail: 'writeUser is an import-set addition' },
      { kind: 'add-alt', label: 'agent B span', detail: 'deleteUser is an import-set addition' },
      { kind: 'admit', label: 'admission', detail: 'no duplicate local names or removals' },
    ],
  },
  'typed-rebase': {
    title: 'Typed Rebase Through A Rename',
    defaultPane: 'Base',
    panes: [
      {
        label: 'Base',
        role: 'base',
        code: 'export interface User {\n  id: string;\n  name: string;\n}\n\nexport function greet(user: User) {\n  return `Hello ${user.name}`;\n}',
        note: {
          kind: 'base',
          label: 'Base contract',
          detail: 'The public field is name, and greet reads that field directly.',
        },
        highlights: [
          { line: 3, text: 'name', kind: 'base', label: 'base field' },
          { line: 7, text: 'name', kind: 'base', label: 'base read' },
        ],
      },
      {
        label: 'Agent A',
        role: 'worker',
        code: 'export interface User {\n  id: string;\n  name: string;\n  nickname?: string;\n}\n\nexport function displayName(user: User) {\n  return user.nickname ?? user.name;\n}\n\nexport function greet(user: User) {\n  return `Hello ${displayName(user)}`;\n}',
        note: {
          kind: 'add',
          label: 'Agent A changed',
          detail: 'A helper and optional nickname field are added, but the helper still reads name.',
        },
        highlights: [
          { line: 3, text: 'name', kind: 'base', label: 'old field' },
          { line: 4, text: 'nickname', kind: 'add', label: 'new optional field' },
          { line: 7, text: 'displayName', kind: 'add', label: 'new helper' },
          { line: 8, text: 'nickname', kind: 'add', label: 'helper read' },
          { line: 8, text: 'name', kind: 'base', label: 'old read' },
          { line: 12, text: 'displayName', kind: 'add', label: 'helper call' },
        ],
      },
      {
        label: 'Agent B',
        role: 'worker',
        code: 'export interface User {\n  id: string;\n  fullName: string;\n}\n\nexport function greet(user: User) {\n  return `Hello ${user.fullName}`;\n}',
        note: {
          kind: 'rename',
          label: 'Agent B changed',
          detail: 'The public field is renamed from name to fullName, and the direct read follows it.',
        },
        highlights: [
          { line: 3, text: 'fullName', kind: 'rename', label: 'renamed field' },
          { line: 7, text: 'fullName', kind: 'rename', label: 'renamed read' },
        ],
      },
      {
        label: 'Output',
        role: 'output',
        code: 'export interface User {\n  id: string;\n  fullName: string;\n  nickname?: string;\n}\n\nexport function displayName(user: User) {\n  return user.nickname ?? user.fullName;\n}\n\nexport function greet(user: User) {\n  return `Hello ${displayName(user)}`;\n}',
        note: {
          kind: 'admit',
          label: 'Typed admission',
          detail: 'The helper is rebased through the rename, then the output has to pass a type gate.',
        },
        highlights: [
          { line: 3, text: 'fullName', kind: 'rename', label: 'renamed field' },
          { line: 4, text: 'nickname', kind: 'add', label: 'kept addition' },
          { line: 7, text: 'displayName', kind: 'add', label: 'kept helper' },
          { line: 8, text: 'nickname', kind: 'add', label: 'helper read' },
          { line: 8, text: 'fullName', kind: 'rename', label: 'rebased read' },
          { line: 12, text: 'displayName', kind: 'add', label: 'helper call' },
        ],
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const normalizeLines = (code = '') => String(code).replace(/\n$/, '').split('\n');

const findHighlightRanges = (line, highlights) => {
  let cursor = 0;
  return highlights
    .map((highlight, index) => {
      const start =
        Number.isInteger(highlight.start) && Number.isInteger(highlight.end)
          ? highlight.start
          : line.indexOf(highlight.text, cursor);
      const end =
        Number.isInteger(highlight.start) && Number.isInteger(highlight.end)
          ? highlight.end
          : start + String(highlight.text ?? '').length;
      if (start < cursor || end <= start) return null;
      cursor = end;
      return { ...highlight, start, end, index };
    })
    .filter(Boolean);
};

const renderLine = (line, lineNumber, highlights = []) => {
  const ranges = findHighlightRanges(
    line,
    highlights.filter((highlight) => highlight.line === lineNumber)
  );
  if (!ranges.length) return line || ' ';

  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(line.slice(cursor, range.start));
    parts.push(
      <mark
        className={`semantic-code-diff__mark semantic-code-diff__mark--${range.kind || 'mark'}`}
        data-label={range.label}
        key={`${lineNumber}-${range.index}-${range.start}`}
      >
        {line.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
};

const renderPaneBody = (pane) => (
  <pre className="semantic-code-diff__pre">
    <code>
      {normalizeLines(pane.code).map((line, index) => (
        <span className="semantic-code-diff__line" key={`${pane.label}-${index}`}>
          <span className="semantic-code-diff__line-number">{index + 1}</span>
          <span className="semantic-code-diff__line-code">{renderLine(line, index + 1, pane.highlights)}</span>
        </span>
      ))}
    </code>
  </pre>
);

const resolvePaneNote = (pane, annotations, index) => pane?.note ?? annotations[index] ?? null;

const estimatePanelHeight = (panes, minHeight, maxHeight) => {
  const codePadding = 28;
  const lineHeight = 21;
  const tallestLineCount = panes.reduce((maxLines, pane) => Math.max(maxLines, normalizeLines(pane.code).length), 1);
  return Math.min(maxHeight, Math.max(minHeight, tallestLineCount * lineHeight + codePadding));
};

const resolveExample = (example, panes, annotations, title) => {
  const preset = semanticCodeDiffExamples[example] || {};
  return {
    title: title ?? preset.title,
    defaultPane: preset.defaultPane,
    panes: panes ?? preset.panes ?? [],
    annotations: annotations ?? preset.annotations ?? [],
  };
};

export default function SemanticCodeDiff({
  example = 'import-set',
  title,
  caption,
  panes,
  annotations,
  panelMinHeight = 0,
  panelMaxHeight = 360,
  className = '',
}) {
  const componentId = useId();
  const resolved = resolveExample(example, panes, annotations, title);
  const initialPaneIndex = Math.max(
    0,
    resolved.panes.findIndex((pane) => pane.label === resolved.defaultPane || pane.active)
  );
  const [activePaneIndex, setActivePaneIndex] = useState(initialPaneIndex);
  const safeActivePaneIndex = resolved.panes.length
    ? Math.min(activePaneIndex, resolved.panes.length - 1)
    : 0;
  const activePane = resolved.panes[safeActivePaneIndex];
  const activeNote = resolvePaneNote(activePane, resolved.annotations, safeActivePaneIndex);
  const paneId = `${componentId}-pane`;
  const activeTabId = `${componentId}-tab-${safeActivePaneIndex}`;
  const panelHeight = estimatePanelHeight(resolved.panes, panelMinHeight, panelMaxHeight);
  const panelStyle = {
    '--semantic-code-diff-panel-min-height': `${panelMinHeight}px`,
    '--semantic-code-diff-panel-max-height': `${panelMaxHeight}px`,
    '--semantic-code-diff-panel-height': `${panelHeight}px`,
  };

  return (
    <figure
      className={classNames('semantic-code-diff', activeNote && 'semantic-code-diff--has-note', className)}
      style={panelStyle}
    >
      {resolved.title ? <figcaption className="semantic-code-diff__title">{resolved.title}</figcaption> : null}
      {resolved.panes.length ? (
        <div className="semantic-code-diff__tabs" role="tablist" aria-label={resolved.title || 'Semantic code diff'}>
          {resolved.panes.map((pane, index) => {
            const isActive = index === activePaneIndex;
            return (
              <button
                aria-controls={paneId}
                aria-selected={isActive}
                className={classNames(
                  'semantic-code-diff__tab',
                  `semantic-code-diff__tab--${pane.role || 'code'}`,
                  isActive && 'semantic-code-diff__tab--active'
                )}
                id={`${componentId}-tab-${index}`}
                key={pane.label}
                onClick={() => setActivePaneIndex(index)}
                role="tab"
                type="button"
              >
                <span className="semantic-code-diff__pane-dot" aria-hidden="true" />
                <span>{pane.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {activePane ? (
        <div className="semantic-code-diff__pane-shell">
          <section
            aria-labelledby={activeTabId}
            className={classNames('semantic-code-diff__pane', `semantic-code-diff__pane--${activePane.role || 'code'}`)}
            id={paneId}
            role="tabpanel"
          >
            {renderPaneBody(activePane)}
          </section>
        </div>
      ) : null}
      {activeNote ? (
        <div
          className={classNames(
            'semantic-code-diff__active-note',
            `semantic-code-diff__active-note--${activeNote.kind || 'mark'}`
          )}
        >
          <span className="semantic-code-diff__annotation-dot" aria-hidden="true" />
          <span className="semantic-code-diff__note-copy">
            <span className="semantic-code-diff__annotation-label">{activeNote.label}</span>
            <span className="semantic-code-diff__annotation-detail">{activeNote.detail}</span>
          </span>
        </div>
      ) : null}
      {caption ? <figcaption className="workflow-chart-caption semantic-code-diff__caption">{caption}</figcaption> : null}
    </figure>
  );
}
