# AI Decision Flow — React Flow + Inngest

A visual AI workflow builder. Each node is a decision step: it sends its prompt to an LLM,
gets back a strict `YES` / `NO`, and the workflow branches down the matching edge. Execution
runs as a durable Inngest function; the graph is edited and visualized with React Flow.

---

## 🎯 What It Does

- **Visual Editor**: Drag and drop decision nodes, connect them with YES/NO edges
- **AI-Powered**: Each node sends its prompt to an LLM (OpenAI / OpenRouter / Ollama)
- **Durable Execution**: Inngest handles retries, failures, and step-by-step execution
- **Real-time Logs**: See each decision as it happens in the execution log panel
- **Save/Load**: Export workflows as JSON and import them later

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **UI** | React Flow (canvas), Tailwind CSS, shadcn/ui |
| **Workflow Engine** | Inngest (durable step-based execution) |
| **AI Provider** | OpenRouter (free tier) / OpenAI / Ollama |
| **Validation** | Zod (for type safety) |

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-decision-flow/ai-decision-flow
npm install
2. Set Up Environment Variables
bash
cp .env.example .env
Edit .env with your values:

bash
# OpenRouter (Free — Recommended)
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=openrouter/free

# OR OpenAI (Paid)
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# LLM_MODEL=gpt-4o-mini

# OR Ollama (Local — Free)
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_API_KEY=ollama
# LLM_MODEL=gemma3:1b

# Inngest Configuration (use "local" for development)
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
3. Get an API Key
Option A: OpenRouter (Recommended — Free)

Go to openrouter.ai

Sign up for a free account

Go to Settings → Privacy and turn ON:

✅ "Free endpoints that may train on request data"

✅ "Free endpoints that may publish prompts"

Create an API key in the API Keys section

Add it to your .env file

Option B: Ollama (Fully Local — Free)

bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a small, fast model
ollama pull gemma3:1b

# Verify it works
ollama run gemma3:1b "Hello"
4. Start the Application
Terminal 1 — Next.js:

bash
npm run dev
→ Open http://localhost:3000

Terminal 2 — Inngest:

bash
npm run inngest:dev
→ Inngest Dev Server at http://localhost:8288

🧪 Testing Your Workflow
Step 1: Create Nodes
Click "Add Node" to create decision boxes

Type a YES/NO question in each node, e.g.:

Node 1: "Is this a support request?"

Node 2: "Is the issue urgent?"

Node 3: "Is this a new feature request?"

Step 2: Connect Nodes
Drag from the green YES handle (bottom-left) to the next node

Drag from the red NO handle (bottom-right) to another node

Step 3: Select Start Node
Use the dropdown in the toolbar to select which node runs first

Step 4: Run the Workflow
Click "Run Workflow"

Watch the Execution Log panel on the right

Step 5: Save/Load
Export JSON: Saves your workflow as a .json file

Import JSON: Loads a previously saved workflow

📊 Example Workflow
text
┌────────────────────────────────────────────────────────────┐
│             Node 1                                         │
│  "Is this a support request?"                              │
│          YES        NO                                     │
│            │         │                                     │
│            ▼         ▼                                     │
│      ┌─────────┐  ┌───────── ┐                             │
│      │ Node 2  │  │ Node 3   │                             │
│      │ "Is it  │  │ "Is it   │                             │
│      │ urgent?"│  │ a sales  │                             │
│      │         │  │ inquiry?"│                             │
│      └─────────┘  └───────── ┘                             │
│          YES        YES                                    │
│            │         │                                     │
│            ▼         ▼                                     │
│      ┌─────────┐  ┌─────────┐                              │
│      │ End    │  │ End    │                                │
│      └─────────┘  └─────────┘                              │
└────────────────────────────────────────────────────────────┘
🔧 Troubleshooting
"ERROR" in Execution Log
Issue	Fix
API key missing	Check your .env file for LLM_API_KEY
Model not found	Verify LLM_MODEL is correct (e.g., openrouter/free)
Rate limited	OpenRouter free tier has 50 requests/day — wait or use Ollama
Hardcoded model	Ensure runWorkflow.ts uses process.env.LLM_MODEL
"Cannot connect to Inngest"
bash
# Make sure Inngest is running
npm run inngest:dev

# Check the URL in app/api/inngest/route.ts
# Should be: http://localhost:8288
"Invalid hook call" Error
Make sure "use client" is at the top of FlowEditor.tsx and DecisionNode.tsx

Check for duplicate imports in DecisionNode.tsx

📁 Project Structure
text
ai-decision-flow/
├── app/
│   ├── api/
│   │   ├── inngest/route.ts          # Inngest handler
│   │   ├── trigger-workflow/route.ts # POST: start a workflow
│   │   └── workflow-status/route.ts  # GET: check workflow status
│   ├── flow-editor/page.tsx          # Main editor page
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Redirects to /flow-editor
├── components/
│   ├── FlowEditor.tsx                # Canvas, toolbar, execution log
│   └── nodes/
│       └── DecisionNode.tsx          # Custom node with YES/NO handles
├── inngest/
│   ├── client.ts                     # Inngest client with typed events
│   └── functions/
│       └── runWorkflow.ts            # Workflow execution logic
├── lib/
│   └── types.ts                      # TypeScript type definitions
├── .env.example                      # Environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md                         # This file
🔄 How It Works
Editor (React Flow)

Users build a graph of decision nodes

Each node has a prompt and YES/NO output handles

Edges define the branching logic

Trigger

"Run Workflow" serializes the graph to JSON

POSTs to /api/trigger-workflow

Sends a workflow/run event to Inngest

Execution (Inngest)

Walks the graph starting at startNodeId

Each node's LLM call is wrapped in step.run()

Returns YES/NO to decide which edge to follow

Status & Logs

Frontend polls /api/workflow-status every 1.5 seconds

Execution log updates in real-time

🎯 Assignment Phase Mapping

Phase	What Covers It
1. Setup	package.json, .env.example, folder structure
2. Foundations	FlowEditor.tsx + DecisionNode.tsx — add/connect/edit nodes, YES/NO edges
3. Build (core)	runWorkflow.ts — per-node Inngest step, LLM call, edge-based traversal
4. Polish	Execution logs, JSON export/import, error handling, visual execution state

📋 Dependencies
bash
npm install next react react-dom reactflow inngest openai class-variance-authority clsx tailwind-merge lucide-react uuid
npm install -D @types/node @types/react @types/react-dom @types/uuid typescript tailwindcss postcss autoprefixer
