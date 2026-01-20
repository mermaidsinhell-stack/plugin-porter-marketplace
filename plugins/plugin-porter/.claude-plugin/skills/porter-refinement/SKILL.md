---
skill: porter-refinement
description: Troubleshooting guide for plugin porting with tool mapping and path fixes
version: 1.0.0
---

# Porter Refinement Guide

This skill helps you troubleshoot and refine converted plugins.

## Common Issues & Fixes

### Issue 1: Broken Tool References

**Symptom:** Agent tries to use Claude-specific tools that don't exist in Qwen.

**Fix:** Use the Tool Mapping Table below.

### Tool Mapping Table

| Claude Code Tool | Qwen Equivalent | Notes |
|-----------------|-----------------|-------|
| `View` | `Read` | Direct replacement |
| `str_replace_snippet` | `Edit` | Parameters may differ slightly |
| `ls -R` | `Glob` | Use glob patterns instead |
| `grep` | `Grep` | Case-sensitive by default |
| `Write` | `Write` | Same in both systems |
| `Bash` | `Bash` | Same in both systems |
| `Task` (with agents) | Launch agent directly | Qwen has native agent support |

### Issue 2: Broken Path References

**Symptom:** Files reference `~/.claude/` paths or `CLAUDE_*` environment variables.

**Find & Replace:**
```bash
# Paths
~/.claude/ → ~/.qwen/
$CLAUDE_HOME → $QWEN_HOME
/claude/ → /qwen/

# Environment Variables
CLAUDE_API_KEY → QWEN_API_KEY
CLAUDE_PLUGIN_ROOT → QWEN_PLUGIN_ROOT
CLAUDE_CONFIG → QWEN_CONFIG
```

### Issue 3: Invalid YAML Frontmatter

**Symptom:** Skill or agent file won't load.

**Checklist:**
- ✅ Three dashes at start and end (`---`)
- ✅ No tabs (use spaces for indentation)
- ✅ Required fields present:
  - Skills: `skill`, `description`, `version`
  - Agents: `agent`, `description`, `skills`, `tools`
- ✅ Arrays use proper YAML syntax:
  ```yaml
  skills:
    - skill-1
    - skill-2
  ```

### Issue 4: Tool Collisions

**Symptom:** MCP tool name conflicts with built-in Qwen tool.

**Fix:** Prefix with plugin name:
```javascript
// Bad
{ name: 'analyze' }

// Good
{ name: 'plugin_name_analyze' }
```

### Issue 5: Template Paths Not Resolving

**Symptom:** MCP tool can't find template files.

**Fix:** Use absolute paths in MCP server:
```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatePath = join(__dirname, 'templates', 'template-name.txt');
```

### Issue 6: Command Arguments Not Converting

**Symptom:** Required/optional parameters not properly detected.

**Claude Code Patterns:**
- `<required>` → Required parameter
- `[--optional]` → Optional parameter
- `{choice1|choice2}` → Enum parameter
- `<file_path>` → String parameter named `file_path`
- `[--format json|yaml]` → Optional enum

**MCP Schema Equivalents:**
```javascript
// <required_arg>
{
  type: 'object',
  properties: {
    required_arg: { type: 'string', description: '...' }
  },
  required: ['required_arg']
}

// [--optional]
{
  type: 'object',
  properties: {
    optional: { type: 'boolean', description: '...' }
  }
}

// {choice1|choice2}
{
  type: 'object',
  properties: {
    choice: {
      type: 'string',
      enum: ['choice1', 'choice2'],
      description: '...'
    }
  },
  required: ['choice']
}
```

## Validation Checklist

Before marking a conversion complete:

### File Structure
- [ ] All skills in `~/.qwen/skills/plugin-name/`
- [ ] All agents in `~/.qwen/agents/`
- [ ] MCP server files in plugin directory
- [ ] Templates extracted to `templates/` folder

### Content Quality
- [ ] All `.md` files have YAML frontmatter
- [ ] No "Claude Code" references remain
- [ ] No "Claude" (standalone) references remain
- [ ] All paths updated to Qwen equivalents
- [ ] All env vars updated to `QWEN_*`

### Tool Configuration
- [ ] All MCP tools have valid `inputSchema`
- [ ] Tool names don't conflict with built-ins
- [ ] All Claude tools mapped to Qwen equivalents
- [ ] `.mcp.json` properly configured

### Testing
- [ ] MCP server starts without errors
- [ ] All tools listed in `qwen mcp list-tools`
- [ ] Skills load without YAML errors
- [ ] Agents can be invoked successfully

## Emergency Rollback

If conversion fails catastrophically:

1. Keep original Claude plugin untouched
2. Work in a separate directory
3. Test incrementally (one skill/agent at a time)
4. Validate each layer before proceeding to next

## Tips for Success

1. **Start small:** Convert one skill first, validate, then proceed
2. **Test frequently:** Don't convert everything then test
3. **Keep mappings handy:** Reference the Tool Mapping Table constantly
4. **Validate YAML:** Use online YAML validators if uncertain
5. **Read error messages:** Qwen's error messages are usually accurate
