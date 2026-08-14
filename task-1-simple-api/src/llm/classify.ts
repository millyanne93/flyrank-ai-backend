import { readFileSync, appendFileSync, mkdirSync } from "fs";
import { ClassifyOutputSchema } from "./schema";
import { llmClient } from "./client";

const SYSTEM_PROMPT = readFileSync("src/prompts/classify-task-v1.md", "utf-8");

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/); 
  if (!match) throw new Error("No JSON object found in model output");
  return JSON.parse(match[0]);
}

async function callModel(title: string, extraMessages: any[] = []) {
  const res = await llmClient.chat.completions.create({
    model: process.env.LLM_MODEL!,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ title }) },
      ...extraMessages,
    ],
  });
  return res.choices[0].message.content!;
}

export async function classifyTask(title: string, taskId: number) {
  const firstRaw = await callModel(title);

  try {
    return ClassifyOutputSchema.parse(extractJson(firstRaw));
  } catch (firstError) {

    const repairRaw = await callModel(title, [
      { role: "assistant", content: firstRaw },
      { role: "user", content: `Your previous answer was rejected for this reason: ${firstError}. Return only corrected JSON matching the schema.` },
    ]);

    try {
      return ClassifyOutputSchema.parse(extractJson(repairRaw));
    } catch (secondError) {
      mkdirSync("logs", { recursive: true });
      appendFileSync("logs/quarantine.jsonl", JSON.stringify({
        taskId,
        title,
        promptVersion: "v1",
        error: String(secondError),
        rawOutput: repairRaw,
        timestamp: new Date().toISOString(),
      }) + "\n");

      const err: any = new Error("Model could not produce valid output after repair");
      err.status = 422;
      throw err;
    }
  }
}
