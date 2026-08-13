import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // testujemy czyste funkcje domenowe — środowisko node wystarcza
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
