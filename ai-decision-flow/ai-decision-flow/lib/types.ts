export type Decision = "YES" | "NO";

export interface DecisionNodeData {
  label: string;
  prompt: string;
  /** populated during/after execution, used for UI highlighting */
  status?: "idle" | "running" | "done-yes" | "done-no" | "error";
}

export interface FlowNode {
  id: string;
  type: "decisionNode";
  position: { x: number; y: number };
  data: DecisionNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: Decision; // "YES" | "NO" — which output handle this edge comes from
  label?: string;
}

export interface WorkflowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string;
}

export interface ExecutionStep {
  nodeId: string;
  prompt: string;
  decision: Decision | "ERROR";
  timestamp: string;
}

export interface WorkflowRunResult {
  runId: string;
  history: ExecutionStep[];
  finishedAt: string;
}
