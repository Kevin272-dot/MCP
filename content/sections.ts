import type { LucideIcon } from "lucide-react";
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* 1. Hero                                                            */
/* ------------------------------------------------------------------ */
export const hero = {
  eyebrow: "MCP in plain English",
  title: [
    { text: "MCP  made  ", accent: false },
    { text: "simple", accent: true },
  ] as const,
  subhead: "One shared way for AI apps to use tools and data",
  supporting: "MCP replaces custom wiring with one standard connection.",
  primaryCta: {
    label: "Explore the guide",
    href: "#architecture",
    icon: ArrowDown,
  },
  secondaryCta: {
    label: "Open the spec",
    href: "https://modelcontextprotocol.io",
    icon: BookOpen,
  },
  scrollHint: "Scroll down",
};

/* ------------------------------------------------------------------ */
/* 2. The Problem                                                     */
/* ------------------------------------------------------------------ */
export const problem = {
  index: "01",
  eyebrow: "The Problem",
  title: "AI needs access.",
  intro: "Without a shared protocol, every app builds its own connections.",
  cards: [
    {
      title: "No access",
      description: "The model cannot use files or data until it is connected.",
      icon: Unplug,
    },
    {
      title: "Duplicate work",
      description: "Teams rebuild the same integrations over and over.",
      icon: Repeat2,
    },
    {
      title: "Hard to maintain",
      description:
        "When APIs change, custom connectors break in different places.",
      icon: Wrench,
    },
  ] as const,
  callout: {
    text: "MCP gives AI one standard way to connect.",
    underline: "standard",
    icon: PlugZap,
  },
};

/* ------------------------------------------------------------------ */
/* 3. The Journey                                                     */
/* ------------------------------------------------------------------ */
export const evolution = {
  index: "02",
  eyebrow: "The Journey",
  title: "How MCP emerged",
  subhead: "From no access to one shared standard",
  stages: [
    {
      step: "01",
      title: "Just the model",
      description: "Early models could answer, but not reach outside systems.",
      highlighted: false,
    },
    {
      step: "02",
      title: "Custom integrations",
      description: "Every app added its own connector for every service.",
      highlighted: false,
    },
    {
      step: "03",
      title: "Model Context Protocol",
      description:
        "One protocol that lets AI apps connect to compatible servers.",
      highlighted: true,
    },
  ] as const,
  arrival: "the standard",
};

/* ------------------------------------------------------------------ */
/* 4. The Definition                                                  */
export const definition = {
  index: "03",
  eyebrow: "The Definition",
  title: "What MCP is",
  fig: "FIG. 1 — one hub, many connections",
  bullets: [
    {
      icon: BadgeCheck,
      text: "An open standard anyone can read and build on.",
    },
    {
      icon: Zap,
      text: "Live context, delivered when the user asks.",
    },
    {
      icon: Globe,
      text: "Vendor-neutral across apps and stacks.",
    },
  ] as const,
  quote: "Think USB-C for AI tools: one plug, many devices.",
};

/* ------------------------------------------------------------------ */
/* 5. The Motivation                                                  */
/* ------------------------------------------------------------------ */
export const motivation = {
  index: "04",
  eyebrow: "The Motivation",
  title: "Why MCP exists",
  intro: "Without MCP, integrations become a web. With MCP, they become a hub.",
  apps: ["Claude Desktop", "Cursor IDE", "Custom Agent"],
  services: ["Gmail", "GitHub", "PostgreSQL"],
  extraService: "Slack",
  without: {
    label: "Without MCP",
    fig: "FIG. 3 — the mesh",
    warnings: ["One API changes", "Auth gets repeated", "Schemas drift apart"],
    stats: [
      { label: "Direct integrations", value: "9" },
      { label: "Custom SDKs", value: "9" },
      { label: "Maintenance load", value: "High" },
    ],
    statsExtra: [
      { label: "Direct integrations", value: "12" },
      { label: "Custom SDKs", value: "12" },
      { label: "Maintenance load", value: "Higher" },
    ],
    hint: "Each app talks to every service on its own.",
  },
  with: {
    label: "With MCP",
    fig: "FIG. 4 — the hub",
    client: "MCP Client",
    hub: "MCP Server",
    stats: [
      { label: "Connections", value: "6" },
      { label: "Protocol", value: "JSON-RPC 2.0" },
      { label: "Codebase footprint", value: "−65%" },
    ],
    statsExtra: [
      { label: "Connections", value: "7" },
      { label: "Protocol", value: "JSON-RPC 2.0" },
      { label: "Codebase footprint", value: "−70%" },
    ],
    hint: "Each app connects once. Each service is described once.",
  },
  callout: {
    text: "MCP is the standard layer for AI connectivity.",
    aside: "One protocol, defined once, reused everywhere.",
    underline: "standard interface",
  },
};

