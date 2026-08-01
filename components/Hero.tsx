'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { hero } from '@/content/sections';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/anim';
import Grain from '@/components/ui/Grain';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/* Cursor-reactive constellation — canvas, no WebGL, ~30 nodes         */
/* ------------------------------------------------------------------ */
function CursorField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(34, Math.max(16, (w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0007,
        vy: (Math.random() - 0.5) * 0.0007,
        r: Math.random() < 0.22 ? 2.2 : 1.3,
      }));
    };

    const drawLinks = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 0.028) {
            const alpha = (1 - d2 / 0.028) * 0.45;
            ctx.strokeStyle = `rgba(142,142,150,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
    };

    const step = () => {
      const mx = mouse.x / w;
      const my = mouse.y / h;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
        const dx = n.x - mx;
        const dy = n.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.05 && d2 > 0.0001) {
          const f = 0.00016 * (1 - Math.sqrt(d2) / 0.25);
          n.vx += (dx / Math.sqrt(d2)) * f;
          n.vy += (dy / Math.sqrt(d2)) * f;
        }
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      step();
      drawLinks();
      for (const n of nodes) {
        ctx.fillStyle = n.r > 1.8 ? 'rgba(245,245,246,0.9)' : 'rgba(142,142,150,0.75)';
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    if (reduce) {
      frame();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-40 sm:opacity-60"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Kinetic headline — masked word-by-word reveal, typography intact    */
/* ------------------------------------------------------------------ */
function KineticTitle() {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  const words = useMemo(() => {
    const out: Array<{ text: string; accent: boolean }> = [];
    for (const part of hero.title) {
      for (const piece of part.text.split(/(\s+)/)) {
        if (piece === '') continue;
        if (/\s/.test(piece)) {
          out[out.length - 1].text += piece;
        } else {
          out.push({ text: piece, accent: part.accent });
        }
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const el = h1Ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero-word]',
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.3,
        },
      );

      gsap.fromTo(
        '[data-hero-fade]',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.9 },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <h1
      ref={h1Ref}
      className="max-w-5xl font-display text-[clamp(2.8rem,8vw,5.75rem)] font-bold leading-[0.98] tracking-[-0.03em]"
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span data-hero-word className={cn('inline-block will-change-transform', w.accent && 'text-mint')}>
            {w.text}
          </span>
        </span>
      ))}
    </h1>
  );
}

export default function Hero() {
  const PrimaryIcon = hero.primaryCta.icon;
  const SecondaryIcon = hero.secondaryCta.icon;

  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <Grain />
      <CursorField />

      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-40 lg:pt-36">
        <p
          data-hero-fade
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mint sm:text-sm"
        >
          {hero.eyebrow}
        </p>

        <div className="mt-6">
          <KineticTitle />
        </div>

        <p data-hero-fade className="mt-5 font-display text-xl italic text-mint sm:text-2xl">
          {hero.subhead}
        </p>

        <p data-hero-fade className="mt-6 max-w-2xl text-base leading-relaxed text-body-dark sm:text-lg">
          {hero.supporting}
        </p>

        <div data-hero-fade className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={hero.primaryCta.href}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-semibold text-navy transition-transform duration-150 hover:-translate-y-0.5"
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
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-5 left-5 hidden items-center gap-3 sm:flex lg:bottom-6 lg:left-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-body-dark">
          {hero.scrollHint}
        </span>
        <span className="relative block h-8 w-px overflow-hidden bg-edge-dark">
          <span
            className="absolute left-0 top-0 h-2 w-px bg-mint"
            style={{ animation: 'cue-drop 1.8s ease-in-out infinite' }}
          />
        </span>
      </div>
    </section>
  );
}
