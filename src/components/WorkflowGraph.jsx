import { getWorkflowChart, workflowChartsById } from '../lib/workflowCharts';

const DEFAULT_MAX_COLUMN_GAP = 28;
const DEFAULT_ROW_GAP = 24;

const nodeTypeDefaults = {
  task: { tone: 'outline', size: 'medium' },
  branch: { tone: 'outline', size: 'medium' },
  gate: { tone: 'filled', size: 'large' },
  pool: { tone: 'filled', size: 'large' },
  event: { tone: 'filled', size: 'medium' },
  select: { tone: 'filled', size: 'medium' },
  synthesis: { tone: 'filled', size: 'large' },
  result: { tone: 'dark', size: 'small' },
  compensation: { tone: 'dark', size: 'small' },
  conflict: { tone: 'dark', size: 'medium' },
};

const sanitizeClassPart = (value) =>
  String(value).replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

const normalizeSize = (size) => {
  if (typeof size === 'number') return size;
  const aliases = {
    sm: 'small',
    small: 'small',
    md: 'medium',
    medium: 'medium',
    lg: 'large',
    large: 'large',
  };
  return aliases[size] || size || 'medium';
};

const resolveNodeVisual = (node) => {
  const type = node.type || 'task';
  const defaults = nodeTypeDefaults[type] || nodeTypeDefaults.task;
  return {
    type,
    tone: node.tone || defaults.tone,
    size: normalizeSize(node.size || defaults.size),
  };
};

const squareToneClass = (tone) => {
  if (tone === 'filled') return 'mesh-node--filled';
  if (tone === 'outline') return 'mesh-node--outline';
  return '';
};

const squareSizeStyle = (size) => {
  if (typeof size !== 'number') return null;
  return {
    '--workflow-square-size': `${size}px`,
    '--workflow-label-y': `-${Math.round(size / 2 + 7)}px`,
  };
};

const normalizeEdges = (edges) =>
  edges.map((edge) =>
    Array.isArray(edge) ? { from: edge[0], to: edge[1] } : edge
  );

const createCappedAxisMap = (values, maxGap) => {
  if (values.length < 2) return null;

  const cappedValues = [0];
  for (let index = 1; index < values.length; index++) {
    const distance = values[index] - values[index - 1];
    cappedValues.push(cappedValues[index - 1] + Math.min(distance, maxGap));
  }

  const offset = 50 - cappedValues[cappedValues.length - 1] / 2;
  return new Map(values.map((value, index) => [value, offset + cappedValues[index]]));
};

const createFixedAxisMap = (values, gap) => {
  if (values.length < 2) return null;

  const centeredGap = Math.min(gap, 76 / (values.length - 1));
  const offset = 50 - ((values.length - 1) * centeredGap) / 2;
  return new Map(values.map((value, index) => [value, offset + index * centeredGap]));
};

const transformAxisValue = (value, values, mappedValues) => {
  if (!Number.isFinite(value) || !mappedValues) return value;
  if (mappedValues.has(value)) return mappedValues.get(value);

  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  if (value <= firstValue) return value + mappedValues.get(firstValue) - firstValue;
  if (value >= lastValue) return value + mappedValues.get(lastValue) - lastValue;

  const rightIndex = values.findIndex((axisValue) => axisValue > value);
  const left = values[rightIndex - 1];
  const right = values[rightIndex];
  const leftMapped = mappedValues.get(left);
  const rightMapped = mappedValues.get(right);
  const ratio = (value - left) / (right - left);
  return leftMapped + (rightMapped - leftMapped) * ratio;
};

const createCenteredLayout = (
  nodes,
  { maxColumnGap = DEFAULT_MAX_COLUMN_GAP, rowGap = DEFAULT_ROW_GAP } = {}
) => {
  const columns = [...new Set(nodes.map((node) => node.x).filter(Number.isFinite))].sort(
    (a, b) => a - b
  );
  const rows = [...new Set(nodes.map((node) => node.y).filter(Number.isFinite))].sort(
    (a, b) => a - b
  );

  const mappedColumns = createCappedAxisMap(columns, maxColumnGap);
  const mappedRows = createFixedAxisMap(rows, rowGap);
  const transformPoint = (point) => ({
    ...point,
    x: transformAxisValue(point.x, columns, mappedColumns),
    y: transformAxisValue(point.y, rows, mappedRows),
  });

  return {
    nodes: nodes.map(transformPoint),
    transformPoint,
  };
};

