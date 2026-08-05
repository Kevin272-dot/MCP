import { recentEvents, subscribe, type McpLogEvent } from '@/lib/mcp/events';

/**
 * Server-Sent Events endpoint that streams the in-process MCP log to the
 * dashboard canvas at `/api/mcp/sse`.
 *
 * The dashboard opens one `EventSource` on mount. Each time the `/api/mcp`
 * handler broadcasts a lifecycle stage (A_B -> B_C -> C_D -> D_E -> E_A), this
 * route serializes it as an SSE `event: mcp` frame and the dashboard appends it
 * to the LIFECYCLE LOG and highlights the matching edge on the flow.
 *
 * Implementation notes:
 *  - Headers follow the SSE spec: `text/event-stream`, no caching, keep-alive.
 *  - A comment frame (`: keep-alive`) is sent every 15s so proxies that drop
 *    idle connections cannot silently sever the stream mid-lecture.
 *  - On connect we replay `recentEvents()` from the ring buffer, so a page
 *    opened after a request finished still shows the last trace.
 *  - On cancel (tab closed / reconnect) the subscription is removed, so stale
 *    listeners cannot accumulate into a leak.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEEPALIVE_MS = 15_000;

function encodeFrame(event: McpLogEvent): string {
  // One event per SSE frame; `event:` names it so the client can ignore others.
  return `event: mcp\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepalive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Catch-up replay so a late connection never shows an empty canvas.
      for (const event of recentEvents()) {
        controller.enqueue(encoder.encode(encodeFrame(event)));
      }
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Fan out every future broadcast to this connection.
      unsubscribe = subscribe((event) => {
        try {
          controller.enqueue(encoder.encode(encodeFrame(event)));
        } catch {
          // Connection already closed — the cancel handler cleans up below.
        }
      });

      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          // Stream closed underneath us.
        }
      }, KEEPALIVE_MS);
    },
    cancel() {
      // Client went away (or EventSource reconnected) — stop the listener.
      unsubscribe?.();
      if (keepalive) clearInterval(keepalive);
      unsubscribe = null;
      keepalive = null;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
