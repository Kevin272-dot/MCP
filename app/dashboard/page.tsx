'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DemoNode, { type DemoNodeData } from '@/components/dashboard/DemoNode';
import PdfViewer from '@/components/dashboard/PdfViewer';
import { cn } from '@/lib/cn';
import type { McpLogEvent, McpStage, McpStep } from '@/lib/mcp/events';
import {
  PIPELINE_EDGE_ID,
  PIPELINE_NODE_ID,
  pipelineStageFromEvent,
  stageIndex,
  type PipelineStage,
} from '@/lib/mcp/pipeline';

/**
 * Live "under-the-hood" demo of the MCP server implemented in app/api/mcp.
 *
 * The five nodes mirror the request lifecycle:
 *   A. AI client posts a JSON-RPC request.      (USER_INPUT)
 *   B. The MCP router dispatches.               (DISCOVERY)
 *   C. The Next.js worker executes the tool.    (API_ROUTE)
 *   D. Headless Chromium boots and scrapes.     (SCRAPER)
 *   E. The result is formatted and returned.    (FORMATTED_OUT)
 *
 * A single EventSource subscribes to /api/mcp/sse. SSE frames for a tool call
 * arrive in a burst (<400ms apart), so a naive "set the stage" would never show
 * a visible glow. Instead each frame is enqueued and played back through an
 * ANIMATED EXECUTION QUEUE: every stage stays lit for a minimum STAGE_HOLD_MS
 * (400ms), the terminal stage holds green for TERMINAL_HOLD_MS (2s), then the
 * canvas resets to IDLE. The active node flares emerald (border + glow + scale)
 * while its incoming edge pulses and streams marching dashes.
 */

const nodeTypes = { demo: DemoNode };

const FLOW_ORDER: McpStep[] = ['A', 'B', 'C', 'D', 'E'];
const EDGE_IDS = ['A-B', 'B-C', 'C-D', 'D-E'];

/** Minimum time each pipeline node stays lit before advancing. */
const STAGE_HOLD_MS = 400;
/** How long the terminal stage stays green before resetting to IDLE. */
const TERMINAL_HOLD_MS = 2000;

const BASE_NODES: Node<DemoNodeData>[] = [
  { id: 'A', type: 'demo', position: { x: 0, y: 120 }, data: { step: 'A', title: 'AI Client', sub: 'User Input', active: false, done: false } },
  { id: 'B', type: 'demo', position: { x: 270, y: 120 }, data: { step: 'B', title: 'MCP Routing', sub: 'Discovery Handler', active: false, done: false } },
  { id: 'C', type: 'demo', position: { x: 540, y: 120 }, data: { step: 'C', title: 'Next.js Worker', sub: 'Dynamic API Route', active: false, done: false } },
  { id: 'D', type: 'demo', position: { x: 810, y: 120 }, data: { step: 'D', title: 'Headless Chrome', sub: 'Scraping Engine', active: false, done: false } },
  { id: 'E', type: 'demo', position: { x: 1080, y: 120 }, data: { step: 'E', title: 'JSON Payload', sub: 'Formatted Out', active: false, done: false } },
];

// Edge palette — live segments glow emerald-400, done segments keep a dim tint,
// idle segments stay muted zinc. High contrast against the dark canvas.
const EMERALD = 'rgb(52 211 153)'; // emerald-400
const EMERALD_DIM = 'rgb(52 211 153 / 0.35)';
const IDLE = 'rgb(75 75 82)';
const LABEL = 'rgb(212 212 216)'; // zinc-300

