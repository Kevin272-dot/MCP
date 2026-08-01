'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { architecture } from '@/content/sections';
import { fadeUp, stagger, VIEWPORT } from '@/components/ui/motion';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import IconBadge from '@/components/ui/IconBadge';
import { cn } from '@/lib/cn';

type Node = (typeof architecture.nodes)[number];

function FlowNode({ node }: { node: Node }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border bg-navy px-2 py-5 text-center',
        node.protocol ? 'border-mint/60' : 'border-edge-dark',
      )}
    >
      <IconBadge icon={node.icon} size="md" tone={node.protocol ? 'mint' : 'teal'} />
      <p className={cn('text-sm font-semibold leading-tight', node.protocol ? 'text-mint' : 'text-white')}>{node.label}</p>
      <p className="text-xs leading-snug text-body-dark">{node.caption}</p>
    </div>
  );
}

function ProtocolGroup() {
  const client = architecture.nodes[2];
  const server = architecture.nodes[3];
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full items-stretch gap-2 rounded-2xl border-2 border-mint/40 bg-mint/5 p-2">
        <FlowNode node={client} />
        <div className="flex items-center text-mint" aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </div>
        <FlowNode node={server} />
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-mint">
        Protocol layer
      </p>
    </div>
  );
}

export default function ArchitectureSection() {
  const [user, host, , , service] = architecture.nodes;
  const reduce = useReducedMotion();

  return (
    <section id="architecture" aria-labelledby="architecture-title" className="scroll-mt-20 bg-navy py-14 text-white lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={stagger}>
          <SectionEyebrow>{architecture.eyebrow}</SectionEyebrow>

          <h2
            id="architecture-title"
            className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
          >
            {architecture.title}
          </h2>

          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-relaxed text-body-dark">
            {architecture.intro}
          </motion.p>

          {/* Desktop flow */}
          <motion.div variants={fadeUp} className="relative mt-12 hidden lg:block">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" aria-hidden="true">
              <div className="relative h-4 w-full">
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-edge-dark" />
                {!reduce && (
                  <motion.span
                    className="absolute top-1/2 -ml-2 h-4 w-4 -translate-y-1/2 rounded-full bg-mint"
                    initial={{ left: '0%', opacity: 0 }}
                    whileInView={{ left: '100%', opacity: [0, 1, 1, 0] }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 2.2, ease: 'linear', times: [0, 0.12, 0.88, 1], delay: 0.5 }}
                  />
                )}
              </div>
            </div>

            <div className="relative flex items-stretch gap-2">
              <FlowNode node={user} />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <FlowNode node={host} />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <ProtocolGroup />
              <div className="flex items-center text-mint" aria-hidden="true">
                <ChevronRight className="h-6 w-6" />
              </div>
              <FlowNode node={service} />
            </div>
          </motion.div>

          {/* Mobile flow */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-stretch gap-2 lg:hidden">
            <FlowNode node={user} />
            <div className="flex justify-center py-1 text-mint" aria-hidden="true">
              <ChevronDown className="h-6 w-6" />
            </div>
            <FlowNode node={host} />
            <div className="flex justify-center py-1 text-mint" aria-hidden="true">
              <ChevronDown className="h-6 w-6" />
            </div>
            <div className="rounded-2xl border-2 border-mint/40 bg-mint/5 p-2">
              <FlowNode node={architecture.nodes[2]} />
              <div className="flex justify-center py-1 text-mint" aria-hidden="true">
                <ChevronDown className="h-6 w-6" />
              </div>
              <FlowNode node={architecture.nodes[3]} />
              <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-mint">
                Protocol layer
              </p>
            </div>
            <div className="flex justify-center py-1 text-mint" aria-hidden="true">
              <ChevronDown className="h-6 w-6" />
            </div>
            <FlowNode node={service} />
          </motion.div>

          {/* Host / Client / Server definitions */}
          <motion.div variants={stagger} className="mt-10 grid gap-5 sm:grid-cols-3 lg:mt-12">
            {architecture.defs.map((def) => (
              <motion.div
                key={def.term}
                variants={fadeUp}
                className="rounded-2xl border border-edge-dark bg-white/5 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">{def.term}</p>
                <p className="mt-2 text-sm leading-relaxed text-body-dark">{def.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
