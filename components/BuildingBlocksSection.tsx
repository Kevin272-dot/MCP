'use client';

import { motion } from 'framer-motion';
import { buildingBlocks } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';

export default function BuildingBlocksSection() {
  return (
    <section id="building-blocks" aria-labelledby="building-blocks-title" className="scroll-mt-20 bg-light py-14 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow tone="teal">{buildingBlocks.eyebrow}</SectionEyebrow>

          <h2
            id="building-blocks-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]"
          >
            {buildingBlocks.title}
          </h2>

          <div className="mt-10 divide-y divide-edge lg:mt-12">
            {buildingBlocks.rows.map((row) => (
              <motion.div
                key={row.title}
                variants={fadeUp}
                className="flex flex-col gap-4 py-8 first:pt-0 sm:flex-row sm:items-center sm:gap-6"
              >
                <div className="flex items-start gap-4 sm:w-1/2">
                  <IconBadge icon={row.icon} size="md" tone="teal" className="mt-1 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{row.title}</h3>
                    <p className="mt-1 text-sm text-muted">{row.description}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted sm:ml-auto sm:w-1/2 sm:text-right">
                  {row.examples.map((example, i) => (
                    <span key={example}>
                      {i > 0 && (
                        <span className="mx-2 text-teal" aria-hidden="true">
                          ·
                        </span>
                      )}
                      {example}
                    </span>
                  ))}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
