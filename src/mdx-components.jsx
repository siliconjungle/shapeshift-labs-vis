import { workflowChartComponents } from './components/WorkflowChartComponents';

export function useMDXComponents(components) {
  return {
    ...workflowChartComponents,
    ...components,
  };
}
