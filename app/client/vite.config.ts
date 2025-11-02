import { defineConfig } from "vite";
import path from "path";

// plugins
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
      },
    }),
  ],
  cacheDir: path.resolve(__dirname, "../../node_modules/.vite"),
  root: path.resolve(__dirname),
  base: "/",

  // But serve from the client directory
  publicDir: path.resolve(__dirname, "../../public"),
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, "../../dist"),
    rolldownOptions: {
      output: { advancedChunks: { groups: [{ test: /maplibre-gl/, name: "maplibre-gl", priority: 999 }] } },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../server/src"),
    },
  },
});
