import WorkflowChartBlock from './WorkflowChartBlock';

const makeWorkflowChart = (type) => {
  const Chart = (props) => <WorkflowChartBlock type={type} {...props} />;
  Chart.displayName = `${type}WorkflowChart`;
  return Chart;
};

export const ChainChart = makeWorkflowChart('chain');
export const BranchChart = makeWorkflowChart('fork');
export const ForkChart = BranchChart;
export const JoinChart = makeWorkflowChart('join');
export const SelectChart = makeWorkflowChart('select');
export const ReduceChart = makeWorkflowChart('reduce');
export const GateChart = makeWorkflowChart('gate');
export const LoopChart = makeWorkflowChart('loop');
export const SimpleBenchmarkLoopChart = makeWorkflowChart('simple-benchmark-loop');
export const ParallelBenchmarkLoopChart = makeWorkflowChart('parallel-benchmark-loop');
export const ResearchSynthesisChart = makeWorkflowChart('research-synthesis');
export const ResearchTreeSynthesisChart = makeWorkflowChart('research-tree-synthesis');
export const SemanticMergeTextConflictChart = makeWorkflowChart('semantic-merge-text-conflict');
export const SemanticMergeImportSetChart = makeWorkflowChart('semantic-merge-import-set');
export const SemanticMergeTypedRebaseChart = makeWorkflowChart('semantic-merge-typed-rebase');
export const RunTranscriptLineChart = makeWorkflowChart('run-transcript-line');
export const RunCausalGraphChart = makeWorkflowChart('run-causal-graph');
export const RunEventsProjectionChart = makeWorkflowChart('run-events-projections');
export const RunLaneConvergenceChart = makeWorkflowChart('run-lane-convergence');
export const RunStaleEvidenceChart = makeWorkflowChart('run-stale-evidence');
export const RunDecisionParentsChart = makeWorkflowChart('run-decision-parents');
export const EvidenceAdmissionChart = makeWorkflowChart('evidence-admission');
export const EvidenceComparisonChart = makeWorkflowChart('evidence-comparison');
export const SemanticLeaseClaimChart = makeWorkflowChart('semantic-lease-claim');
export const SemanticLeaseFencingChart = makeWorkflowChart('semantic-lease-fencing');
export const SemanticLeaseMergeChart = makeWorkflowChart('semantic-lease-merge');
export const CoordinatorTriageChart = makeWorkflowChart('coordinator-work-triage');
export const CoordinatorWaveLoopChart = makeWorkflowChart('coordinator-wave-loop');
export const MergeReviewAdmissionChart = makeWorkflowChart('merge-review-admission');
export const MergeReviewRebaseChart = makeWorkflowChart('merge-review-rebase');
export const HumanQuestionControlFlowChart = makeWorkflowChart('human-question-control-flow');
export const HumanQuestionFanoutChart = makeWorkflowChart('human-question-fanout');
export const SemanticRegionIndexChart = makeWorkflowChart('semantic-region-index');
export const SemanticRegionOverlapChart = makeWorkflowChart('semantic-region-overlap');
export const StaleWorkDetectionChart = makeWorkflowChart('stale-work-detection');
export const StaleWorkRebaseLoopChart = makeWorkflowChart('stale-work-rebase-loop');
export const MergeRoutingRouterChart = makeWorkflowChart('merge-routing-router');
export const MergeRoutingOutcomeLoopChart = makeWorkflowChart('merge-routing-outcome-loop');
export const PatchAdmissionTypeCheckChart = makeWorkflowChart('patch-admission-type-check');
export const PatchAdmissionEvidenceSubtypeChart = makeWorkflowChart(
  'patch-admission-evidence-subtyping'
);
export const PatchAdmissionFailClosedChart = makeWorkflowChart('patch-admission-fail-closed');
export const AgentReadableSurfaceChart = makeWorkflowChart('agent-readable-surface');
export const AgentReadableFeedbackChart = makeWorkflowChart('agent-readable-feedback');
export const SimulationSandboxChart = makeWorkflowChart('simulation-before-mutation-sandbox');
export const SimulationLadderChart = makeWorkflowChart('simulation-before-mutation-ladder');
export const OracleStackChart = makeWorkflowChart('oracle-stack');
export const OracleDisagreementChart = makeWorkflowChart('oracle-disagreement');
export const ParallelInterfacesChart = makeWorkflowChart('parallel-work-interfaces');
export const ParallelBoundaryChart = makeWorkflowChart('parallel-work-boundary');
export const LayoutRuntimeStackChart = makeWorkflowChart('layout-runtime-stack');
export const LayoutRuntimeEvidenceChart = makeWorkflowChart('layout-runtime-evidence');
export const ReviewBandwidthFunnelChart = makeWorkflowChart('review-bandwidth-funnel');
export const ReviewBandwidthRoutingChart = makeWorkflowChart('review-bandwidth-routing');
export const WorkspaceIsolationWorldsChart = makeWorkflowChart('workspace-isolation-worlds');
export const WorkspaceIsolationAdmissionChart = makeWorkflowChart('workspace-isolation-admission');
export const CapabilitiesActionSurfaceChart = makeWorkflowChart('capabilities-action-surface');
export const CapabilitiesAuditTrailChart = makeWorkflowChart('capabilities-audit-trail');
export const TextSubstrateLayersChart = makeWorkflowChart('text-substrate-layers');
export const FourVersionMergeBindingChart = makeWorkflowChart('four-version-merge-binding');
export const CssDependencyGraphChart = makeWorkflowChart('css-dependency-graph');
export const MatrixRoutingSystemChart = makeWorkflowChart('matrix-routing-system');
export const QueueContractLifecycleChart = makeWorkflowChart('queue-contract-lifecycle');
export const DistributedAgentReceiptChart = makeWorkflowChart('distributed-agent-receipt');
export const GateInterfaceContractChart = makeWorkflowChart('gate-interface-contract');
export const ApplyReviewEngineChart = makeWorkflowChart('apply-review-engine');
export const SmallTaskScalingChart = makeWorkflowChart('small-task-scaling');
export const SemanticMergeConservativeChart = makeWorkflowChart('semantic-merge-conservative');
export const RuntimeProofInterfaceChart = makeWorkflowChart('runtime-proof-interface');
export const HumanHighCostOracleChart = makeWorkflowChart('human-high-cost-oracle');
export const MergeHotspotMeasurementChart = makeWorkflowChart('merge-hotspot-measurement');
export const HotspotRoutingFeedbackChart = makeWorkflowChart('hotspot-routing-feedback');
export const ModelTournamentFeedbackChart = makeWorkflowChart('model-tournament-feedback');
export const ModelRoutingBudgetLoopChart = makeWorkflowChart('model-routing-budget-loop');
export const SupersetInterlinguaBridgeChart = makeWorkflowChart('superset-interlingua-bridge');
export const SupersetSemanticLayersChart = makeWorkflowChart('superset-semantic-layers');
export const SupersetLoweringRoutesChart = makeWorkflowChart('superset-lowering-routes');
export const LockfileCausalGraphChart = makeWorkflowChart('lockfile-causal-graph');
export const PreviewEvidenceMachineChart = makeWorkflowChart('preview-evidence-machine');
export const RefactorCoordinationGraphChart = makeWorkflowChart('refactor-coordination-graph');
export const AgentMapFeedbackChart = makeWorkflowChart('agent-map-feedback');

