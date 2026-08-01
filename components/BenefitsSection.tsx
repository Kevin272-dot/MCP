'use client';

import { motion } from 'framer-motion';
import { benefits } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';

export default function BenefitsSection() {
  const CtaIcon = benefits.cta.icon;

  return (
    <section id="benefits" aria-labelledby="benefits-title" className="scroll-mt-20 bg-navy py-14 text-white lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow>{benefits.eyebrow}</SectionEyebrow>

          <h2
            id="benefits-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
          >
            {benefits.title}
          </h2>

          <motion.div variants={stagger} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mt-12 lg:grid-cols-5">
            {benefits.tiles.map((tile) => (
              <motion.div
                key={tile.label}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="rounded-2xl border border-edge-dark bg-white/5 p-5 text-center transition-shadow duration-150 hover:shadow-lift-dark"
              >
                <div className="flex justify-center">
                  <IconBadge icon={tile.icon} size="sm" tone="mint" />
                </div>
                <p className="mt-4 text-sm font-semibold leading-snug">{tile.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 lg:mt-12">
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-mint px-6 py-10 text-center text-navy sm:px-10 lg:py-12">
              <p className="max-w-3xl font-display text-2xl font-bold leading-snug sm:text-3xl lg:text-[2.1rem]">
                {benefits.callout.text}
              </p>
              <a
                href={benefits.cta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5"
              >
                <CtaIcon className="h-4 w-4 text-mint" aria-hidden="true" />
                {benefits.cta.label}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
