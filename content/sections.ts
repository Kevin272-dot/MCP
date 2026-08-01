import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  ArrowDown,
  BadgeCheck,
  BookOpen,
  Cable,
  Database,
  FileText,
  FolderOpen,
  Gauge,
  Github,
  Globe,
  Link2,
  MessageSquareText,
  MonitorSmartphone,
  PlugZap,
  Recycle,
  Repeat2,
  Server,
  ShieldCheck,
  Unplug,
  User,
  Wrench,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* 1. Hero                                                            */
/* ------------------------------------------------------------------ */
export const hero = {
  eyebrow: 'Model Context Protocol',
  title: [
    { text: 'Understanding the ', accent: false },
    { text: 'Why', accent: true },
    { text: ' and the ', accent: false },
    { text: 'What', accent: true },
  ] as const,
  subhead: 'An open standard for connecting AI to the systems it relies on',
  supporting:
    'Models are powerful in isolation, yet limited without context. MCP is the open protocol that lets them reach real systems — tools, data sources, and services — through a single, consistent interface.',
  primaryCta: { label: 'See how it works', href: '#architecture', icon: ArrowDown },
  secondaryCta: { label: 'Read the spec', href: 'https://modelcontextprotocol.io', icon: BookOpen },
  scrollHint: 'Scroll',
};

/* ------------------------------------------------------------------ */
/* 2. The Problem                                                     */
/* ------------------------------------------------------------------ */
export const problem = {
  index: '01',
  eyebrow: 'The Problem',
  title: 'AI cannot reach the context it needs.',
  intro: 'Models reason brilliantly, yet remain cut off from the tools, documents, and data that make their answers useful.',
  cards: [
    {
      title: 'No Access',
      description: 'A model cannot read your inbox, query your database, or inspect the files you are actually working with.',
      icon: Unplug,
    },
    {
      title: 'Duplicated Work',
      description: 'Every AI application builds its own integration for the same services, repeating the effort at each vendor.',
      icon: Repeat2,
    },
    {
      title: 'High Maintenance',
      description: 'Inconsistent implementations grow harder to maintain as each one drifts toward bespoke behavior.',
      icon: Wrench,
    },
  ] as const,
  callout: {
    text: 'MCP gives AI one standard way to reach the outside world.',
    underline: 'standard',
    icon: PlugZap,
  },
};

/* ------------------------------------------------------------------ */
/* 3. The Journey                                                     */
/* ------------------------------------------------------------------ */
export const evolution = {
  index: '02',
  eyebrow: 'The Journey',
  title: 'How we got here',
  subhead: 'From isolated models to a shared standard',
  stages: [
    {
      step: '01',
      title: 'Standalone Language Models',
      description: 'Early models operated in isolation, with no way to reach external systems.',
      highlighted: false,
    },
    {
      step: '02',
      title: 'Custom API Integrations',
      description: 'Applications introduced proprietary connectors, each tailored to a single vendor.',
      highlighted: false,
    },
    {
      step: '03',
      title: 'Model Context Protocol',
      description: 'A common protocol that lets any AI application connect to any compatible server.',
      highlighted: true,
    },
  ] as const,
  arrival: 'the standard',
};

/* ------------------------------------------------------------------ */
/* 4. The Definition                                                  */
/* ------------------------------------------------------------------ */
export const definition = {
  index: '03',
  eyebrow: 'The Definition',
  title: 'What is Model Context Protocol?',
  fig: 'FIG. 1 — one hub, many connections',
  bullets: [
    {
      icon: BadgeCheck,
      text: 'An open standard — free to read, free to build on, with no vendor lock-in.',
    },
    {
      icon: Zap,
      text: 'Live context, delivered at query time rather than inferred from stale training data.',
    },
    {
      icon: Globe,
      text: 'Vendor-neutral by design: it does not depend on any specific model, application, or stack.',
    },
  ] as const,
  quote: 'As HTTP standardized communication between browsers and servers, MCP standardizes communication between AI applications and the systems they use.',
};

/* ------------------------------------------------------------------ */
/* 5. The Motivation                                                  */
/* ------------------------------------------------------------------ */
export const motivation = {
  index: '04',
  eyebrow: 'The Motivation',
  title: 'Why MCP exists',
  intro:
    'The same three applications, wired to the same three services — two ways. Select an application in either panel and watch how the connections behave.',
  apps: ['Claude Desktop', 'Cursor IDE', 'Custom Agent'],
  services: ['Gmail', 'GitHub', 'PostgreSQL'],
  extraService: 'Slack',
  without: {
    label: 'Without MCP',
    fig: 'FIG. 3 — the mesh',
    warnings: ['Broken API update', 'Duplicate auth token', 'Drifting schema'],
    stats: [
      { label: 'Direct integrations', value: '9' },
      { label: 'Custom SDKs', value: '9' },
      { label: 'Maintenance load', value: 'High' },
    ],
    statsExtra: [
      { label: 'Direct integrations', value: '12' },
      { label: 'Custom SDKs', value: '12' },
      { label: 'Maintenance load', value: 'Higher' },
    ],
    hint: 'One line per app × service. Every pair is a bespoke integration.',
  },
  with: {
    label: 'With MCP',
    fig: 'FIG. 4 — the hub',
    client: 'MCP Client',
    hub: 'MCP Server',
    stats: [
      { label: 'Connections', value: '6' },
      { label: 'Protocol', value: 'JSON-RPC 2.0' },
      { label: 'Codebase footprint', value: '−65%' },
    ],
    statsExtra: [
      { label: 'Connections', value: '7' },
      { label: 'Protocol', value: 'JSON-RPC 2.0' },
      { label: 'Codebase footprint', value: '−70%' },
    ],
    hint: 'Each app connects once. The hub exposes each service once.',
  },
  callout: {
    text: 'MCP is the standard interface for AI connectivity.',
    aside: 'One protocol, defined once, consumed by every compatible application.',
    underline: 'standard interface',
  },
};

