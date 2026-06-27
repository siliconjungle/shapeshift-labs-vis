import { getWorkflowChart } from '../lib/workflowCharts';
import WorkflowGraph from './WorkflowGraph';

const DEFAULT_ROW_GAP = 24;
const TARGET_ROW_GAP_PX = 52;
const GRAPH_VERTICAL_INSET_RATIO = 0.76;
const MIN_CHART_HEIGHT = 210;
const MAX_CHART_HEIGHT = 560;

const uniqueSortedValues = (values) =>
  [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);

const estimateChartHeight = (chart) => {
  if (chart.height) return chart.height;

  const rows = uniqueSortedValues((chart.nodes || []).map((node) => node.y));
  if (rows.length < 2) return MIN_CHART_HEIGHT;

  const rowGap = Math.min(chart.rowGap || DEFAULT_ROW_GAP, 76 / (rows.length - 1));
  const estimated = Math.round((TARGET_ROW_GAP_PX * 100) / (GRAPH_VERTICAL_INSET_RATIO * rowGap));
  return Math.min(MAX_CHART_HEIGHT, Math.max(MIN_CHART_HEIGHT, estimated));
};

export default function WorkflowChartBlock({ type = 'diamond', caption = null, className = '' }) {
  const chart = getWorkflowChart(type);
  const figureClassName = ['workflow-chart-block', className].filter(Boolean).join(' ');
  const chartHeight = estimateChartHeight(chart);

  return (
    <figure className={figureClassName}>
      <div
        aria-label={chart.title}
        className="visual-grid-surface workflow-chart-surface"
        role="img"
        style={{ '--workflow-chart-height': `${chartHeight}px` }}
      >
        <WorkflowGraph type={type} />
      </div>
      {caption ? <figcaption className="workflow-chart-caption">{caption}</figcaption> : null}
    </figure>
  );
}