export const workflowChartComponents = {
  ChainChart,
  BranchChart,
  ForkChart,
  JoinChart,
  SelectChart,
  ReduceChart,
  GateChart,
  LoopChart,
  SimpleBenchmarkLoopChart,
  ParallelBenchmarkLoopChart,
  ResearchSynthesisChart,
  ResearchTreeSynthesisChart,
  SemanticMergeTextConflictChart,
  SemanticMergeImportSetChart,
  SemanticMergeTypedRebaseChart,
  RunTranscriptLineChart,
  RunCausalGraphChart,
  RunEventsProjectionChart,
  RunLaneConvergenceChart,
  RunStaleEvidenceChart,
  RunDecisionParentsChart,
  EvidenceAdmissionChart,
  EvidenceComparisonChart,
  SemanticLeaseClaimChart,
  SemanticLeaseFencingChart,
  SemanticLeaseMergeChart,
  CoordinatorTriageChart,
  CoordinatorWaveLoopChart,
  MergeReviewAdmissionChart,
  MergeReviewRebaseChart,
  HumanQuestionControlFlowChart,
  HumanQuestionFanoutChart,
  SemanticRegionIndexChart,
  SemanticRegionOverlapChart,
  StaleWorkDetectionChart,
  StaleWorkRebaseLoopChart,
  MergeRoutingRouterChart,
  MergeRoutingOutcomeLoopChart,
  PatchAdmissionTypeCheckChart,
  PatchAdmissionEvidenceSubtypeChart,
  PatchAdmissionFailClosedChart,
  AgentReadableSurfaceChart,
  AgentReadableFeedbackChart,
  SimulationSandboxChart,
  SimulationLadderChart,
  OracleStackChart,
  OracleDisagreementChart,
  ParallelInterfacesChart,
  ParallelBoundaryChart,
  LayoutRuntimeStackChart,
  LayoutRuntimeEvidenceChart,
  ReviewBandwidthFunnelChart,
  ReviewBandwidthRoutingChart,
  WorkspaceIsolationWorldsChart,
  WorkspaceIsolationAdmissionChart,
  CapabilitiesActionSurfaceChart,
  CapabilitiesAuditTrailChart,
  TextSubstrateLayersChart,
  FourVersionMergeBindingChart,
  CssDependencyGraphChart,
  MatrixRoutingSystemChart,
  QueueContractLifecycleChart,
  DistributedAgentReceiptChart,
  GateInterfaceContractChart,
  ApplyReviewEngineChart,
  SmallTaskScalingChart,
  SemanticMergeConservativeChart,
  RuntimeProofInterfaceChart,
  HumanHighCostOracleChart,
  MergeHotspotMeasurementChart,
  HotspotRoutingFeedbackChart,
  ModelTournamentFeedbackChart,
  ModelRoutingBudgetLoopChart,
  SupersetInterlinguaBridgeChart,
  SupersetSemanticLayersChart,
  SupersetLoweringRoutesChart,
  LockfileCausalGraphChart,
  PreviewEvidenceMachineChart,
  RefactorCoordinationGraphChart,
  AgentMapFeedbackChart,
};
