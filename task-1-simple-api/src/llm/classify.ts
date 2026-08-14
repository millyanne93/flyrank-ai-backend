import { readFileSync } from "fs";
import { llmClient } from "./client";

const SYSTEM_PROMPT = readFileSync("src/prompts/classify-task-v1.md", "utf-8");

export async function classifyTask(title: string) {
  const res = await llmClient.chat.completions.create({
    model: process.env.LLM_MODEL!,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ title }) },
    ],
  });
  return res.choices[0].message.content;
}
