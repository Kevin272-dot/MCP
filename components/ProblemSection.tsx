'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { problem } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';
import MintUnderline from '@/components/ui/MintUnderline';
import Grain from '@/components/ui/Grain';

const CARDS = [
  ...problem.cards,
  { title: '', description: '', icon: problem.callout.icon, isCallout: true },
] as const;

type CardProps = {
  card: (typeof CARDS)[number];
  index: number;
  total: number;
};

function ProblemCard({ card, index, total }: CardProps) {
  if ('isCallout' in card && card.isCallout) {
    return (
      <div
        data-problem-card
        className="flex flex-col justify-center overflow-hidden rounded-xl border border-transparent bg-white p-8 text-navy shadow-[0_24px_70px_-28px_rgba(0,0,0,0.85)] sm:p-10"
      >
        <div className="flex items-start gap-4">
          <IconBadge icon={card.icon} size="md" tone="navy" className="mt-0.5 shrink-0" />
          <div>
            <p className="relative inline-block font-display text-2xl font-bold leading-snug sm:text-3xl">
              {problem.callout.text}
              <MintUnderline className="mt-1 block h-4 w-full text-navy/40" />
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-navy/70">
              one standard, everywhere
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      data-problem-card
      className="flex flex-col overflow-hidden rounded-xl border border-edge-dark bg-[#141416] p-8 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.8)] sm:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
          0{index} / 0{total}
        </span>
        <IconBadge icon={card.icon} size="sm" tone="light" />
      </div>
      <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{card.title}</h3>
      <p className="mt-3 leading-relaxed text-body-dark">{card.description}</p>
    </div>
  );
}

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-problem-card]',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-14 text-white lg:py-24"
    >
      <Grain />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionEyebrow index={problem.index}>{problem.eyebrow}</SectionEyebrow>
        <h2
          id="problem-title"
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          {problem.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body-dark">{problem.intro}</p>

        <div className="mt-10 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] lg:mt-14">
          {CARDS.map((card, i) => (
            <ProblemCard key={i} card={card} index={i + 1} total={problem.cards.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
