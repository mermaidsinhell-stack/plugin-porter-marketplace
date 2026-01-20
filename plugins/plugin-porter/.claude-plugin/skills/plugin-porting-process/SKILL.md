---
skill: plugin-porting-process
description: Master SOP for converting Claude Code plugins to Qwen CLI architecture
version: 1.0.0
---

# Universal Plugin Porting SOP

This skill guides you through the complete process of converting a Claude Code plugin to Qwen CLI + MCP architecture.

## Phase 1: Repository Analysis

Use `porter_analyze_repo` to scan the target Claude plugin repository and classify files:

- **Brain (Skills)**: `.md` files in `skills/` folder → Move to `~/.qwen/skills/plugin-name/`
- **Role (Agents)**: `.md` files in `agents/` folder → Move to `~/.qwen/agents/`
- **Hands (Commands)**: `.md` files in `commands/` folder → Convert to MCP tools

## Phase 2: Identity Swap

For all Markdown files, perform these transformations using `porter_transform_markdown`:

1. **Replace all references:**
   - "Claude Code" → "Qwen CLI"
   - "Claude" → "Qwen"
   - `/claude/` paths → `/qwen/` paths
   - `CLAUDE_*` env vars → `QWEN_*` env vars

2. **Inject YAML frontmatter** (if missing):
   ```yaml
   ---
   skill: skill-name
   description: Brief description
   version: 1.0.0
   ---
   ```

## Phase 3: Schema Extraction

Use `porter_extract_schema` to convert command placeholders to JSON schemas:

**Claude Code patterns:**
- `<required_arg>` → Required parameter
- `[--optional-flag]` → Optional parameter
- `{choice1|choice2}` → Enum parameter

**Output:** Valid MCP `inputSchema` JSON

## Phase 4: Template Extraction

Use `porter_extract_templates` to:
1. Find embedded code/config templates in Markdown
2. Extract them to standalone files in `templates/`
3. Reference them from the MCP tool handler

## Phase 5: MCP Server Generation

Use `porter_generate_mcp` to create:

1. **`server.js`**: Universal MCP server with:
   - `@modelcontextprotocol/sdk` integration
   - `StdioServerTransport` for Qwen CLI
   - Auto-discovery of templates folder
   - Tool handlers for all extracted commands

2. **`package.json`**: Dependencies and configuration

3. **`.mcp.json`**: Qwen CLI server registration

## Phase 6: Validation

Verify the converted plugin:

1. **Structure check**: Skills/Agents/MCP folders exist
2. **YAML check**: All `.md` files have valid frontmatter
3. **Schema check**: All MCP tools have valid `inputSchema`
4. **Path check**: No broken references to Claude-specific paths
5. **Tool check**: All tools map correctly (see Tool Mapping Table)

## Tool Mapping Reference

| Claude Code Tool | Qwen Equivalent |
|-----------------|-----------------|
| `View` | `Read` |
| `str_replace_snippet` | `Edit` |
| `ls -R` | `Glob` |
| `grep` | `Grep` |

## Success Criteria

- ✅ All skills deployed to `~/.qwen/skills/`
- ✅ All agents deployed to `~/.qwen/agents/`
- ✅ MCP server running and registered
- ✅ No Claude-specific references remain
- ✅ All tools validate successfully
