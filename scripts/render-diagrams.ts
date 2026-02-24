import { renderMermaidSVG, THEMES } from "beautiful-mermaid";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = join(import.meta.dirname, "../public/blog/personal-agent-ontology");
mkdirSync(outDir, { recursive: true });

const theme = {
  bg: "var(--color-bg, #f8f7f4)",
  fg: "var(--color-text, #3d4852)",
  accent: "var(--color-teal, #4a8b7c)",
  muted: "var(--color-text-muted, #6b7280)",
  surface: "var(--color-teal-light, #e8f0ed)",
  border: "var(--color-teal, #4a8b7c)",
  transparent: true,
};

const diagrams: Record<string, string> = {
  "actor-hierarchy": `
graph TD
    Agent(["<b>Agent</b>"])
    AIAgent["AIAgent"]
    HumanUser["HumanUser"]
    SubAgent["SubAgent"]
    Persona(("Persona"))
    AgentRole(("AgentRole"))
    Organization(("Organization"))

    Agent -->|subclass| AIAgent
    Agent -->|subclass| HumanUser
    AIAgent -->|subclass| SubAgent
    AIAgent -.->|has| Persona
    Agent -.->|plays| AgentRole
    Agent -.->|belongs to| Organization
`,

  "conversation-stack": `
graph TD
    Conversation(["Conversation"])
    Session(["Session"])
    Turn["Turn"]
    Message["Message"]
    ContentBlock["ContentBlock"]
    ToolInvocation["ToolInvocation"]
    ToolResult["ToolResult"]
    ContextWindow{{"ContextWindow"}}
    CompactionEvent{{"CompactionEvent"}}

    Conversation -->|has| Session
    Session -->|contains| Turn
    Turn -->|has| Message
    Message -->|has| ContentBlock
    Turn -->|triggers| ToolInvocation
    ToolInvocation -->|produces| ToolResult
    Session -.->|bounded by| ContextWindow
    ContextWindow -.->|triggers| CompactionEvent
`,

  "memory-architecture": `
graph TD
    MemoryItem(["<b>MemoryItem</b>"])

    subgraph Tiers
        Working[("WorkingMemory")]
        Episodic[("EpisodicMemory")]
        Procedural[("ProceduralMemory")]
        Semantic[("SemanticMemory")]
    end

    subgraph Operations
        Encoding{{"Encoding"}}
        Retrieval{{"Retrieval"}}
        Consolidation{{"Consolidation"}}
        Forgetting{{"Forgetting"}}
    end

    MemoryItem --> Working
    MemoryItem --> Episodic
    MemoryItem --> Semantic
    MemoryItem --> Procedural

    Working -.->|encode| Encoding
    Encoding -.->|store| Episodic
    Episodic -.->|extract| Consolidation
    Consolidation -.->|generalize| Semantic
    Semantic -.->|recall| Retrieval
    Semantic -.->|expire| Forgetting

    Episodic -->|instance| Episode["Episode"]
    Semantic -->|instance| Claim["Claim"]
`,

  "module-map": `
graph TD
    Core(["<b>Core: Identity & Actors</b><br/>8 classes"])
    Event(["Actions, Events & Time<br/>10 classes"])
    Conv["Conversation & Interaction<br/>20 classes"]
    Mem["Memory<br/>18 classes"]
    Plan["Goals, Plans & Tasks<br/>8 classes"]
    Gov["Governance & Safety<br/>11 classes"]
    Svc["External Services<br/>10 classes"]
    Err["Error Recovery<br/>11 classes"]
    Model["Model Identity<br/>5 classes"]
    Sched["Scheduling<br/>10 classes"]

    Core ==> Event
    Core ==> Conv
    Core ==> Mem
    Core ==> Plan
    Core ==> Gov
    Core ==> Svc
    Core ==> Model
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
