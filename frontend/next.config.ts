import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin access to dev resources (HMR websocket, Fast
  // Refresh runtime) by default, allowing only `localhost`. This app is served on
  // `127.0.0.1:3000` (kept consistent with the API origin + Cognito cookies), which
  // Next treats as a different origin — the block silently breaks hydration, so the
  // page renders but no event handlers attach (forms fall back to native submit).
  // Allow 127.0.0.1 explicitly. Dev-only setting; ignored in production builds.
  allowedDevOrigins: ['127.0.0.1'],

  // This app is the Turbopack root. Pin it so unrelated lockfiles in parent
  // directories don't get picked as the workspace root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
