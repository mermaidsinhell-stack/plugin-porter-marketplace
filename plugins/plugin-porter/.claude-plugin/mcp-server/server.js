#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
  {
    name: 'plugin-porter',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Definitions
const TOOLS = [
  {
    name: 'porter_analyze_repo',
    description: 'Scan a Claude Code plugin repository and classify files into Brain (Skills), Role (Agents), and Hands (Commands)',
    inputSchema: {
      type: 'object',
      properties: {
        repo_path: {
          type: 'string',
          description: 'Path to the Claude Code plugin repository',
        },
      },
      required: ['repo_path'],
    },
  },
  {
    name: 'porter_transform_markdown',
    description: 'Perform identity swap (Claude → Qwen) and inject YAML frontmatter into Markdown files',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the Markdown file to transform',
        },
        file_type: {
          type: 'string',
          enum: ['skill', 'agent'],
          description: 'Type of file being transformed (determines frontmatter structure)',
        },
      },
      required: ['file_path', 'file_type'],
    },
  },
  {
    name: 'porter_extract_schema',
    description: 'Extract JSON schema from Claude Code command placeholders (<required>, [--optional], {enum|values})',
    inputSchema: {
      type: 'object',
      properties: {
        command_file: {
          type: 'string',
          description: 'Path to the Claude Code command .md file',
        },
      },
      required: ['command_file'],
    },
  },
  {
    name: 'porter_extract_templates',
    description: 'Extract embedded templates from Markdown and save as standalone files',
    inputSchema: {
      type: 'object',
      properties: {
        source_file: {
          type: 'string',
          description: 'Path to file containing embedded templates',
        },
        output_dir: {
          type: 'string',
          description: 'Directory to save extracted templates',
        },
      },
      required: ['source_file', 'output_dir'],
    },
  },
  {
    name: 'porter_generate_mcp',
    description: 'Generate MCP server boilerplate (server.js, package.json, .mcp.json) from extracted schemas',
    inputSchema: {
      type: 'object',
      properties: {
        plugin_name: {
          type: 'string',
          description: 'Name of the plugin being converted',
        },
        tools: {
          type: 'array',
          description: 'Array of tool definitions extracted from commands',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              inputSchema: { type: 'object' },
            },
          },
        },
        output_dir: {
          type: 'string',
          description: 'Directory to write MCP server files',
        },
      },
      required: ['plugin_name', 'tools', 'output_dir'],
    },
  },
];

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'porter_analyze_repo':
        return await analyzeRepo(args.repo_path);

      case 'porter_transform_markdown':
        return await transformMarkdown(args.file_path, args.file_type);

      case 'porter_extract_schema':
        return await extractSchema(args.command_file);

      case 'porter_extract_templates':
        return await extractTemplates(args.source_file, args.output_dir);

      case 'porter_generate_mcp':
        return await generateMCP(args.plugin_name, args.tools, args.output_dir);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool Implementations

async function analyzeRepo(repoPath) {
  const analysis = {
    skills: [],
    agents: [],
    commands: [],
    other: [],
  };

  async function scanDir(dir, category = null) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          let newCategory = category;
          if (entry.name === 'skills') newCategory = 'skills';
          else if (entry.name === 'agents') newCategory = 'agents';
          else if (entry.name === 'commands') newCategory = 'commands';

          await scanDir(fullPath, newCategory);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          if (category) {
            analysis[category].push(fullPath);
          } else {
            analysis.other.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or isn't readable
    }
  }

  await scanDir(repoPath);

  const summary = `Repository Analysis Complete:
- Skills (Brain): ${analysis.skills.length} files
- Agents (Role): ${analysis.agents.length} files
- Commands (Hands): ${analysis.commands.length} files
- Other: ${analysis.other.length} files

Files found:
${JSON.stringify(analysis, null, 2)}`;

  return {
    content: [{ type: 'text', text: summary }],
  };
}

