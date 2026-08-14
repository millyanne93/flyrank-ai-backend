import { readFileSync, appendFileSync, mkdirSync } from "fs";
import { llmClient } from "./client";
import { ClassifyOutputSchema } from "./schema";

const SYSTEM_PROMPT = readFileSync("src/prompts/classify-task-v1.md", "utf-8");

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model output");
  return JSON.parse(match[0]);
}

function isRetryable(err: any): boolean {
  const status = err?.status;
  return status === 429 || (status >= 500 && status < 600) || err?.name === 'APIConnectionTimeoutError';
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callModel(title: string, extraMessages: any[] = [], maxAttempts = 3): Promise<{ content: string; usage: any; durationMs: number }> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify({ title }) },
    ...extraMessages,
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    try {
      const res = await llmClient.chat.completions.create({
        model: process.env.LLM_MODEL!,
        temperature: 0.2,
        messages,
      });
      return {
        content: res.choices[0].message.content!,
        usage: res.usage,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      if (!isRetryable(err) || attempt === maxAttempts) throw err;
      const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500; // exponential + jitter
      await sleep(backoff);
    }
  }
  throw new Error("unreachable");
}

function logCost(entry: Record<string, unknown>) {
  console.log(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
}

export async function classifyTask(title: string, taskId: number) {
  // Kill switch
  if (process.env.LLM_ENABLED === 'false') {
    const err: any = new Error("Classification temporarily disabled");
    err.status = 503;
    throw err;
  }

  const first = await callModel(title);
  logCost({
    taskId, promptVersion: "v1", model: process.env.LLM_MODEL,
    inputTokens: first.usage?.prompt_tokens, outputTokens: first.usage?.completion_tokens,
    durationMs: first.durationMs, repaired: false,
  });

  try {
    return ClassifyOutputSchema.parse(extractJson(first.content));
  } catch (firstError) {
    const repair = await callModel(title, [
      { role: "assistant", content: first.content },
      { role: "user", content: `Your previous answer was rejected for this reason: ${firstError}. Return only corrected JSON matching the schema.` },
    ]);
    logCost({
      taskId, promptVersion: "v1", model: process.env.LLM_MODEL,
      inputTokens: repair.usage?.prompt_tokens, outputTokens: repair.usage?.completion_tokens,
      durationMs: repair.durationMs, repaired: true,
    });

    try {
      return ClassifyOutputSchema.parse(extractJson(repair.content));
    } catch (secondError) {
      mkdirSync("logs", { recursive: true });
      appendFileSync("logs/quarantine.jsonl", JSON.stringify({
        taskId, title, promptVersion: "v1", error: String(secondError),
        rawOutput: repair.content, timestamp: new Date().toISOString(),
      }) + "\n");

      const err: any = new Error("Model could not produce valid output after repair");
      err.status = 422;
      throw err;
    }
  }
}
