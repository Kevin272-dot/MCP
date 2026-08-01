'use client';

import { motion } from 'framer-motion';
import { problem } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';
import Callout from '@/components/ui/Callout';

export default function ProblemSection() {
  return (
    <section id="problem" aria-labelledby="problem-title" className="scroll-mt-20 bg-light py-14 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow tone="teal">{problem.eyebrow}</SectionEyebrow>

          <h2
            id="problem-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]"
          >
            {problem.title}
          </h2>

          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {problem.intro}
          </motion.p>

          <motion.div variants={stagger} className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {problem.cards.map((card) => (
              <motion.article
                key={card.title}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="rounded-2xl border border-edge bg-white p-6 transition-shadow duration-150 hover:shadow-lift sm:p-8"
              >
                <IconBadge icon={card.icon} tone="teal" size="md" />
                <h3 className="mt-5 text-xl font-semibold text-navy">{card.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{card.description}</p>
              </motion.article>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 lg:mt-10">
            <Callout tone="banner" icon={problem.callout.icon}>
              {problem.callout.text}
            </Callout>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
