import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // firebase-admin pulls jose/jwks-rsa; keep them external to avoid ESM require() crashes on Vercel.
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
