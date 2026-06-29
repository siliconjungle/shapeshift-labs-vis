const routeDecisionExamples = {
  'merge-router': {
    eyebrow: 'Route Decision Table',
    title: 'Candidate Routes',
    rows: [
      {
        route: 'Apply',
        signal: 'Low risk, current head, strong evidence',
        requires: 'Output-bound proof matches the touched boundary',
        produces: 'Shared state moves',
        tone: 'apply',
      },
      {
        route: 'Review',
        signal: 'Evidence is useful but incomplete',
        requires: 'Human or coordinator judgment on the remaining risk',
        produces: 'Narrow decision or stronger proof request',
        tone: 'review',
      },
      {
        route: 'Rebase',
        signal: 'Idea still fits, but the head moved',
        requires: 'Same semantic intent survives current head',
        produces: 'Fresh output and gate run',
        tone: 'rebase',
      },
      {
        route: 'Rerun',
        signal: 'Evidence is stale, failed, or too weak',
        requires: 'New attempt with sharper context',
        produces: 'Replacement candidate',
        tone: 'rerun',
      },
      {
        route: 'Split',
        signal: 'One candidate contains multiple risks',
        requires: 'Independent hunks, regions, or proof boundaries',
        produces: 'Separate review objects',
        tone: 'split',
      },
      {
        route: 'Ask',
        signal: 'A human decision is missing',
        requires: 'Typed question with scope and options',
        produces: 'Answer node and continuation',
        tone: 'ask',
      },
      {
        route: 'Block',
        signal: 'Candidate conflicts with the system',
        requires: 'Conflict, unsafe proof, or rejected boundary',
        produces: 'Recorded non-admission',
        tone: 'block',
      },
    ],
  },
  'split-route': {
    eyebrow: 'Split Decision',
    title: 'One Candidate, Several Routes',
    rows: [
      {
        route: 'Apply',
        signal: 'Private helper hunk',
        requires: 'Focused unit fixture',
        produces: 'Safe hunk admitted',
        tone: 'apply',
      },
      {
        route: 'Review',
        signal: 'Public API hunk',
        requires: 'Declaration impact and accepted compatibility decision',
        produces: 'Human-visible decision',
        tone: 'review',
      },
      {
        route: 'Rerun',
        signal: 'Runtime effect hunk',
        requires: 'Effect trace or replay proof',
        produces: 'Fresh runtime-proof task',
        tone: 'rerun',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

export default function RouteDecisionTable({
  example = 'merge-router',
  eyebrow,
  title,
  rows,
  caption,
  className = '',
}) {
  const preset = routeDecisionExamples[example] || routeDecisionExamples['merge-router'];
  const resolvedRows = rows ?? preset.rows;
  const resolvedTitle = title ?? preset.title;
  const resolvedEyebrow = eyebrow ?? preset.eyebrow;

  return (
    <figure className={classNames('route-decision-table', className)}>
      <div className="route-decision-table__panel" aria-label={resolvedTitle}>
        <header className="route-decision-table__header">
          <span className="route-decision-table__eyebrow">{resolvedEyebrow}</span>
          <span className="route-decision-table__title">{resolvedTitle}</span>
        </header>
        <div className="route-decision-table__rows" role="table">
          <div className="route-decision-table__row route-decision-table__row--head" role="row">
            <span role="columnheader">Route</span>
            <span role="columnheader">Signal</span>
            <span role="columnheader">Requires</span>
            <span role="columnheader">Produces</span>
          </div>
          {resolvedRows.map((row, index) => (
            <div
              className={classNames(
                'route-decision-table__row',
                row.tone ? `route-decision-table__row--${row.tone}` : ''
              )}
              key={`${row.route}-${index}`}
              role="row"
            >
              <span className="route-decision-table__route" role="cell">{row.route}</span>
              <span role="cell">{row.signal}</span>
              <span role="cell">{row.requires}</span>
              <span role="cell">{row.produces}</span>
            </div>
          ))}
        </div>
      </div>
      {caption ? <figcaption className="workflow-chart-caption route-decision-table__caption">{caption}</figcaption> : null}
    </figure>
  );
}