async function transformMarkdown(filePath, fileType) {
  let content = await fs.readFile(filePath, 'utf-8');

  // Identity swap
  content = content.replace(/Claude Code/g, 'Qwen CLI');
  content = content.replace(/\bClaude\b/g, 'Qwen');
  content = content.replace(/\/claude\//g, '/qwen/');
  content = content.replace(/\.claude\//g, '.qwen/');
  content = content.replace(/CLAUDE_/g, 'QWEN_');
  content = content.replace(/\$CLAUDE/g, '$QWEN');

  // Check if frontmatter exists
  const hasFrontmatter = content.startsWith('---');

  if (!hasFrontmatter) {
    const fileName = path.basename(filePath, '.md');
    let frontmatter = '';

    if (fileType === 'skill') {
      frontmatter = `---
skill: ${fileName}
description: Converted from Claude Code plugin
version: 1.0.0
---

`;
    } else if (fileType === 'agent') {
      frontmatter = `---
agent: ${fileName}
description: Converted from Claude Code plugin
skills: []
tools: []
version: 1.0.0
---

`;
    }

    content = frontmatter + content;
  }

  // Write back
  await fs.writeFile(filePath, content, 'utf-8');

  return {
    content: [
      {
        type: 'text',
        text: `Transformed ${filePath}:\n- Identity swapped (Claude → Qwen)\n- YAML frontmatter ${hasFrontmatter ? 'preserved' : 'injected'}`,
      },
    ],
  };
}

async function extractSchema(commandFile) {
  const content = await fs.readFile(commandFile, 'utf-8');

  const schema = {
    type: 'object',
    properties: {},
    required: [],
  };

  // Extract <required> placeholders
  const requiredMatches = content.matchAll(/<(\w+)>/g);
  for (const match of requiredMatches) {
    const paramName = match[1];
    schema.properties[paramName] = {
      type: 'string',
      description: `${paramName} parameter`,
    };
    schema.required.push(paramName);
  }

  // Extract [--optional] flags
  const optionalMatches = content.matchAll(/\[--(\w+)\]/g);
  for (const match of optionalMatches) {
    const paramName = match[1];
    schema.properties[paramName] = {
      type: 'boolean',
      description: `${paramName} flag`,
    };
  }

  // Extract {choice1|choice2} enums
  const enumMatches = content.matchAll(/\{([^}]+)\}/g);
  for (const match of enumMatches) {
    const choices = match[1].split('|');
    const paramName = 'choice'; // Could be improved with better naming
    schema.properties[paramName] = {
      type: 'string',
      enum: choices,
      description: `Choose from: ${choices.join(', ')}`,
    };
    schema.required.push(paramName);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Extracted schema from ${commandFile}:\n${JSON.stringify(schema, null, 2)}`,
      },
    ],
  };
}

async function extractTemplates(sourceFile, outputDir) {
  const content = await fs.readFile(sourceFile, 'utf-8');
  const templates = [];

  // Find code blocks with template markers
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'txt';
    const templateContent = match[2];

    const templateName = `template-${index}.${language}`;
    const templatePath = path.join(outputDir, templateName);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(templatePath, templateContent, 'utf-8');

    templates.push(templateName);
    index++;
  }

  return {
    content: [
      {
        type: 'text',
        text: `Extracted ${templates.length} templates to ${outputDir}:\n${templates.join('\n')}`,
      },
    ],
  };
}

async function generateMCP(pluginName, tools, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate server.js
  const serverTemplate = `#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: '${pluginName}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS = ${JSON.stringify(tools, null, 2)};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // TODO: Implement tool handlers
  return {
    content: [
      {
        type: 'text',
        text: \`Tool \${name} called with args: \${JSON.stringify(args)}\`,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;

  await fs.writeFile(path.join(outputDir, 'server.js'), serverTemplate);

  // Generate package.json
  const packageJson = {
    name: pluginName,
    version: '1.0.0',
    type: 'module',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.4',
    },
  };

  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Generate .mcp.json
  const mcpConfig = {
    mcpServers: {
      [pluginName]: {
        command: 'node',
        args: [path.join(outputDir, 'server.js')],
      },
    },
  };

  await fs.writeFile(
    path.join(outputDir, '.mcp.json'),
    JSON.stringify(mcpConfig, null, 2)
  );

  return {
    content: [
      {
        type: 'text',
        text: `Generated MCP server for ${pluginName} in ${outputDir}:\n- server.js\n- package.json\n- .mcp.json\n\nNext steps:\n1. cd ${outputDir}\n2. npm install\n3. Test with: node server.js`,
      },
    ],
  };
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
