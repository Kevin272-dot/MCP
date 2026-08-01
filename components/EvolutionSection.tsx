'use client';

import { useLayoutEffect, useRef } from 'react';
import { evolution } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

export default function EvolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-stage]',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 76%', once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="evolution"
      aria-labelledby="evolution-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={evolution.index}>{evolution.eyebrow}</SectionEyebrow>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h2
            id="evolution-title"
            className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
          >
            {evolution.title}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-body-dark">{evolution.subhead}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:mt-14">
          {evolution.stages.map((stage) => (
            <div
              key={stage.step}
              data-stage
              className={cn(
                'relative flex flex-col overflow-hidden rounded-2xl border p-8 sm:p-10',
                stage.highlighted ? 'border-mint/50 bg-mint/5' : 'border-edge-dark bg-white/[0.04]',
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-6 top-4 select-none font-display text-7xl font-bold text-white/[0.05]"
              >
                {stage.step}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Stage {stage.step}</span>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">{stage.title}</h3>
              <p className="mt-3 leading-relaxed text-body-dark">{stage.description}</p>
              {stage.highlighted && (
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border-2 border-mint px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-mint">
                  {evolution.arrival}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
