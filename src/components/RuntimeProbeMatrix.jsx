const runtimeProbeMatrixExamples = {
  'ui-runtime-surfaces': {
    rows: [
      {
        surface: 'Selector reachability',
        scope: 'class rename, CSS Module export, selector edit',
        probe: 'Target probe',
        probeDetail: 'Resolve selectors against the output DOM.',
        signal: 'Matched elements, orphaned selectors, intended target moves',
        claim: 'The selector still reaches the same semantic target.',
        route: 'Admit target',
        tone: 'apply',
      },
      {
        surface: 'Viewport layout',
        scope: 'media rule, container query, spacing, position',
        probe: 'Viewport matrix',
        probeDetail: 'Render declared widths and compare geometry.',
        signal: 'Bounding boxes, overlap, visibility, scroll range',
        claim: 'The layout holds for the declared viewport set.',
        route: 'Gate layout',
        tone: 'gate',
      },
      {
        surface: 'Interaction state',
        scope: 'hover, focus, disabled state, input workflow',
        probe: 'Interaction trace',
        probeDetail: 'Replay the smallest user path through the output.',
        signal: 'Focus order, enabled controls, event result, state transition',
        claim: 'The workflow remains reachable after the merge.',
        route: 'Gate workflow',
        tone: 'review',
      },
      {
        surface: 'Accessibility tree',
        scope: 'role, label, aria relationship, hidden content',
        probe: 'A11y snapshot',
        probeDetail: 'Read the browser accessibility tree.',
        signal: 'Accessible name, role, state, relationships, tab stop',
        claim: 'The control keeps its user-facing semantics.',
        route: 'Require proof',
        tone: 'missing',
      },
      {
        surface: 'Hydration boundary',
        scope: 'server markup, client state, framework runtime',
        probe: 'Hydration probe',
        probeDetail: 'Load server output and observe client takeover.',
        signal: 'Console errors, markup drift, event attachment, first state',
        claim: 'The rendered output survives client hydration.',
        route: 'Block drift',
        tone: 'block',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

export default function RuntimeProbeMatrix({
  example = 'ui-runtime-surfaces',
  rows,
  caption,
  className = '',
}) {
  const preset = runtimeProbeMatrixExamples[example] || runtimeProbeMatrixExamples['ui-runtime-surfaces'];
  const resolvedRows = rows ?? preset.rows;

  return (
    <figure className={classNames('runtime-probe-matrix', className)}>
      <div className="runtime-probe-matrix__table-scroll">
        <table className="admission-checklist__rows runtime-probe-matrix__table" aria-label="runtime probe matrix">
          <colgroup>
            <col className="runtime-probe-matrix__col-surface" />
            <col className="runtime-probe-matrix__col-probe" />
            <col className="runtime-probe-matrix__col-signal" />
            <col className="runtime-probe-matrix__col-route" />
          </colgroup>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Probe</th>
              <th>Measured signal</th>
              <th>Admission route</th>
            </tr>
          </thead>
          <tbody>
            {resolvedRows.map((row, index) => (
              <tr
                className={classNames(
                  'runtime-probe-matrix__row',
                  row.tone ? `runtime-probe-matrix__row--${row.tone}` : ''
                )}
                key={`${row.surface}-${index}`}
              >
                <td data-label="Surface">
                  <span className="runtime-probe-matrix__surface">
                    <strong>{row.surface}</strong>
                    <small>{row.scope}</small>
                  </span>
                </td>
                <td data-label="Probe">
                  <span className="runtime-probe-matrix__probe">
                    <strong>{row.probe}</strong>
                    <small>{row.probeDetail}</small>
                  </span>
                </td>
                <td data-label="Measured signal">{row.signal}</td>
                <td data-label="Admission route">
                  <span className="runtime-probe-matrix__route">{row.route}</span>
                  <small className="runtime-probe-matrix__claim">{row.claim}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className="workflow-chart-caption runtime-probe-matrix__caption">{caption}</figcaption> : null}
    </figure>
  );
}
