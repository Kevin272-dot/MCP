'use client';

import {
  Fragment,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  FileJson,
  FileSearch,
  FileText,
  Flag,
  Globe2,
  HeartHandshake,
  Layers,
  MonitorCheck,
  MousePointerClick,
  Pause,
  Play,
  Server,
  Sparkles,
  StepForward,
  Target,
  TrendingUp,
  User,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/anim';

/**
 * MCP PDF Viewer dashboard item.
 *
 * Renders the raw JSON-RPC response of a `read_pdf_file` tools/call call:
 *
 *   result.content[0].text = JSON.stringify({
 *     path, pages, title, metadata, text
 *   })
 *
 * Three views share one parsed document:
 *   1. "Formatted Document" — PDF text cleaned, split into section Cards,
 *      UN SDGs surfaced as coloured badges (for the general audience).
 *   2. "Interactive Flowchart" — User Trigger → Next.js Worker → pdf-parse
 *      Engine → Response Output, with an adaptive CSS glow on the active node.
 *   3. "Raw JSON-RPC" — the untouched payload with lightweight syntax
 *      highlighting and a copy button.
 *
 * Every failure mode (bad envelope, JSON-RPC error, unparseable inner JSON,
 * missing fields) degrades to a readable error panel with the raw payload.
 */

export interface PdfMetadata {
  author?: unknown;
  creator?: unknown;
  producer?: unknown;
  creationDate?: unknown;
  Author?: unknown;
  CreationDate?: unknown;
  [key: string]: unknown;
}

export interface PdfDocument {
  path?: string;
  pages?: number;
  title?: string | null;
  metadata?: PdfMetadata | null;
  text?: string;
  [key: string]: unknown;
}

export interface PdfViewerProps {
  /** Raw JSON-RPC response object (or a JSON string of one). */
  response: unknown;
  className?: string;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface PdfParseSuccess {
  status: 'ready';
  doc: PdfDocument;
  raw: string;
}

export interface PdfParseError {
  status: 'error';
  title: string;
  message: string;
  raw: string;
}

export type PdfParseResult = PdfParseSuccess | PdfParseError;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Safe stringify — JSON.stringify(undefined) returns `undefined`, not a string. */
function rawFallback(value: unknown): string {
  const text = JSON.stringify(value, null, 2);
  return typeof text === 'string' ? text : String(value);
}

function fail(title: string, message: string, raw: string): PdfParseError {
  return { status: 'error', title, message, raw };
}

/** Extract a PdfDocument out of a JSON-RPC `tools/call` response envelope. */
export function parsePdfResponse(response: unknown): PdfParseResult {
  let envelope: unknown = response;

  if (typeof envelope === 'string') {
    const rawEnvelope = envelope;
    try {
      envelope = JSON.parse(envelope);
    } catch {
      return fail(
        'Invalid JSON-RPC envelope',
        'The response could not be parsed as JSON — the server may have returned a non-JSON body.',
        rawEnvelope,
      );
    }
  }

  if (!isRecord(envelope)) {
    return fail(
      'Unexpected response shape',
      'Expected a JSON-RPC response object, but received something else.',
      rawFallback(response),
    );
  }

  const raw = rawFallback(envelope);

  // A JSON-RPC error reply (e.g. -32000 TOOL_EXECUTION_ERROR).
  if (envelope.error !== undefined) {
    const err = isRecord(envelope.error) ? envelope.error : {};
    const message =
      typeof err.data === 'string'
        ? err.data
        : `code ${String(err.code ?? 'unknown')}.`;
    return fail(
      typeof err.message === 'string' ? err.message : 'Tool execution error',
      message,
      raw,
    );
  }

  // Already a parsed PdfDocument passed straight through.
  if (typeof envelope.path === 'string' && typeof envelope.text === 'string') {
    return { status: 'ready', doc: envelope as unknown as PdfDocument, raw };
  }

  const result = envelope.result;
  if (!isRecord(result)) {
    return fail(
      'Missing JSON-RPC result',
      'The response has no "result" member — a successful tools/call should include one.',
      raw,
    );
  }

  const content = result.content;
  const textBlock = Array.isArray(content)
    ? content.find(
        (block) => isRecord(block) && typeof block.text === 'string',
      )
    : undefined;
  const innerText = textBlock?.text;

  if (typeof innerText !== 'string' || innerText.trim() === '') {
    return fail(
      'No extractable text payload',
      'result.content[0].text was missing or empty — this may not be a read_pdf_file response.',
      raw,
    );
  }

  let doc: PdfDocument;
  try {
    const parsed: unknown = JSON.parse(innerText);
    if (!isRecord(parsed)) throw new Error('inner payload is not an object');
    doc = parsed as unknown as PdfDocument;
  } catch {
    return fail(
      'Inner payload could not be parsed',
      'result.content[0].text did not contain valid JSON. The server may have returned a different tool result.',
      innerText,
    );
  }

  if (typeof doc.text !== 'string' || doc.text.trim() === '') {
    return fail(
      'Incomplete PDF payload',
      'The parsed document is missing its "text" body.',
      innerText,
    );
  }

  return { status: 'ready', doc, raw };
}

// ---------------------------------------------------------------------------
// Text cleanup & sectioning
// ---------------------------------------------------------------------------

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Trim the noise pdf-parse leaves behind: stray page numbers, run-on spacing,
 * and repeated blank lines — but keep single blank lines as paragraph breaks.
 */
function cleanPdfText(text: string): string {
  let out = text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const kept = out.split('\n').filter((line) => {
    const t = line.trim();
    if (t === '') return true; // paragraph separator
    if (/^\d{1,3}$/.test(t)) return false; // standalone page number
    if (/^\d{1,3}[.)-]?$/.test(t)) return false; // dangling "2."
    if (/^\d+\s*[-–]\s*\d+$/.test(t)) return false; // "1 - 2"
    return true;
  });

  out = kept.join('\n').replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

/** Strip leading outline numbering ("1.", "2.1", "3)") from a heading line. */
function stripHeadingNumber(line: string): string {
  return line.replace(/^\s*\d+(\.\d+)*[.)]?\s+/, '');
}

interface SectionDef {
  label: string;
  icon: LucideIcon;
  /** Alternative phrases (longest first) used to recognise the heading. */
  patterns: string[];
}

const SECTION_DEFS: SectionDef[] = [
  { label: 'Goal', icon: Target, patterns: ['goal'] },
  {
    label: 'Key Contributions',
    icon: Sparkles,
    patterns: ['key contributions', 'key contribution'],
  },
  { label: 'Impact', icon: TrendingUp, patterns: ['impact'] },
  { label: 'Social Impact', icon: HeartHandshake, patterns: ['social impact'] },
  {
    label: 'UN SDGs Served',
    icon: Globe2,
    patterns: ['un sdgs served', 'un sdg', 'sdgs served', 'sdgs', 'sdg'],
  },
  { label: 'Objectives', icon: Target, patterns: ['objectives', 'objective'] },
  {
    label: 'Introduction',
    icon: BookOpen,
    patterns: ['introduction', 'executive summary'],
  },
  { label: 'Background', icon: BookOpen, patterns: ['background'] },
  { label: 'Conclusion', icon: Flag, patterns: ['conclusion'] },
];

interface TextBlock {
  section: SectionDef | null;
  paragraphs: string[][];
}

/** Match a known section heading; returns the heading + any inline remainder. */
function matchSection(line: string): { section: SectionDef; rest: string } | null {
  const trimmed = stripHeadingNumber(line).replace(/\s+/g, ' ').trim();
  if (trimmed.length === 0 || trimmed.length > 80) return null;
  for (const def of SECTION_DEFS) {
    const re = new RegExp(`^(${def.patterns.map(escapeRegex).join('|')})\\b`, 'i');
    const match = re.exec(trimmed);
    if (!match) continue;
    const rest = trimmed.slice(match[0].length).trim().replace(/^[:;,-]\s*/, '');
    return { section: def, rest };
  }
  return null;
}

/** Split cleaned PDF text into sections + paragraphs for the Card layout. */
function splitSections(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let current: TextBlock = { section: null, paragraphs: [] };
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      current.paragraphs.push(paragraph);
      paragraph = [];
    }
  };
  const flushBlock = () => {
    flushParagraph();
    if (current.paragraphs.length > 0) {
      blocks.push(current);
      current = { section: null, paragraphs: [] };
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      flushParagraph();
      continue;
    }
    const matched = matchSection(line);
    if (matched) {
      flushBlock();
      current.section = matched.section;
      if (matched.rest) paragraph.push(matched.rest);
      continue;
    }
    paragraph.push(stripHeadingNumber(line) || line);
  }
  flushBlock();

  return blocks;
}

