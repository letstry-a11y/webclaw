import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return { beforeFiles: [{ source: "/uploads/:path+", destination: "/api/files/:path+" }], afterFiles: [], fallback: [] };
  },
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "./prisma/schema.prisma",
      "./prisma/migrations/*/migration.sql",
    ],
  },
};

export default nextConfig;
