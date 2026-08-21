"use client";

import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuid } from "uuid";
import DecisionNode from "@/components/nodes/DecisionNode";
import type {
  Decision,
  DecisionNodeData,
  ExecutionStep,
  FlowEdge,
  FlowNode,
  WorkflowGraph,
} from "@/lib/types";

const nodeTypes = { decisionNode: DecisionNode };

const edgeColor: Record<Decision, string> = {
  YES: "#10b981",
  NO: "#f43f5e",
};


function newNode(position: { x: number; y: number }): Node<DecisionNodeData> {
  const id = uuid();
  return {
    id,
    type: "decisionNode",
    position,
    data: { label: "New decision", prompt: "", status: "idle" },
  };
}

export default function FlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<DecisionNodeData>([
    newNode({ x: 250, y: 50 }),
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<{ condition: Decision }>([]);
  const [startNodeId, setStartNodeId] = useState<string | null>(nodes[0]?.id ?? null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<ExecutionStep[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      const condition = (connection.sourceHandle as Decision) ?? "YES";
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: uuid(),
            label: condition,
            style: { stroke: edgeColor[condition] },
            data: { condition },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNodeToCanvas = () => {
    const position = { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 };
    const n = newNode(position);
    setNodes((ns) => [...ns, n]);
    if (!startNodeId) setStartNodeId(n.id);
  };

  const buildGraph = (): WorkflowGraph => {
    const flowNodes: FlowNode[] = nodes.map((n) => ({
      id: n.id,
      type: "decisionNode",
      position: n.position,
      data: {
        label: n.data.label,
        prompt: n.data.prompt,
      },
    }));
    const flowEdges: FlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target!,
      sourceHandle: (e.data?.condition as Decision) ?? "YES",
    }));
    return { nodes: flowNodes, edges: flowEdges, startNodeId: startNodeId! };
  };

  const runWorkflow = async () => {
    if (!startNodeId) {
      setErrorMsg("Pick a start node first.");
      return;
    }
    setErrorMsg(null);
    setRunning(true);
    setLog([]);

    try {
      const res = await fetch("/api/trigger-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: buildGraph() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to trigger run");
      const { eventId } = await res.json();

      // Simple poll loop against the Inngest dev server status route.
      const start = Date.now();
      const poll = async (): Promise<void> => {
        if (Date.now() - start > 60_000) {
          setErrorMsg("Timed out waiting for run to finish.");
          setRunning(false);
          return;
        }
        const statusRes = await fetch(`/api/workflow-status?eventId=${eventId}`);
        const statusData = await statusRes.json();
        const run = statusData?.data?.[0];

        if (run?.status === "Completed") {
          setLog(run.output?.history ?? []);
          setRunning(false);
          return;
        }
        if (run?.status === "Failed") {
          setErrorMsg("Workflow run failed. Check the Inngest dev server logs.");
          setRunning(false);
          return;
        }
        setTimeout(poll, 1500);
      };
      poll();
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
      setRunning(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(buildGraph(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const graph: WorkflowGraph = JSON.parse(reader.result as string);
        setNodes(
          graph.nodes.map((n) => ({
            id: n.id,
            type: "decisionNode",
            position: n.position,
            data: { label: n.data.label, prompt: n.data.prompt, status: "idle" },
          }))
        );
        setEdges(
          graph.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            label: e.sourceHandle,
            style: { stroke: edgeColor[e.sourceHandle] },
            data: { condition: e.sourceHandle },
          }))
        );
        setStartNodeId(graph.startNodeId);
      } catch {
        setErrorMsg("Invalid workflow JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-14 flex items-center gap-2 px-4 border-b border-slate-200 shrink-0">
        <h1 className="font-semibold text-slate-800 mr-4">AI Decision Flow</h1>

        <button
          onClick={addNodeToCanvas}
          className="text-sm px-3 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-700"
        >
          + Add Node
        </button>

        <select
          className="text-sm border border-slate-300 rounded px-2 py-1.5"
          value={startNodeId ?? ""}
          onChange={(e) => setStartNodeId(e.target.value)}
        >
          <option value="" disabled>
            Select start node
          </option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.data.label || n.id}
            </option>
          ))}
        </select>

        <button
          onClick={runWorkflow}
          disabled={running}
          className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {running ? "Running…" : "▶ Run Workflow"}
        </button>

        <button
          onClick={exportJson}
          className="text-sm px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
        >
          Export JSON
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
        />

        {errorMsg && <span className="text-sm text-red-600 ml-2">{errorMsg}</span>}
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="reactflow-wrapper flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <aside className="w-80 shrink-0 border-l border-slate-200 p-3 overflow-y-auto">
          <h2 className="font-semibold text-sm text-slate-700 mb-2">Execution Log</h2>
          {log.length === 0 && (
            <p className="text-xs text-slate-400">
              Run the workflow to see step-by-step decisions here.
            </p>
          )}
          <ol className="space-y-2">
            {log.map((step, i) => (
              <li
                key={i}
                className={`text-xs rounded border p-2 ${
                  step.decision === "YES"
                    ? "border-emerald-300 bg-emerald-50"
                    : step.decision === "NO"
                    ? "border-rose-300 bg-rose-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <div className="font-medium">
                  Step {i + 1}: {step.decision}
                </div>
                <div className="text-slate-500 truncate">{step.prompt}</div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

export function FlowEditorWithProvider() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
