'use client';

const admissionChecklistExamples = {
  'import-set': {
    title: 'Admission Checklist',
    decision: 'Admit',
    rows: [
      {
        label: 'Base binding preserved',
        detail: 'readUser remains imported from ./api and the existing call site still resolves.',
      },
      {
        label: 'Unique local names',
        detail: 'writeUser and deleteUser introduce distinct bindings, so neither addition shadows the other.',
      },
      {
        label: 'No removal or alias conflict',
        detail: 'Neither branch deletes readUser or changes the import source, alias, or module boundary.',
      },
      {
        label: 'Canonical output built',
        detail: 'The admitted import set contains readUser, deleteUser, and writeUser exactly once.',
      },
    ],
  },
  'typed-rebase': {
    title: 'Admission Checklist',
    decision: 'Admit after gate',
    rows: [
      {
        label: 'Rename evidence found',
        detail: 'User.name becomes User.fullName in the declaration and in the existing direct read.',
      },
      {
        label: 'Helper rebased',
        detail: 'displayName keeps the nickname fallback, but its old name read is rewritten to fullName.',
      },
      {
        label: 'Independent addition preserved',
        detail: 'nickname?: string and the displayName helper survive the adaptation unchanged.',
      },
      {
        label: 'Type gate passed',
        detail: 'The admitted output must compile against the rebased public contract before it is accepted.',
      },
    ],
  },
};

const classNames = (...values) => values.filter(Boolean).join(' ');

export default function AdmissionChecklist({ example = 'import-set', title, decision, rows, className = '' }) {
  const preset = admissionChecklistExamples[example] || admissionChecklistExamples['import-set'];
  const resolvedRows = rows ?? preset.rows;

  return (
    <aside className={classNames('admission-checklist', className)} aria-label={title ?? preset.title}>
      <div className="admission-checklist__header">
        <span className="admission-checklist__eyebrow">{title ?? preset.title}</span>
        <span className="admission-checklist__decision">{decision ?? preset.decision}</span>
      </div>
      <table className="admission-checklist__rows" aria-label={`${title ?? preset.title} checks`}>
        <tbody>
          {resolvedRows.map((row, index) => (
            <tr className="admission-checklist__row" key={`${row.label}-${index}`}>
              <td className="admission-checklist__status">PASS</td>
              <td className="admission-checklist__label">{row.label}</td>
              <td className="admission-checklist__detail">{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
