import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

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
  title: "HEEYAKU — #1 Best EdTech Platform, EdTech CRM & LMS Company | Agartala, Tripura, India",
  description: "Heeyaku is the #1 best platform for EdTech solutions in Agartala, Tripura, and India. Custom EdTech software, student lead CRM, DRM video LMS, WhatsApp automations, and customized educational websites.",
  keywords: [
    "Best platform for EdTech solution",
    "Best EdTech software company in Agartala Tripura",
    "EdTech CRM Tripura",
    "EdTech CRM Agartala",
    "LMS software Agartala",
    "Customized EdTech software Agartala Tripura",
    "Customized website for education institute Agartala",
    "School management software Agartala Tripura",
    "Online fees collection system Agartala",
    "Admission portal software development Tripura",
    "AI automation for coaching institute India",
    "Encrypted DRM LMS player India",
    "WhatsApp drip automation for student lead conversion",
    "Hembro Infotech alternative Agartala",
    "Insyssky alternative Tripura",
    "Software World Tripura alternative",
    "Heeyaku EdTech infrastructure",
    "Custom CRM LMS development Tripura India"
  ],
  authors: [{ name: "Heeyaku Inc." }],
  metadataBase: new URL("https://heeyaku.com"),
  alternates: {
    canonical: "https://heeyaku.com",
  },
  openGraph: {
    title: "HEEYAKU — Best EdTech Platform, EdTech CRM & LMS Solutions | Agartala, Tripura",
    description: "Heeyaku provides custom CRM, DRM-protected LMS, AI automations, and custom web portals for education institutes in Agartala, Tripura, and across India.",
    url: "https://heeyaku.com",
    type: "website",
    locale: "en_IN",
    siteName: "Heeyaku",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEEYAKU — Best EdTech Platform, EdTech CRM & LMS Solutions",
    description: "Custom EdTech CRM, LMS, AI automation, and web development in Tripura, Agartala, India.",
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
      "name": "Heeyaku EdTech OS",
      "applicationCategory": "EducationalSoftware",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "128"
      },
      "description": "Best platform for EdTech solutions providing custom CRM, DRM-protected LMS, AI workflow automations, and custom websites in Agartala, Tripura, and India."
    },
    {
      "@type": "LocalBusiness",
      "name": "Heeyaku Technologies",
      "image": "https://heeyaku.com/favicon.ico",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Agartala",
        "addressRegion": "Tripura",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 23.8315,
        "longitude": 91.2868
      },
      "url": "https://heeyaku.com",
      "telephone": "+91-9000000000",
      "priceRange": "₹₹₹"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Which is the best platform for EdTech solutions in Tripura & Agartala?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Heeyaku provides the best custom EdTech solutions in Agartala, Tripura, featuring a sub-second CRM, DRM-encrypted LMS, WhatsApp drip bots, and high-performance custom websites."
          }
        },
        {
          "@type": "Question",
          "name": "Does Heeyaku build customized websites and software for education institutes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Heeyaku builds custom edtech software, student portals, and LMS platforms tailored specifically for coaching institutes, bootcamps, and academies."
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
      className={`${manrope.variable} antialiased font-sans`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="w-full flex flex-col bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}