/* ------------------------------------------------------------------ */
/* 5. The Demonstration (interactive with/without MCP)                */
/* ------------------------------------------------------------------ */
export const simulation = {
  index: '05',
  eyebrow: 'The Demonstration',
  title: 'What changes, in practice',
  intro:
    'Two ways to wire an AI application to the same services. Toggle between the architectures and watch a request travel end to end.',
  withoutLabel: 'Without MCP',
  withLabel: 'With MCP',
  apps: ['App A', 'App B', 'App C'],
  services: ['Gmail', 'GitHub', 'Database'],
  hub: 'MCP Server',
  client: 'MCP Client',
  counts: {
    without: '3 apps × 3 services = 9 direct integrations',
    with: '6 connections, one protocol',
  },
  caption: {
    without:
      'Every application implements its own connector for every service. Nine bespoke integrations, nine ways to drift.',
    with: 'Every application speaks one protocol. Each service exposes one server. Requests route through a single standard.',
  },
  payloads: {
    app: '{ "query": "<prompt>", "model": "claude-sonnet", "tools": ["gmail.list", "github.read"] }',
    client: '{ "method": "tools/call", "params": { "name": "github.create_issue" } }',
    server: '{ "name": "github", "tools": 9, "schema": "JSON-RPC 2.0" }',
    serviceOk: '{ "status": "ok", "latency": "120ms" }',
    serviceErr: '{ "status": "error", "sdk": "custom", "drift": "v2.3" }',
  },
  stats: {
    without: [
      { label: 'Integrations', value: '9' },
      { label: 'Maintenance load', value: 'High' },
      { label: 'Protocol overhead', value: 'N/A — custom SDKs' },
    ],
    with: [
      { label: 'Integrations', value: '1 hub + 3 servers' },
      { label: 'Codebase footprint', value: '−65%' },
      { label: 'Schema', value: 'JSON-RPC 2.0' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 6. Architecture                                                    */
/* ------------------------------------------------------------------ */
export const architecture = {
  index: '06',
  eyebrow: 'The Architecture',
  title: 'How it actually fits together',
  intro: 'A single request passes through five components — no custom integration required.',
  fig: 'FIG. 2 — the request path',
  giant: 'MCP',
  nodes: [
    { id: 'user', label: 'User', caption: 'You, asking the question', icon: User, protocol: false },
    { id: 'host', label: 'Host', caption: 'The AI app you’re using', icon: AppWindow, protocol: false },
    { id: 'client', label: 'MCP Client', caption: 'Protocol client in the host', icon: Cable, protocol: true },
    { id: 'server', label: 'MCP Server', caption: 'Exposes tools, data & prompts', icon: Server, protocol: true },
    { id: 'service', label: 'External Service', caption: 'Gmail, GitHub, databases…', icon: Database, protocol: false },
  ] as const,
  defs: [
    {
      term: 'Host',
      description: 'The AI application a user talks to — Claude Desktop, an IDE, a web app. It loads one client per connection.',
    },
    {
      term: 'MCP Client',
      description: 'Lives inside the host and keeps a 1:1 connection with a single MCP server.',
    },
    {
      term: 'MCP Server',
      description: 'The middleman that gives the client access to external tools, data, and prompts.',
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 7. Core Building Blocks                                            */
/* ------------------------------------------------------------------ */
export const buildingBlocks = {
  index: '07',
  eyebrow: 'The Building Blocks',
  title: 'What MCP is made of',
  rows: [
    {
      tag: '§01',
      title: 'Resources',
      description: 'Information the AI can read.',
      examples: ['PDFs', 'databases', 'markdown files', 'spreadsheets'],
      icon: FolderOpen,
    },
    {
      tag: '§02',
      title: 'Tools',
      description: 'Actions the AI can perform.',
      examples: ['Send email', 'execute SQL', 'create a GitHub issue'],
      icon: Wrench,
    },
    {
      tag: '§03',
      title: 'Prompts',
      description: 'Reusable instructions provided by servers.',
      examples: ['Standardized templates for common tasks'],
      icon: MessageSquareText,
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 8. Key Benefits + Closing CTA                                      */
/* ------------------------------------------------------------------ */
export const benefits = {
  index: '08',
  eyebrow: 'The Payoff',
  title: 'Why it’s worth it',
  tiles: [
    { icon: Link2, label: 'Standardized Integrations' },
    { icon: Recycle, label: 'Reusable Ecosystem' },
    { icon: Gauge, label: 'Reduced Dev Effort' },
    { icon: ShieldCheck, label: 'Secure & Permissioned' },
    { icon: MonitorSmartphone, label: 'Cross-Platform Interoperability' },
  ] as const,
  callout: {
    text: 'You now understand what MCP is and why it matters. The specification is the next step.',
    cta: { label: 'Read the spec', href: 'https://modelcontextprotocol.io', icon: BookOpen },
  },
};

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */
export const footer = {
  credit:
    'An independent explainer of the Model Context Protocol, the open standard for connecting AI to context.',
  links: [
    { label: 'GitHub', href: 'https://github.com', icon: Github },
    { label: 'Spec', href: 'https://modelcontextprotocol.io/specification', icon: FileText },
    { label: 'Docs', href: 'https://modelcontextprotocol.io/introduction', icon: BookOpen },
  ] as const,
};

export type SectionIcon = LucideIcon;
