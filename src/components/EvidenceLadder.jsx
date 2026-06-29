const evidenceLadderExamples = {
  admission: {
    levels: [
      {
        name: 'Agent note',
        strength: 'weakest',
        proves: 'A hypothesis, summary, or proposed explanation.',
        limit: 'Does not prove the patch is correct.',
        route: 'Ask for an oracle',
        tone: 'note',
      },
      {
        name: 'Source binding',
        strength: 'bound',
        proves: 'The evidence belongs to a specific file state, span, hash, or output.',
        limit: 'Does not prove behavior by itself.',
        route: 'Attach to candidate',
        tone: 'bound',
      },
      {
        name: 'Static oracle',
        strength: 'static',
        proves: 'Syntax, types, imports, declarations, or public shape under a static checker.',
        limit: 'Does not prove layout, interaction, or runtime order.',
        route: 'Admit static claim',
        tone: 'static',
      },
      {
        name: 'Focused fixture',
        strength: 'focused',
        proves: 'One declared behavior path, fixture, viewport, or state transition.',
        limit: 'Does not prove every product state.',
        route: 'Admit scoped behavior',
        tone: 'focused',
      },
      {
        name: 'Runtime trace',
        strength: 'observed',
        proves: 'The output behaved under a replayed browser, effect, or workflow condition.',
        limit: 'Only proves the traced conditions.',
        route: 'Admit traced workflow',
        tone: 'runtime',
      },
      {
        name: 'Accepted decision',
        strength: 'strongest',
        proves: 'The intended outcome was chosen for the named boundary.',
        limit: 'Does not erase lower evidence requirements.',
        route: 'Cross boundary',
        tone: 'decision',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

export default function EvidenceLadder({
  example = 'admission',
  levels,
  caption,
  className = '',
}) {
  const preset = evidenceLadderExamples[example] || evidenceLadderExamples.admission;
  const resolvedLevels = levels ?? preset.levels;

  return (
    <figure className={classNames('evidence-ladder', className)}>
      <div className="evidence-ladder__frame" aria-label="evidence strength ladder">
        <div className="evidence-ladder__scale" aria-hidden="true">
          <span>weaker claim</span>
          <span>stronger claim</span>
        </div>
        <ol className="evidence-ladder__levels">
          {resolvedLevels.map((level, index) => (
            <li
              className={classNames('evidence-ladder__level', `evidence-ladder__level--${level.tone || 'note'}`)}
              key={`${level.name}-${index}`}
            >
              <span className="evidence-ladder__rung" aria-hidden="true">{index + 1}</span>
              <div className="evidence-ladder__identity">
                <strong>{level.name}</strong>
                <small>{level.strength}</small>
              </div>
              <div className="evidence-ladder__claim">
                <small>Can prove</small>
                <span>{level.proves}</span>
              </div>
              <div className="evidence-ladder__limit">
                <small>Stops at</small>
                <span>{level.limit}</span>
              </div>
              <div className="evidence-ladder__route">{level.route}</div>
            </li>
          ))}
        </ol>
      </div>
      {caption ? <figcaption className="workflow-chart-caption evidence-ladder__caption">{caption}</figcaption> : null}
    </figure>
  );
}
