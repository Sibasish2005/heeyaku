import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import HeeyakuLogo from "@/components/landingpage/shared/HeeyakuLogo";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-center items-center p-4 selection:bg-[#2563EB] selection:text-white">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 space-y-4">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Clerk Dedicated Auth Box */}
      <div className="w-full max-w-md flex justify-center">
        <SignIn />
      </div>
    </div>
  );
}
