import { clerkMiddleware, createRouteMatcher, clerkFrontendApiProxy } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/__clerk")) {
    const headers = new Headers(req.headers);
    const host = headers.get("x-forwarded-host") || headers.get("host") || "";
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      headers.set("x-forwarded-host", "heeyaku.vercel.app");
      headers.set("x-forwarded-proto", "https");
    }
    const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body;
    const proxiedRequest = new Request(req.url, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-ignore
      duplex: hasBody ? "half" : undefined,
    });
    const response = await clerkFrontendApiProxy(proxiedRequest);
    const location = response.headers.get("location");
    if (location && location.includes("https://heeyaku.vercel.app/__clerk")) {
      const rewritten = location.replace("https://heeyaku.vercel.app/__clerk", `${req.nextUrl.origin}/__clerk`);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("location", rewritten);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
    return response;
  }

  if (isProtectedRoute(req)) {
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