// ---------------------------------------------------------------------------
// UN Sustainable Development Goals
// ---------------------------------------------------------------------------

interface SdgDef {
  id: number;
  name: string;
  className: string;
}

const SDG_DEFS: SdgDef[] = [
  { id: 1, name: 'No Poverty', className: 'border-red-400/40 bg-red-500/15 text-red-200' },
  { id: 2, name: 'Zero Hunger', className: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
  { id: 3, name: 'Good Health and Well-Being', className: 'border-green-400/40 bg-green-500/15 text-green-200' },
  { id: 4, name: 'Quality Education', className: 'border-rose-300/40 bg-rose-500/15 text-rose-100' },
  { id: 5, name: 'Gender Equality', className: 'border-orange-400/40 bg-orange-500/15 text-orange-200' },
  { id: 6, name: 'Clean Water and Sanitation', className: 'border-sky-400/40 bg-sky-500/15 text-sky-200' },
  { id: 7, name: 'Affordable and Clean Energy', className: 'border-yellow-300/40 bg-yellow-400/15 text-yellow-100' },
  { id: 8, name: 'Decent Work and Economic Growth', className: 'border-rose-400/40 bg-rose-500/15 text-rose-200' },
  { id: 9, name: 'Industry, Innovation and Infrastructure', className: 'border-orange-300/40 bg-orange-400/15 text-orange-100' },
  { id: 10, name: 'Reduced Inequalities', className: 'border-pink-400/40 bg-pink-500/15 text-pink-200' },
  { id: 11, name: 'Sustainable Cities and Communities', className: 'border-amber-300/40 bg-amber-500/15 text-amber-100' },
  { id: 12, name: 'Responsible Consumption and Production', className: 'border-yellow-500/40 bg-yellow-600/15 text-yellow-100' },
  { id: 13, name: 'Climate Action', className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' },
  { id: 14, name: 'Life Below Water', className: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200' },
  { id: 15, name: 'Life on Land', className: 'border-lime-400/40 bg-lime-500/15 text-lime-200' },
  { id: 16, name: 'Peace, Justice and Strong Institutions', className: 'border-blue-400/40 bg-blue-500/15 text-blue-200' },
  { id: 17, name: 'Partnerships for the Goals', className: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200' },
];

/** Extra spellings seen in reports (pdf-parse rarely normalises ampersands). */
const SDG_NAME_VARIANTS: Record<number, string[]> = {
  3: ['Good Health & Well-Being'],
  9: ['Industry, Innovation & Infrastructure'],
  12: ['Responsible Consumption & Production'],
  17: ['Partnership for the Goals'],
};

function detectSdgs(text: string): SdgDef[] {
  const found: SdgDef[] = [];
  for (const sdg of SDG_DEFS) {
    const variants = SDG_NAME_VARIANTS[sdg.id] ?? [];
    const re = new RegExp(
      `\\bsdg\\s*[#:.]?\\s*${sdg.id}\\b|${[sdg.name, ...variants]
        .map(escapeRegex)
        .join('|')}`,
      'i',
    );
    if (re.test(text)) found.push(sdg);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function basename(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

/** pdf-parse returns PDF dates ("D:20250301120000Z") or ISO strings. */
function formatCreationDate(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Unknown date';
  const pdf = /^D:(\d{4})(\d{2})?(\d{2})?/.exec(value.trim());
  if (pdf) {
    const [, year, month, day] = pdf;
    return [year, month, day].filter(Boolean).join('-');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function Pill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-edge-dark bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-zinc-300">
      <Icon className="h-3.5 w-3.5 text-mint" aria-hidden="true" />
      {label}
    </span>
  );
}

function SdgBadge({ sdg }: { sdg: SdgDef }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        sdg.className,
      )}
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-current text-[9px] font-bold text-navy">
        {sdg.id}
      </span>
      {sdg.name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Title bar + header badges
// ---------------------------------------------------------------------------

function TitleBar({ doc, sdgs }: { doc: PdfDocument; sdgs: SdgDef[] }) {
  const title = doc.title || basename(doc.path ?? '') || 'Untitled PDF';
  const metadata = doc.metadata ?? {};
  const author =
    typeof metadata.author === 'string' && metadata.author.trim() !== ''
      ? metadata.author
      : null;
  const creationDate =
    metadata.creationDate !== undefined
      ? metadata.creationDate
      : metadata.CreationDate;

  return (
    <div className="flex flex-col gap-4 border-b border-edge-dark bg-[#121216] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold tracking-tight text-white sm:text-lg">
              {title}
            </h3>
            <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400" title={doc.path}>
              {doc.path ?? 'unknown path'}
            </p>
          </div>
        </div>
        {sdgs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sdgs.slice(0, 6).map((sdg) => (
              <SdgBadge key={sdg.id} sdg={sdg} />
            ))}
            {sdgs.length > 6 && (
              <span className="inline-flex items-center rounded-full border border-edge-dark bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                +{sdgs.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {typeof doc.pages === 'number' && (
          <Pill
            icon={Layers}
            label={`${doc.pages} page${doc.pages === 1 ? '' : 's'}`}
          />
        )}
        {author && <Pill icon={User} label={author} />}
        {creationDate !== undefined && creationDate !== null && (
          <Pill icon={CalendarDays} label={formatCreationDate(creationDate)} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

type ViewMode = 'formatted' | 'flowchart' | 'raw';

const VIEWS: { id: ViewMode; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'formatted', label: 'Formatted Document', short: 'Formatted', icon: FileText },
  { id: 'flowchart', label: 'Interactive Flowchart', short: 'Flowchart', icon: Workflow },
  { id: 'raw', label: 'Raw JSON-RPC', short: 'Raw', icon: FileJson },
];

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="PDF viewer view"
      className="flex flex-wrap items-center gap-1 rounded-lg border border-edge-dark bg-white/[0.04] p-1"
    >
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={value === view.id}
          onClick={() => onChange(view.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
            value === view.id
              ? 'bg-mint text-navy'
              : 'text-body-dark hover:text-white',
          )}
        >
          <view.icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{view.label}</span>
          <span className="sm:hidden">{view.short}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatted Document view
// ---------------------------------------------------------------------------

function FormattedView({ doc, sdgs }: { doc: PdfDocument; sdgs: SdgDef[] }) {
  const cleaned = useMemo(() => cleanPdfText(doc.text ?? ''), [doc.text]);
  const blocks = useMemo(() => splitSections(cleaned), [cleaned]);

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      {sdgs.length > 0 && (
        <div className="rounded-xl border border-edge-dark bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-mint" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              UN Sustainable Development Goals served
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sdgs.map((sdg) => (
              <SdgBadge key={sdg.id} sdg={sdg} />
            ))}
          </div>
        </div>
      )}

      {blocks.map((block, index) => (
        <SectionCard key={index} block={block} />
      ))}
    </div>
  );
}

function SectionCard({ block }: { block: TextBlock }) {
  const Icon = block.section?.icon ?? FileText;
  return (
    <div className="overflow-hidden rounded-xl border border-edge-dark bg-white/[0.03]">
      {block.section && (
        <div className="flex items-center gap-2 border-b border-edge-dark bg-white/[0.02] px-4 py-2.5">
          <Icon className="h-4 w-4 text-mint" aria-hidden="true" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
            {block.section.label}
          </h4>
        </div>
      )}
      <div className="space-y-2.5 p-4 sm:p-5">
        {block.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300"
          >
            {paragraph.join(' ')}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive Flowchart view
// ---------------------------------------------------------------------------

const FLOW_STEPS = [
  {
    title: 'User Trigger',
    sub: 'JSON-RPC tools/call',
    icon: MousePointerClick,
    detail:
      'The presenter clicks the "pdf" button, posting a JSON-RPC envelope to /api/mcp.',
  },
  {
    title: 'Next.js Worker',
    sub: 'Dynamic API route',
    icon: Server,
    detail:
      'The route validates the request and dispatches read_pdf_file from the tool registry.',
  },
  {
    title: 'pdf-parse Engine',
    sub: 'Host file system bridge',
    icon: FileSearch,
    detail:
      'Reads the PDF bytes and extracts text plus metadata from the host machine.',
  },
  {
    title: 'Response Output',
    sub: 'result.content[0].text',
    icon: MonitorCheck,
    detail:
      'The parsed document is stringified and returned inside the JSON-RPC result.',
  },
] as const;

type FlowStep = (typeof FLOW_STEPS)[number];

const PDF_VIEWER_CSS = `
@keyframes pdfviewer-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55),
      0 0 12px 1px rgba(52, 211, 153, 0.45),
      inset 0 0 8px 0 rgba(52, 211, 153, 0.18);
  }
  50% {
    box-shadow: 0 0 30px 6px rgba(52, 211, 153, 0.85),
      0 0 48px 10px rgba(16, 185, 129, 0.4),
      inset 0 0 18px 2px rgba(52, 211, 153, 0.35);
  }
}
@keyframes pdfviewer-halo {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.8; }
}
.pdfviewer-glow { animation: pdfviewer-glow-pulse 1.6s ease-in-out infinite; }
.pdfviewer-halo { animation: pdfviewer-halo 1.6s ease-in-out infinite; }
.pdfviewer-text-glow {
  text-shadow: 0 0 12px rgba(110, 231, 183, 0.9), 0 0 28px rgba(52, 211, 153, 0.6);
}
.pdfviewer-icon-glow {
  box-shadow: 0 0 14px 2px rgba(52, 211, 153, 0.55), 0 0 26px 6px rgba(16, 185, 129, 0.3);
}
`;

function FlowNode({
  step,
  index,
  active,
  onHover,
  onSelect,
}: {
  step: FlowStep;
  index: number;
  active: boolean;
  onHover: (hovered: boolean) => void;
  onSelect: () => void;
}) {
  const Icon = step.icon;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${step.title}${active ? ' — active' : ''}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        'relative flex-1 cursor-pointer rounded-xl border-2 px-4 py-4 transition-all duration-300',
        active
          ? 'pdfviewer-glow scale-[1.03] border-emerald-400 bg-emerald-500/10'
          : 'border-edge-dark bg-white/[0.03] hover:border-white/30',
      )}
    >
      <span
        className={cn(
          'absolute left-3 top-3 font-mono text-[10px] tracking-[0.14em]',
          active ? 'pdfviewer-text-glow text-emerald-300' : 'text-zinc-500',
        )}
      >
        0{index + 1}
      </span>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-all duration-300',
            active
              ? 'pdfviewer-icon-glow border-emerald-400 bg-emerald-400/25 text-emerald-200'
              : 'border-edge-dark bg-white/[0.04] text-zinc-400',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-sm font-bold leading-tight',
              active ? 'pdfviewer-text-glow text-emerald-100' : 'text-white',
            )}
          >
            {step.title}
          </p>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-body-dark">
            {step.sub}
          </p>
        </div>
      </div>

      {active && (
        <>
          <span
            aria-hidden="true"
            className="pdfviewer-halo pointer-events-none absolute -inset-3 -z-10 rounded-2xl bg-emerald-400/25 blur-xl"
          />
          <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_10px_2px_rgba(52,211,153,0.9)]" />
          </span>
        </>
      )}
    </div>
  );
}

function FlowchartView() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const hoveredRef = useRef(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    const id = window.setInterval(() => {
      if (hoveredRef.current) return;
      setActive((current) => (current + 1) % FLOW_STEPS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [playing, reduced]);

  const select = (index: number) => {
    setActive(index);
    setPlaying(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="isolate flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {FLOW_STEPS.map((step, index) => (
          <Fragment key={step.title}>
            <FlowNode
              step={step}
              index={index}
              active={active === index}
              onHover={(hovered) => {
                hoveredRef.current = hovered;
              }}
              onSelect={() => select(index)}
            />
            {index < FLOW_STEPS.length - 1 && (
              <div
                aria-hidden="true"
                className="flex justify-center lg:shrink-0 lg:px-1"
              >
                <ChevronRight
                  className={cn(
                    'h-5 w-5 rotate-90 transition-colors duration-300 lg:rotate-0',
                    active >= index
                      ? 'animate-pulse text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,1)]'
                      : 'text-zinc-600',
                  )}
                />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-body-dark">
        {FLOW_STEPS[active].detail}
      </p>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge-dark px-3 py-1.5 text-xs font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => {
            setActive((current) => (current + 1) % FLOW_STEPS.length);
            setPlaying(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge-dark px-3 py-1.5 text-xs font-semibold text-body-dark transition-colors hover:border-white/40 hover:text-white"
        >
          <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
          Step
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raw JSON-RPC view
// ---------------------------------------------------------------------------

const JSON_TOKEN_RE =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Tiny JSON highlighter — no dependency, just token-coloured spans. */
function highlightJson(source: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  JSON_TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = JSON_TOKEN_RE.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++} className="text-zinc-500">
          {source.slice(lastIndex, match.index)}
        </span>,
      );
    }
    const [, stringToken, colon, keyword] = match;
    const className = colon
      ? 'text-sky-300'
      : stringToken
        ? 'text-emerald-300'
        : keyword
          ? 'text-amber-300'
          : 'text-violet-300';
    nodes.push(
      <span key={key++} className={className}>
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    nodes.push(
      <span key={key++} className="text-zinc-500">
        {source.slice(lastIndex)}
      </span>,
    );
  }
  return nodes;
}

function RawJsonView({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context) — leave the button idle.
    }
  };

  return (
    <div className="flex min-h-[280px] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-edge-dark bg-white/[0.02] px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          Response — untouched
        </p>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors',
            copied
              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
              : 'border-edge-dark text-body-dark hover:border-white/40 hover:text-white',
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      <pre className="max-h-[420px] min-h-[280px] flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed">
        {highlightJson(raw)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorView({ error }: { error: PdfParseError }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 sm:p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-red-200">{error.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-red-200/80">
            {error.message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-white"
      >
        {expanded ? 'Hide' : 'Show'} raw payload
      </button>
      {expanded && (
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-edge-dark bg-[#0a0a0c] p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
          {error.raw}
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PdfViewer({ response, className }: PdfViewerProps) {
  const parsed = useMemo(() => parsePdfResponse(response), [response]);
  const [view, setView] = useState<ViewMode>('formatted');

  const sdgs = useMemo(
    () => (parsed.status === 'ready' ? detectSdgs(parsed.doc.text ?? '') : []),
    [parsed],
  );

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-edge-dark bg-[#0a0a0c]',
        className,
      )}
    >
      <style>{PDF_VIEWER_CSS}</style>

      {parsed.status === 'ready' ? (
        <>
          <TitleBar doc={parsed.doc} sdgs={sdgs} />
          <div className="flex items-center justify-between gap-3 border-b border-edge-dark bg-[#0f0f12] px-3 py-2.5 sm:px-4">
            <SegmentedControl value={view} onChange={setView} />
          </div>
          <div className="min-h-[280px]">
            {view === 'formatted' && (
              <FormattedView doc={parsed.doc} sdgs={sdgs} />
            )}
            {view === 'flowchart' && <FlowchartView />}
            {view === 'raw' && <RawJsonView raw={parsed.raw} />}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-edge-dark bg-[#121216] px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-red-400/40 bg-red-500/10 text-red-400">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-300">
              MCP PDF Viewer
            </h3>
          </div>
          <ErrorView error={parsed} />
        </>
      )}
    </div>
  );
}
