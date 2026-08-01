'use client';

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { evolution } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import { cn } from '@/lib/cn';

export default function EvolutionSection() {
  const { stages } = evolution;

  return (
    <section id="evolution" aria-labelledby="evolution-title" className="scroll-mt-20 bg-navy py-14 text-white lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow>{evolution.eyebrow}</SectionEyebrow>

          <h2
            id="evolution-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
          >
            {evolution.title}
          </h2>

          <div className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-0">
            {stages.map((stage, i) => {
              const isLast = i === stages.length - 1;
              const isDest = stage.highlighted;

              return (
                <Fragment key={stage.step}>
                  <motion.div variants={fadeUp} className="flex-1">
                    <div
                      className={cn(
                        'h-full rounded-2xl border p-6 sm:p-8',
                        isDest ? 'border-mint bg-mint/10' : 'border-edge-dark bg-white/5',
                      )}
                    >
                      <p className={cn('text-xs font-semibold tracking-[0.2em]', isDest ? 'text-mint' : 'text-body-dark')}>
                        {stage.step}
                      </p>
                      <h3 className={cn('mt-3 text-lg font-semibold', isDest && 'text-mint')}>{stage.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-body-dark sm:text-base">{stage.description}</p>
                    </div>
                  </motion.div>

                  {!isLast && (
                    <motion.div
                      variants={fadeUp}
                      aria-hidden="true"
                      className="flex items-center justify-center self-center py-1 text-mint lg:px-4 lg:py-0"
                    >
                      <ChevronDown className="h-6 w-6 lg:hidden" />
                      <ChevronRight className="hidden h-6 w-6 lg:block" />
                    </motion.div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
