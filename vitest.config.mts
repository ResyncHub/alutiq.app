import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Ten sam alias co w tsconfig.json ("@/*" -> "src/*").
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // testujemy czyste funkcje domenowe/walidacyjne — środowisko node wystarcza
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
