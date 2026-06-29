const claimProofMatrixExamples = {
  'semantic-merge-surfaces': {
    eyebrow: 'Claim Proof Matrix',
    title: 'Proof Strength By Surface',
    rows: [
      {
        surface: 'Import graph',
        claim: 'Import additions commute',
        proof: 'Import set evidence',
        evidence: 'Base binding, local names, module source',
        route: 'Admit',
        status: 'proved',
      },
      {
        surface: 'Public API',
        claim: 'Public API preserved',
        proof: 'Declaration output proof',
        evidence: 'Output declarations match expected shape',
        route: 'Gate',
        status: 'required',
      },
      {
        surface: 'CSS selector',
        claim: 'Selector target preserved',
        proof: 'Selector target graph',
        evidence: 'Class rename plus use-site proof',
        route: 'Prove target',
        status: 'missing',
      },
      {
        surface: 'Browser runtime',
        claim: 'Behavior preserved',
        proof: 'Runtime proof bundle',
        evidence: 'Output-bound trace, viewport, DOM, accessibility',
        route: 'Run proof',
        status: 'missing',
      },
    ],
  },
  'missing-proof-routes': {
    eyebrow: 'Routing Table',
    title: 'Missing Proof Becomes Work',
    rows: [
      {
        surface: 'CSS selector',
        claim: 'Same rendered target',
        proof: 'Selector target graph',
        evidence: 'Missing',
        route: 'Prove selector target or review target move',
        status: 'missing',
      },
      {
        surface: 'Runtime',
        claim: 'Output behaves the same',
        proof: 'Output-bound browser proof',
        evidence: 'Missing',
        route: 'Run browser assertion against output',
        status: 'missing',
      },
      {
        surface: 'Type contract',
        claim: 'Public shape preserved',
        proof: 'Declaration comparison',
        evidence: 'Missing',
        route: 'Emit declarations and compare public shape',
        status: 'missing',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const statusLabels = {
  proved: 'Proved',
  required: 'Required',
  missing: 'Missing',
  blocked: 'Blocked',
};

export default function ClaimProofMatrix({
  example = 'semantic-merge-surfaces',
  eyebrow,
  title,
  rows,
  caption,
  className = '',
}) {
  const preset = claimProofMatrixExamples[example] || claimProofMatrixExamples['semantic-merge-surfaces'];
  const resolvedRows = rows ?? preset.rows;
  const resolvedTitle = title ?? preset.title;
  const resolvedEyebrow = eyebrow ?? preset.eyebrow;

  return (
    <figure className={classNames('claim-proof-matrix', className)}>
      <div className="claim-proof-matrix__panel" aria-label={resolvedTitle}>
        <header className="claim-proof-matrix__header">
          <span className="claim-proof-matrix__eyebrow">{resolvedEyebrow}</span>
          <span className="claim-proof-matrix__title">{resolvedTitle}</span>
        </header>
        <div className="claim-proof-matrix__grid" role="table">
          <div className="claim-proof-matrix__row claim-proof-matrix__row--head" role="row">
            <span role="columnheader">Surface</span>
            <span role="columnheader">Claim</span>
            <span role="columnheader">Required proof</span>
            <span role="columnheader">Current evidence</span>
            <span role="columnheader">Route</span>
          </div>
          {resolvedRows.map((row, index) => (
            <div
              className={classNames(
                'claim-proof-matrix__row',
                `claim-proof-matrix__row--${row.status || 'required'}`
              )}
              key={`${row.surface}-${index}`}
              role="row"
            >
              <span className="claim-proof-matrix__surface" role="cell">
                <small>{statusLabels[row.status] || row.status || 'Required'}</small>
                {row.surface}
              </span>
              <span role="cell">{row.claim}</span>
              <span role="cell">{row.proof}</span>
              <span role="cell">{row.evidence}</span>
              <span className="claim-proof-matrix__route" role="cell">{row.route}</span>
            </div>
          ))}
        </div>
      </div>
      {caption ? <figcaption className="workflow-chart-caption claim-proof-matrix__caption">{caption}</figcaption> : null}
    </figure>
  );
}
