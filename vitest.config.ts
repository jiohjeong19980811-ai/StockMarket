import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          environment: "node",
          include: ["packages/core/test/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "api",
          environment: "node",
          include: ["apps/api/test/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "web",
          environment: "jsdom",
          include: ["apps/web/test/**/*.test.tsx"],
        },
      },
    ],
  },
});
