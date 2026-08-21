import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import type { WorkflowGraph } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const graph: WorkflowGraph = body.graph;

  if (!graph?.startNodeId || !graph?.nodes?.length) {
    return NextResponse.json(
      { error: "Graph must include nodes and a startNodeId" },
      { status: 400 }
    );
  }

  const { ids } = await inngest.send({
    name: "workflow/run",
    data: { graph },
  });

  // ids[0] is the Inngest event id — use it to look up the run in the
  // dev server UI (http://localhost:8288) or via the status route below.
  return NextResponse.json({ eventId: ids[0] });
}
