import { readFile, stat, mkdir, readdir, realpath, writeFile, lstat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import type pdfParseType from 'pdf-parse';

/**
 * pdf-parse is loaded lazily through `createRequire` (NOT a static import)
 * because it ships a CommonJS module that dynamically requires its bundled
 * pdf.js build via a computed path. Bundling it with webpack turns that into
 * an unresolved async chunk that breaks `next build`; `createRequire` keeps it
 * as a plain Node resolution from the real node_modules at runtime.
 */
const nodeRequire = createRequire(__filename);
let pdfParse: typeof pdfParseType | null = null;
function getPdfParse(): typeof pdfParseType {
  if (!pdfParse) {
    pdfParse = nodeRequire('pdf-parse') as typeof pdfParseType;
  }
  return pdfParse;
}

/**
 * HOST system file bridge behind the MCP tools — the "system" sibling of the
 * sandboxed local bridge in `fs.ts`.
 *
 *   read_system_file   ({ path })
 *   write_system_file  ({ path, content })
 *   list_system_dir    ({ path })
 *   read_pdf_file      ({ path })
 *
 * These intentionally reach OUTSIDE the project sandbox so a presenter can
 * demo reading real host files (e.g. `/etc/os-release`) or PDFs parked next to
 * the repo (`180dc/vit materials/<file>.pdf`).
 *
 * SECURITY: every path resolves against a single configured root —
 * `MCP_SYSTEM_ROOT`, defaulting to the OS root `/` — and is verified BEFORE any
 * operation (same literal + symlink escape checks as fs.ts):
 *  1. The literal (string) target must sit inside the realpath'd root.
 *  2. Symlinked parents and entries are resolved and rejected if they escape.
 *
 * This guards against ACCIDENTAL escapes (a stray `..`), it is NOT a hard
 * sandbox — writes can touch anything under the root. Only point it at a root
 * you actually want a demo user to modify.
 */

const CONFIGURED_SYSTEM_ROOT = resolve(process.env.MCP_SYSTEM_ROOT ?? '/');

/** Structured error: `code` is machine-readable, `message` is human. */
export class SystemFileError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SystemFileError';
    this.code = code;
  }
}

export function getSystemRoot(): string {
  return CONFIGURED_SYSTEM_ROOT;
}

function isOutsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel !== '' && (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}

/** Resolve `rawPath` against the system root; throw SystemFileError on escapes. */
async function resolveSystemPath(rawPath: string): Promise<string> {
  if (typeof rawPath !== 'string' || rawPath.trim() === '') {
    throw new SystemFileError('INVALID_PATH', 'Path must be a non-empty string.');
  }
  const root = CONFIGURED_SYSTEM_ROOT;
  const target = resolve(root, rawPath.trim());

  if (isOutsideRoot(root, target)) {
    throw new SystemFileError(
      'PATH_ESCAPE',
      `Path "${rawPath}" escapes the system root "${CONFIGURED_SYSTEM_ROOT}".`,
    );
  }

  const parentReal = await realpath(dirname(target)).catch(() => dirname(target));
  if (isOutsideRoot(root, parentReal)) {
    throw new SystemFileError(
      'SYMLINK_ESCAPE',
      `Path "${rawPath}" resolves outside the system root "${CONFIGURED_SYSTEM_ROOT}" via symlink.`,
    );
  }

  const entryStat = await lstat(target).catch(() => null);
  if (entryStat?.isSymbolicLink()) {
    const entryReal = await realpath(target);
    if (isOutsideRoot(root, entryReal)) {
      throw new SystemFileError(
        'SYMLINK_ESCAPE',
        `Path "${rawPath}" is a symlink that escapes the system root "${CONFIGURED_SYSTEM_ROOT}".`,
      );
    }
  }

  return target;
}

export interface SystemReadFileResult {
  path: string;
  size: number;
  content: string;
}

export async function readSystemFile(args: { path: string }): Promise<SystemReadFileResult> {
  const target = await resolveSystemPath(args.path);
  const info = await stat(target).catch(() => {
    throw new SystemFileError('NOT_FOUND', `"${args.path}" does not exist on the host file system.`);
  });
  if (info.isDirectory()) {
    throw new SystemFileError('IS_DIRECTORY', `"${args.path}" is a directory — use list_system_dir.`);
  }
  const content = await readFile(target, 'utf-8');
  return { path: target, size: info.size, content };
}

export interface SystemWriteFileResult {
  path: string;
  bytes: number;
}

export async function writeSystemFile(args: {
  path: string;
  content: string;
}): Promise<SystemWriteFileResult> {
  const target = await resolveSystemPath(args.path);
  await mkdir(dirname(target), { recursive: true });
  const content = typeof args.content === 'string' ? args.content : '';
  await writeFile(target, content, 'utf-8');
  return { path: target, bytes: Buffer.byteLength(content, 'utf-8') };
}

export type SystemDirEntryType = 'file' | 'directory' | 'symlink' | 'other';

export interface SystemDirEntry {
  name: string;
  type: SystemDirEntryType;
}

export interface SystemListDirResult {
  path: string;
  count: number;
  entries: SystemDirEntry[];
}

export async function listSystemDir(args: { path: string }): Promise<SystemListDirResult> {
  const target = await resolveSystemPath(args.path);
  const info = await stat(target).catch(() => {
    throw new SystemFileError('NOT_FOUND', `"${args.path}" does not exist on the host file system.`);
  });
  if (!info.isDirectory()) {
    throw new SystemFileError('NOT_A_DIRECTORY', `"${args.path}" is not a directory.`);
  }
  const dirents = await readdir(target, { withFileTypes: true });
  const entries: SystemDirEntry[] = dirents
    .map((entry) => {
      const type: SystemDirEntryType = entry.isDirectory()
        ? 'directory'
        : entry.isFile()
          ? 'file'
          : entry.isSymbolicLink()
            ? 'symlink'
            : 'other';
      return { name: entry.name, type };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { path: target, count: entries.length, entries };
}

export interface SystemPdfReadResult {
  path: string;
  pages: number;
  title: string | null;
  metadata: Record<string, unknown>;
  text: string;
}

export async function readPdfFile(args: { path: string }): Promise<SystemPdfReadResult> {
  const target = await resolveSystemPath(args.path);
  const info = await stat(target).catch(() => {
    throw new SystemFileError('NOT_FOUND', `"${args.path}" does not exist on the host file system.`);
  });
  if (info.isDirectory()) {
    throw new SystemFileError('IS_DIRECTORY', `"${args.path}" is a directory — use list_system_dir.`);
  }

  const buffer = await readFile(target);
  let parsed;
  try {
    parsed = await getPdfParse()(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parser error';
    throw new SystemFileError('PDF_PARSE_FAILED', `Could not parse "${args.path}" as a PDF: ${message}`);
  }

  const meta = parsed.info ?? {};
  return {
    path: target,
    pages: parsed.numpages,
    title: typeof meta.Title === 'string' ? meta.Title : null,
    metadata: {
      author: meta.Author ?? null,
      creator: meta.Creator ?? null,
      producer: meta.Producer ?? null,
      creationDate: meta.CreationDate ?? null,
    },
    text: parsed.text.trim(),
  };
}
