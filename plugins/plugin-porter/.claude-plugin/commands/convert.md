---
command: /convert
description: Convert a Claude Code plugin to Qwen CLI architecture
arguments:
  - name: repo_path
    description: Path to the Claude Code plugin repository
    required: true
---

Convert a Claude Code plugin to Qwen CLI's 3-layer architecture (Skills/Agents/MCP).

## Usage

```
/convert <repo_path>
```

## What This Does

This command launches the **plugin-porter** agent to perform a complete conversion:

1. **Analyze**: Scan the repository and classify files
2. **Transform**: Convert Claude → Qwen identity references
3. **Extract**: Create MCP schemas from command definitions
4. **Generate**: Build MCP server infrastructure
5. **Validate**: Ensure everything works correctly

## Example

```
/convert ~/Downloads/awesome-claude-plugin
```

## Output

The converted plugin will be created in:
- Skills: `~/.qwen/skills/plugin-name/`
- Agents: `~/.qwen/agents/`
- MCP Server: `~/.qwen/mcp-servers/plugin-name/`

## Notes

- The original Claude plugin is never modified
- You'll be asked to confirm before major operations
- A validation report is generated at the end
- Installation instructions are provided

## Requirements

- Source plugin must be a valid Claude Code plugin
- You must have write access to `~/.qwen/` directories
- Node.js must be installed for MCP server generation
