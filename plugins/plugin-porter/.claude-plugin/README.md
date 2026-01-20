# Plugin Porter

Automated conversion of Claude Code plugins to Qwen CLI + MCP architecture.

## What It Does

Plugin Porter transforms Claude Code plugins into Qwen CLI's 3-layer architecture:

1. **Skills (Brain)**: Knowledge modules → `~/.qwen/skills/`
2. **Agents (Role)**: Specialized personas → `~/.qwen/agents/`
3. **MCP Tools (Hands)**: Executable actions → MCP server

## Components

### Skills
- `plugin-porting-process`: Master SOP for conversion workflow
- `qwen-architecture-patterns`: Guide to Qwen's 3-layer architecture
- `porter-refinement`: Troubleshooting and tool mapping reference

### Agent
- `plugin-porter`: Systems architect specialized in plugin migration

### Command
- `/convert <repo_path>`: Convert a Claude Code plugin repository

### MCP Tools
- `porter_analyze_repo`: Scan and classify repository files
- `porter_transform_markdown`: Perform identity swaps and inject YAML frontmatter
- `porter_extract_schema`: Convert command placeholders to JSON schemas
- `porter_extract_templates`: Extract embedded templates
- `porter_generate_mcp`: Generate MCP server boilerplate

## Usage

```bash
# Convert a Claude Code plugin
/convert ~/path/to/claude-plugin

# Or use the agent directly
@plugin-porter please convert the plugin at ~/path/to/claude-plugin
```

## Installation

This plugin is part of the plugin-porter-marketplace. It will be automatically installed when you add the marketplace to Claude Code.

## Requirements

- Node.js (for MCP server generation)
- Write access to `~/.qwen/` directories
- Valid Claude Code plugin as input

## Output Structure

Converted plugins are organized as:

```
~/.qwen/
├── skills/
│   └── plugin-name/
│       ├── skill-1.md
│       └── skill-2.md
├── agents/
│   └── agent-name.md
└── mcp-servers/
    └── plugin-name/
        ├── server.js
        ├── package.json
        └── .mcp.json
```

## Validation

The conversion process includes automatic validation:

- ✅ YAML frontmatter syntax
- ✅ No Claude-specific references
- ✅ Correct tool mappings
- ✅ Valid MCP schemas
- ✅ Proper file structure

## Troubleshooting

See the `porter-refinement` skill for:
- Tool mapping table
- Common issues and fixes
- Path reference updates
- YAML validation tips

## License

MIT
