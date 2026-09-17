# Landing Page Component Architecture
`components/landingpage/`

This folder contains all the sections and modular components that form the Heeyaku landing page. Each section is segregated into its own dedicated subdirectory matching the visual hierarchy from top to bottom.

---

## 🗂️ Section-by-Section Directory Guide

| Folder | Section Name | Included Components | Description |
|---|---|---|---|
| **`navbar/`** | Navigation Header | `Navbar.tsx`<br/>`StaggeredMenu.tsx` | Translucent sticky navigation bar with animated morphing icons and mobile menu |
| **`hero/`** | 1. Hero Section | `Hero.tsx`<br/>`InteractiveAppWorkspace.tsx`<br/>`Aurora.tsx` | Main hero headline, dynamic Aurora WebGL shader background, and interactive SaaS desktop simulator |
| **`brand-pillars/`** | 2. Brand Pillars | `BrandPillarsShowcase.tsx` | The 3 signature cards showcasing core values, branding, and capabilities |
| **`social-proof/`** | 3. Social Proof & Masonry | `SocialProofBar.tsx`<br/>`Masonry.tsx` | Industry partner logos, live metrics, and image masonry showcase |
| **`metrics/`** | 4. Technical Metrics Strip | `TechnicalMetricsStrip.tsx` | High-impact numerical benchmarks and telemetry counters |
| **`product-suite/`** | 5. Product Suite Grid | `ProductSuiteGrid.tsx` | Asymmetric bento grid highlighting CRM, LMS, and WhatsApp engine modules |
| **`revenue-leak/`** | 6. Revenue Leak Diagnostic | `RevenueLeakSection.tsx` | Problem statement breakdown highlighting lost revenue in fragmented tools |
| **`workflow/`** | 7. Connected Workflow | `ConnectedWorkflowSection.tsx`<br/>`AccordionGallery.tsx` | Interactive 5-step stepper & accordion detailing the student enrollment journey |
| **`metabrain/`** | 8. MetaBrain Deep-Dive | `MetaBrainSection.tsx` | AI-assisted intelligence feature showcase with 3D tilted card preview |
| **`integrations/`** | 9. Integrations Ecosystem | `IntegrationsEcosystem.tsx` | Interactive node graph showcasing third-party tools (WhatsApp, Razorpay, Zoom, etc.) |
| **`why-heeyaku/`** | 10. Why Heeyaku Matrix | `WhyHeeyaku.tsx` | Comprehensive architectural comparison table vs traditional tools |
| **`roadmap/`** | 11. Implementation Roadmap | `ImplementationRoadmap.tsx` | Step-by-step rollout timeline and onboarding guarantees |
| **`cta/`** | 12. Final Call-to-Action | `FinalCTA.tsx`<br/>`GhostFibers.tsx` | Bottom conversion banner with interactive canvas fiber shader |
| **`footer/`** | 13. Global Footer | `Footer.tsx` | Site links, brand copyright, and status badge |
| **`shared/`** | Universal Primitives | `HeeyakuLogo.tsx`<br/>`BookDemoButton.tsx`<br/>`CountUpNumber.tsx`<br/>`InteractiveMorphIcon.tsx`<br/>`SmoothScroll.tsx`<br/>`SpotlightCard.tsx`<br/>`TiltedCard.tsx` | Reusable micro-components, buttons, and animations used across multiple sections |

---

## 📦 Imports Usage

You can import components directly from their section folder:
```tsx
import Hero from '@/components/landingpage/hero/Hero';
import Navbar from '@/components/landingpage/navbar/Navbar';
```

Or import from the central index barrel:
```tsx
import { Hero, Navbar, BrandPillarsShowcase } from '@/components/landingpage';
```
