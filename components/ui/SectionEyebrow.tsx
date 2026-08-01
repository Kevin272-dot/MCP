import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionEyebrowProps = {
  children: ReactNode;
  tone?: 'mint' | 'teal';
  className?: string;
};

export default function SectionEyebrow({ children, tone = 'mint', className }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        'text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm',
        tone === 'teal' ? 'text-teal' : 'text-mint',
        className,
      )}
    >
      {children}
    </p>
  );
}
