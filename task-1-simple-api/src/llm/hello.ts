import { llmClient } from "./client";

async function main() {
  const res = await llmClient.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [{ role: "user", content: "Reply with exactly the word: ready" }],
  });
  console.log(res.choices[0].message.content);
}

main();
