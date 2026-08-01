'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';

type MintUnderlineProps = {
  className?: string;
};

export default function MintUnderline({ className }: MintUnderlineProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const reduce = prefersReducedMotion();
    if (reduce) return;

    const ctx = gsap.context(() => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: path, start: 'top 92%', once: true },
      });
    }, path);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 140 16"
      preserveAspectRatio="none"
      className={className}
      fill="none"
    >
      <path
        ref={pathRef}
        d="M3 11 C 28 4, 64 15, 137 7"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
