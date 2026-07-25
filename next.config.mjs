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
  },
};

export default nextConfig;
