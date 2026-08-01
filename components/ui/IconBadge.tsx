import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'mint' | 'teal' | 'navy' | 'light';
type Size = 'sm' | 'md' | 'lg';

const toneClasses: Record<Tone, string> = {
  mint: 'bg-mint text-navy',
  teal: 'bg-teal text-white',
  navy: 'bg-navy text-mint',
  light: 'border border-edge bg-light text-navy',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const iconSizes: Record<Size, number> = {
  sm: 18,
  md: 22,
  lg: 26,
};

type IconBadgeProps = {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  label?: string;
  className?: string;
};

export default function IconBadge({ icon: Icon, tone = 'mint', size = 'md', label, className }: IconBadgeProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', toneClasses[tone], sizeClasses[size], className)}
      role={label ? undefined : 'presentation'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <Icon size={iconSizes[size]} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
