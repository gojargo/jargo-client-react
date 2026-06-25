import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The lib ships pre-built (dist) and is resolved via the workspace, so no
  // transpilePackages is needed. Run `npm run build` in the lib root first.
};

export default nextConfig;
