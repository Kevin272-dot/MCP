# MCP — Understanding the Why and the What

A single-page marketing/explainer site that teaches developers what the Model Context
Protocol is, why it exists, and how it works. Static, dependency-light, no backend.

## Tech stack

- Next.js 14 (App Router) + TypeScript, static export (`output: 'export'`)
- Tailwind CSS v3 with CSS-variable theme tokens (swappable in `app/globals.css`)
- Framer Motion for scroll-reveal and flow animations
- lucide-react icons, next/font (Source Serif 4 + Inter)

## Getting started

```bash
npm install
npm run dev      # local dev
npm run build    # production build + typecheck + lint → out/
npm run typecheck
npm run lint
```

## Structure

- `app/` — layout, page assembly, global styles + theme tokens
- `components/` — one component per section, plus `ui/` primitives
- `content/sections.ts` — all copy lives here, typed and easy to edit
