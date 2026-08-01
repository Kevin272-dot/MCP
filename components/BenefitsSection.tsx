'use client';

import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { benefits } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

function MarqueeHalf({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10 whitespace-nowrap"
    >
      {benefits.tiles.map((tile) => (
        <li key={tile.label} className="flex items-center gap-10">
          <span className="font-display text-xl font-semibold text-navy/70 sm:text-2xl">{tile.label}</span>
          <span aria-hidden="true" className="h-2 w-2 rotate-45 bg-navy/30" />
        </li>
      ))}
    </ul>
  );
}

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = calloutRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.style.clipPath = 'none';
        return;
      }
      gsap.fromTo(
        el,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const CtaIcon = benefits.callout.cta.icon;

  return (
    <section
      id="benefits"
      aria-labelledby="benefits-title"
      className="scroll-mt-20 overflow-hidden bg-light py-14 text-navy lg:py-24"
    >
      <div aria-hidden="true" className="flex overflow-hidden border-y border-navy/15 bg-white/60">
        <div className="marquee-track flex">
          <MarqueeHalf />
          <MarqueeHalf hidden />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={benefits.index}>{benefits.eyebrow}</SectionEyebrow>

        <h2
          id="benefits-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {benefits.title}
        </h2>

        <div ref={calloutRef} className="mt-10 rounded-2xl bg-navy p-8 will-change-[clip-path] text-white sm:p-12 lg:mt-14">
          <p className="max-w-3xl font-display text-2xl font-bold leading-snug sm:text-3xl lg:text-[2.2rem]">
            {benefits.callout.text}
          </p>
          <motion.a
            href={benefits.callout.cta.href}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-navy"
          >
            <CtaIcon className="h-4 w-4 text-navy" aria-hidden="true" />
            {benefits.callout.cta.label}
          </motion.a>
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-navy/70">
          FIG. 5 — next steps
        </p>
      </div>
    </section>
  );
}
