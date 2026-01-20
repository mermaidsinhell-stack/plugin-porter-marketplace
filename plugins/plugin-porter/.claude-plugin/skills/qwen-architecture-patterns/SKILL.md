---
skill: qwen-architecture-patterns
description: Guide to Qwen CLI's 3-layer architecture (Skills/Agents/MCP)
version: 1.0.0
---

# Qwen CLI Architecture Patterns

This skill explains the 3-layer architecture that Qwen CLI uses for plugins.

## The 3-Layer Architecture

```
Layer 1: Skills (The Brain)
    ↓ invoked by
Layer 2: Agents (The Role)
    ↓ uses
Layer 3: MCP Tools (The Hands)
```

## Layer 1: Skills (Knowledge)

**Location:** `~/.qwen/skills/plugin-name/`

**Purpose:** Reusable knowledge modules that can be invoked by any agent.

**Structure:**
```
~/.qwen/skills/
  └── plugin-name/
      ├── skill-1.md
      ├── skill-2.md
      └── skill-3.md
```

**YAML Frontmatter (Required):**
```yaml
---
skill: skill-name
description: Brief description of what this skill does
version: 1.0.0
tags: [optional, tags, here]
---
```

**Content:** Pure instruction sets, SOPs, reference tables, or knowledge bases.

## Layer 2: Agents (Personas)

**Location:** `~/.qwen/agents/`

**Purpose:** Role-based personas that combine multiple skills and tools.

**Structure:**
```
~/.qwen/agents/
  └── agent-name.md
```

**YAML Frontmatter (Required):**
```yaml
---
agent: agent-name
description: What this agent specializes in
skills:
  - skill-1
  - skill-2
  - skill-3
tools:
  - Bash
  - Read
  - Write
  - mcp__server-name__tool-name
persona: Brief personality/approach description
---
```

**Content:** Agent-specific instructions, workflows, and behavioral guidelines.

## Layer 3: MCP Tools (Actions)

**Location:** Custom MCP server with `StdioServerTransport`

**Purpose:** Executable tools that perform specific actions.

**Server Structure:**
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'plugin-name',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tool_name',
      description: 'What this tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'Parameter description' }
        },
        required: ['param1']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Tool implementation
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Registration (`.mcp.json`):**
```json
{
  "mcpServers": {
    "plugin-name": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

## Conversion Mapping

| Claude Code Component | Qwen Equivalent |
|-----------------------|-----------------|
| `skills/*.md` | `~/.qwen/skills/plugin-name/*.md` |
| `agents/*.md` | `~/.qwen/agents/*.md` |
| `commands/*.md` | MCP tools in `server.js` |
| `plugin.json` | `package.json` + `.mcp.json` |

## Best Practices

1. **Skills should be atomic:** One concept per skill file
2. **Agents should be specialized:** Clear persona and purpose
3. **MCP tools should be stateless:** No side effects beyond their purpose
4. **Use YAML frontmatter consistently:** All files must have it
5. **Follow naming conventions:** kebab-case for everything

## Example: Converting a Claude Command to MCP Tool

**Claude Code (`commands/analyze.md`):**
```markdown
---
command: /analyze
description: Analyze code quality
---

Analyze the code at <file_path> and report issues.
```

**Qwen MCP Tool:**
```javascript
{
  name: 'analyze_code',
  description: 'Analyze code quality',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Path to file' }
    },
    required: ['file_path']
  }
}
```
