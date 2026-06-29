import { workflowChartComponents } from './components/WorkflowChartComponents';
import AdmissionChecklist from './components/AdmissionChecklist';
import CapabilityCard from './components/CapabilityCard';
import ClaimProofMatrix from './components/ClaimProofMatrix';
import CssCascadeInspector from './components/CssCascadeInspector';
import EvidenceLadder from './components/EvidenceLadder';
import FourVersionMergeView from './components/FourVersionMergeView';
import LineDiffComparison from './components/LineDiffComparison';
import RegionOverlapMap from './components/RegionOverlapMap';
import RouteDecisionTable from './components/RouteDecisionTable';
import RunLensComparison from './components/RunLensComparison';
import RuntimeProbeMatrix from './components/RuntimeProbeMatrix';
import SemanticCodeDiff from './components/SemanticCodeDiff';
import SemanticRecord from './components/SemanticRecord';
import SourceSpanMap from './components/SourceSpanMap';

export function useMDXComponents(components) {
  return {
    ...workflowChartComponents,
    AdmissionChecklist,
    CapabilityCard,
    ClaimProofMatrix,
    CssCascadeInspector,
    EvidenceLadder,
    FourVersionMergeView,
    LineDiffComparison,
    RegionOverlapMap,
    RouteDecisionTable,
    RunLensComparison,
    RuntimeProbeMatrix,
    SemanticCodeDiff,
    SemanticRecord,
    SourceSpanMap,
    ...components,
  };
}
