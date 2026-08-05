import type { ToolDefinition } from '@/lib/mcp/types';

/**
 * The full tool catalog advertised by `tools/list` and dispatched by
 * `tools/call`. Kept separate from the route handler so discovery and
 * execution read from one source of truth.
 */

const CHROME_FETCH_HEADLINE: ToolDefinition = {
  name: 'chrome_fetch_headline',
  description:
    'Boots a serverless headless Chromium instance, loads the given URL, and returns the page title and headline. Used to demonstrate the MCP tools/list -> tools/call lifecycle.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Absolute http(s) URL of the page to scrape.' },
    },
    required: ['url'],
  },
};

const READ_LOCAL_FILE: ToolDefinition = {
  name: 'read_local_file',
  description:
    'Reads a UTF-8 text file from the local file system and returns its content plus metadata (size, resolved path). Restricted to the configured allowed root directory.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to the allowed root, e.g. "data/notes.txt".' },
    },
    required: ['path'],
  },
};

const WRITE_LOCAL_FILE: ToolDefinition = {
  name: 'write_local_file',
  description:
    'Writes UTF-8 text to a local file, creating any missing parent directories. Restricted to the configured allowed root directory.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Destination path relative to the allowed root, e.g. "data/notes.txt".' },
      content: { type: 'string', description: 'UTF-8 text to save.' },
    },
    required: ['path', 'content'],
  },
};

const LIST_LOCAL_DIR: ToolDefinition = {
  name: 'list_local_dir',
  description:
    'Lists the entries (files and directories) inside a local folder, sorted by name. Restricted to the configured allowed root directory.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Folder path relative to the allowed root, e.g. "." or "data".' },
    },
    required: ['path'],
  },
};

const READ_SYSTEM_FILE: ToolDefinition = {
  name: 'read_system_file',
  description:
    'Reads a UTF-8 text file from the HOST system (outside the project sandbox) and returns its content plus size. Restricted to the configured system root (MCP_SYSTEM_ROOT, default "/").',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to the system root, e.g. "180dc/vit materials/notes.txt" or "/etc/hostname".' },
    },
    required: ['path'],
  },
};

const WRITE_SYSTEM_FILE: ToolDefinition = {
  name: 'write_system_file',
  description:
    'Writes UTF-8 text to a file on the HOST system, creating any missing parent directories. Restricted to the configured system root (MCP_SYSTEM_ROOT, default "/").',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Destination path relative to the system root, e.g. "180dc/vit materials/notes.txt".' },
      content: { type: 'string', description: 'UTF-8 text to save.' },
    },
    required: ['path', 'content'],
  },
};

const LIST_SYSTEM_DIR: ToolDefinition = {
  name: 'list_system_dir',
  description:
    'Lists the entries (files and directories) inside a folder on the HOST system, sorted by name. Restricted to the configured system root (MCP_SYSTEM_ROOT, default "/").',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Folder path relative to the system root, e.g. "." or "180dc".' },
    },
    required: ['path'],
  },
};

const READ_PDF_FILE: ToolDefinition = {
  name: 'read_pdf_file',
  description:
    'Parses a PDF from the HOST system and returns its extracted text plus metadata (page count, title, author, creator, producer). Restricted to the configured system root (MCP_SYSTEM_ROOT, default "/").',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'PDF path relative to the system root, e.g. "180dc/vit materials/materials-guide.pdf".' },
    },
    required: ['path'],
  },
};

export const TOOL_CATALOG: ToolDefinition[] = [
  CHROME_FETCH_HEADLINE,
  READ_LOCAL_FILE,
  WRITE_LOCAL_FILE,
  LIST_LOCAL_DIR,
  READ_SYSTEM_FILE,
  WRITE_SYSTEM_FILE,
  LIST_SYSTEM_DIR,
  READ_PDF_FILE,
];

export function findTool(name: string): ToolDefinition | undefined {
  return TOOL_CATALOG.find((tool) => tool.name === name);
}