/* ------------------------------------------------------------------ */
/* 5. The Demonstration (interactive with/without MCP)                */
/* ------------------------------------------------------------------ */
export const simulation = {
  index: "05",
  eyebrow: "The Demonstration",
  title: "How it works",
  intro: "Toggle between the two setups to see the difference.",
  withoutLabel: "Without MCP",
  withLabel: "With MCP",
  apps: ["App A", "App B", "App C"],
  services: ["Gmail", "GitHub", "Database"],
  hub: "MCP Server",
  client: "MCP Client",
  counts: {
    without: "3 apps × 3 services = 9 integrations",
    with: "6 connections, one protocol",
  },
  caption: {
    without: "Every app builds its own connector for every service.",
    with: "Every app speaks one protocol.",
  },
  payloads: {
    app: '{ "query": "<prompt>", "model": "claude-sonnet", "tools": ["gmail.list", "github.read"] }',
    client:
      '{ "method": "tools/call", "params": { "name": "github.create_issue" } }',
    server: '{ "name": "github", "tools": 9, "schema": "JSON-RPC 2.0" }',
    serviceOk: '{ "status": "ok", "latency": "120ms" }',
    serviceErr: '{ "status": "error", "sdk": "custom", "drift": "v2.3" }',
  },
  stats: {
    without: [
      { label: "Integrations", value: "9" },
      { label: "Maintenance load", value: "High" },
      { label: "Protocol overhead", value: "N/A — custom SDKs" },
    ],
    with: [
      { label: "Integrations", value: "1 hub + 3 servers" },
      { label: "Codebase footprint", value: "−65%" },
      { label: "Schema", value: "JSON-RPC 2.0" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 6. Architecture                                                    */
/* ------------------------------------------------------------------ */
export const architecture = {
  index: "06",
  eyebrow: "The Architecture",
  title: "How it fits",
  intro: "One request moves through five pieces.",
  fig: "FIG. 2 — the request path",
  giant: "MCP",
  nodes: [
    {
      id: "user",
      label: "User",
      caption: "You, asking the question",
      icon: User,
      protocol: false,
    },
    {
      id: "host",
      label: "Host",
      caption: "The AI app you are using",
      icon: AppWindow,
      protocol: false,
    },
    {
      id: "client",
      label: "MCP Client",
      caption: "The connector inside the app",
      icon: Cable,
      protocol: true,
    },
    {
      id: "server",
      label: "MCP Server",
      caption: "Shows tools, data, and prompts",
      icon: Server,
      protocol: true,
    },
    {
      id: "service",
      label: "External Service",
      caption: "Gmail, GitHub, databases, and more",
      icon: Database,
      protocol: false,
    },
  ] as const,
  defs: [
    {
      term: "Host",
      description:
        "The AI app the user talks to, like Claude Desktop, an IDE, or a web app.",
    },
    {
      term: "MCP Client",
      description:
        "Lives inside the host and keeps one connection to one MCP server.",
    },
    {
      term: "MCP Server",
      description:
        "The middle layer that gives the client access to tools, data, and prompts.",
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 7. Core Building Blocks                                            */
/* ------------------------------------------------------------------ */
export const buildingBlocks = {
  index: "07",
  eyebrow: "The Building Blocks",
  title: "What MCP shares",
  rows: [
    {
      tag: "§01",
      title: "Resources",
      description: "Things the AI can read.",
      examples: ["PDFs", "files", "notes", "spreadsheets"],
      icon: FolderOpen,
    },
    {
      tag: "§02",
      title: "Tools",
      description: "Things the AI can do.",
      examples: ["Send email", "run SQL", "create a GitHub issue"],
      icon: Wrench,
    },
    {
      tag: "§03",
      title: "Prompts",
      description: "Reusable instructions from servers.",
      examples: ["Simple templates for common tasks"],
      icon: MessageSquareText,
    },
  ] as const,
};

/* ------------------------------------------------------------------ */
/* 8. Key Benefits + Closing CTA                                      */
/* ------------------------------------------------------------------ */
export const benefits = {
  index: "08",
  eyebrow: "The Payoff",
  title: "Why it helps",
  tiles: [
    { icon: Link2, label: "Standard integrations" },
    { icon: Recycle, label: "Reusable ecosystem" },
    { icon: Gauge, label: "Less dev effort" },
    { icon: ShieldCheck, label: "Permissioned access" },
    { icon: MonitorSmartphone, label: "Works across platforms" },
  ] as const,
  callout: {
    text: "You now know what MCP is, why it matters, and why the mesh gets messy.",
    cta: {
      label: "Open the spec",
      href: "https://modelcontextprotocol.io",
      icon: BookOpen,
    },
  },
};

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */
export const footer = {
  credit: "A short explainer of the Model Context Protocol.",
  links: [
    { label: "GitHub", href: "https://github.com", icon: Github },
    {
      label: "Spec",
      href: "https://modelcontextprotocol.io/specification",
      icon: FileText,
    },
    {
      label: "Docs",
      href: "https://modelcontextprotocol.io/introduction",
      icon: BookOpen,
    },
  ] as const,
};

export type SectionIcon = LucideIcon;
