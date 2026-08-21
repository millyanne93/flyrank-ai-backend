"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import type { DecisionNodeData } from "@/lib/types";

const statusStyles: Record<string, string> = {
  idle: "border-slate-300 bg-white",
  running: "border-amber-400 bg-amber-50 animate-pulse",
  "done-yes": "border-emerald-500 bg-emerald-50",
  "done-no": "border-rose-500 bg-rose-50",
  error: "border-red-600 bg-red-50",
};

function DecisionNode({ id, data, selected }: NodeProps<DecisionNodeData>) {
  const [prompt, setPrompt] = useState(data.prompt);
  const { deleteElements } = useReactFlow();

  const handleBlur = () => {
    data.prompt = prompt;
  };

  const handleDelete = () => {
    if (confirm(`Delete node "${data.label || id}"?`)) {
      deleteElements({ nodes: [{ id }] });
    }
  };

  const status = data.status ?? "idle";

  return (
    <div
      className={`relative rounded-lg border-2 px-3 py-2 shadow-sm w-64 text-sm ${statusStyles[status]} ${
        selected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 flex items-center justify-center"
        aria-label="Delete node"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} />

      <div className="font-semibold text-slate-700 mb-1 truncate">
        {data.label || `Node ${id}`}
      </div>

      <textarea
        className="w-full resize-none rounded border border-slate-200 p-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 nodrag"
        rows={3}
        placeholder='e.g. "Is this a support request?"'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={handleBlur}
      />

      {/* Two distinct output handles so edges are unambiguous */}
      <div className="flex justify-between mt-2 text-[10px] font-medium">
        <span className="text-emerald-600">YES →</span>
        <span className="text-rose-600">NO →</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="YES"
        style={{ left: "25%", background: "#10b981" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="NO"
        style={{ left: "75%", background: "#f43f5e" }}
      />
    </div>
  );
}

export default memo(DecisionNode);
