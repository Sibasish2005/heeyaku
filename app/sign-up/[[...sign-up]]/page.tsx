import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import HeeyakuLogo from "@/components/landingpage/shared/HeeyakuLogo";

export default function SignUpPage() {
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
      </div>

      {/* Clerk Dedicated Auth Box */}
      <div className="w-full max-w-[420px] flex justify-center">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/admin/dashboard"
          forceRedirectUrl="/admin/dashboard"
        />
      </div>
    </main>
  );
}