const buildPath = (edge, nodesById) => {
  const from = nodesById.get(edge.from);
  const to = edge.toPoint || nodesById.get(edge.to);
  if (!from || !to) return '';

  const points = edge.points || [];
  const commands = [
    `M ${from.x} ${from.y}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${to.x} ${to.y}`,
  ];
  return commands.join(' ');
};

const resolveEdgeLabelPosition = (edge, nodesById) => {
  if (edge.labelPosition) return edge.labelPosition;

  const from = nodesById.get(edge.from);
  const to = nodesById.get(edge.to);
  if (!from || !to) return null;

  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - 2,
  };
};

export const workflowGraphPresets = workflowChartsById;

export default function WorkflowGraph({ type = 'diamond', graph = null, className = '' }) {
  const selected = graph || getWorkflowChart(type);
  const layout = createCenteredLayout(selected.nodes || [], {
    maxColumnGap: selected.maxColumnGap,
    rowGap: selected.rowGap,
  });
  const nodes = layout.nodes;
  const edges = normalizeEdges(selected.edges || []).map((edge) => ({
    ...edge,
    points: edge.points ? edge.points.map(layout.transformPoint) : edge.points,
    toPoint: edge.toPoint ? layout.transformPoint(edge.toPoint) : edge.toPoint,
    labelPosition: edge.labelPosition ? layout.transformPoint(edge.labelPosition) : edge.labelPosition,
  }));
  const annotations = (selected.annotations || []).map(layout.transformPoint);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const graphClassName = ['workflow-graph', className].filter(Boolean).join(' ');

  return (
    <div className={graphClassName}>
      <svg className="workflow-graph__edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge, index) => {
          const path = buildPath(edge, nodesById);
          if (!path) return null;
          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <path
                className={`workflow-graph__edge ${
                  edge.kind ? `workflow-graph__edge--${edge.kind}` : ''
                }`}
                d={path}
              />
            </g>
          );
        })}
      </svg>
      {edges.map((edge, index) => {
        const labelPosition = edge.label ? resolveEdgeLabelPosition(edge, nodesById) : null;
        if (!labelPosition) return null;

        return (
          <span
            className="mesh-label mesh-label--positioned workflow-graph__edge-label"
            key={`${edge.from}-${edge.to}-${index}-label`}
            style={{
              left: `${labelPosition.x}%`,
              top: `${labelPosition.y}%`,
            }}
          >
            {edge.label}
          </span>
        );
      })}
      {annotations.map((annotation, index) => {
        if (annotation.type !== 'direction-arrow') return null;

        return (
          <svg
            aria-hidden="true"
            className={`workflow-graph__direction-arrow workflow-graph__direction-arrow--${
              annotation.direction || 'up'
            }`}
            key={`${annotation.type}-${index}`}
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
            }}
            viewBox="0 0 14 14"
          >
            <path d="M7 2.5 L12 10.5 H2 Z" />
          </svg>
        );
      })}
      {nodes.map((node) => {
        const visual = resolveNodeVisual(node);
        const typeClass = `workflow-graph__node--${sanitizeClassPart(visual.type)}`;
        const sizeClass =
          typeof visual.size === 'number'
            ? 'workflow-graph__node--custom-size'
            : `workflow-graph__node--${sanitizeClassPart(visual.size)}`;
        const toneClass = `workflow-graph__square--${sanitizeClassPart(visual.tone)}`;
        const meshToneClass = squareToneClass(visual.tone);
        const squareClassName = [
          'mesh-node',
          'mesh-node--positioned',
          'workflow-graph__square',
          toneClass,
          meshToneClass,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div
            className={`workflow-graph__node ${typeClass} ${sizeClass}`}
            key={node.id}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              ...(squareSizeStyle(visual.size) || {}),
            }}
          >
            <span className={squareClassName} aria-hidden="true" />
            <span
              className={`mesh-label mesh-label--positioned workflow-graph__label ${
                node.wide ? 'workflow-graph__label--wide' : ''
              }`}
            >
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
