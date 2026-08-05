# MCP — Understanding the Why and the What

A single-page explainer site that teaches developers what the Model Context
Protocol is, why it exists, and how it works — **plus a live, self-hosted MCP
server** that demos the protocol handshake end-to-end with a React Flow
visualization.

## Tech stack

- Next.js 14 (App Router) + TypeScript, strict mode
- Tailwind CSS v3 with CSS-variable theme tokens (swappable in `app/globals.css`)
- Framer Motion for scroll-reveal and flow animations on the marketing pages
- **`@xyflow/react`** — React Flow canvas on `/dashboard`
- **`puppeteer-core` + `@sparticuz/chromium`** — serverless headless Chrome on `/api/mcp`
- Zero-dependency SSE event bus (`lib/mcp/events.ts`) drives the live canvas

> Note: the site previously used `output: 'export'` (fully static). That is
> removed because a live API route cannot exist in a static export. The
> marketing pages are unchanged; the app now requires `next start` (or Vercel)
> to serve `/api/mcp`.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build + typecheck + lint
npm run start    # serve the production build (required for /api/mcp)
npm run typecheck
npm run lint
```

## The live MCP demo

### 1. API endpoint — `app/api/mcp/route.ts`

A stateless POST handler that speaks JSON-RPC 2.0 (the wire format MCP is
built on). It implements the standard method set:

| Method        | Behavior                                                            |
| ------------- | ------------------------------------------------------------------- |
| `initialize`  | Handshake: advertises protocol version + server capabilities        |
| `tools/list`  | Discovery: returns the `chrome_fetch_headline` tool catalog         |
| `tools/call`  | Execution: boots headless Chrome, scrapes the `<h1>`, closes browser |
| `ping`        | Liveness                                                             |

Every response is the standard MCP envelope:
`{ "jsonrpc": "2.0", "id": …, "result": { … } }` (or `error`).

```bash
# discovery
curl -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# execution — real headless-Chrome scrape
curl -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"chrome_fetch_headline","arguments":{"url":"https://example.com"}}}'
```

You can also point a real MCP client at it (the official inspector works):

```bash
npx @modelcontextprotocol/inspector -- http://localhost:3000/api/mcp
```

### 2. Live visualization — `app/dashboard/page.tsx`

A React Flow canvas with the 5 lifecycle nodes (AI client → MCP routing →
Next.js worker → Headless Chrome → JSON payload). It keeps an SSE connection
open to `/api/mcp/sse`; every stage broadcast appends a line to the LIFECYCLE
LOG and lights up the matching edge (A→B, B→C, …) with a pulsing destination
node, while the JSON-RPC response appears in the panel below. The right-hand
column can fire `tools/list` or `chrome_fetch_headline` straight at the
endpoint for the audience to watch.

### 3. How the "under the hood" bridge works

- `lib/mcp/events.ts` — in-process ring-buffered event bus (last 100 events)
  with a `broadcast(stage, title, detail, …)` API. Stages are `A_B`, `B_C`,
  `C_D`, `D_E`, `E_A` — each maps to one edge on the diagram.
- `app/api/mcp/sse/route.ts` — SSE stream (`text/event-stream` with
  `no-cache, no-transform` and `keep-alive`) that relays broadcasts and
  replays the buffer on connect, so a page opened *after* a request still
  renders the trace. Heartbeat frames keep proxies from killing idle
  connections.
- `lib/mcp/chrome.ts` — lifecycle-safe scraping engine: browser is always
  closed in a `finally`, navigation has a hard 15s timeout, and the inflated
  Chromium path is cached across warm invocations so no memory leaks between
  serverless requests.

## Deployment notes (Vercel)

- `/api/mcp` is a Node runtime function (`export const runtime = 'nodejs'`,
  `maxDuration = 60`).
- `puppeteer-core` and `@sparticuz/chromium` are kept out of the webpack bundle
  (`experimental.serverComponentsExternalPackages`) and emitted as runtime
  `import()` calls.
- The Chromium payload is ~67 MB on disk. `next.config.mjs` includes
  `outputFileTracingIncludes` for `/api/mcp`; if your function size limit
  rejects it, bump the Vercel plan or host the demo on any Node server
  (`next start`) — which is the recommended path for a live lecture anyway.
- The event bus is in-memory, so the live canvas works best on a single Node
  process (`next dev` / `next start`). The dashboard's own invocation still
  renders the returned payload even if the SSE stream misses a broadcast.

## Structure

- `app/` — layout, marketing page, `/dashboard`, and the `/api/mcp*` routes
- `components/` — one component per section, plus `ui/` primitives and
  `dashboard/DemoNode.tsx` (the custom React Flow node)
- `content/sections.ts` — all marketing copy lives here, typed and easy to edit
- `lib/mcp/` — protocol types, the event bus, and the Chromium scraper
