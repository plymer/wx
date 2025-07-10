import { defineConfig } from "vite";
import path from "path";

// plugins
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import nodeAdapter from "@hono/vite-dev-server/node";

import devServer from "@hono/vite-dev-server";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devServer({
      entry: "/src/server/main.ts",
      exclude: [
        /.*\.tsx?($|\?)/,
        /.*\.(css)($|\?)/,
        /.*\.(svg|png|json)($|\?)/,
        /^\/@.+$/,
        /^\/favicon\.ico$/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
      ],
      injectClientScript: false,
      adapter: nodeAdapter,
    }),
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
