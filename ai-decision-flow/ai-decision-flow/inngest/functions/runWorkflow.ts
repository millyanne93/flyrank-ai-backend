import OpenAI from "openai";
import { inngest } from "@/inngest/client";
import type {
  Decision,
  ExecutionStep,
  FlowEdge,
  FlowNode,
  WorkflowGraph,
} from "@/lib/types";

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_KEY,
});

const SYSTEM_PROMPT =
  "You are a strict binary classifier. Respond with exactly one word: YES or NO. " +
  "Never explain your answer, never add punctuation, never say anything else.";

function findNode(nodes: FlowNode[], id: string) {
  return nodes.find((n) => n.id === id);
}

function findNextEdge(edges: FlowEdge[], nodeId: string, decision: Decision) {
  return edges.find((e) => e.source === nodeId && e.sourceHandle === decision);
}

export const runWorkflow = inngest.createFunction(
  { id: "run-decision-workflow", retries: 2 },
  { event: "workflow/run" },
  async ({ event, step, runId }) => {
    const graph: WorkflowGraph = event.data.graph;
    const history: ExecutionStep[] = [];

    let currentId: string | null = graph.startNodeId;
    let guard = 0; // simple cycle-protection

    while (currentId && guard < 50) {
      guard++;
      const nodeId: string = currentId;
      const node = findNode(graph.nodes, nodeId);
      if (!node) break;

      // Each node's LLM call is its own durable, retryable Inngest step.
      const decision = await step.run(`evaluate-${node.id}`, async () => {
        try {
          const res = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || "openrouter/free",
            temperature: 0,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: node.data.prompt },
            ],
          });

          const raw = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
          const clean: Decision = raw.startsWith("YES") ? "YES" : "NO";

          return {
            nodeId: node.id,
            prompt: node.data.prompt,
            decision: clean,
            timestamp: new Date().toISOString(),
          } satisfies ExecutionStep;
        } catch (err) {
          return {
            nodeId: node.id,
            prompt: node.data.prompt,
            decision: "ERROR",
            timestamp: new Date().toISOString(),
          } satisfies ExecutionStep;
        }
      });

      history.push(decision);

      if (decision.decision === "ERROR") break;

      const nextEdge = findNextEdge(graph.edges, node.id, decision.decision);
      currentId = nextEdge ? nextEdge.target : null;
    }

    const result = {
      runId,
      history,
      finishedAt: new Date().toISOString(),
    };

    // Emit a completion event so the frontend can pick it up (e.g. via polling
    // a status route, or Inngest Realtime if you wire that in later).
    await step.sendEvent("send-completion", {
      name: "workflow/run.completed",
      data: result,
    });

    return result;
  }
);
