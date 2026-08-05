import { broadcast } from '@/lib/mcp/events';
import { fetchHeadline } from '@/lib/mcp/chrome';
import { getAllowedRoot, listLocalDir, readLocalFile, writeLocalFile } from '@/lib/mcp/fs';
import {
  getSystemRoot,
  listSystemDir,
  readPdfFile,
  readSystemFile,
  SystemFileError,
  writeSystemFile,
} from '@/lib/mcp/system';
import { findTool, TOOL_CATALOG } from '@/lib/mcp/tools';
import {
  ERROR_CODES,
  type InitializeResult,
  type McpRequest,
  type McpResponse,
  type ToolCallParams,
  type ToolsCallResult,
  type ToolsListResult,
} from '@/lib/mcp/types';

/**
 * The MCP server — implemented as a single stateless App Router route handler.
 *
 * Protocol flow (mirrored live on /dashboard via the SSE event stream):
 *
 *   A_B  Request Received    POST to /api/mcp — JSON-RPC envelope parsed.
 *   B_C  MCP Routing         method dispatched (tools/list / tools/call).
 *   C_D  Next.js Worker      tool handler validates + executes the tool.
 *   D_E  Headless Chrome     scraper path: navigates, extracts, tears down.
 *   E_A  Complete            result wrapped in the MCP response and returned.
 *
 * Local file system tools (read_local_file / write_local_file / list_local_dir)
 * execute entirely on stage C_D — no headless Chrome is spawned — so they light
 * up node C ("Next.js Worker") and stream edge B->C, then finish on E_A.
 *
 * The handler is deliberately stateless: every request parses its own payload
 * and resolves in isolation, so cold starts are trivial to explain on stage.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel: allow the browser a little longer than the default 10s ceiling.
export const maxDuration = 60;

// The name/version a real MCP client sees in the `initialize` handshake.
const SERVER_INFO = { name: 'mcp-understanding-demo', version: '1.0.0' };

// MCP protocol version this server implements.
const PROTOCOL_VERSION = '2025-06-18';

// Browser-based MCP inspectors hit this from a different origin — keep CORS open.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

function json<T>(id: string | number | null, result: T): Response {
  const body: McpResponse<T> = { jsonrpc: '2.0', id, result };
  return Response.json(body, { status: 200, headers: JSON_HEADERS });
}

function jsonError(
  id: string | number | null,
  code: number,
  message: string,
  status = 200,
  data?: unknown,
): Response {
  const body: McpResponse = { jsonrpc: '2.0', id, error: { code, message, data } };
  return Response.json(body, { status, headers: JSON_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  // STEP A — read the raw body so "raw JSON payloads" are handled verbatim.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError(null, ERROR_CODES.PARSE_ERROR, 'Parse error: request body could not be read.', 400);
  }

  let message: McpRequest;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as McpRequest).jsonrpc !== '2.0' ||
      typeof (parsed as McpRequest).method !== 'string'
    ) {
      throw new Error('not a JSON-RPC 2.0 request');
    }
    message = parsed as McpRequest;
  } catch {
    return jsonError(null, ERROR_CODES.PARSE_ERROR, 'Parse error: body must be a JSON-RPC 2.0 request object.', 400);
  }

  const id = message.id ?? null;
  // The tool is only known before dispatch when the client already named it.
  const requestedTool =
    message.method === 'tools/call'
      ? ((message.params as ToolCallParams | undefined)?.name ?? 'chrome_fetch_headline')
      : message.method;

  // A -> B — the client's JSON-RPC envelope just landed on the server.
  broadcast('A_B', 'REQUEST_RECEIVED', `POST to /api/mcp — method "${message.method}"`, {
    level: 'info',
    tool: requestedTool,
    route: '/api/mcp',
    meta: { method: message.method, id },
  });

  switch (message.method) {
    // Standard MCP handshake: capability negotiation before any tool use.
    case 'initialize': {
      broadcast('B_C', 'DISCOVERING_HANDLER', 'initialize handshake — negotiating protocol capabilities', {
        route: '/api/mcp',
      });
      const result: InitializeResult = {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      };
      broadcast('E_A', 'PAYLOAD_FORMATTED', 'Returning initialize JSON-RPC result', {
        level: 'ok',
        status: 'success',
        result,
      });
      return json(id, result);
    }

    // Liveness check used by clients/health probes.
    case 'ping': {
      broadcast('B_C', 'DISCOVERING_HANDLER', 'ping — liveness probe', { route: '/api/mcp' });
      broadcast('E_A', 'PAYLOAD_FORMATTED', 'Returning pong', { level: 'ok', status: 'success' });
      return json(id, {});
    }

    // Discovery: "what can you do?" -> return the tool catalog.
    case 'tools/list': {
      broadcast('B_C', 'DISCOVERING_HANDLER', 'Routing to Discovery Handler — returning tool catalog', {
        route: '/api/mcp',
      });
      const result: ToolsListResult = { tools: TOOL_CATALOG };
      broadcast('E_A', 'PAYLOAD_FORMATTED', 'Returning tools/list JSON-RPC result', {
        level: 'ok',
        status: 'success',
        result,
      });
      return json(id, result);
    }

    // Execution: "do this thing" -> dispatch to the tool implementation.
    case 'tools/call': {
      const params = (message.params ?? {}) as ToolCallParams;

      const tool = findTool(params.name);
      if (!tool) {
        broadcast('B_C', 'DISCOVERING_HANDLER', `Unknown tool "${params.name}" requested`, {
          level: 'error',
          route: '/api/mcp',
        });
        broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
        return jsonError(id, ERROR_CODES.INVALID_PARAMS, `Unknown tool: "${params.name}".`, 200);
      }

      // B -> C — the router hands the validated call to the tool registry.
      broadcast('B_C', 'DISCOVERING_HANDLER', `Routing to Tool Registry — ${tool.name}`, { route: '/api/mcp' });

      if (tool.name === 'chrome_fetch_headline') {
        return handleChromeFetchHeadline(id, params);
      }
      if (SYSTEM_TOOLS.has(tool.name)) {
        return handleSystemTools(id, params);
      }
      return handleLocalFileSystem(id, params);
    }

    default: {
      broadcast('B_C', 'DISCOVERING_HANDLER', `No handler for method "${message.method}"`, {
        level: 'error',
        route: '/api/mcp',
      });
      broadcast('E_A', 'REQUEST_FAILED', 'Returning method-not-found error', { level: 'error', status: 'error' });
      return jsonError(id, ERROR_CODES.METHOD_NOT_FOUND, `Method not found: "${message.method}".`, 200);
    }
  }
}

/** Scraper tool: boots headless Chromium on stage C->D->E. */
async function handleChromeFetchHeadline(id: string | number | null, params: ToolCallParams): Promise<Response> {  const tool = 'chrome_fetch_headline';
  const url = typeof params.arguments?.url === 'string' ? params.arguments.url.trim() : '';
  if (!url) {
    broadcast('C_D', 'WORKER_EXECUTING', 'Validation failed — missing required "url" argument', { level: 'error' });
    broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
    return jsonError(id, ERROR_CODES.INVALID_PARAMS, 'Missing required argument "url".', 200);
  }

  // C -> D — the Next.js worker is about to start the scraping engine.
  broadcast('C_D', 'WORKER_EXECUTING', 'Spawning Headless Chrome process', { tool, url });

  try {
    // D -> E — headless Chromium does the work, then formats the payload.
    broadcast('D_E', 'SCRAPER_EXECUTING', 'Scraping target URL and formatting payload', { tool, url });
    const scraped = await fetchHeadline(url, (detail, meta) =>
      broadcast('D_E', 'SCRAPER_EXECUTING', detail, { tool, url, meta }),
    );

    const result: ToolsCallResult = {
      content: [{ type: 'text', text: JSON.stringify(scraped) }],
      isError: false,
    };
    broadcast('E_A', 'PAYLOAD_FORMATTED', 'Returning JSON-RPC response with scraped payload', {
      level: 'ok',
      status: 'success',
      tool,
      url,
      result: scraped,
    });
    return json(id, result);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown scraping error.';
    broadcast('E_A', 'SCRAPER_FAILED', `Scraping failed — ${messageText}`, {
      level: 'error',
      status: 'error',
      tool,
      url,
    });
    return jsonError(id, ERROR_CODES.TOOL_EXECUTION_ERROR, `chrome_fetch_headline failed: ${messageText}`, 200);
  }
}

