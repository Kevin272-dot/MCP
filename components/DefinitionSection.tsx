'use client';

import { motion } from 'framer-motion';
import { Database, FolderOpen, Globe, Network, Quote, Server } from 'lucide-react';
import { definition } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';

const SATELLITES = [Globe, Server, Database, FolderOpen];
const ANGLES = [0, 90, 180, 270];

function OrbitRings() {
  return (
    <div
      role="img"
      aria-label="One hub at the center with many connected services orbiting it"
      className="relative mx-auto h-72 w-72 sm:h-96 sm:w-96"
    >
      <div className="absolute inset-0 rounded-full border border-dashed border-teal/40" />
      <div className="absolute inset-10 rounded-full border border-edge" />
      <div className="absolute inset-20 rounded-full border border-edge" />

      <div className="absolute inset-0 flex items-center justify-center">
        <IconBadge icon={Network} size="lg" tone="mint" label="MCP hub" />
      </div>

      {ANGLES.map((angle, i) => {
        const SatIcon = SATELLITES[i];
        return (
          <div key={angle} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
            <div className="absolute inset-0" style={{ animation: 'orbit 60s linear infinite' }}>
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <div style={{ animation: 'orbit-rev 60s linear infinite' }}>
                  <IconBadge icon={SatIcon} size="sm" tone="teal" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DefinitionSection() {
  return (
    <section id="definition" aria-labelledby="definition-title" className="scroll-mt-20 bg-white py-14 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger}
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <SectionEyebrow tone="teal">{definition.eyebrow}</SectionEyebrow>

            <h2
              id="definition-title"
              className="mt-4 max-w-xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]"
            >
              {definition.title}
            </h2>

            <ul className="mt-8 space-y-5">
              {definition.bullets.map((bullet, i) => (
                <motion.li key={i} variants={fadeUp} className="flex items-start gap-4">
                  <IconBadge icon={bullet.icon} size="sm" tone="teal" className="mt-0.5" />
                  <p className="text-base leading-relaxed text-muted sm:text-lg">{bullet.text}</p>
                </motion.li>
              ))}
            </ul>

            <motion.blockquote
              variants={fadeUp}
              className="mt-8 rounded-2xl border border-edge border-l-4 border-l-mint bg-light p-6 sm:p-8"
            >
              <Quote className="h-6 w-6 text-mint" aria-hidden="true" />
              <p className="mt-3 font-display text-xl italic leading-relaxed text-navy sm:text-2xl">{definition.quote}</p>
            </motion.blockquote>
          </div>

          <motion.div variants={fadeUp} className="py-6 lg:py-0">
            <OrbitRings />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
