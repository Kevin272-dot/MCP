'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { buildingBlocks } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

export default function BuildingBlocksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    setReduced(reduce);
    if (reduce) return;

    const ctx = gsap.context(() => {
      const rows = rowsRef.current ? gsap.utils.toArray<HTMLElement>('[data-block-row]', rowsRef.current) : [];
      rows.forEach((row, ri) => {
        const chips = row.querySelectorAll<HTMLElement>('[data-example]');

        if (ri === 0) {
          gsap.fromTo(
            chips,
            { scale: 0.4, opacity: 0, rotate: -6 },
            {
              scale: 1,
              opacity: 1,
              rotate: 0,
              duration: 0.5,
              ease: 'back.out(2.2)',
              stagger: 0.07,
              scrollTrigger: { trigger: row, start: 'top 80%', once: true },
            },
          );
        } else if (ri === 1) {
          gsap.fromTo(
            chips,
            { y: 12, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.35,
              ease: 'power2.out',
              stagger: 0.09,
              scrollTrigger: { trigger: row, start: 'top 80%', once: true },
            },
          );
        } else {
          const target = row.querySelector<HTMLElement>('[data-type]');
          const caret = row.querySelector<HTMLElement>('[data-caret]');
          const text = buildingBlocks.rows[ri].examples.join(', ');
          if (target && caret) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: row, start: 'top 78%', once: true },
              onStart: () => {
                caret.style.display = 'inline-block';
              },
            });
            tl.to(
              target,
              {
                duration: 1.4,
                ease: 'none',
                onUpdate: () => {
                  target.textContent = text.slice(0, Math.round(tl.progress() * text.length));
                },
              },
              0,
            );
          }
        }

        gsap.fromTo(
          row.querySelector('[data-row-rail]'),
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 80%', once: true },
          },
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="building-blocks"
      aria-labelledby="building-blocks-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={buildingBlocks.index}>{buildingBlocks.eyebrow}</SectionEyebrow>

        <h2
          id="building-blocks-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {buildingBlocks.title}
        </h2>

        <div ref={rowsRef} className="mt-12 border-y border-dashed border-edge-dark/70">
          {buildingBlocks.rows.map((row, ri) => (
            <div
              key={row.tag}
              data-block-row
              className="group relative grid gap-5 border-b border-dashed border-edge-dark/70 py-8 last:border-b-0 lg:grid-cols-[3rem_1fr] lg:gap-10 lg:py-10"
            >
              <span
                data-row-rail
                aria-hidden="true"
                className="absolute left-0 top-0 hidden h-full w-[2px] origin-top bg-mint/60 lg:block"
              />

              <div className="flex items-start gap-4">
                <span className="font-mono text-xs tracking-[0.2em] text-mint">{row.tag}</span>
                <IconBadge icon={row.icon} size="sm" tone="teal" className="mt-[-6px]" />
              </div>

              <div className="lg:pl-2">
                <h3 className="font-display text-2xl font-bold tracking-tight transition-colors duration-300 group-hover:text-mint">
                  {row.title}
                </h3>
                <p className="mt-2 leading-relaxed text-body-dark">{row.description}</p>

                {ri === 2 ? (
                  <div className="mt-4 font-mono text-sm text-mint">
                    <span data-type>
                      {reduced ? row.examples.join(', ') : ''}
                    </span>
                    <span
                      data-caret
                      aria-hidden="true"
                      style={reduced ? { display: 'none' } : { display: 'none' }}
                      className="caret-blink ml-1 inline-block h-3.5 w-[7px] translate-y-[2px] bg-mint"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.examples.map((ex) => (
                      <span
                        key={ex}
                        data-example
                        className="rounded-full border border-edge-dark/70 bg-white/[0.04] px-3.5 py-1.5 text-xs text-body-dark transition-all duration-150 hover:-translate-y-0.5 hover:border-mint/50 hover:bg-mint/10 hover:text-mint active:scale-95"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
