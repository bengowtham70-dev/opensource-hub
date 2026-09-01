import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(__dirname, "dashboard"),
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.join(__dirname, "dist", "client"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/motion/")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/cmdk/")) {
            return "vendor-cmdk";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/zustand/")) {
            return "vendor-zustand";
          }
          if (id.includes("dashboard/src/lib/logos.js")) {
            return "catalog-logos";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
