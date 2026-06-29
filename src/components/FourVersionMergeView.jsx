import SemanticCodeDiff from './SemanticCodeDiff';

const fourVersionMergeExamples = {
  'import-set': {
    title: 'Four Versions',
    panes: [
      {
        label: 'Base',
        role: 'base',
        code: 'import { readUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        highlights: [
          { line: 1, text: 'readUser', kind: 'base' },
          { line: 4, text: 'readUser', kind: 'base' },
        ],
      },
      {
        label: 'Worker',
        role: 'worker',
        code: 'import { readUser, writeUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        highlights: [
          { line: 1, text: 'readUser', kind: 'base' },
          { line: 1, text: 'writeUser', kind: 'add' },
          { line: 4, text: 'readUser', kind: 'base' },
        ],
      },
      {
        label: 'Head',
        role: 'worker',
        code: 'import { readUser, deleteUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        highlights: [
          { line: 1, text: 'readUser', kind: 'base' },
          { line: 1, text: 'deleteUser', kind: 'add-alt' },
          { line: 4, text: 'readUser', kind: 'base' },
        ],
      },
      {
        label: 'Output',
        role: 'output',
        code: 'import { readUser, deleteUser, writeUser } from "./api";\n\nexport function run() {\n  return readUser();\n}',
        highlights: [
          { line: 1, text: 'readUser', kind: 'base' },
          { line: 1, text: 'deleteUser', kind: 'add-alt' },
          { line: 1, text: 'writeUser', kind: 'add' },
          { line: 4, text: 'readUser', kind: 'base' },
        ],
      },
    ],
  },
};

export default function FourVersionMergeView({
  example = 'import-set',
  title,
  caption,
  panes,
  panelMinHeight = 0,
  panelMaxHeight = 320,
  className = '',
}) {
  const preset = fourVersionMergeExamples[example] || fourVersionMergeExamples['import-set'];

  return (
    <SemanticCodeDiff
      annotations={[]}
      caption={caption}
      className={className}
      panelMaxHeight={panelMaxHeight}
      panelMinHeight={panelMinHeight}
      panes={panes ?? preset.panes}
      title={title ?? preset.title}
    />
  );
}
