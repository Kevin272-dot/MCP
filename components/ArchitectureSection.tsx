'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { architecture } from '@/content/sections';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

type Node = (typeof architecture.nodes)[number];

function FlowNode({ node, register }: { node: Node; register: (id: string, el: HTMLElement | null) => void }) {
  return (
    <div
      ref={(el) => register(node.id, el)}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border bg-[#141416] px-2 py-5 text-center',
        node.protocol ? 'border-mint/50' : 'border-edge-dark',
      )}
    >
      <IconBadge icon={node.icon} size="md" tone={node.protocol ? 'mint' : 'teal'} />
      <p className={cn('node-title text-sm font-semibold leading-tight', node.protocol ? 'text-mint' : 'text-white')}>
        {node.label}
      </p>
      <p className="text-xs leading-snug text-body-dark">{node.caption}</p>
    </div>
  );
}

function ProtocolGroup({ register }: { register: (id: string, el: HTMLElement | null) => void }) {
  const client = architecture.nodes[2];
  const server = architecture.nodes[3];
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full items-stretch gap-2 rounded-md border-2 border-mint/40 bg-mint/5 p-2">
        <FlowNode node={client} register={register} />
        <div className="flex items-center text-mint" aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </div>
        <FlowNode node={server} register={register} />
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-mint">
        Protocol layer
      </p>
    </div>
  );
}

export default function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const stage = stageRef.current;
    const svg = svgRef.current;
    const line = lineRef.current;
    const pulse = pulseRef.current;
    if (!stage || !svg || !line || !pulse) return;

    let pulseTween: gsap.core.Tween | null = null;
    let ro: ResizeObserver | null = null;
    let lengths: number[] = [];
    let total = 0;
    let activeId: string | null = null;

    const highlightNode = (p: number) => {
      if (lengths.length === 0) return;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < lengths.length; i++) {
        const frac = lengths[i] / total;
        const d = Math.abs(frac - p);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      const id = architecture.nodes[best].id;
      if (id === activeId) return;
      if (activeId) {
        const prev = nodeRefs.current.get(activeId);
        if (prev) {
          prev.classList.remove('arch-node-active');
          gsap.to(prev, { scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
        }
      }
      const next = nodeRefs.current.get(id);
      if (next) {
        next.classList.add('arch-node-active');
        gsap.to(next, { scale: 1.06, y: -4, duration: 0.35, ease: 'power2.out' });
      }
      activeId = id;
    };

    const build = () => {
      const stageRect = stage.getBoundingClientRect();
      const pts = architecture.nodes.map((n) => {
        const el = nodeRefs.current.get(n.id);
        const r = el ? el.getBoundingClientRect() : { left: stageRect.left, top: stageRect.top, width: 0, height: 0 };
        return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 };
      });
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      line.setAttribute('d', d);
      pulse.setAttribute('d', d);

      total = 0;
      lengths = [0];
      for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        lengths.push(total);
      }

      pulseTween?.kill();
      if (reduce) {
        line.style.opacity = '0.5';
        pulse.style.opacity = '0';
        return;
      }
      line.style.opacity = '1';
      const state = { offset: total, p: 0 };
      pulseTween = gsap.fromTo(
        state,
        { offset: total, p: 0 },
        {
          offset: -total,
          p: 1,
          duration: 2.6,
          ease: 'none',
          repeat: -1,
          paused: true,
          onUpdate() {
            pulse.setAttribute('stroke-dashoffset', String(state.offset));
            highlightNode(state.p);
          },
        },
      );
    };

    const drawLine = () => {
      if (reduce) return;
      const len = line.getTotalLength();
      gsap.fromTo(
        line,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: stage, start: 'top 72%', once: true },
          onComplete() {
            line.style.strokeDasharray = 'none';
            line.style.strokeDashoffset = 'none';
            pulseTween?.play();
          },
        },
      );
    };

    build();
    drawLine();
    ro = new ResizeObserver(() => build());
    ro.observe(stage);

    const ctx = gsap.context(() => {
      gsap.fromTo('[data-arch-def]', { y: 24, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: stage, start: 'top 60%', once: true },
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      ro?.disconnect();
      pulseTween?.kill();
      activeId = null;
    };
  }, [isDesktop]);

  const [user, host, , , service] = architecture.nodes;
  const register = (id: string, el: HTMLElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  return (
    <section id="architecture" aria-labelledby="architecture-title" className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24">
      <Grain />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[24%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[26vw] font-bold leading-none text-white/[0.03]"
      >
        {architecture.giant}
      </span>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={architecture.index}>{architecture.eyebrow}</SectionEyebrow>

        <h2
          id="architecture-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {architecture.title}
        </h2>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body-dark">{architecture.intro}</p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-body-dark">{architecture.fig}</p>

        <div ref={stageRef} className="relative mt-8">
          <svg
            ref={svgRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
            fill="none"
          >
            <path ref={lineRef} stroke="rgb(var(--edge-dark))" strokeWidth="1.5" />
            <path
              ref={pulseRef}
              stroke="rgb(var(--mint))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="0.1 24"
              opacity="0"
            />
          </svg>

          {isDesktop ? (
            <div className="relative z-10 hidden items-stretch gap-2 lg:flex">
              <FlowNode node={user} register={register} />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <FlowNode node={host} register={register} />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <ProtocolGroup register={register} />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <FlowNode node={service} register={register} />
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-stretch gap-2">
              <FlowNode node={user} register={register} />
              <div className="flex justify-center py-1 text-mint" aria-hidden="true">
                <ChevronDown className="h-6 w-6" />
              </div>
              <FlowNode node={host} register={register} />
              <div className="flex justify-center py-1 text-mint" aria-hidden="true">
                <ChevronDown className="h-6 w-6" />
              </div>
              <div className="rounded-md border-2 border-mint/40 bg-mint/5 p-2">
                <FlowNode node={architecture.nodes[2]} register={register} />
                <div className="flex justify-center py-1 text-mint" aria-hidden="true">
                  <ChevronDown className="h-6 w-6" />
                </div>
                <FlowNode node={architecture.nodes[3]} register={register} />
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-mint">
                  Protocol layer
                </p>
              </div>
              <div className="flex justify-center py-1 text-mint" aria-hidden="true">
                <ChevronDown className="h-6 w-6" />
              </div>
              <FlowNode node={service} register={register} />
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:mt-12">
          {architecture.defs.map((def) => (
            <div
              key={def.term}
              data-arch-def
              className="rounded-md border border-edge-dark bg-white/5 p-6"
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-mint">{def.term}</p>
              <p className="mt-2 text-sm leading-relaxed text-body-dark">{def.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
