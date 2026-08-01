'use client';

import { useMotionValueEvent, useScroll, motion } from 'framer-motion';
import { useState } from 'react';
import { PlugZap } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function TopBar() {
  const { scrollY } = useScroll();
  const [pastHero, setPastHero] = useState(false);

  useMotionValueEvent(scrollY, 'change', (v) => setPastHero(v > 80));

  return (
    <motion.nav
      aria-label="Top navigation"
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-edge-dark bg-navy',
        pastHero ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      initial={{ y: -72, opacity: 0 }}
      animate={pastHero ? { y: 0, opacity: 1 } : { y: -72, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-navy">
            <PlugZap className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-bold text-white">MCP</span>
        </a>
      </div>
    </motion.nav>
  );
}
