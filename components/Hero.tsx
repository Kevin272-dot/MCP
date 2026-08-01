'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { hero } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';

const NODES: Array<[number, number]> = [
  [78, 34],
  [210, 40],
  [320, 96],
  [120, 130],
  [250, 160],
  [356, 180],
  [180, 220],
  [300, 250],
  [96, 260],
];

const LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [4, 5],
  [4, 6],
  [6, 8],
  [5, 7],
];

function Constellation() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-72 overflow-hidden sm:w-96 lg:w-[30rem] xl:w-[36rem]">
      <div className="absolute right-[-4rem] top-1/2 w-full -translate-y-1/2 opacity-30 sm:opacity-70">
        <motion.svg
          viewBox="0 0 400 300"
          fill="none"
          className="w-full"
          initial={reduce ? false : { y: 0 }}
          animate={reduce ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
        <g>
          {LINKS.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={NODES[a][0]}
              y1={NODES[a][1]}
              x2={NODES[b][0]}
              y2={NODES[b][1]}
              stroke="rgb(var(--teal))"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          ))}
        </g>
        {NODES.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 3.5 : 2.5}
            fill={i % 2 === 0 ? 'rgb(var(--mint))' : 'rgb(var(--teal))'}
            initial={reduce ? false : { opacity: 0.35 }}
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3.5 + (i % 4) * 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
          />
        ))}
      </motion.svg>
      </div>
    </div>
  );
}

export default function Hero() {
  const PrimaryIcon = hero.primaryCta.icon;
  const SecondaryIcon = hero.secondaryCta.icon;

  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <Constellation />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 lg:pb-36 lg:pt-40">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger} className="max-w-3xl">
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.22em] text-mint sm:text-sm">
            🔌 {hero.eyebrow}
          </motion.p>

          <motion.h1 variants={fadeUp} className="mt-6 font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[4.5rem]">
            {hero.title.map((part, i) =>
              part.accent ? (
                <span key={i} className="text-mint">
                  {part.text}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 font-display text-xl italic text-mint sm:text-2xl">
            {hero.subhead}
          </motion.p>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-relaxed text-body-dark sm:text-lg">
            {hero.supporting}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={hero.primaryCta.href}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-semibold text-navy transition-shadow duration-150 hover:shadow-lift"
            >
              {hero.primaryCta.label}
              <PrimaryIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-edge-dark px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:border-body-dark hover:bg-edge-dark"
            >
              <SecondaryIcon className="h-4 w-4 text-mint" aria-hidden="true" />
              {hero.secondaryCta.label}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
