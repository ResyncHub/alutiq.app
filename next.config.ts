import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Jednoznacznie wskazujemy katalog projektu — w katalogu nadrzędnym
  // (C:\Users\juras) leży inny package-lock.json, który mylił Turbopack.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
