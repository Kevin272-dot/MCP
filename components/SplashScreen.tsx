"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Grain from "@/components/ui/Grain";
import horizontalLogo from "@/app/images/180DC.png";
import markLogo from "@/app/images/official-logo.png";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const MARQUEE = [
  "180DC",
  "RIGOUR",
  "EMPATHY",
  "CREATIVITY",
  "IMPACT",
  "CURIOSITY",
  "FIND THE 180",
  "180 DEGREES OF THOUGHT",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
  exit: {
    opacity: 0,
    y: -22,
    transition: { duration: 0.4, ease: "easeIn" as const },
  },
};

function MarqueeHalf({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap"
    >
      {MARQUEE.map((label, i) => (
        <li key={i} className="flex items-center gap-8">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-mint/70">
            {label}
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rotate-45 bg-mint/30"
          />
        </li>
      ))}
    </ul>
  );
}

type SplashScreenProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fired = useRef(false);

  const finish = () => {
    if (fired.current) return;
    fired.current = true;
    onFinish();
  };

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Proceed to the MCP content"
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-navy text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{
        opacity: 0,
        clipPath: "inset(0 0 100% 0)",
        transition: { duration: 0.7, ease: EASE },
      }}
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <Grain />

      {/* faint oversized 180DC watermark, repeated */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-between py-[8vh] font-display text-[clamp(6rem,20vw,16rem)] font-bold leading-none tracking-[-0.04em] text-white/[0.03]"
      >
        <span>180DC</span>
        <span className="text-mint/[0.03]">180°</span>
        <span>180DC</span>
      </div>

      {/* rotating rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-[38vw] -mt-[38vw] h-[76vw] w-[76vw] rounded-full border border-white/[0.05]"
        style={{ animation: "spin 80s linear infinite" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-[28vw] -mt-[28vw] h-[56vw] w-[56vw] rounded-full border border-dashed border-mint/[0.07]"
        style={{ animation: "spin-rev 56s linear infinite" }}
      />

      {/* soft green bloom behind the lockup */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46vh] w-[46vh] -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-slow"
        style={{
          background:
            "radial-gradient(circle, rgb(135 180 60 / 0.14), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-mint sm:text-xs"
        >
          A short guide to MCP
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-8 flex items-center gap-4"
        >
          <span aria-hidden="true" className="h-px w-10 bg-mint/30 sm:w-16" />
          <motion.img
            src={markLogo.src}
            alt=""
            className="h-16 w-16 object-contain drop-shadow-[0_0_18px_rgb(135_180_60/0.45)] sm:h-20 sm:w-20"
            animate={{ y: [0, -7, 0], rotate: [0, -3, 0, 3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span aria-hidden="true" className="h-px w-10 bg-mint/30 sm:w-16" />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-8 rounded-2xl bg-white p-3 shadow-lift-dark sm:p-4"
        >
          <Image
            src={horizontalLogo}
            alt="180 Degrees Consulting"
            priority
            className="h-auto w-[min(78vw,540px)]"
          />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          <span className="text-mint">MCP</span> in plain English
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-4 max-w-xl text-base leading-relaxed text-body-dark sm:text-lg"
        >
          One shared protocol for tools, data, and AI apps.
        </motion.p>

        <motion.button
          type="button"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={finish}
          className="mt-10 inline-flex min-h-16 items-center justify-center rounded-full bg-mint px-8 py-4 text-base font-semibold text-navy shadow-[0_18px_50px_-20px_rgba(135,180,60,0.75)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#b5e04f] focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-navy sm:px-10 sm:text-lg"
        >
          Proceed to content
        </motion.button>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-4 text-sm text-body-dark"
        >
          Tap the button to continue.
        </motion.p>
      </div>

      <motion.div
        aria-hidden="true"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        exit="exit"
        className="marquee-track flex overflow-hidden border-y border-white/10 bg-white/[0.03] py-3"
      >
        <MarqueeHalf />
        <MarqueeHalf hidden />
      </motion.div>

      <div className="relative z-10 flex flex-1 items-end justify-center pb-8">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-body-dark sm:text-xs"
        >
          <span>Click to continue</span>
        </motion.p>
      </div>
    </motion.div>
  );
}
