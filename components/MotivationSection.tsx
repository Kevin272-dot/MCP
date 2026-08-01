'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { motivation } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';

export default function MotivationSection() {
  return (
    <section id="motivation" aria-labelledby="motivation-title" className="scroll-mt-20 bg-light py-14 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow tone="teal">{motivation.eyebrow}</SectionEyebrow>

          <h2
            id="motivation-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]"
          >
            {motivation.title}
          </h2>

          <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-2 lg:gap-6">
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-edge bg-white p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {motivation.without.emoji}
                </span>
                <h3 className="text-xl font-semibold text-navy">{motivation.without.title}</h3>
              </div>
              <ul className="mt-6 space-y-4">
                {motivation.without.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-muted">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                      <X size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-edge-dark bg-navy p-6 text-white sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {motivation.with.emoji}
                </span>
                <h3 className="text-xl font-semibold">{motivation.with.title}</h3>
              </div>
              <ul className="mt-6 space-y-4">
                {motivation.with.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-body-dark">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-navy">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="mt-6 lg:mt-8">
            <div className="flex flex-col items-start gap-4 rounded-2xl bg-mint p-6 text-navy sm:flex-row sm:items-center sm:gap-5 sm:p-8">
              <IconBadge icon={motivation.callout.icon} size="md" tone="navy" className="shrink-0" />
              <p className="font-display text-xl font-semibold leading-snug sm:text-2xl">{motivation.callout.text}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
