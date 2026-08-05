/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: was `output: 'export'` — removed so the live `/api/mcp` serverless
  // route (Puppeteer + @sparticuz/chromium) can actually run. The marketing
  // pages still render identically; they now require `next start`/Vercel
  // instead of a pure static export.
  images: { unoptimized: true },

  experimental: {
    // Keep the headless-browser packages OUT of the webpack bundle so
    // @sparticuz/chromium's `bin/` folder (the compressed Chromium payload)
    // is resolved from the real node_modules at runtime. (pdf-parse is loaded
    // via `createRequire` in lib/mcp/system.ts instead, because its dynamic
    // `./pdf.js/${version}/build/pdf.js` require cannot be webpack-bundled.)
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'pdf-parse'],
    // Ship the Chromium + pdf-parse payloads alongside the `/api/mcp` function.
    outputFileTracingIncludes: {
      '/api/mcp': [
        './node_modules/@sparticuz/chromium/bin/**',
        './node_modules/pdf-parse/**',
      ],
    },
  },
};

export default nextConfig;
