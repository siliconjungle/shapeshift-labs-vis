const capabilityCardExamples = {
  'propose-parser-patch': {
    name: 'propose_parser_patch',
    status: 'bounded action',
    summary: 'Create a patch only inside the parser recovery region, then attach evidence before review.',
    fields: [
      {
        label: 'Can read',
        value: 'parser source, parser fixtures, public declaration snapshot',
      },
      {
        label: 'Can change',
        value: 'parser recovery region and matching focused tests',
      },
      {
        label: 'Must run',
        value: 'parser fixture gate, type gate, declaration diff',
        tone: 'proof',
      },
      {
        label: 'Must ask',
        value: 'public API change, fixture expectation change, new syntax policy',
        tone: 'warning',
      },
      {
        label: 'Produces',
        value: 'patch, touched regions, evidence bundle, next route',
      },
      {
        label: 'Feedback',
        value: 'accepted, stale head, failed gate, missing proof, blocked question',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

export default function CapabilityCard({
  example = 'propose-parser-patch',
  name,
  status,
  summary,
  fields,
  caption,
  className = '',
}) {
  const preset = capabilityCardExamples[example] || capabilityCardExamples['propose-parser-patch'];
  const resolvedName = name ?? preset.name;
  const resolvedStatus = status ?? preset.status;
  const resolvedSummary = summary ?? preset.summary;
  const resolvedFields = fields ?? preset.fields;

  return (
    <figure className={classNames('capability-card', className)}>
      <div className="capability-card__panel" aria-label={`${resolvedName} capability`}>
        <header className="capability-card__header">
          <span className="capability-card__name">{resolvedName}</span>
          <span className="capability-card__status">{resolvedStatus}</span>
        </header>
        <p className="capability-card__summary">{resolvedSummary}</p>
        <dl className="capability-card__fields">
          {resolvedFields.map((field, index) => (
            <div
              className={classNames(
                'capability-card__field',
                field.tone ? `capability-card__field--${field.tone}` : ''
              )}
              key={`${field.label}-${index}`}
            >
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {caption ? <figcaption className="workflow-chart-caption capability-card__caption">{caption}</figcaption> : null}
    </figure>
  );
}
