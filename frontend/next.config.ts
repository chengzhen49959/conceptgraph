import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is the Turbopack root. Pin it so unrelated lockfiles in parent
  // directories don't get picked as the workspace root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
