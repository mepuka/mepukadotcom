import { renderMermaidSVG, THEMES } from "beautiful-mermaid";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = join(import.meta.dirname, "../public/blog/personal-agent-ontology");
mkdirSync(outDir, { recursive: true });

const theme = {
  bg: "var(--color-bg, #1a1b26)",
  fg: "var(--color-text, #a9b1d6)",
  accent: "#7aa2f7",
  muted: "#565f89",
  surface: "#292e42",
  border: "#3d59a1",
  transparent: true,
};

const diagrams: Record<string, string> = {
  "actor-hierarchy": `
graph TD
    Agent["Agent"]
    AIAgent["AIAgent"]
    HumanUser["HumanUser"]
    SubAgent["SubAgent"]
    Persona["Persona"]
    AgentRole["AgentRole"]
    Organization["Organization"]

    Agent --> AIAgent
    Agent --> HumanUser
    AIAgent --> SubAgent
    AIAgent -.- Persona
    Agent -.- AgentRole
    Agent -.- Organization
`,

  "conversation-stack": `
graph TD
    Conversation["Conversation"] --> Session["Session"]
    Session --> Turn["Turn"]
    Turn --> Message["Message"]
    Message --> ContentBlock["ContentBlock"]
    Turn --> ToolInvocation["ToolInvocation"]
    ToolInvocation --> ToolResult["ToolResult"]
    Session -.- ContextWindow["ContextWindow"]
    ContextWindow -.- CompactionEvent["CompactionEvent"]
`,

  "memory-architecture": `
graph TD
    subgraph Tiers
        Working["WorkingMemory"]
        Episodic["EpisodicMemory"]
        Semantic["SemanticMemory"]
        Procedural["ProceduralMemory"]
    end

    subgraph Operations
        Encoding["Encoding"]
        Retrieval["Retrieval"]
        Consolidation["Consolidation"]
        Forgetting["Forgetting"]
    end

    MemoryItem["MemoryItem"] --> Working
    MemoryItem --> Episodic
    MemoryItem --> Semantic
    MemoryItem --> Procedural

    Working -.- Encoding
    Encoding -.- Episodic
    Episodic -.- Consolidation
    Consolidation -.- Semantic
    Semantic -.- Retrieval
    Semantic -.- Forgetting

    Episodic --> Episode["Episode"]
    Semantic --> Claim["Claim"]
`,

  "module-map": `
graph TD
    Core["Core: Identity & Actors<br/><small>8 classes</small>"]
    Event["Actions, Events & Time<br/><small>10 classes</small>"]
    Conv["Conversation & Interaction<br/><small>20 classes</small>"]
    Mem["Memory<br/><small>18 classes</small>"]
    Plan["Goals, Plans & Tasks<br/><small>8 classes</small>"]
    Gov["Governance & Safety<br/><small>11 classes</small>"]
    Svc["External Services<br/><small>10 classes</small>"]
    Err["Error Recovery & Observability<br/><small>11 classes</small>"]
    Model["Model Identity<br/><small>5 classes</small>"]
    Sched["Scheduling & Automation<br/><small>10 classes</small>"]

    Core --> Event
    Core --> Conv
    Core --> Mem
    Core --> Plan
    Core --> Gov
    Core --> Svc
    Core --> Model
    Event --> Conv
    Event --> Mem
    Event --> Plan
    Event --> Gov
    Event --> Err
    Event --> Sched
    Plan --> Sched
`,
};

for (const [name, mermaid] of Object.entries(diagrams)) {
  const svg = renderMermaidSVG(mermaid, theme);
  const outPath = join(outDir, `${name}.svg`);
  writeFileSync(outPath, svg);
  console.log(`Wrote ${outPath}`);
}

console.log("Done — all diagrams rendered.");
