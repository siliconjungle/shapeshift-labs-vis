import workflowCharts from '../content/workflow-charts.json';

const chartEntries = workflowCharts.flatMap((chart) => [
  [chart.id, chart],
  ...(chart.aliases || []).map((alias) => [alias, chart]),
]);

export const workflowChartList = workflowCharts;

export const workflowChartsById = Object.fromEntries(chartEntries);

export const getWorkflowChart = (id = 'diamond') =>
  workflowChartsById[id] || workflowChartsById.diamond;
