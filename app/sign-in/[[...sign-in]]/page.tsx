import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import HeeyakuLogo from "@/components/landingpage/shared/HeeyakuLogo";

/**
 * Validates and sanitizes destination redirect URL against Open Redirect (CWE-601).
 * Strictly permits only internal relative paths starting with a single '/' and rejects
 * protocol-relative URLs ('//'), backslashes ('\'), schemes ('javascript:', 'http:'), and control chars.
 */
function getSafeRedirectUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '/admin/dashboard';
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('\\') &&
    !trimmed.includes(':') &&
    !trimmed.includes('\0')
  ) {
    return trimmed;
  }
  return '/admin/dashboard';
}

export default async function SignInPage(props: {
  searchParams?: Promise<{ redirect_url?: string; [key: string]: string | string[] | undefined }>;
}) {
  const headerList = await headers();
  const isServerAction = headerList.has("next-action");

  const { userId } = await auth();
  const searchParams = props.searchParams ? await props.searchParams : {};
  const targetUrl = getSafeRedirectUrl(
    typeof searchParams?.redirect_url === "string" ? searchParams.redirect_url : null
  );

  // Server-side redirect for standard GET page requests
  if (userId && !isServerAction) {
    redirect(targetUrl);
  }

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

      {/* Clerk Auth Box */}
      <div className="w-full max-w-[420px] flex justify-center">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl={targetUrl}
          fallbackRedirectUrl={targetUrl}
        />
      </div>
    </main>
  );
}

