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
  Sparkles,
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
  subhead: '(the plot twist AI needed 🎬)',
  supporting:
    'MCP is an open standard that connects AI models to the tools, data, and services they live beside — one protocol, every integration.',
  primaryCta: { label: 'See how it works', href: '#architecture', icon: ArrowDown },
  secondaryCta: { label: 'Read the spec', href: 'https://modelcontextprotocol.io', icon: BookOpen },
};

/* ------------------------------------------------------------------ */
/* 2. The Problem                                                     */
/* ------------------------------------------------------------------ */
export const problem = {
  eyebrow: 'The Problem 😩',
  title: 'Why do we need MCP?',
  intro: 'Modern AI models are built different 🧠💪 — but tragically offline.',
  cards: [
    {
      title: 'No Access 🔌',
      description: 'Models can’t reach emails, databases, files, or APIs on their own.',
      icon: Unplug,
    },
    {
      title: 'Duplicated Work 🔁',
      description: 'Every AI app builds its own custom integration from scratch.',
      icon: Repeat2,
    },
    {
      title: 'High Maintenance ⚙️',
      description: 'Inconsistent implementations pile up across every app and vendor.',
      icon: Wrench,
    },
  ] as const,
  callout: {
    text: 'MCP introduces one standard way for AI to interact with external systems. Finally. 🙌',
    icon: Sparkles,
  },
};

/* ------------------------------------------------------------------ */
/* 3. The Journey                                                     */
/* ------------------------------------------------------------------ */
export const evolution = {
  eyebrow: 'The Journey 🗺️',
  title: 'Evolution of AI assistants',
  stages: [
    {
      step: '01',
      title: 'Standalone Language Models',
      description: 'Generate text and answer questions — no external tools, no live data.',
      highlighted: false,
    },
    {
      step: '02',
      title: 'Custom API Integrations',
      description: 'Every app hand-builds its own Gmail, GitHub, or database connector.',
      highlighted: false,
    },
    {
      step: '03',
      title: 'Model Context Protocol ✨',
      description: 'One common protocol across every AI application.',
      highlighted: true,
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 4. The Definition                                                  */
/* ------------------------------------------------------------------ */
export const definition = {
  eyebrow: 'The Definition 📖',
  title: 'What is Model Context Protocol?',
  bullets: [
    {
      icon: BadgeCheck,
      text: 'An open standard, published openly and free to implement for anyone.',
    },
    {
      icon: Zap,
      text: 'Connects models to live context and real-time data — not just training data.',
    },
    {
      icon: Globe,
      text: 'Vendor-neutral and interoperable across every AI app and tool.',
    },
  ] as const,
  quote: 'Like HTTP standardizes web communication, MCP standardizes AI communication.',
};

/* ------------------------------------------------------------------ */
/* 5. The Motivation                                                  */
/* ------------------------------------------------------------------ */
export const motivation = {
  eyebrow: 'The Motivation 🧭',
  title: 'Why was MCP created?',
  without: {
    emoji: '😩',
    title: 'Without MCP',
    points: [
      'Fragmented, one-off integrations for every app',
      'Repeated effort rebuilding the same connectors',
      'Inconsistent behavior across vendors',
    ],
  },
  with: {
    emoji: '😌',
    title: 'With MCP',
    points: [
      'Build one server — any compatible AI can use it',
      'One integration, reused everywhere',
      'Consistent, predictable behavior',
    ],
  },
  callout: {
    text: 'MCP is the USB-C for AI. ⚡ (we’re SO done with 15 cables)',
    icon: PlugZap,
  },
};

/* ------------------------------------------------------------------ */
/* 6. Architecture                                                    */
/* ------------------------------------------------------------------ */
export const architecture = {
  eyebrow: 'The Architecture 🏗️',
  title: 'How it fits together',
  intro: 'A request flows from the person, through the host, and out to an external service — all over one protocol.',
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
  eyebrow: 'The Building Blocks 🧱',
  title: 'What MCP is made of',
  rows: [
    {
      icon: FolderOpen,
      title: 'Resources 📄',
      description: 'Information the AI can read.',
      examples: ['PDFs', 'databases', 'markdown files', 'spreadsheets'],
    },
    {
      icon: Wrench,
      title: 'Tools 🛠️',
      description: 'Actions the AI can perform.',
      examples: ['Send email', 'execute SQL', 'create a GitHub issue'],
    },
    {
      icon: MessageSquareText,
      title: 'Prompts 💬',
      description: 'Reusable instructions provided by servers.',
      examples: ['Standardized templates for common tasks'],
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 8. Key Benefits + Closing CTA                                      */
/* ------------------------------------------------------------------ */
export const benefits = {
  eyebrow: 'The Payoff 🎯',
  title: 'Why it’s worth it',
  tiles: [
    { icon: Link2, label: 'Standardized Integrations' },
    { icon: Recycle, label: 'Reusable Ecosystem' },
    { icon: Gauge, label: 'Reduced Dev Effort' },
    { icon: ShieldCheck, label: 'Secure & Permissioned' },
    { icon: MonitorSmartphone, label: 'Cross-Platform Interoperability' },
  ] as const,
  callout: {
    text: 'Now that we understand what MCP is and why it exists, let’s see how it works in practice. 🚀',
  },
  cta: { label: 'Read the spec', href: 'https://modelcontextprotocol.io', icon: BookOpen },
};

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */
export const footer = {
  credit:
    'MCP is an open standard for connecting AI to context. This page is a plain-language explainer — no affiliation, just enthusiasm.',
  links: [
    { label: 'GitHub', href: '#', icon: Github },
    { label: 'Spec', href: '#', icon: FileText },
    { label: 'Docs', href: '#', icon: BookOpen },
  ] as const,
};

export type SectionIcon = LucideIcon;
