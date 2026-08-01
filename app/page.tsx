'use client';

import { MotionConfig } from 'framer-motion';
import TopBar from '@/components/TopBar';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import EvolutionSection from '@/components/EvolutionSection';
import DefinitionSection from '@/components/DefinitionSection';
import MotivationSection from '@/components/MotivationSection';
import ArchitectureSection from '@/components/ArchitectureSection';
import BuildingBlocksSection from '@/components/BuildingBlocksSection';
import BenefitsSection from '@/components/BenefitsSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <TopBar />
      <main>
        <Hero />
        <ProblemSection />
        <EvolutionSection />
        <DefinitionSection />
        <MotivationSection />
        <ArchitectureSection />
        <BuildingBlocksSection />
        <BenefitsSection />
      </main>
      <Footer />
    </MotionConfig>
  );
}
