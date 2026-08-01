import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import IconBadge from '@/components/ui/IconBadge';
import { cn } from '@/lib/cn';

type CalloutProps = {
  tone?: 'banner' | 'mint';
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

export default function Callout({ tone = 'banner', icon: Icon, children, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-8',
        tone === 'banner' ? 'border border-edge bg-white' : 'bg-mint',
        className,
      )}
    >
      {Icon && <IconBadge icon={Icon} size="md" tone={tone === 'banner' ? 'mint' : 'navy'} className="shrink-0" />}
      <p className="text-lg font-semibold leading-snug text-navy sm:text-xl">{children}</p>
    </div>
  );
}
