'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, StepForward } from 'lucide-react';
import { simulation } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

const W = 960;
const H = 460;
const APP_X = 40;
const APP_W = 170;
const APP_CX = APP_X + APP_W / 2;
const SVC_X = W - 210;
const SVC_W = 170;
const SVC_CX = SVC_X + SVC_W / 2;
const YS = [120, 230, 340];
const HUB_CX = W / 2;
const HUB_Y = 230;

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

function wrapText(text: string, max = 58): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if ((cur + ' ' + word).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = word;
    } else {
      cur += ' ' + word;
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}

type NodeBoxProps = {
  x: number;
  y: number;
  label: string;
  active: boolean;
  sub?: string;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
};

function NodeBox({ x, y, label, active, sub, onClick, onHover, onLeave }: NodeBoxProps) {
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
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y - 28}
        width={170}
        height={56}
        rx={8}
        fill="rgb(var(--navy))"
        stroke={active ? 'rgb(245 245 246 / 0.95)' : 'rgb(245 245 246 / 0.22)'}
        strokeWidth={active ? 1.75 : 1}
        className="transition-[fill,stroke] duration-300 hover:fill-white/10"
      />
      <text
        x={x + 85}
        y={y + (sub ? -4 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        className={cn('font-mono text-[13px] uppercase tracking-[0.12em]', active ? 'fill-white' : 'fill-white/70')}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + 85}
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

type HoverState = { title: string; body: string };

export default function SimulationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const pulseRefs = useRef<(SVGCircleElement | null)[][]>(Array.from({ length: 3 }, () => Array(3).fill(null)));
  const [reduced, setReduced] = useState(false);
  const [mode, setMode] = useState<'without' | 'with'>('without');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [status, setStatus] = useState('Select an application or service to trace a request.');
  const [last, setLast] = useState<{ app: number; svc: number } | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const clearActive = useCallback(() => {
    sectionRef.current?.querySelectorAll('.sim-line-active').forEach((el) => el.classList.remove('sim-line-active'));
  }, []);

  const runPulse = useCallback(
    (appIdx: number, svcIdx: number, m: 'without' | 'with') => {
      const dot = dotRef.current;
      if (!dot || reduced) return;
      gsap.killTweensOf(dot);
      const points: Pt[] =
        m === 'without'
          ? [
              { x: APP_CX, y: YS[appIdx] },
              { x: SVC_CX, y: YS[svcIdx] },
            ]
          : [
              { x: APP_CX, y: YS[appIdx] },
              { x: HUB_CX, y: HUB_Y },
              { x: SVC_CX, y: YS[svcIdx] },
            ];
      const proxy = { p: 0 };
      dot.setAttribute('opacity', '1');
      gsap.to(proxy, {
        p: 1,
        duration: 1.5 / speed,
        ease: 'power1.inOut',
        onUpdate: () => {
          const pt = pointAlong(points, proxy.p);
          dot.setAttribute('cx', String(pt.x));
          dot.setAttribute('cy', String(pt.y));
        },
        onComplete: () => {
          gsap.to(dot, { opacity: 0, duration: 0.5, delay: 0.4 });
        },
      });
    },
    [reduced, speed],
  );

  const runRequest = useCallback(
    (appIdx: number, svcIdx: number, m: 'without' | 'with') => {
      const app = simulation.apps[appIdx];
      const svc = simulation.services[svcIdx];
      clearActive();
      const lineSel =
        m === 'without'
          ? `[data-line-without="${appIdx}-${svcIdx}"]`
          : `[data-line-with-app="${appIdx}"], [data-line-with-svc="${svcIdx}"]`;
      sectionRef.current?.querySelectorAll(lineSel).forEach((el) => el.classList.add('sim-line-active'));
      setStatus(m === 'without' ? `${app} → ${svc} · dedicated integration` : `${app} → MCP → ${svc}`);
      setLast({ app: appIdx, svc: svcIdx });
      runPulse(appIdx, svcIdx, m);
    },
    [clearActive, runPulse],
  );

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduced) return;
    if (!playing) return;
    const intervalMs = (mode === 'without' ? 4200 : 3600) / speed;
    const id = window.setInterval(() => {
      if (mode === 'without') {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const dot = pulseRefs.current[i][j];
            if (!dot) continue;
            gsap.killTweensOf(dot);
            const pts: Pt[] = [
              { x: APP_CX, y: YS[i] },
              { x: SVC_CX, y: YS[j] },
            ];
            const proxy = { p: 0 };
            dot.setAttribute('opacity', '0.9');
            gsap.to(proxy, {
              p: 1,
              duration: 1.3 / speed,
              delay: (i * 3 + j) * 0.16,
              ease: 'power1.inOut',
              onUpdate: () => {
                const pt = pointAlong(pts, proxy.p);
                dot.setAttribute('cx', String(pt.x));
                dot.setAttribute('cy', String(pt.y));
              },
              onComplete: () => {
                gsap.to(dot, { opacity: 0, duration: 0.35, delay: 0.2 });
              },
            });
          }
        }
      } else {
        const app = Math.floor(Math.random() * simulation.apps.length);
        const svc = Math.floor(Math.random() * simulation.services.length);
        runRequest(app, svc, 'with');
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, mode, speed, reduced, runRequest]);

  useEffect(() => {
    setStatus(
      mode === 'without'
        ? 'Without MCP — every application maintains its own connection to every service.'
        : 'With MCP — applications connect once to the protocol; servers expose each service once.',
    );
    setLast(null);
    setHover(null);
    clearActive();
    if (dotRef.current) dotRef.current.setAttribute('opacity', '0');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const dot = pulseRefs.current[i][j];
        if (dot) {
          gsap.killTweensOf(dot);
          dot.setAttribute('opacity', '0');
        }
      }
    }
  }, [mode, clearActive]);

  const servicePayload = mode === 'without' ? simulation.payloads.serviceErr : simulation.payloads.serviceOk;

  return (
    <section
      id="demonstration"
      aria-labelledby="demonstration-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={simulation.index}>{simulation.eyebrow}</SectionEyebrow>

        <h2
          id="demonstration-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {simulation.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body-dark">{simulation.intro}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-edge-dark bg-white/[0.04] p-1">
            {(['without', 'with'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150',
                  mode === m ? 'bg-white text-navy' : 'text-body-dark hover:text-white',
                )}
              >
                {m === 'without' ? simulation.withoutLabel : simulation.withLabel}
              </button>
            ))}
          </div>

          {!reduced && (
            <div className="flex rounded-lg border border-edge-dark bg-white/[0.04] p-1" aria-label="Playback speed">
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-150',
                    speed === s ? 'bg-white text-navy' : 'text-body-dark hover:text-white',
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          {!reduced && (
            <button
              type="button"
              onClick={() => {
                const app = Math.floor(Math.random() * simulation.apps.length);
                const svc = Math.floor(Math.random() * simulation.services.length);
                runRequest(app, svc, mode);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-edge-dark px-4 py-2 text-sm font-semibold text-body-dark transition-colors duration-150 hover:border-white/40 hover:text-white"
            >
              <StepForward className="h-4 w-4" aria-hidden="true" />
              Step
            </button>
          )}

          {!reduced && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause animation' : 'Play animation'}
              className="inline-flex items-center gap-2 rounded-lg border border-edge-dark px-4 py-2 text-sm font-semibold text-body-dark transition-colors duration-150 hover:border-white/40 hover:text-white"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {playing ? 'Pause' : 'Play'}
            </button>
          )}

          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-body-dark">
            {mode === 'without' ? simulation.counts.without : simulation.counts.with}
          </p>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Diagram comparing how an AI request reaches a service with and without MCP"
          className="mt-8 w-full"
        >
          <text x={APP_CX} y={44} textAnchor="middle" className="fill-body-dark font-mono text-[10px] uppercase tracking-[0.18em]">
            AI applications
          </text>
          <text x={SVC_CX} y={44} textAnchor="middle" className="fill-body-dark font-mono text-[10px] uppercase tracking-[0.18em]">
            external services
          </text>

          {mode === 'without' ? (
            <g className="transition-opacity duration-300">
              {simulation.apps.map((_, i) =>
                simulation.services.map((_, j) => (
                  <line
                    key={`${i}-${j}`}
                    data-line-without={`${i}-${j}`}
                    x1={APP_CX}
                    y1={YS[i]}
                    x2={SVC_CX}
                    y2={YS[j]}
                    stroke="rgb(var(--edge-dark))"
                    strokeWidth="1"
                    className="transition-[stroke,stroke-width] duration-300"
                  />
                )),
              )}
            </g>
          ) : (
            <g className="transition-opacity duration-300">
              {simulation.apps.map((_, i) => (
                <line
                  key={`app-${i}`}
                  data-line-with-app={i}
                  x1={APP_CX}
                  y1={YS[i]}
                  x2={HUB_CX}
                  y2={HUB_Y}
                  stroke="rgb(var(--edge-dark))"
                  strokeWidth="1"
                  className="transition-[stroke,stroke-width] duration-300"
                />
              ))}
              {simulation.services.map((_, j) => (
                <line
                  key={`svc-${j}`}
                  data-line-with-svc={j}
                  x1={HUB_CX}
                  y1={HUB_Y}
                  x2={SVC_CX}
                  y2={YS[j]}
                  stroke="rgb(var(--edge-dark))"
                  strokeWidth="1"
                  className="transition-[stroke,stroke-width] duration-300"
                />
              ))}
            </g>
          )}

          {mode === 'without' &&
            simulation.apps.map((app, i) =>
              NodeBox({
                x: APP_X,
                y: YS[i],
                label: app,
                active: last?.app === i,
                onClick: () => {
                  const svc = Math.floor(Math.random() * simulation.services.length);
                  runRequest(i, svc, 'without');
                },
                onHover: () => setHover({ title: app, body: simulation.payloads.app }),
                onLeave: () => setHover(null),
              }),
            )}
          {mode === 'without' &&
            simulation.services.map((svc, j) =>
              NodeBox({
                x: SVC_X,
                y: YS[j],
                label: svc,
                active: last?.svc === j,
                onClick: () => {
                  const app = Math.floor(Math.random() * simulation.apps.length);
                  runRequest(app, j, 'without');
                },
                onHover: () => setHover({ title: `${svc} — custom SDK`, body: servicePayload }),
                onLeave: () => setHover(null),
              }),
            )}

          {mode === 'with' &&
            simulation.apps.map((app, i) =>
              NodeBox({
                x: APP_X,
                y: YS[i],
                label: app,
                active: last?.app === i,
                onClick: () => {
                  const svc = Math.floor(Math.random() * simulation.services.length);
                  runRequest(i, svc, 'with');
                },
                onHover: () => setHover({ title: app, body: simulation.payloads.app }),
                onLeave: () => setHover(null),
              }),
            )}
          {mode === 'with' &&
            simulation.services.map((svc, j) =>
              NodeBox({
                x: SVC_X,
                y: YS[j],
                label: svc,
                active: last?.svc === j,
                onClick: () => {
                  const app = Math.floor(Math.random() * simulation.apps.length);
                  runRequest(app, j, 'with');
                },
                onHover: () => setHover({ title: `${svc} — MCP server`, body: servicePayload }),
                onLeave: () => setHover(null),
              }),
            )}

          {mode === 'with' && (
            <>
              <g onMouseEnter={() => setHover({ title: simulation.client, body: simulation.payloads.client })} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                <text x={HUB_CX} y={HUB_Y - 44} textAnchor="middle" className="fill-white/60 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {simulation.client}
                </text>
              </g>
              <g
                onMouseEnter={() => setHover({ title: simulation.hub, body: simulation.payloads.server })}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer drop-shadow-[0_0_16px_rgba(245,245,246,0.28)]"
              >
                <rect x={HUB_CX - 100} y={HUB_Y - 28} width={200} height={56} rx={8} fill="rgb(var(--navy))" stroke="rgb(var(--mint))" strokeWidth={1.5} />
                <text x={HUB_CX} y={HUB_Y} textAnchor="middle" dominantBaseline="central" className="fill-white font-mono text-[13px] uppercase tracking-[0.12em]">
                  {simulation.hub}
                </text>
              </g>
            </>
          )}

          {mode === 'without' &&
            simulation.apps.map((_, i) =>
              simulation.services.map((_, j) => (
                <circle key={`p-${i}-${j}`} ref={(el) => { pulseRefs.current[i][j] = el; }} r="4" fill="rgb(var(--mint))" opacity="0" />
              )),
            )}
          {mode === 'with' && <circle ref={dotRef} r="6" fill="rgb(var(--mint))" opacity="0" />}

          {hover && (
            <g className="pointer-events-none">
              <rect x={W - 392} y={56} width={376} height={hover && wrapText(hover.body).length * 16 + 34} rx={8} fill="rgb(var(--navy))" stroke="rgb(245 245 246 / 0.35)" strokeWidth={1} />
              <text x={W - 380} y={74} className="fill-mint font-mono text-[10px] uppercase tracking-[0.15em]">
                {hover.title}
              </text>
              {wrapText(hover.body).map((line, i) => (
                <text key={i} x={W - 380} y={94 + i * 16} className="fill-body-dark font-mono text-[11px]">
                  {line}
                </text>
              ))}
            </g>
          )}
        </svg>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {simulation.stats[mode].map((s) => (
            <div key={s.label} className="rounded-lg border border-edge-dark bg-white/[0.03] px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-body-dark">{s.label}</p>
              <p className="mt-1 font-display text-lg font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-edge-dark pt-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <p className="max-w-xl font-mono text-xs leading-relaxed text-body-dark">{status}</p>
          <p className="max-w-md text-sm leading-relaxed text-body-dark lg:text-right">
            {mode === 'without' ? simulation.caption.without : simulation.caption.with}
          </p>
        </div>
      </div>
    </section>
  );
}
