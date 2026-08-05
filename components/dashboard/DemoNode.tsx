"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { McpStep } from "@/lib/mcp/events";

/**
 * The visual building block of the dashboard canvas.
 *
 * `data.active` is driven by the dashboard's animated execution queue: while the
 * matching pipeline stage is being shown, the node flares emerald — bright
 * 2px border, deep glow, scale pop, pulse ring and a spinning spinner — so the
 * light-up is unmistakable on a projector. `data.done` leaves a permanent
 * emerald tint once a step has completed; idle nodes sit muted and dim.
 */

export interface DemoNodeData extends Record<string, unknown> {
  step: McpStep;
  title: string;
  sub: string;
  active: boolean;
  done: boolean;
  bright: boolean;
}

/** The React Flow node type that carries DemoNodeData. */
export type DemoNodeType = Node<DemoNodeData>;

function DemoNodeInner({ data }: NodeProps<DemoNodeType>) {
  const { step, title, sub, active, done, bright } = data;
  const idle = !active && !done;
  const lit = active || done;
  return (
    <div
      role="figure"
      aria-label={`${step}: ${title} — ${active ? "active" : done ? "done" : "idle"}`}
      className={cn(
        "relative w-[230px] rounded-xl border-2 px-5 py-4 transition-all duration-300",
        bright
          ? active
            ? "scale-105 border-emerald-500 bg-emerald-50 text-navy shadow-[0_0_20px_rgba(52,211,153,0.35)]"
            : done
              ? "border-emerald-300 bg-emerald-100 text-navy"
              : "border-zinc-200 bg-white text-zinc-700 opacity-85"
          : active
            ? "scale-105 border-emerald-400 bg-emerald-950/60 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
            : done && !active
              ? "border-emerald-800/70 bg-emerald-950/20 text-zinc-300"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-500 opacity-60",
      )}
    >
      {/* Incoming edge attaches on the left, outgoing edge exits on the right. */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!h-2.5 !w-2.5 !border-none",
          lit ? "!bg-emerald-400" : "!bg-zinc-600",
        )}
      />

      {/* Active: soft pulse ring + spinning "working" indicator. */}
      {active && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px animate-pulse rounded-xl ring-2 ring-emerald-300/70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent"
          />
        </>
      )}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md border font-mono text-sm font-bold transition-colors duration-300",
            bright
              ? active
                ? "border-emerald-500 bg-emerald-400 text-navy"
                : idle
                  ? "border-zinc-200 bg-white text-zinc-500"
                  : "border-emerald-300 bg-emerald-100 text-emerald-800"
              : active
                ? "border-emerald-300 bg-emerald-400 text-navy"
                : idle
                  ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                  : "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
          )}
        >
          {step}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-semibold leading-tight",
              bright
                ? active
                  ? "text-navy"
                  : done
                    ? "text-navy"
                    : "text-zinc-700"
                : active
                  ? "text-emerald-200"
                  : done
                    ? "text-zinc-200"
                    : "text-zinc-500",
            )}
          >
            {title}
          </p>
          {/* Secondary label (e.g. "USER INPUT", "DISCOVERY HANDLER") — must stay
              legible on the dark node: zinc-300, not the dimmer body-dark. */}
          <p
            className={cn(
              "mt-1 truncate font-mono text-[11px] uppercase tracking-[0.14em]",
              bright
                ? active
                  ? "text-emerald-700"
                  : done
                    ? "text-zinc-700"
                    : "text-zinc-500"
                : active
                  ? "text-emerald-300/90"
                  : done
                    ? "text-zinc-400"
                    : "text-zinc-600",
            )}
          >
            {sub}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-2.5 !w-2.5 !border-none",
          lit ? "!bg-emerald-400" : "!bg-zinc-600",
        )}
      />
    </div>
  );
}

export default memo(DemoNodeInner);
