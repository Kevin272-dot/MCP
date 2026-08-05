import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/**
 * Local file system bridge behind the MCP tools:
 *
 *   read_local_file  ({ path })
 *   write_local_file ({ path, content })
 *   list_local_dir   ({ path })
 *
 * SECURITY: every path is resolved against a single allowed root and verified
 * BEFORE any operation:
 *  1. `ALLOWED_ROOT` = `process.env.MCP_FS_ROOT`, falling back to the process
 *     working directory (the project root) when unset.
 *  2. The literal (string) target must sit inside the realpath'd root — so
 *     `../`, absolute paths, and separator tricks cannot escape it.
 *  3. Symlinks are resolved and rejected if their real target (file itself or
 *     its parent directory) lands outside the root.
 *
 * This is defense for *accidental* escapes (a stray `..` in an argument),
 * not a sandbox boundary — run the app as a dedicated low-privilege user if
 * you need a hard guarantee.
 */

const CONFIGURED_ROOT = resolve(process.env.MCP_FS_ROOT ?? process.cwd());

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

// Resolve the root once per process: create it if needed, then realpath it so
// the prefix check compares against a symlink-free canonical path.
let rootPromise: Promise<string> | null = null;

export function getAllowedRoot(): Promise<string> {
  if (!rootPromise) {
    rootPromise = (async () => {
      await mkdir(CONFIGURED_ROOT, { recursive: true });
      return realpath(CONFIGURED_ROOT);
    })();
  }
  return rootPromise;
}

function isOutsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel !== '' && (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}

/**
 * Resolve `rawPath` against the allowed root and throw FileSystemError unless
 * both the literal path AND its (possibly symlinked) real location are inside.
 */
async function resolveSafe(rawPath: string): Promise<string> {
  if (typeof rawPath !== 'string' || rawPath.trim() === '') {
    throw new FileSystemError('Path must be a non-empty string.');
  }
  const root = await getAllowedRoot();
  const target = resolve(root, rawPath.trim());

  // 1) Literal path check — blocks `..` traversal, absolute paths, etc.
  if (isOutsideRoot(root, target)) {
    throw new FileSystemError(
      `Path "${rawPath}" escapes the allowed root "${CONFIGURED_ROOT}".`,
    );
  }

  // 2) Symlink check on the parent directory (covers writes to fresh files).
  const parentReal = await realpath(dirname(target)).catch(() => dirname(target));
  if (isOutsideRoot(root, parentReal)) {
    throw new FileSystemError(
      `Path "${rawPath}" resolves outside the allowed root "${CONFIGURED_ROOT}" via symlink.`,
    );
  }

  // 3) Symlink check on the entry itself (covers reads of symlinked files).
  const entryStat = await lstat(target).catch(() => null);
  if (entryStat?.isSymbolicLink()) {
    const entryReal = await realpath(target);
    if (isOutsideRoot(root, entryReal)) {
      throw new FileSystemError(
        `Path "${rawPath}" is a symlink that escapes the allowed root "${CONFIGURED_ROOT}".`,
      );
    }
  }

  return target;
}

export interface ReadFileResult {
  path: string;
  size: number;
  content: string;
}

export async function readLocalFile(args: { path: string }): Promise<ReadFileResult> {
  const target = await resolveSafe(args.path);
  const info = await stat(target);
  if (info.isDirectory()) {
    throw new FileSystemError(`"${args.path}" is a directory — use list_local_dir.`);
  }
  const content = await readFile(target, 'utf-8');
  return { path: target, size: info.size, content };
}

export interface WriteFileResult {
  path: string;
  bytes: number;
}

export async function writeLocalFile(args: {
  path: string;
  content: string;
}): Promise<WriteFileResult> {
  const target = await resolveSafe(args.path);
  await mkdir(dirname(target), { recursive: true });
  const content = typeof args.content === 'string' ? args.content : '';
  await writeFile(target, content, 'utf-8');
  return { path: target, bytes: Buffer.byteLength(content, 'utf-8') };
}

export type DirEntryType = 'file' | 'directory' | 'symlink' | 'other';

export interface DirEntry {
  name: string;
  type: DirEntryType;
}

export interface ListDirResult {
  path: string;
  count: number;
  entries: DirEntry[];
}

export async function listLocalDir(args: { path: string }): Promise<ListDirResult> {
  const target = await resolveSafe(args.path);
  const info = await stat(target);
  if (!info.isDirectory()) {
    throw new FileSystemError(`"${args.path}" is not a directory.`);
  }
  const dirents = await readdir(target, { withFileTypes: true });
  const entries: DirEntry[] = dirents
    .map((entry) => {
      const type: DirEntryType = entry.isDirectory()
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
