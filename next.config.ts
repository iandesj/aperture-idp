import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure the correct workspace root is used when multiple lockfiles exist
    root: __dirname,
  },
};

export default nextConfig;