/** Local file system tools: read / write / list — execute entirely on stage C. */
async function handleLocalFileSystem(id: string | number | null, params: ToolCallParams): Promise<Response> {
  const { name } = params;
  const args = (params.arguments ?? {}) as Record<string, unknown>;
  const rawPath = typeof args.path === 'string' ? args.path.trim() : '';

  if (!rawPath) {
    broadcast('C_D', 'TOOL_EXECUTING', 'Validation failed — missing required "path" argument', { level: 'error' });
    broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
    return jsonError(id, ERROR_CODES.INVALID_PARAMS, 'Missing required argument "path".', 200);
  }

  if (name === 'write_local_file' && typeof args.content !== 'string') {
    broadcast('C_D', 'TOOL_EXECUTING', 'Validation failed — missing required "content" argument', {
      level: 'error',
    });
    broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
    return jsonError(id, ERROR_CODES.INVALID_PARAMS, 'Missing required argument "content".', 200);
  }

  const root = await getAllowedRoot();
  // C -> E — the Next.js worker performs the file operation directly.
  broadcast('C_D', 'TOOL_EXECUTING', `Executing ${name} via the local file system bridge`, {
    tool: name,
    meta: { path: rawPath, root },
  });

  try {
    let data: unknown;
    if (name === 'read_local_file') {
      data = await readLocalFile({ path: rawPath });
    } else if (name === 'list_local_dir') {
      data = await listLocalDir({ path: rawPath });
    } else {
      data = await writeLocalFile({ path: rawPath, content: String(args.content) });
    }

    const result: ToolsCallResult = {
      content: [{ type: 'text', text: JSON.stringify(data) }],
      isError: false,
    };
    broadcast('E_A', 'PAYLOAD_FORMATTED', `Returning JSON-RPC response from ${name}`, {
      level: 'ok',
      status: 'success',
      tool: name,
      meta: { path: rawPath },
      result: data,
    });
    return json(id, result);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown file system error.';
    broadcast('E_A', 'TOOL_FAILED', `${name} failed — ${messageText}`, {
      level: 'error',
      status: 'error',
      tool: name,
      meta: { path: rawPath },
    });
    return jsonError(id, ERROR_CODES.TOOL_EXECUTION_ERROR, `${name} failed: ${messageText}`, 200);
  }
}

