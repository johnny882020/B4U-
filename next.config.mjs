/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // playwright-core and @sparticuz/chromium resolve their binaries via
    // relative paths at runtime — bundling them breaks that. Excluding them
    // from Server Components bundling (native `require` instead) is
    // required for the website-reviewer route to work on Vercel.
    serverComponentsExternalPackages: ["playwright-core", "@sparticuz/chromium"],
    // Marking the package external (above) stops webpack from bundling it,
    // but Vercel's own build-time file tracer (Node File Trace) still
    // decides which files actually ship in the deployed function — and its
    // static analysis doesn't pick up @sparticuz/chromium's brotli-compressed
    // binaries under bin/, since they're read via a runtime-computed path,
    // not a static require()/import. Without this, the function throws
    // `The input directory ".../@sparticuz/chromium/bin" does not exist` at
    // runtime, confirmed live on this exact route. Force-including it here
    // is the fix documented for this failure mode.
    outputFileTracingIncludes: {
      "/api/evaluate-website/**": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
};

export default nextConfig;
