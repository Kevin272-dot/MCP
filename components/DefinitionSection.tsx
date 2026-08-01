'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { definition } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

const RINGS = [
  { inset: '5%', rotate: -90, dash: '2 7' },
  { inset: '17%', rotate: 130, dash: 'none' },
  { inset: '29%', rotate: -220, dash: '5 11' },
] as const;

export default function DefinitionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    setReduced(reduce);
    if (reduce) return;

    const ctx = gsap.context(() => {
      const diagram = diagramRef.current;
      if (!diagram) return;

      gsap.fromTo(
        diagram,
        { scale: 0.9, rotate: -2 },
        {
          scale: 1.05,
          rotate: 2,
          ease: 'none',
          scrollTrigger: { trigger: diagram, start: 'top 85%', end: 'top 25%', scrub: true },
        },
      );

      const rings = gsap.utils.toArray<HTMLElement>('[data-ring]');
      rings.forEach((ring, i) => {
        gsap.to(ring, {
          rotate: RINGS[i % RINGS.length].rotate,
          ease: 'none',
          scrollTrigger: { trigger: diagram, start: 'top 85%', end: 'top 25%', scrub: true },
        });
      });

      gsap.fromTo(
        '[data-sat-pulse]',
        { opacity: 1, scale: 1 },
        {
          opacity: 0.5,
          scale: 1.6,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: diagram, start: 'top 85%', end: 'top 40%', scrub: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="definition"
      aria-labelledby="definition-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={definition.index}>{definition.eyebrow}</SectionEyebrow>

        <h2
          id="definition-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {definition.title}
        </h2>

        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          <div>
            <ul>
              {definition.bullets.map((bullet) => (
                <li key={bullet.text} className="flex items-start gap-4 border-b border-edge-dark/60 py-5 first:pt-0 last:border-0 last:pb-0">
                  <bullet.icon className="mt-1 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                  <p className="leading-relaxed text-body-dark">{bullet.text}</p>
                </li>
              ))}
            </ul>

            <blockquote className="mt-8 border-l-2 border-mint pl-5">
              <p className="font-display text-xl font-semibold leading-snug sm:text-2xl">{definition.quote}</p>
            </blockquote>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-body-dark">{definition.fig}</p>
          </div>

          <div
            ref={diagramRef}
            className="relative mx-auto aspect-square w-[min(78vw,26rem)] will-change-transform"
            aria-hidden="true"
          >
            <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-mint font-display text-2xl font-bold text-navy shadow-[0_0_80px_-20px_rgba(255,255,255,0.45)]">
              MCP
            </div>

            {RINGS.map((ring, i) => (
              <div
                key={i}
                data-ring
                className={cn('absolute rounded-full border', ring.dash === 'none' ? 'border-edge-dark/70' : 'border-dashed border-edge-dark')}
                style={{ inset: ring.inset }}
              >
                <span
                  className={cn(
                    'absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
                    i % 2 === 0 ? 'bg-mint' : 'bg-teal',
                  )}
                />
                <span
                  data-sat-pulse
                  className={cn(
                    'absolute bottom-0 left-[16%] h-2 w-2 rounded-full',
                    i % 2 === 0 ? 'bg-teal' : 'bg-mint',
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
