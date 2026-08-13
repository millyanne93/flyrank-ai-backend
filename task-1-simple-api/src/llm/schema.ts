import { z } from "zod";

export const ClassifyOutputSchema = z.object({
  category: z.enum(["work", "personal", "learning", "health", "errand", "other"]),
  priority: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});
