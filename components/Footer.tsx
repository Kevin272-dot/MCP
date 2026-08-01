import { PlugZap } from 'lucide-react';
import { footer } from '@/content/sections';
import IconBadge from '@/components/ui/IconBadge';

export default function Footer() {
  return (
    <footer className="border-t border-edge-dark bg-navy py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <IconBadge icon={PlugZap} size="sm" tone="mint" label="MCP logo" />
          <span className="font-display text-lg font-bold">MCP</span>
          <span className="hidden text-sm text-body-dark sm:inline">— Understanding the Why and the What</span>
        </div>

        <p className="max-w-sm text-center text-sm leading-relaxed text-body-dark lg:max-w-md lg:text-left">
          {footer.credit}
        </p>

        <ul className="flex items-center gap-6">
          {footer.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="inline-flex items-center gap-2 text-sm text-body-dark transition-colors duration-150 hover:text-mint"
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
