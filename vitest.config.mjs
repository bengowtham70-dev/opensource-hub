import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["dashboard/src/**/*.test.{js,jsx}"],
    environment: "node",
    // Low-RAM guard: run files sequentially with a single worker so vitest
    // never OOMs on constrained machines ("Committing semi space failed").
    fileParallelism: false,
    minWorkers: 1,
    maxWorkers: 1,
  },
});
