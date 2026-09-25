import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import HeeyakuLogo from "@/components/landingpage/shared/HeeyakuLogo";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="min-h-dvh w-full bg-background flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#2563EB] selection:text-white">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 space-y-3">
        <Link href="/" className="transition-transform duration-160 ease-out active:scale-95">
          <HeeyakuLogo
            size={40}
            color="currentColor"
            dotColor="#2563EB"
            withText={true}
            withTagline={true}
            textColor="currentColor"
            taglineColor="currentColor"
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Clerk Auth Box */}
      <div className="w-full max-w-[420px] flex justify-center clerk-no-signup">
        <SignIn
          appearance={{
            elements: {
              footer: "!hidden hidden",
              footerAction: "!hidden hidden",
              footerActionText: "!hidden hidden",
              footerActionLink: "!hidden hidden",
              footerPages: "!hidden hidden",
              footerPagesLink: "!hidden hidden",
            },
          }}
        />
      </div>
    </main>
  );
}
