/**
 * Minimal ambient types for `pdf-parse` (CJS, ships no .d.ts).
 *
 * `export =` matches the CommonJS `module.exports = PDF` shape; with
 * `esModuleInterop` enabled a default import (`import pdfParse from 'pdf-parse'`)
 * resolves to the exported callable.
 */

declare module 'pdf-parse' {
  interface PdfParseMetadata {
    info?: Record<string, unknown>;
    metadata?: unknown;
    version?: string;
  }

  interface PdfParseResult extends PdfParseMetadata {
    numpages: number;
    numrender: number;
    text: string;
  }

  interface PdfParseOptions {
    pagerender?: (page: unknown) => Promise<string>;
    max?: number;
    version?: string | 'default';
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;

  export = pdfParse;
}
