import dynamic from 'next/dynamic';
import {
  Navbar,
  Hero,
  BrandPillarsShowcase,
  SmoothScroll,
} from "@/components/landingpage";

// Code-split below-the-fold components for ultra-fast initial mobile load
const SocialProofBar = dynamic(() => import('@/components/landingpage/SocialProofBar'));
const TechnicalMetricsStrip = dynamic(() => import('@/components/landingpage/TechnicalMetricsStrip'));
const ProductSuiteGrid = dynamic(() => import('@/components/landingpage/ProductSuiteGrid'));
const RevenueLeakSection = dynamic(() => import('@/components/landingpage/RevenueLeakSection'));
const ConnectedWorkflowSection = dynamic(() => import('@/components/landingpage/ConnectedWorkflowSection'));
const MetaBrainSection = dynamic(() => import('@/components/landingpage/MetaBrainSection'));
const IntegrationsEcosystem = dynamic(() => import('@/components/landingpage/IntegrationsEcosystem'));
const WhyHeeyaku = dynamic(() => import('@/components/landingpage/WhyHeeyaku'));
const ImplementationRoadmap = dynamic(() => import('@/components/landingpage/ImplementationRoadmap'));
const FinalCTA = dynamic(() => import('@/components/landingpage/FinalCTA'));
const Footer = dynamic(() => import('@/components/landingpage/Footer'));

export default function Home() {
  return (
    <SmoothScroll>
      <div className="relative w-full bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white">
        {/* Global Translucent Sticky Navbar with Morphicons */}
        <Navbar />

        <main className="w-full overflow-hidden">
          {/* 1. Hero Section with Aurora Shader + Interactive Real SaaS App Workspace */}
          <Hero />

          {/* 2. Official Brand Template Showcase (The 3 Signature Minimalist Cards) */}
          <BrandPillarsShowcase />

          {/* 3. Social Proof & Industry Focus Bar + React Bits Masonry Showcase */}
          <SocialProofBar />

          {/* 4. Technical Metrics Strip */}
          <TechnicalMetricsStrip />

          {/* 5. Product Suite Grid (Asymmetric Bento Architecture) */}
          <ProductSuiteGrid />

          {/* 6. The Problem Section ("The Revenue Leak" Diagnostic) */}
          <RevenueLeakSection />

          {/* 7. The 5-Step Connected Workflow (Solution Stepper) */}
          <ConnectedWorkflowSection />

          {/* 8. Feature Deep Dive: "Heeyaku MetaBrain" */}
          <MetaBrainSection />

          {/* 9. Integrations Ecosystem */}
          <IntegrationsEcosystem />

          {/* 10. Why Heeyaku (Architectural Spec Matrix) */}
          <WhyHeeyaku />

          {/* 11. Implementation Roadmap */}
          <ImplementationRoadmap />

          {/* 12. Final Call to Action (Bottom Banner) */}
          <FinalCTA />
        </main>

        {/* 13. Global Footer with Official Bottom Signature Bar */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
