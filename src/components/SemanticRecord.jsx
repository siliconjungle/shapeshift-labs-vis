const semanticRecordExamples = {
  'parser-admission': {
    eyebrow: 'Review Object',
    title: 'Parser Recovery Candidate',
    status: 'Admissible shape',
    fields: [
      {
        label: 'Candidate',
        value: 'Changed parser recovery',
        detail: 'The patch is the proposed value. It is not the decision.',
      },
      {
        label: 'Claim',
        value: 'Malformed input now reports a span',
        detail: 'The statement the candidate wants the system to believe.',
      },
      {
        label: 'Oracle',
        value: 'Parser fixture malformed-03 passed',
        detail: 'A trusted surface checks the claim in a bounded case.',
      },
      {
        label: 'Boundary',
        value: 'Private parser behavior',
        detail: 'The proof requirement is smaller than a public API change.',
      },
      {
        label: 'Limit',
        value: 'Does not cover streaming parser',
        detail: 'A visible non-claim prevents accidental widening.',
      },
      {
        label: 'Route',
        value: 'Apply or review',
        detail: 'The output is a route, not just a pass/fail label.',
        tone: 'route',
      },
    ],
  },
  'public-type-failure': {
    eyebrow: 'Failed Admission',
    title: 'Display Name Helper',
    status: 'Request proof',
    fields: [
      {
        label: 'Candidate',
        value: 'Add displayName helper',
      },
      {
        label: 'Claim',
        value: 'Safe public-type rebase',
      },
      {
        label: 'Expected',
        value: 'Symbol rename evidence, declaration proof, type gate',
      },
      {
        label: 'Received',
        value: 'Text patch, focused unit test',
        tone: 'warning',
      },
      {
        label: 'Route',
        value: 'Request stronger evidence',
        tone: 'route',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

const normalizeFields = (fields = []) =>
  fields.map((field) =>
    typeof field === 'string'
      ? { label: field, value: '' }
      : field
  );

export default function SemanticRecord({
  example = 'parser-admission',
  eyebrow,
  title,
  status,
  fields,
  caption,
  className = '',
}) {
  const preset = semanticRecordExamples[example] || semanticRecordExamples['parser-admission'];
  const resolvedFields = normalizeFields(fields ?? preset.fields);
  const resolvedTitle = title ?? preset.title;
  const resolvedEyebrow = eyebrow ?? preset.eyebrow;
  const resolvedStatus = status ?? preset.status;

  return (
    <figure className={classNames('semantic-record', className)}>
      <div className="semantic-record__panel" aria-label={resolvedTitle}>
        <header className="semantic-record__header">
          <span className="semantic-record__eyebrow">{resolvedEyebrow}</span>
          {resolvedStatus ? <span className="semantic-record__status">{resolvedStatus}</span> : null}
        </header>
        <div className="semantic-record__title">{resolvedTitle}</div>
        <dl className="semantic-record__fields">
          {resolvedFields.map((field, index) => (
            <div
              className={classNames(
                'semantic-record__field',
                field.tone ? `semantic-record__field--${field.tone}` : ''
              )}
              key={`${field.label}-${index}`}
            >
              <dt className="semantic-record__label">{field.label}</dt>
              <dd className="semantic-record__value">
                <span>{field.value}</span>
                {field.detail ? <small>{field.detail}</small> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {caption ? <figcaption className="workflow-chart-caption semantic-record__caption">{caption}</figcaption> : null}
    </figure>
  );
}
