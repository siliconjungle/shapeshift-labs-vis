import WorkflowGraph from './WorkflowGraph';

export default function RunLensComparison({
  caption = 'The same run, rendered first as a flat transcript and then as a causal graph with branches, retries, questions, evidence, and decisions connected.',
}) {
  return (
    <figure className="run-lens-comparison">
      <div
        aria-label="Transcript line compared with causal run graph"
        className="run-lens-comparison__surface"
        role="img"
      >
        <div className="run-lens-comparison__row run-lens-comparison__row--top">
          <span className="run-lens-comparison__label">Transcript</span>
          <WorkflowGraph type="run-transcript-line" />
        </div>
        <div className="run-lens-comparison__row run-lens-comparison__row--bottom">
          <span className="run-lens-comparison__label">Causal run</span>
          <WorkflowGraph type="run-causal-graph" />
        </div>
      </div>
      {caption ? <figcaption className="workflow-chart-caption">{caption}</figcaption> : null}
    </figure>
  );
}
