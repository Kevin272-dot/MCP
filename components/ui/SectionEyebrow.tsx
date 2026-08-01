import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionEyebrowProps = {
  children: ReactNode;
  index?: string;
  tone?: 'mint' | 'teal';
  className?: string;
};

export default function SectionEyebrow({ children, index, tone = 'mint', className }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        'flex items-baseline gap-3 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm',
        tone === 'teal' ? 'text-teal' : 'text-mint',
        className,
      )}
    >
      {index && (
        <span className="font-mono text-[0.85em] font-normal tracking-normal opacity-75" aria-hidden="true">
          {index} /
        </span>
      )}
      {children}
    </p>
  );
}
