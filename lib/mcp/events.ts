/**
 * Tiny in-process event bus that bridges the server-side `/api/mcp` handler
 * to the live React Flow dashboard.
 *
 * The dashboard holds an SSE connection open to `/api/mcp/sse`. Every time the
 * route handler hits a lifecycle milestone it broadcasts an event here; the SSE
 * route relays it to the page, which appends it to the LIFECYCLE LOG and lights
 * up the matching edge (A->B, B->C, …) on the diagram.
 *
 * Each event is a superset of the protocol "semantic" shapes:
 *
 *   { event: 'REQUEST_RECEIVED',    tool, timestamp }
 *   { event: 'DISCOVERING_HANDLER', route }
 *   { event: 'SCRAPER_EXECUTING',   url }
 *   { event: 'PAYLOAD_FORMATTED',   status, result }
 *
 * plus `stage` / `title` / `detail` so the diagram and console both stay in sync:
 *
 *   A_B  REQUEST_RECEIVED    POST to /api/mcp
 *   B_C  DISCOVERING_HANDLER Routing to Discovery Handler
 *   C_D  WORKER_EXECUTING    Spawning Headless Chrome process
 *   D_E  SCRAPER_EXECUTING   Scraping target URL and formatting payload
 *   E_A  PAYLOAD_FORMATTED   Returning JSON-RPC response
 *
 * A fixed-size ring buffer means a dashboard that connects AFTER a request has
 * finished still replays the recent trace instead of rendering an empty canvas
 * — handy when the presenter refreshes mid-lecture.
 *
 * NOTE: this is deliberately in-memory/zero-dependency. On a single Node
 * process (`next dev` / `next start`) the POST and the SSE stream share it.
 * On horizontally-scaled serverless platforms the dashboard's OWN invocation
 * still shows the returned payload, so the demo never fully breaks.
 */

/** The five handshake stages — these map 1:1 to edges on the dashboard canvas. */
export const MCP_STAGES = ['A_B', 'B_C', 'C_D', 'D_E', 'E_A'] as const;
export type McpStage = (typeof MCP_STAGES)[number];

/** The five visual nodes on the dashboard canvas (A = AI client … E = payload). */
export type McpStep = 'A' | 'B' | 'C' | 'D' | 'E';

/** Semantic lifecycle event emitted by the MCP execution routes. */
export type McpLifecycleEventName =
  | 'REQUEST_RECEIVED'
  | 'DISCOVERING_HANDLER'
  | 'WORKER_EXECUTING'
  | 'SCRAPER_EXECUTING'
  | 'TOOL_EXECUTING'
  | 'SYSTEM_READ_START'
  | 'SYSTEM_FILE_LOADED'
  | 'SYSTEM_PDF_READ_START'
  | 'SYSTEM_PDF_READ_COMPLETE'
  | 'PAYLOAD_FORMATTED'
  | 'SCRAPER_FAILED'
  | 'TOOL_FAILED'
  | 'REQUEST_FAILED';

/** Human title shown in the LIFECYCLE LOG for each semantic event. */
const EVENT_TITLES: Record<McpLifecycleEventName, string> = {
  REQUEST_RECEIVED: 'Request Received',
  DISCOVERING_HANDLER: 'MCP Routing',
  WORKER_EXECUTING: 'Next.js Worker',
  SCRAPER_EXECUTING: 'Headless Chrome',
  TOOL_EXECUTING: 'Next.js Worker',
  SYSTEM_READ_START: 'Host System Read',
  SYSTEM_FILE_LOADED: 'Host File Loaded',
  SYSTEM_PDF_READ_START: 'Host PDF Read',
  SYSTEM_PDF_READ_COMPLETE: 'Host PDF Complete',
  PAYLOAD_FORMATTED: 'Complete',
  SCRAPER_FAILED: 'Scraping Failed',
  TOOL_FAILED: 'Tool Failed',
  REQUEST_FAILED: 'Request Failed',
};

export interface McpLogEvent {
  id: number;
  /** Epoch milliseconds — matches the `timestamp` field clients expect. */
  timestamp: number;
  /** ISO timestamp — the dashboard renders a "console" style trace. */
  at: string;
  /** Edge/stage key that drives the diagram animation. */
  stage: McpStage;
  /** Semantic lifecycle label, e.g. "REQUEST_RECEIVED". */
  event: McpLifecycleEventName;
  /** Short human label, e.g. "Request Received". */
  title: string;
  /** What actually ran, e.g. "Routing to Discovery Handler". */
  detail: string;
  level: 'info' | 'ok' | 'error';
  tool?: string;
  route?: string;
  url?: string;
  status?: 'success' | 'error';
  result?: unknown;
  meta?: Record<string, unknown>;
}

export interface BroadcastOptions {
  /** Human title; defaults to EVENT_TITLES[eventName]. */
  title?: string;
  level?: McpLogEvent['level'];
  tool?: string;
  route?: string;
  url?: string;
  status?: 'success' | 'error';
  result?: unknown;
  meta?: Record<string, unknown>;
}

const RING_SIZE = 100;
let nextId = 1;
const ring: McpLogEvent[] = [];
const subscribers = new Set<(event: McpLogEvent) => void>();

/** Record a lifecycle milestone and push it to every subscriber + the buffer. */
export function broadcast(
  stage: McpStage,
  eventName: McpLifecycleEventName,
  detail: string,
  options: BroadcastOptions = {},
): McpLogEvent {
  const event: McpLogEvent = {
    id: nextId++,
    timestamp: Date.now(),
    at: new Date().toISOString(),
    stage,
    event: eventName,
    title: options.title ?? EVENT_TITLES[eventName],
    detail,
    level: options.level ?? 'info',
    tool: options.tool,
    route: options.route,
    url: options.url,
    status: options.status,
    result: options.result,
    meta: options.meta,
  };
  ring.push(event);
  if (ring.length > RING_SIZE) ring.shift();
  subscribers.forEach((notify) => {
    try {
      notify(event);
    } catch {
      // A subscriber must never crash the MCP handler.
    }
  });
  return event;
}

/** Subscribe to live events; returns an unsubscribe function. */
export function subscribe(notify: (event: McpLogEvent) => void): () => void {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

/** Snapshot of the most recent events, oldest first. */
export function recentEvents(): McpLogEvent[] {
  return [...ring];
}
