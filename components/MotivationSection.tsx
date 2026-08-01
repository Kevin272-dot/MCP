'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motivation } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import MintUnderline from '@/components/ui/MintUnderline';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

const PW = 520;
const PH = 500;
const APP_W = 150;
const APP_X = 20;
const APP_CX = APP_X + APP_W / 2;
const SVC_W = 150;
const SVC_X = PW - 20 - SVC_W;
const SVC_CX = SVC_X + SVC_W / 2;
const APP_YS = [120, 230, 340];
const SVC_YS = [120, 230, 340];
const EXTRA_Y = 448;
const HUB_X = 260;
const HUB_Y = 230;
const NODE_H = 46;

const DIM = { stroke: 'rgb(var(--edge-dark))', width: 1, dash: '3 7' };
const HIGHLIGHTS = [
  { stroke: 'rgb(var(--mint))', width: 2, dash: undefined },
  { stroke: '#ffffff', width: 1.75, dash: '6 5' },
  { stroke: 'rgb(var(--body-on-dark))', width: 1.75, dash: '2 4' },
];

type Pt = { x: number; y: number };

function pointAlong(points: Pt[], t: number): Pt {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  let target = t * total;
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (target <= seg) {
      const f = seg === 0 ? 0 : target / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * f,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * f,
      };
    }
    target -= seg;
  }
  return points[points.length - 1];
}

type NodeProps = {
  x: number;
  y: number;
  label: string;
  active: boolean;
  sub?: string;
  onClick?: () => void;
};

function NodeBox({ x, y, label, active, sub, onClick }: NodeProps) {
  return (
    <g
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(onClick && 'cursor-pointer')}
    >
      <rect
        x={x}
        y={y - NODE_H / 2}
        width={APP_W}
        height={NODE_H}
        rx={8}
        fill="rgb(var(--navy))"
        stroke={active ? 'rgb(245 245 246 / 0.95)' : 'rgb(245 245 246 / 0.22)'}
        strokeWidth={active ? 1.75 : 1}
        className="transition-[fill,stroke] duration-300 hover:fill-white/10"
      />
      <text
        x={x + APP_W / 2}
        y={y + (sub ? -4 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        className={cn('font-mono text-[12.5px] uppercase tracking-[0.08em]', active ? 'fill-white' : 'fill-white/70')}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + APP_W / 2}
          y={y + 14}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-body-dark font-mono text-[8px] uppercase tracking-[0.18em]"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function WarnBadge({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect
        x={x - 6}
        y={y - 6}
        width={12}
        height={12}
        rx={2}
        transform={`rotate(45 ${x} ${y})`}
        fill="rgb(var(--navy))"
        stroke="rgb(var(--mint))"
        strokeWidth={1}
      />
      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" className="fill-mint font-mono text-[9px]">
        !
      </text>
      <text
        x={x}
        y={y + 17}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-body-dark font-mono text-[8.5px] uppercase tracking-[0.1em]"
      >
        {label}
      </text>
    </g>
  );
}

type PanelShellProps = {
  title: string;
  fig: string;
  hint: string;
  stats: ReadonlyArray<{ label: string; value: string }>;
  children: React.ReactNode;
};