// Tools that reach OUTSIDE the project sandbox onto the host file system.
const SYSTEM_TOOLS: ReadonlySet<string> = new Set([
  'read_system_file',
  'write_system_file',
  'list_system_dir',
  'read_pdf_file',
]);

/**
 * Host system tools: read / write / list on the host file system plus PDF
 * parsing — execute entirely on stage C and stream SYSTEM_* events so the
 * dashboard lights up the engine node (C) instead of the scraper (D).
 */
async function handleSystemTools(id: string | number | null, params: ToolCallParams): Promise<Response> {
  const { name } = params;
  const args = (params.arguments ?? {}) as Record<string, unknown>;
  const rawPath = typeof args.path === 'string' ? args.path.trim() : '';
  const root = getSystemRoot();
  const isPdf = name === 'read_pdf_file';
  const isWrite = name === 'write_system_file';

  if (!rawPath) {
    broadcast('C_D', 'TOOL_EXECUTING', 'Validation failed — missing required "path" argument', { level: 'error' });
    broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
    return jsonError(id, ERROR_CODES.INVALID_PARAMS, 'Missing required argument "path".', 200);
  }
  if (isWrite && typeof args.content !== 'string') {
    broadcast('C_D', 'TOOL_EXECUTING', 'Validation failed — missing required "content" argument', {
      level: 'error',
    });
    broadcast('E_A', 'REQUEST_FAILED', 'Returning invalid-params error', { level: 'error', status: 'error' });
    return jsonError(id, ERROR_CODES.INVALID_PARAMS, 'Missing required argument "content".', 200);
  }

  broadcast(
    'C_D',
    isPdf ? 'SYSTEM_PDF_READ_START' : 'SYSTEM_READ_START',
    isPdf ? 'Parsing PDF from the host file system' : `Executing ${name} on the host file system`,
    { tool: name, meta: { path: rawPath, root } },
  );

  try {
    let data: unknown;
    if (name === 'read_system_file') {
      data = await readSystemFile({ path: rawPath });
    } else if (name === 'list_system_dir') {
      data = await listSystemDir({ path: rawPath });
    } else if (isPdf) {
      data = await readPdfFile({ path: rawPath });
    } else {
      data = await writeSystemFile({ path: rawPath, content: String(args.content) });
    }

    if (isPdf) {
      const pdf = data as { pages: number; title: string | null };
      broadcast('C_D', 'SYSTEM_PDF_READ_COMPLETE', `Extracted ${pdf.pages} page(s) from PDF`, {
        level: 'ok',
        tool: name,
        status: 'success',
        meta: { path: rawPath, pages: pdf.pages, title: pdf.title },
      });
    } else if (!isWrite) {
      broadcast('C_D', 'SYSTEM_FILE_LOADED', 'Host file system operation completed', {
        level: 'ok',
        tool: name,
        status: 'success',
        meta: { path: rawPath },
      });
    }

    const result: ToolsCallResult = {
      content: [{ type: 'text', text: JSON.stringify(data) }],
      isError: false,
    };
    broadcast('E_A', 'PAYLOAD_FORMATTED', `Returning JSON-RPC response from ${name}`, {
      level: 'ok',
      status: 'success',
      tool: name,
      meta: { path: rawPath, root },
      result: data,
    });
    return json(id, result);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown system tool error.';
    const code = error instanceof SystemFileError ? error.code : undefined;
    broadcast('E_A', 'TOOL_FAILED', `${name} failed — ${messageText}`, {
      level: 'error',
      status: 'error',
      tool: name,
      meta: { path: rawPath, code },
    });
    return jsonError(
      id,
      ERROR_CODES.TOOL_EXECUTION_ERROR,
      `${name} failed: ${messageText}`,
      200,
      code ? { code, path: rawPath, root } : undefined,
    );
  }
}
