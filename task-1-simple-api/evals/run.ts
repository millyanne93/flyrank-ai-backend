import { readFileSync } from "fs";

const cases = JSON.parse(readFileSync("evals/cases.json", "utf-8"));

async function runEval() {
  let categoryCorrect = 0;
  let priorityCorrect = 0;
  const failures: any[] = [];

  for (const testCase of cases) {
    const createRes = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: testCase.title }),
    });
    const task = await createRes.json();

    const classifyRes = await fetch(`http://localhost:3000/tasks/${task.id}/classify`, {
      method: "POST",
    });
    const result = await classifyRes.json();

    const categoryPass = result.category === testCase.expected_category;
    const priorityPass = result.priority === testCase.expected_priority;

    if (categoryPass) categoryCorrect++;
    if (priorityPass) priorityCorrect++;

    if (!categoryPass || !priorityPass) {
      failures.push({
        title: testCase.title,
        expected: { category: testCase.expected_category, priority: testCase.expected_priority },
        got: { category: result.category, priority: result.priority },
      });
    }
  }

  console.log(`Category score: ${categoryCorrect}/${cases.length}`);
  console.log(`Priority score: ${priorityCorrect}/${cases.length}`);
  if (failures.length > 0) {
    console.log("Failures:", JSON.stringify(failures, null, 2));
  }
}

runEval();