function PanelShell({ title, fig, hint, stats, children }: PanelShellProps) {
  return (
    <div data-motivation-panel className="rounded-xl border border-edge-dark bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-body-dark">{fig}</span>
      </div>
      {children}
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-body-dark">{hint}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-edge-dark pt-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-body-dark">{s.label}</dt>
            <dd className="mt-1 font-display text-base font-bold text-white sm:text-lg">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WithoutPanel({
  selected,
  onSelect,
  addService,
  reduced,
}: {
  selected: number;
  onSelect: (i: number) => void;
  addService: boolean;
  reduced: boolean;
}) {
  const stats = addService ? motivation.without.statsExtra : motivation.without.stats;
  return (
    <PanelShell
      title={motivation.without.label}
      fig={motivation.without.fig}
      hint={motivation.without.hint}
      stats={stats}
    >
      <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="Without MCP — every application connects directly to every service" className="mt-4 w-full">
        <text x={APP_CX} y={60} textAnchor="middle" className="fill-body-dark font-mono text-[9px] uppercase tracking-[0.18em]">
          Applications
        </text>
        <text x={SVC_CX} y={60} textAnchor="middle" className="fill-body-dark font-mono text-[9px] uppercase tracking-[0.18em]">
          Services
        </text>

        {motivation.apps.map((_, i) =>
          motivation.services.map((_, j) => {
            const hl = selected === i;
            const style = hl ? HIGHLIGHTS[j] : DIM;
            return (
              <line
                key={`${i}-${j}`}
                x1={APP_CX}
                y1={APP_YS[i]}
                x2={SVC_CX}
                y2={SVC_YS[j]}
                stroke={style.stroke}
                strokeWidth={style.width}
                strokeDasharray={style.dash}
                className={cn(!hl && 'line-flow', 'transition-[stroke,stroke-width] duration-300')}
              />
            );
          }),
        )}

        {addService &&
          motivation.apps.map((_, i) => {
            const hl = selected === i;
            return (
              <line
                key={`x-${i}`}
                x1={APP_CX}
                y1={APP_YS[i]}
                x2={SVC_CX}
                y2={EXTRA_Y}
                stroke={hl ? '#ffffff' : 'rgb(var(--edge-dark))'}
                strokeWidth={hl ? 1.5 : 1}
                strokeDasharray={hl ? '4 4' : '3 7'}
                className={cn(!hl && 'line-flow', 'transition-[stroke,stroke-width] duration-300')}
              />
            );
          })}

        {selected !== null &&
          motivation.services.map((_, j) => (
            <WarnBadge
              key={`w-${j}`}
              x={(APP_CX + SVC_CX) / 2}
              y={(APP_YS[selected] + SVC_YS[j]) / 2}
              label={motivation.without.warnings[j]}
            />
          ))}
        {addService && selected !== null && (
          <WarnBadge x={(APP_CX + SVC_CX) / 2} y={(APP_YS[selected] + EXTRA_Y) / 2} label="Another SDK" />
        )}

        {motivation.apps.map((app, i) => (
          <NodeBox key={app} x={APP_X} y={APP_YS[i]} label={app} active={selected === i} onClick={() => onSelect(i)} />
        ))}
        {motivation.services.map((svc, j) => (
          <NodeBox key={svc} x={SVC_X} y={SVC_YS[j]} label={svc} active={false} />
        ))}
        {addService && <NodeBox x={SVC_X} y={EXTRA_Y} label={motivation.extraService} active={false} />}

        {!reduced && selected !== null && (
          <circle
            className="animate-pulse-slow"
            r={4}
            fill="rgb(var(--mint))"
            opacity="0.7"
            cx={(APP_CX + SVC_CX) / 2}
            cy={(APP_YS[selected] + SVC_YS[0]) / 2}
          />
        )}
      </svg>
    </PanelShell>
  );
}

function WithPanel({
  selected,
  onSelect,
  addService,
  reduced,
}: {
  selected: number;
  onSelect: (i: number) => void;
  addService: boolean;
  reduced: boolean;
}) {
  const dotRef = useRef<SVGCircleElement>(null);
  const stats = addService ? motivation.with.statsExtra : motivation.with.stats;

  useLayoutEffect(() => {
    const dot = dotRef.current;
    if (!dot || reduced) {
      if (dot) dot.setAttribute('opacity', '0');
      return;
    }
    let cancelled = false;
    gsap.killTweensOf(dot);
    const cycle = [0, 1, 2];
    let k = 0;
    const run = () => {
      if (cancelled || !dot) return;
      const j = cycle[k % cycle.length];
      const pts: Pt[] = [
        { x: APP_CX, y: APP_YS[selected] },
        { x: HUB_X, y: HUB_Y },
        { x: SVC_CX, y: SVC_YS[j] },
      ];
      const proxy = { p: 0 };
      dot.setAttribute('opacity', '1');
      gsap.to(proxy, {
        p: 1,
        duration: 1.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          const pt = pointAlong(pts, proxy.p);
          dot.setAttribute('cx', String(pt.x));
          dot.setAttribute('cy', String(pt.y));
        },
        onComplete: () => {
          k += 1;
          window.setTimeout(run, 700);
        },
      });
    };
    run();
    return () => {
      cancelled = true;
      gsap.killTweensOf(dot);
    };
  }, [selected, addService, reduced]);

  return (
    <PanelShell title={motivation.with.label} fig={motivation.with.fig} hint={motivation.with.hint} stats={stats}>
      <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="With MCP — every application routes through a central protocol hub" className="mt-4 w-full">
        <text x={APP_CX} y={60} textAnchor="middle" className="fill-body-dark font-mono text-[9px] uppercase tracking-[0.18em]">
          Applications
        </text>
        <text x={SVC_CX} y={60} textAnchor="middle" className="fill-body-dark font-mono text-[9px] uppercase tracking-[0.18em]">
          Services
        </text>

        {motivation.apps.map((_, i) => (
          <line
            key={`a-${i}`}
            x1={APP_CX}
            y1={APP_YS[i]}
            x2={HUB_X}
            y2={HUB_Y}
            stroke={selected === i ? 'rgb(var(--mint))' : 'rgb(var(--edge-dark))'}
            strokeWidth={selected === i ? 2 : 1}
            className="transition-[stroke,stroke-width] duration-300"
          />
        ))}
        {motivation.services.map((_, j) => (
          <line
            key={`s-${j}`}
            x1={HUB_X}
            y1={HUB_Y}
            x2={SVC_CX}
            y2={SVC_YS[j]}
            stroke={selected !== null ? 'rgb(var(--mint))' : 'rgb(var(--edge-dark))'}
            strokeWidth={selected !== null ? 1.75 : 1}
            className="transition-[stroke,stroke-width] duration-300"
          />
        ))}
        {addService && (
          <line
            x1={HUB_X}
            y1={HUB_Y}
            x2={SVC_CX}
            y2={EXTRA_Y}
            stroke={selected !== null ? 'rgb(var(--mint))' : 'rgb(var(--edge-dark))'}
            strokeWidth={selected !== null ? 1.5 : 1}
            className="transition-[stroke,stroke-width] duration-300"
          />
        )}

        <g className="drop-shadow-[0_0_16px_rgba(245,245,246,0.28)]">
          <rect
            x={HUB_X - 95}
            y={HUB_Y - NODE_H / 2}
            width={190}
            height={NODE_H}
            rx={10}
            fill="rgb(var(--navy))"
            stroke="rgb(var(--mint))"
            strokeWidth={1.5}
          />
          <text x={HUB_X} y={HUB_Y - 4} textAnchor="middle" dominantBaseline="central" className="fill-white font-mono text-[13px] uppercase tracking-[0.1em]">
            {motivation.with.hub}
          </text>
          <text x={HUB_X} y={HUB_Y + 14} textAnchor="middle" dominantBaseline="central" className="fill-body-dark font-mono text-[8px] uppercase tracking-[0.18em]">
            one protocol
          </text>
        </g>

        {motivation.apps.map((app, i) => (
          <NodeBox key={app} x={APP_X} y={APP_YS[i]} label={app} active={selected === i} onClick={() => onSelect(i)} />
        ))}
        {motivation.services.map((svc, j) => (
          <NodeBox key={svc} x={SVC_X} y={SVC_YS[j]} label={svc} active={false} />
        ))}
        {addService && <NodeBox x={SVC_X} y={EXTRA_Y} label={motivation.extraService} active={false} />}

        <circle ref={dotRef} r={5} fill="rgb(var(--mint))" opacity="0" />
      </svg>
    </PanelShell>
  );
}

export default function MotivationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState(0);
  const [addService, setAddService] = useState(false);

  useLayoutEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-motivation-panel]',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="motivation"
      aria-labelledby="motivation-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={motivation.index}>{motivation.eyebrow}</SectionEyebrow>

        <h2
          id="motivation-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {motivation.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body-dark">{motivation.intro}</p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-body-dark">
            Select an application in either panel
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={addService}
            onClick={() => setAddService((v) => !v)}
            className="flex items-center gap-3 rounded-lg border border-edge-dark px-4 py-2.5 transition-colors duration-150 hover:border-white/40"
          >
            <span className="text-sm font-semibold text-white">Add a service — {motivation.extraService}</span>
            <span className={cn('relative h-5 w-9 rounded-full transition-colors duration-200', addService ? 'bg-mint' : 'bg-edge-dark')}>
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200',
                  addService ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
              />
            </span>
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <WithoutPanel selected={selected} onSelect={setSelected} addService={addService} reduced={reduced} />
          <WithPanel selected={selected} onSelect={setSelected} addService={addService} reduced={reduced} />
        </div>

        <div className="mt-10 rounded-md bg-white p-8 text-navy sm:p-10 lg:mt-14">
          <p className="relative inline-block font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {motivation.callout.text}
            <MintUnderline className="mt-1 block h-4 w-full text-navy/40" />
          </p>
          <p className="mt-3 font-mono text-xs tracking-wide text-navy/60">{motivation.callout.aside}</p>
        </div>
      </div>
    </section>
  );
}
