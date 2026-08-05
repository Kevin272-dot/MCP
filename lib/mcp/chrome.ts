import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

/**
 * The scraping engine behind the `chrome_fetch_headline` MCP tool.
 *
 * Lifecycle discipline matters on serverless runtimes (Vercel functions are
 * short-lived): every browser is launched in a `try`, torn down in a `finally`
 * (page -> browser -> process), and the page has a hard navigation timeout so
 * a slow/hung site can never pin the function's memory open.
 *
 * @sparticuz/chromium v149 ships a compressed Chromium payload (`bin/`) that
 * is inflated once into the OS temp dir and cached across warm invocations.
 */

export type ScrapeLog = (message: string, meta?: Record<string, unknown>) => void;

export interface ScrapeResult {
  url: string;
  /** After redirects — useful to show in the lecture. */
  finalUrl: string;
  title: string;
  headline: string | null;
}

const NAV_TIMEOUT_MS = 15_000;
const PROTOCOL_TIMEOUT_MS = 30_000;

// Only allow http(s) — never let a prompt turn the scraper into an SSRF proxy.
function validateHttpUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol "${url.protocol}" — only http(s) is allowed.`);
  }
  if (!url.hostname) throw new Error('URL must include a hostname.');
  return url.toString();
}

/**
 * Locate the @sparticuz/chromium `bin/` folder.
 *
 * When the package is marked external (see next.config.mjs) its own
 * `getBinPath()` resolves via `import.meta.url` and "just works". We still
 * keep explicit candidates as a fallback for bundlers/edge packaging, and to
 * make the failure mode human-readable.
 */
function findChromiumBin(): string {
  const candidates = [
    process.env.MCP_CHROMIUM_BIN,
    join(process.cwd(), 'node_modules/@sparticuz/chromium/bin'),
    join(process.cwd(), '.next/server/app/api/mcp/node_modules/@sparticuz/chromium/bin'),
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Could not locate @sparticuz/chromium/bin. Install the dependency (npm install) or set MCP_CHROMIUM_BIN to its absolute path.',
  );
}

// Inflate once per warm function instance; reuse the cached path across calls.
let executablePromise: Promise<string> | null = null;

function getExecutablePath(): Promise<string> {
  if (!executablePromise) {
    executablePromise = Chromium.executablePath(findChromiumBin());
  }
  return executablePromise;
}

// WebGL is not needed for headline extraction — dropping the graphics stack
// saves memory and startup time on the serverless runtime.
Chromium.setGraphicsMode = false;

/**
 * Boot headless Chromium, load `rawUrl`, extract the page title + headline, and
 * guarantee the browser is destroyed before this function resolves.
 */
export async function fetchHeadline(rawUrl: string, log: ScrapeLog): Promise<ScrapeResult> {
  const url = validateHttpUrl(rawUrl);

  const executablePath = await getExecutablePath();
  log('Launching serverless Chromium…', { executablePath });

  const browser = await puppeteer.launch({
    executablePath,
    args: Chromium.args,
    headless: 'shell',
    defaultViewport: { width: 1280, height: 800 },
    protocolTimeout: PROTOCOL_TIMEOUT_MS,
  });

  try {
    log('Browser process ready — navigating to target…', { url });

    const page = await browser.newPage();
    try {
      await page.setDefaultTimeout(NAV_TIMEOUT_MS);
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
      log('Page loaded.', { status: response?.status() ?? null, finalUrl: page.url() });

      const extracted = await page.evaluate(() => {
        // Many sites (notably Hacker News) have NO <h1>/<h2> on the page — the
        // front page only marks up story titles inside `.titleline` cells. Walk
        // the selector list in priority order and take the first non-empty text
        // so `headline` only falls back to null when no story text exists at all.
        const selectors = [
          'td.title > span.titleline > a', // HN: primary story cell
          'span.titleline > a', // HN: any titleline link
          'tr.athing .titleline a', // HN: story rows
          'h1', // generic page heading
          'h2', // generic section heading
        ] as const;

        let selector: string | null = null;
        let headline: string | null = null;
        for (const candidate of selectors) {
          const el = document.querySelector<HTMLElement>(candidate);
          const text = el?.textContent?.trim();
          if (text) {
            headline = text;
            selector = candidate;
            break;
          }
        }

        return {
          title: document.title.trim(),
          headline,
          matchedSelector: selector,
        };
      });
      log('Headline extracted — closing tab…', extracted);

      return {
        url,
        finalUrl: page.url(),
        title: extracted.title,
        headline: extracted.headline,
      };
    } finally {
      await page.close().catch(() => {
        // Closing an already-destroyed tab is harmless — swallow it.
      });
    }
  } finally {
    // Always close the browser (and its child processes) so the serverless
    // function cannot leak file descriptors or orphaned Chromium processes.
    await browser.close().catch(() => {
      // Browser may already be gone — nothing to clean up.
    });
    log('Browser closed — no orphaned processes.');
  }
}
