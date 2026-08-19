import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const serverActionOrigins = (() => {
  const hosts = new Set<string>(["localhost:3000", "127.0.0.1:3000"]);
  if (process.env.VERCEL_URL) hosts.add(process.env.VERCEL_URL);
  if (process.env.AUTH_URL) {
    try {
      hosts.add(new URL(process.env.AUTH_URL).host);
    } catch {
      /* ignore */
    }
  }
  return [...hosts];
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 5 Mo fichier + overhead multipart/form-data (~10–20 Ko, parfois plus)
      bodySizeLimit: "10mb",
      allowedOrigins: serverActionOrigins,
    },
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "private, max-age=3600" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
