import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build to a single self-contained HTML file (all JS/CSS inlined) so the backend
// can serve it verbatim as the `ui://graph/app.html` MCP resource with no external
// asset fetches — see backend/app/mcp/app_ui.py. Rebuild + copy: see README.md.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
    outDir: "dist",
    emptyOutDir: true,
  },
});
