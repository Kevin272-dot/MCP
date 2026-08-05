/**
 * Minimal JSON-RPC 2.0 wire types — the exact subset MCP is built on.
 *
 * MCP (Model Context Protocol) is literally "JSON-RPC 2.0 plus a well-known
 * method vocabulary". Every exchange is a request/notification carrying:
 *
 *   { "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {} }
 *
 * and the server answers with `result` (or `error`). We only need the tiny
 * subset below for the `tools/list` + `tools/call` live demo.
 */

/** A request/notification that the client sends over the wire. */
export interface McpRequest {
  jsonrpc: '2.0';
  /** Requests carry an id; notifications may omit it. */
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface McpErrorShape {
  code: number;
  message: string;
  data?: unknown;
}

/** Every server reply is one of these: a `result` OR an `error`. */
export interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: T;
  error?: McpErrorShape;
}

/** One advertised capability in the `tools/list` result. */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema draft-07 object that describes the tool's arguments. */
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

/** `tools/list` -> `result` */
export interface ToolsListResult {
  tools: ToolDefinition[];
}

/** `tools/call` -> `params` */
export interface ToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/** `tools/call` -> `result` — MCP returns content blocks, we only emit text. */
export interface ToolsCallResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** `initialize` -> `result` */
export interface InitializeResult {
  protocolVersion: string;
  capabilities: { tools: { listChanged: boolean } };
  serverInfo: { name: string; version: string };
}

/** JSON-RPC error codes we actually emit (subset of the spec). */
export const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // MCP/application-level tool failure
  TOOL_EXECUTION_ERROR: -32000,
} as const;
