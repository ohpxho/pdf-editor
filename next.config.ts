import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // This prevents the 'canvas' package from being bundled
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    
    return config;
  },
};

export default nextConfig;
