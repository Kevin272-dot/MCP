import type { McpLogEvent, McpStep } from '@/lib/mcp/events';

/**
 * UI-facing pipeline stage — the single source of truth that drives node
 * highlighting and edge animation on the dashboard diagram.
 *
 * The SSE stream emits `McpLogEvent`s with semantic `event` names
 * (REQUEST_RECEIVED, DISCOVERING_HANDLER, WORKER_EXECUTING,
 * SCRAPER_EXECUTING, PAYLOAD_FORMATTED). Each maps onto one step of the
 * visual pipeline:
 *
 *   REQUEST_RECEIVED     -> USER_INPUT       (node A, AI client)
 *   DISCOVERING_HANDLER  -> DISCOVERY        (node B, MCP routing)
 *   WORKER_EXECUTING     -> API_ROUTE        (node C, Next.js worker)
 *   TOOL_EXECUTING       -> API_ROUTE        (node C — local file system tools)
 *   SYSTEM_*             -> API_ROUTE        (node C — host system / PDF tools)
 *   SCRAPER_EXECUTING    -> SCRAPER          (node D, headless Chrome)
 *   PAYLOAD_FORMATTED    -> FORMATTED_OUT    (node E, JSON payload)
 *
 * Failure events (SCRAPER_FAILED / REQUEST_FAILED) reset to IDLE so the
 * canvas clears instead of leaving a misleading "in flight" glow.
 */

export type PipelineStage = 'IDLE' | 'USER_INPUT' | 'DISCOVERY' | 'API_ROUTE' | 'SCRAPER' | 'FORMATTED_OUT';

/** Stages in execution order (IDLE excluded — it is the reset state). */
export const PIPELINE_ORDER: readonly Exclude<PipelineStage, 'IDLE'>[] = [
  'USER_INPUT',
  'DISCOVERY',
  'API_ROUTE',
  'SCRAPER',
  'FORMATTED_OUT',
];

/** Which diagram node lights up while a stage is running. */
export const PIPELINE_NODE_ID: Record<PipelineStage, McpStep | null> = {
  IDLE: null,
  USER_INPUT: 'A',
  DISCOVERY: 'B',
  API_ROUTE: 'C',
  SCRAPER: 'D',
  FORMATTED_OUT: 'E',
};

/** Which edge streams data into the active node (null = terminal/reset). */
export const PIPELINE_EDGE_ID: Record<PipelineStage, string | null> = {
  IDLE: null,
  USER_INPUT: 'A-B',
  DISCOVERY: 'B-C',
  API_ROUTE: 'C-D',
  SCRAPER: 'D-E',
  FORMATTED_OUT: null,
};

/** Map an incoming SSE lifecycle event to its diagram stage. */
export function pipelineStageFromEvent(event: McpLogEvent): PipelineStage {
  switch (event.event) {
    case 'REQUEST_RECEIVED':
      return 'USER_INPUT';
    case 'DISCOVERING_HANDLER':
      return 'DISCOVERY';
    case 'WORKER_EXECUTING':
      return 'API_ROUTE';
    case 'SCRAPER_EXECUTING':
      return 'SCRAPER';
    case 'TOOL_EXECUTING':
    case 'WORKER_EXECUTING':
    case 'SYSTEM_READ_START':
    case 'SYSTEM_FILE_LOADED':
    case 'SYSTEM_PDF_READ_START':
    case 'SYSTEM_PDF_READ_COMPLETE':
      return 'API_ROUTE';
    case 'PAYLOAD_FORMATTED':
      return 'FORMATTED_OUT';
    default:
      // SCRAPER_FAILED / REQUEST_FAILED / unknown -> clear the canvas.
      return 'IDLE';
  }
}

/** Position of a stage in the pipeline (0..4), -1 for IDLE. */
export function stageIndex(stage: PipelineStage): number {
  if (stage === 'IDLE') return -1;
  return PIPELINE_ORDER.indexOf(stage);
}

/** True when the stage is the terminal "done" state. */
export function isTerminal(stage: PipelineStage): boolean {
  return stage === 'FORMATTED_OUT';
}
