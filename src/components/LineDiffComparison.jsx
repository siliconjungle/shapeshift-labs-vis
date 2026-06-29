'use client';

import { useId, useState } from 'react';

const lineDiffExamples = {
  'import-set': {
    title: 'Line Diff View',
    defaultPane: 'Base',
    panes: [
      {
        label: 'Base',
        role: 'base',
        lines: [
          { kind: 'base', text: 'import { readUser } from "./api";' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function run() {' },
          { kind: 'base', text: '  return readUser();' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Base file',
          detail: 'The original file has one import specifier and one call site.',
        },
      },
      {
        label: 'Agent A',
        role: 'worker',
        lines: [
          { kind: 'add', text: 'import { readUser, writeUser } from "./api";' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function run() {' },
          { kind: 'base', text: '  return readUser();' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Agent A file',
          detail: 'The file version adds writeUser to the import line.',
        },
      },
      {
        label: 'Agent B',
        role: 'worker',
        lines: [
          { kind: 'add-alt', text: 'import { readUser, deleteUser } from "./api";' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function run() {' },
          { kind: 'base', text: '  return readUser();' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Agent B file',
          detail: 'The file version adds deleteUser to the same import line.',
        },
      },
      {
        label: 'Conflict',
        role: 'conflict',
        lines: [
          { kind: 'meta', text: '@@ line 1 @@' },
          { kind: 'conflict', text: '<<<<<<< Agent A' },
          { kind: 'add', text: 'import { readUser, writeUser } from "./api";' },
          { kind: 'conflict', text: '=======' },
          { kind: 'add-alt', text: 'import { readUser, deleteUser } from "./api";' },
          { kind: 'conflict', text: '>>>>>>> Agent B' },
        ],
        note: {
          label: 'Text result',
          detail: 'Both branches replace the same line, so the merge stops even though each branch only added a different import.',
        },
      },
    ],
  },
  'typed-rebase': {
    title: 'Line Diff View',
    defaultPane: 'Base',
    panes: [
      {
        label: 'Base',
        role: 'base',
        lines: [
          { kind: 'base', text: 'export interface User {' },
          { kind: 'base', text: '  id: string;' },
          { kind: 'base', text: '  name: string;' },
          { kind: 'base', text: '}' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function greet(user: User) {' },
          { kind: 'base', text: '  return `Hello ${user.name}`;' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Base file',
          detail: 'The original public contract exposes name and greet reads it directly.',
        },
      },
      {
        label: 'Agent A',
        role: 'worker',
        lines: [
          { kind: 'base', text: 'export interface User {' },
          { kind: 'base', text: '  id: string;' },
          { kind: 'base', text: '  name: string;' },
          { kind: 'add', text: '  nickname?: string;' },
          { kind: 'base', text: '}' },
          { kind: 'base', text: '' },
          { kind: 'add', text: 'export function displayName(user: User) {' },
          { kind: 'add', text: '  return user.nickname ?? user.name;' },
          { kind: 'add', text: '}' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function greet(user: User) {' },
          { kind: 'add', text: '  return `Hello ${displayName(user)}`;' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Agent A file',
          detail: 'The file version adds nickname and a displayName helper against the old name field.',
        },
      },
      {
        label: 'Agent B',
        role: 'worker',
        lines: [
          { kind: 'base', text: 'export interface User {' },
          { kind: 'base', text: '  id: string;' },
          { kind: 'add-alt', text: '  fullName: string;' },
          { kind: 'base', text: '}' },
          { kind: 'base', text: '' },
          { kind: 'base', text: 'export function greet(user: User) {' },
          { kind: 'add-alt', text: '  return `Hello ${user.fullName}`;' },
          { kind: 'base', text: '}' },
        ],
        note: {
          label: 'Agent B file',
          detail: 'The file version renames the public field and updates the direct greet read.',
        },
      },
      {
        label: 'Conflict',
        role: 'conflict',
        lines: [
          { kind: 'meta', text: '@@ User contract @@' },
          { kind: 'conflict', text: '<<<<<<< Agent A' },
          { kind: 'base', text: '  name: string;' },
          { kind: 'add', text: '  nickname?: string;' },
          { kind: 'conflict', text: '=======' },
          { kind: 'add-alt', text: '  fullName: string;' },
          { kind: 'conflict', text: '>>>>>>> Agent B' },
          { kind: 'meta', text: '@@ greet body @@' },
          { kind: 'conflict', text: '<<<<<<< Agent A' },
          { kind: 'add', text: '  return `Hello ${displayName(user)}`;' },
          { kind: 'conflict', text: '=======' },
          { kind: 'add-alt', text: '  return `Hello ${user.fullName}`;' },
          { kind: 'conflict', text: '>>>>>>> Agent B' },
        ],
        note: {
          label: 'Text result',
          detail: 'The merge can see overlapping replacements, but it cannot prove that the helper should be rewritten through the rename.',
        },
      },
    ],
  },
};

const markers = {
  add: '+',
  'add-alt': '+',
  base: ' ',
  conflict: '!',
  meta: '@',
  remove: '-',
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const estimatePanelHeight = (panes, minHeight, maxHeight) => {
  const codePadding = 24;
  const lineHeight = 21;
  const tallestLineCount = panes.reduce((maxLines, pane) => Math.max(maxLines, pane.lines?.length || 1), 1);
  return Math.min(maxHeight, Math.max(minHeight, tallestLineCount * lineHeight + codePadding));
};

export default function LineDiffComparison({
  example = 'import-set',
  title,
  caption,
  panes,
  panelMinHeight = 0,
  panelMaxHeight = 320,
  className = '',
}) {
  const componentId = useId();
  const preset = lineDiffExamples[example] || {};
  const resolvedPanes = panes ?? preset.panes ?? [];
  const initialPaneIndex = Math.max(
    0,
    resolvedPanes.findIndex((pane) => pane.label === preset.defaultPane || pane.active)
  );
  const [activePaneIndex, setActivePaneIndex] = useState(initialPaneIndex);
  const safeActivePaneIndex = resolvedPanes.length ? Math.min(activePaneIndex, resolvedPanes.length - 1) : 0;
  const activePane = resolvedPanes[safeActivePaneIndex];
  const showMarkers = activePane?.showMarkers ?? true;
  const activeTabId = `${componentId}-tab-${safeActivePaneIndex}`;
  const paneId = `${componentId}-pane`;
  const panelHeight = estimatePanelHeight(resolvedPanes, panelMinHeight, panelMaxHeight);
  const panelStyle = {
    '--line-diff-panel-height': `${panelHeight}px`,
    '--line-diff-panel-min-height': `${panelMinHeight}px`,
    '--line-diff-panel-max-height': `${panelMaxHeight}px`,
  };

  const activeNote = activePane?.note;

  return (
    <figure
      className={classNames('line-diff-comparison', activeNote && 'line-diff-comparison--has-note', className)}
      style={panelStyle}
    >
      <figcaption className="line-diff-comparison__title">{title ?? preset.title ?? 'Line Diff View'}</figcaption>
      {resolvedPanes.length ? (
        <div className="line-diff-comparison__tabs" role="tablist" aria-label={title ?? preset.title ?? 'Line diff'}>
          {resolvedPanes.map((pane, index) => {
            const isActive = index === safeActivePaneIndex;
            return (
              <button
                aria-controls={paneId}
                aria-selected={isActive}
                className={classNames(
                  'line-diff-comparison__tab',
                  `line-diff-comparison__tab--${pane.role || 'code'}`,
                  isActive && 'line-diff-comparison__tab--active'
                )}
                id={`${componentId}-tab-${index}`}
                key={pane.label}
                onClick={() => setActivePaneIndex(index)}
                role="tab"
                type="button"
              >
                {pane.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {activePane ? (
        <div className="line-diff-comparison__pane-shell">
          <section
            aria-labelledby={activeTabId}
            className={classNames('line-diff-comparison__pane', `line-diff-comparison__pane--${activePane.role || 'code'}`)}
            id={paneId}
            role="tabpanel"
          >
            <pre
              className={classNames(
                'line-diff-comparison__pre',
                showMarkers ? 'line-diff-comparison__pre--markers' : 'line-diff-comparison__pre--plain'
              )}
            >
              <code>
                {activePane.lines.map((line, index) => (
                  <span
                    className={classNames('line-diff-comparison__line', `line-diff-comparison__line--${line.kind || 'base'}`)}
                    key={`${activePane.label}-${line.kind}-${index}-${line.text}`}
                  >
                    {showMarkers ? <span className="line-diff-comparison__marker">{markers[line.kind] ?? ' '}</span> : null}
                    <span className="line-diff-comparison__code">{line.text || ' '}</span>
                  </span>
                ))}
              </code>
            </pre>
          </section>
        </div>
      ) : null}
      {activeNote ? (
        <div className="line-diff-comparison__note">
          <span className="line-diff-comparison__note-label">{activeNote.label}</span>
          <span className="line-diff-comparison__note-detail">{activeNote.detail}</span>
        </div>
      ) : null}
      {caption ? <figcaption className="workflow-chart-caption line-diff-comparison__caption">{caption}</figcaption> : null}
    </figure>
  );
}
