'use client';

import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import TopBar from '@/components/TopBar';
import SmoothScroll from '@/components/SmoothScroll';
import ScrollProgress from '@/components/ScrollProgress';
import CustomCursor from '@/components/CustomCursor';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import EvolutionSection from '@/components/EvolutionSection';
import DefinitionSection from '@/components/DefinitionSection';
import MotivationSection from '@/components/MotivationSection';
import SimulationSection from '@/components/SimulationSection';
import ArchitectureSection from '@/components/ArchitectureSection';
import BuildingBlocksSection from '@/components/BuildingBlocksSection';
import BenefitsSection from '@/components/BenefitsSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={() => setSplashVisible(false)}>
        {splashVisible && <SplashScreen onFinish={() => setSplashVisible(false)} />}
      </AnimatePresence>
      <CustomCursor />
      <ScrollProgress />
      <SmoothScroll />
      <TopBar />
      <main>
        <Hero />
        <ProblemSection />
        <EvolutionSection />
        <DefinitionSection />
        <MotivationSection />
        <SimulationSection />
        <ArchitectureSection />
        <BuildingBlocksSection />
        <BenefitsSection />
      </main>
      <Footer />
    </MotionConfig>
  );
}
