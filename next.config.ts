import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   experimental: {
    turbo: {
      resolveAlias: {
        canvas: './empty-module.ts',
        encoding: './empty-module.ts'
      }
    }
   }
};

export default nextConfig;
