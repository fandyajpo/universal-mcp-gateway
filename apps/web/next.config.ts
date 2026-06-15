import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/types",
    "@repo/ui",
    "@repo/utils",
    "@repo/validation",
  ],
  serverExternalPackages: [
    "bcrypt",
    "better-auth",
    "mongoose",
    "mongodb",
    "pino",
    "pino-pretty",
    "@sentry/node",
    "@sentry/core",
    "@mapbox/node-pre-gyp",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        "bcrypt",
        "@mapbox/node-pre-gyp",
      ];
    }
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...(typeof config.resolve?.fallback === "object" && !Array.isArray(config.resolve.fallback) ? config.resolve.fallback : {}),
        aws4: false,
        "mongodb-client-encryption": false,
        "snappy": false,
        "socks": false,
        "kerberos": false,
        "@mongodb-js/zstd": false,
        "gcp-metadata": false,
      },
    };
    return config;
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/chat",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sentry.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' https://sentry.io https://o*.ingest.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