function edgeFor(from: McpStep, to: McpStep): Edge {
  return {
    id: `${from}-${to}`,
    source: from,
    target: to,
    // Only the segment currently carrying data streams its dashes (set in applyFlowState).
    animated: false,
    label: `${from}->${to}`,
    labelStyle: { fill: LABEL, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
    labelBgStyle: { fill: 'rgb(18 18 22)', opacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    markerEnd: { type: MarkerType.ArrowClosed, color: IDLE, width: 16, height: 16 },
    style: { stroke: IDLE, strokeWidth: 1.5 },
  };
}

const BASE_EDGES: Edge[] = [
  edgeFor('A', 'B'),
  edgeFor('B', 'C'),
  edgeFor('C', 'D'),
  edgeFor('D', 'E'),
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}

function stageBadge(stage: McpStage): string {
  return `[${stage.replace('_', '→')}]`;
}

export default function DashboardPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DemoNodeData>>(BASE_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(BASE_EDGES);

  const [activeStage, setActiveStage] = useState<PipelineStage>('IDLE');
  const [logs, setLogs] = useState<McpLogEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [bright, setBright] = useState(false);

  const [url, setUrl] = useState('https://news.ycombinator.com/');
  const [fsPath, setFsPath] = useState('.');
  const [fsContent, setFsContent] = useState('Hello from the MCP local file system tool!');
  const [sysPath, setSysPath] = useState('180dc/vit materials/');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [pdfResponse, setPdfResponse] = useState<unknown | null>(null);

  const logRef = useRef<HTMLUListElement>(null);

  // Animated execution queue: refs keep the playback loop free of stale closures.
  const queueRef = useRef<PipelineStage[]>([]);
  const processingRef = useRef(false);
  const activeStageRef = useRef<PipelineStage>('IDLE');
  const mountedRef = useRef(true);

  // ---- Node/edge restyling driven by the current pipeline stage ------------
  const applyFlowState = useCallback(
    (stage: PipelineStage) => {
      // -1 for IDLE; otherwise 0..4 (USER_INPUT .. FORMATTED_OUT) matching A..E.
      const idx = stageIndex(stage);
      const activeNodeId = PIPELINE_NODE_ID[stage];
      const activeEdgeId = PIPELINE_EDGE_ID[stage];

      setNodes((current) =>
        current.map((node) => {
          const nodeIdx = FLOW_ORDER.indexOf(node.id as McpStep);
          return {
            ...node,
            data: {
              ...node.data,
              active: node.id === activeNodeId,
              done: idx >= 0 && nodeIdx < idx,
            },
          };
        }),
      );

      setEdges((current) =>
        current.map((edge) => {
          const edgeIdx = EDGE_IDS.indexOf(edge.id);
          const isLive = edge.id === activeEdgeId;
          const isDone = idx > 0 && edgeIdx < idx;
          return {
            ...edge,
            // Data "moves" only on the live segment — every other edge is static.
            animated: isLive,
            className: isLive ? 'edge-live' : undefined,
            style: {
              ...edge.style,
              stroke: isLive ? EMERALD : isDone ? EMERALD_DIM : IDLE,
              strokeWidth: isLive ? 3 : isDone ? 2.5 : 1.5,
              filter: isLive ? 'drop-shadow(0 0 6px rgba(52,211,153,0.7))' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isLive ? EMERALD : isDone ? EMERALD_DIM : IDLE,
              width: isLive ? 18 : 16,
              height: isLive ? 18 : 16,
            },
          };
        }),
      );
    },
    [setEdges, setNodes],
  );

  // ---- Animated execution queue --------------------------------------------
  // SSE frames for a tool call arrive in a burst (often <400ms apart), so a
  // naive "set activeStage to the latest event" never lets the audience SEE a
  // node glow. We queue every distinct stage and play it back at a minimum
  // pace: STAGE_HOLD_MS per node, TERMINAL_HOLD_MS for the terminal stage,
  // then IDLE. The queue also drains when the next request's events arrive.
  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0 && mountedRef.current) {
      const stage = queueRef.current.shift()!;
      activeStageRef.current = stage;
      setActiveStage(stage);
      await delay(stage === 'FORMATTED_OUT' ? TERMINAL_HOLD_MS : STAGE_HOLD_MS);
    }
    if (mountedRef.current && queueRef.current.length === 0) {
      activeStageRef.current = 'IDLE';
      setActiveStage('IDLE');
    }
    processingRef.current = false;
  }, []);

  // ---- SSE bridge ----------------------------------------------------------
  const handleEvent = useCallback(
    (event: McpLogEvent) => {
      setLogs((prev) => [...prev.slice(-199), event]);

      const stage = pipelineStageFromEvent(event);
      if (stage === 'IDLE') {
        // Failure / unknown event — clear the queue and the canvas right away.
        queueRef.current = [];
        activeStageRef.current = 'IDLE';
        setActiveStage('IDLE');
        return;
      }

      // Dedupe repeated frames of the same stage (e.g. many SCRAPER_EXECUTING).
      const tail = queueRef.current[queueRef.current.length - 1];
      if (tail === stage || activeStageRef.current === stage) return;

      queueRef.current.push(stage);
      void drainQueue();
    },
    [drainQueue],
  );

  useEffect(() => {
    const source = new EventSource('/api/mcp/sse');

    source.addEventListener('mcp', (raw) => {
      try {
        handleEvent(JSON.parse((raw as MessageEvent<string>).data) as McpLogEvent);
      } catch {
        // Ignore malformed frames; the next one may be valid.
      }
    });

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false); // EventSource auto-reconnects.

    return () => {
      source.close();
    };
  }, [handleEvent]);

  // Keep the canvas in sync with the current queue position.
  useEffect(() => {
    applyFlowState(activeStage);
  }, [activeStage, applyFlowState]);

  // Stop the playback loop if the page unmounts mid-drain. (StrictMode
  // double-mounts effects in dev, so the ref is re-armed on every mount.)
  useEffect(
    () => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        queueRef.current = [];
      };
    },
    [],
  );

  // Auto-scroll the lifecycle log to the newest entry.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  // ---- Presenter controls --------------------------------------------------
  const invoke = useCallback(async (body: unknown) => {
    setBusy(true);
    setResponse(null);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      // The PDF viewer dashboard item renders whenever read_pdf_file replies.
      const toolName = (body as { params?: { name?: unknown } } | undefined)?.params?.name;
      setPdfResponse(toolName === 'read_pdf_file' ? data : null);
    } catch (error) {
      setResponse(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
    } finally {
      setBusy(false);
    }
  }, []);

  const runToolsList = useCallback(() => invoke({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), [invoke]);
  const runToolCall = useCallback(
    () =>
      invoke({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'chrome_fetch_headline', arguments: { url } },
      }),
    [invoke, url],
  );

  // Local file system tools — paths are resolved against the configured root.
  const runFsTool = useCallback(
    (name: 'read_local_file' | 'write_local_file' | 'list_local_dir', args: Record<string, unknown>) =>
      invoke({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    [invoke],
  );

  // Host system tools — paths are resolved against MCP_SYSTEM_ROOT (default "/").
  const runSystemTool = useCallback(
    (
      name: 'read_system_file' | 'write_system_file' | 'list_system_dir' | 'read_pdf_file',
      args: Record<string, unknown>,
    ) =>
      invoke({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    [invoke],
  );

  const minimapColors = useMemo(
    () => ({
      nodeColor: (n: Node<DemoNodeData>) => (n.data.active ? 'rgb(245 245 246 / 0.9)' : 'rgb(40 40 44)'),
      maskColor: 'rgb(10 10 12 / 0.75)',
      bgColor: 'rgb(18 18 22)',
    }),
    [],
  );

  return (
    <main className={cn('relative min-h-screen overflow-x-hidden bg-navy text-white', bright && 'invert hue-rotate-180')}>
      <header className="border-b border-edge-dark">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              MCP under the hood
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-zinc-400">
              Live handshake · /api/mcp · JSON-RPC 2.0
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span
              className={cn('h-2.5 w-2.5 rounded-full transition-colors', connected ? 'bg-mint' : 'bg-body-dark')}
              aria-hidden="true"
            />
            <span className={cn(connected ? 'text-mint' : 'text-body-dark')}>
              {connected ? 'SSE live' : 'SSE connecting…'}
            </span>
            <span className="h-4 w-px bg-edge-dark" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setBright((value) => !value)}
              aria-pressed={bright}
              className="rounded-md border border-edge-dark px-2.5 py-1.5 text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              {bright ? 'Dark mode' : 'Bright mode'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        {/* Left: the React Flow canvas -------------------------------------- */}
        <section
          aria-label="MCP request flow"
          className="relative h-[520px] min-w-0 overflow-hidden rounded-xl border border-edge-dark bg-[#0d0d10]"
        >
          <ReactFlow<Node<DemoNodeData>, Edge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.35}
            maxZoom={1.4}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(75 75 82 / 0.5)" />
            <MiniMap {...minimapColors} pannable zoomable />
            <Controls showInteractive={false} className="flow-controls" />
          </ReactFlow>
        </section>

        {/* Right: controls + live log + response ---------------------------- */}
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-label="Presenter controls" className="rounded-xl border border-edge-dark bg-[#121216] p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Drive the demo</h2>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="target-url" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                  Target URL
                </label>
                <input
                  id="target-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-edge-dark bg-navy px-3 py-2 font-mono text-sm text-white placeholder:text-body-dark focus:border-mint focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={runToolsList}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  tools/list
                </button>
                <button
                  type="button"
                  onClick={runToolCall}
                  disabled={busy}
                  className="rounded-md bg-mint px-3 py-2.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? 'Running…' : 'chrome_fetch_headline'}
                </button>
              </div>

              <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
                The buttons POST a JSON-RPC envelope straight to /api/mcp — the same wire message any MCP client (Claude, the inspector, curl) would send.
              </p>
            </div>
          </section>

          <section aria-label="Local file system tools" className="rounded-xl border border-edge-dark bg-[#121216] p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Local file system</h2>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="fs-path" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                  Path (relative to allowed root)
                </label>
                <input
                  id="fs-path"
                  type="text"
                  value={fsPath}
                  onChange={(e) => setFsPath(e.target.value)}
                  placeholder="data/notes.txt"
                  className="w-full rounded-md border border-edge-dark bg-navy px-3 py-2 font-mono text-sm text-white placeholder:text-body-dark focus:border-mint focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="fs-content" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                  Content (write_local_file only)
                </label>
                <textarea
                  id="fs-content"
                  value={fsContent}
                  onChange={(e) => setFsContent(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-md border border-edge-dark bg-navy px-3 py-2 font-mono text-sm text-white placeholder:text-body-dark focus:border-mint focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => runFsTool('read_local_file', { path: fsPath })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  read
                </button>
                <button
                  type="button"
                  onClick={() => runFsTool('write_local_file', { path: fsPath, content: fsContent })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  write
                </button>
                <button
                  type="button"
                  onClick={() => runFsTool('list_local_dir', { path: fsPath })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  list
                </button>
              </div>

              <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
                Paths are sandboxed to the configured root (MCP_FS_ROOT, default: project root). A trailing path like &quot;../..&quot; is rejected server-side.
              </p>
            </div>
          </section>

          <section aria-label="Host system tools" className="rounded-xl border border-edge-dark bg-[#121216] p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Host system</h2>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="sys-path" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                  Path (relative to system root)
                </label>
                <input
                  id="sys-path"
                  type="text"
                  value={sysPath}
                  onChange={(e) => setSysPath(e.target.value)}
                  placeholder="180dc/vit materials/file.pdf"
                  className="w-full rounded-md border border-edge-dark bg-navy px-3 py-2 font-mono text-sm text-white placeholder:text-body-dark focus:border-mint focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => runSystemTool('read_system_file', { path: sysPath })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  read
                </button>
                <button
                  type="button"
                  onClick={() => runSystemTool('write_system_file', { path: sysPath, content: fsContent })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  write
                </button>
                <button
                  type="button"
                  onClick={() => runSystemTool('list_system_dir', { path: sysPath })}
                  disabled={busy}
                  className="rounded-md border border-edge-dark px-3 py-2.5 text-sm font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  list
                </button>
                <button
                  type="button"
                  onClick={() => runSystemTool('read_pdf_file', { path: sysPath })}
                  disabled={busy}
                  className="rounded-md bg-mint px-3 py-2.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  pdf
                </button>
              </div>

              <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
                Reaches outside the sandbox onto the host machine. Root is MCP_SYSTEM_ROOT (default: &quot;/&quot;); the pdf button parses via pdf-parse and returns text + metadata.
              </p>
            </div>
          </section>

          <section aria-label="Live lifecycle log" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-edge-dark bg-[#0a0a0c]">
            <div className="flex items-center justify-between border-b border-edge-dark px-4 py-2.5">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Lifecycle log</h2>
              <span className="font-mono text-[10px] text-zinc-400">{logs.length} events</span>
            </div>
            <ul ref={logRef} className="h-64 space-y-1.5 overflow-y-auto p-3 font-mono text-[11px] leading-snug">
              {logs.length === 0 && (
                <li className="text-body-dark">
                  <span className="text-mint">▸</span> waiting for a request… run tools/list or chrome_fetch_headline.
                </li>
              )}
              {logs.map((event) => (
                <li key={event.id} className="flex gap-2">
                  <span className="shrink-0 text-body-dark">{formatTime(event.at)}</span>
                  <span
                    className={cn(
                      'shrink-0 font-bold',
                      event.level === 'error' ? 'text-red-400' : event.level === 'ok' ? 'text-mint' : 'text-zinc-300',
                    )}
                  >
                    {stageBadge(event.stage)}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('font-semibold', event.level === 'error' ? 'text-red-300' : 'text-white')}>
                      {event.title}
                    </span>
                    <span className="text-zinc-400"> — {event.detail}</span>
                    {event.tool && <span className="text-mint"> · tool={event.tool}</span>}
                    {event.url && <span className="text-zinc-500"> · {event.url}</span>}
                    {event.status === 'success' && <span className="text-mint"> · ok</span>}
                    {event.status === 'error' && <span className="text-red-400"> · failed</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Server response" className="overflow-hidden rounded-xl border border-edge-dark bg-[#0a0a0c]">
            <div className="border-b border-edge-dark px-4 py-2.5">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">JSON-RPC response</h2>
            </div>
            {pdfResponse ? (
              <PdfViewer response={pdfResponse} />
            ) : (
              <pre className="h-44 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
                {response ?? 'No request sent yet.'}
              </pre>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
