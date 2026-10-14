import { clerkMiddleware, createRouteMatcher, clerkFrontendApiProxy } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/super-admin(.*)",
  "/onboarding(.*)",
  "/verification-pending(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Handle Clerk Frontend API reverse proxy (production custom domain only)
  if (req.nextUrl.pathname.startsWith("/__clerk")) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_CLERK_PROXY_URL) {
      const headers = new Headers(req.headers);
      const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body;
      const proxiedRequest = new Request(req.url, {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
        // @ts-ignore
        duplex: hasBody ? "half" : undefined,
      });
      const response = await clerkFrontendApiProxy(proxiedRequest);
      return response;
    }
  }

  // 2. Enforce authentication for protected admin pages (page navigations only; Server Actions enforce RBAC internally)
  if (isProtectedRoute(req) && !req.headers.has("next-action")) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
