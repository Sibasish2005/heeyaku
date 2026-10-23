import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#0B1F33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "HEEYAKU — Leading Telephony CRM in India & Top-Rated CRM Company in Agartala, Tripura",
  description: "HEEYAKU is a premier SIM-based telephony CRM and top-rated CRM software company in Agartala, Tripura. Reduce calling overhead with native Android SIM dialing, eliminate telecaller fraud with Hardware KPI Gating, and automate lead distribution.",
  keywords: [
    // Top Indian CRM Keywords
    "Leading CRM in India",
    "Indian CRM software",
    "Telephony CRM India",
    "SIM based calling CRM",
    "Exotel alternative India",
    "Twilio alternative India",
    "Zoho CRM alternative India",
    "LeadSquared alternative",
    "TeleCRM alternative India",
    "Sales CRM for Indian startups",
    "BDA call tracker Android",
    "Telecalling software India",
    "Outbound call center CRM India",
    "Lead management software India",
    "Speed to lead automation India",
    // Hyper-Local Agartala & Tripura CRM Keywords
    "Best CRM company in Agartala",
    "CRM software in Agartala",
    "CRM company in Agartala Tripura",
    "Top software company in Agartala",
    "Software company in Agartala Tripura",
    "IT companies in Agartala",
    "CRM development company in Agartala",
    "Tripura IT Park software company",
    "RK Nagar IT Park Agartala software",
    "Insyssky alternative Agartala",
    "Hembro Infotech alternative Tripura",
    "Software World Tripura alternative",
    "Business management software Agartala",
    "Call center software Agartala",
    "Custom CRM development Tripura",
    "Northeast India sales CRM software",
  ],
  authors: [{ name: "HEEYAKU Technologies" }],
  metadataBase: new URL("https://heeyaku.com"),
  alternates: {
    canonical: "https://heeyaku.com",
  },
  openGraph: {
    title: "HEEYAKU — Leading Telephony CRM in India & Top CRM Company in Agartala, Tripura",
    description: "Enterprise Telephony CRM with native Android SIM calling, Hardware KPI Gating, automated lead distribution, and zero VoIP bills. Made in Agartala, Tripura for high-growth Indian sales teams.",
    url: "https://heeyaku.com",
    type: "website",
    locale: "en_IN",
    siteName: "HEEYAKU",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEEYAKU — Leading Telephony CRM in India & Top CRM Company in Agartala",
    description: "Enterprise SIM Telephony CRM, automated lead distribution, and verified call telemetry. Built for high-velocity sales teams across India.",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "HEEYAKU Telephony CRM",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Android, Web, Cloud",
      "offers": {
        "@type": "Offer",
        "price": "499",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "HEEYAKU Technologies"
        }
      },
      "description": "India's premier SIM-based telephony CRM and sales acceleration platform. Features hardware talk-time verification, zero VoIP costs, and automated lead routing.",
      "featureList": [
        "Native Android SIM-Based Telephony",
        "Hardware KPI Gating (Verified Talk Time)",
        "Automated Round-Robin Lead Assignment",
        "Multi-Tenant PostgreSQL 16 Architecture",
        "CEO-Only Secure Lead CSV Exports",
        "Google Sheets & Webhook Real-Time Sync"
      ]
    },
    {
      "@type": "LocalBusiness",
      "name": "HEEYAKU Technologies — CRM & Software Development",
      "image": "https://heeyaku.com/icon.svg",
      "logo": "https://heeyaku.com/icon.svg",
      "url": "https://heeyaku.com",
      "email": "admin@heeyaku.com",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Tripura IT Park, RK Nagar / Central City",
        "addressLocality": "Agartala",
        "addressRegion": "Tripura",
        "postalCode": "799008",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 23.8315,
        "longitude": 91.2868
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "19:00"
      },
      "areaServed": [
        "Agartala",
        "Tripura",
        "Northeast India",
        "India"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Which is a leading CRM software company in Agartala, Tripura?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "HEEYAKU Technologies is a leading CRM software provider in Agartala, Tripura, delivering a modern cloud CRM with native Android SIM-based telephony, verified talk-time telemetry, and automated lead distribution."
          }
        },
        {
          "@type": "Question",
          "name": "What is the benefit of a SIM-based telephony CRM for Indian sales teams?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SIM-based telephony CRMs utilize sales reps' existing unlimited carrier voice plans (Jio, Airtel) instead of charging per-minute VoIP rates, significantly lowering telephony bills while capturing comprehensive call telemetry."
          }
        },
        {
          "@type": "Question",
          "name": "How does Hardware KPI Gating prevent telecaller fraud?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Hardware KPI Gating verifies that a phone call actually took place on the cellular network with recorded talk duration (durationSeconds > 0) before permitting status changes to Contacted or Qualified stages."
          }
        },
        {
          "@type": "Question",
          "name": "How does HEEYAKU compare with alternative platforms like Zoho or LeadSquared?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "HEEYAKU focuses specifically on outbound sales workflows with built-in SIM calling, eliminating per-minute VoIP add-on fees and offering an unbloated interface designed for rapid agent onboarding."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} antialiased font-sans`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="w-full flex flex-col bg-background text-foreground selection:bg-[#2563EB] selection:text-white antialiased transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClerkProvider appearance={{ theme: shadcn }}>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}