import path from "path";
import { defineConfig } from "vite";

// plugins
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const ReactCompilerConfig = {
  target: "19",
};

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    VitePWA({ registerType: "autoUpdate", manifest: false }),
  ],
  server: {
    proxy: {
      "https://api.prariewx.ca": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
