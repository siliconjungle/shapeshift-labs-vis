import VisualGridSurface from './VisualGridSurface';
import WorkflowGraph from './WorkflowGraph';

export default function PostInteractivePlaceholder({ type = 'diamond' }) {
  return (
    <VisualGridSurface
      className="post-component-section"
      surfaceClassName="post-component-placeholder"
    >
      <WorkflowGraph type={type} />
    </VisualGridSurface>
  );
}
