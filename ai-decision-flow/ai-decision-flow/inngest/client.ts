import { Inngest, EventSchemas } from "inngest";
import type { WorkflowGraph, WorkflowRunResult } from "@/lib/types";

type Events = {
  "workflow/run": {
    data: {
      graph: WorkflowGraph;
    };
  };
  "workflow/run.completed": {
    data: WorkflowRunResult;
  };
};

export const inngest = new Inngest({
  id: "ai-decision-flow",
  schemas: new EventSchemas().fromRecord<Events>(),
});
