import path from "path";
import { defineConfig } from "vite";

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
        /.*\.(s?css|less)($|\?)/,
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
    VitePWA({ registerType: "autoUpdate", manifest: false }),
  ],

  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "./src/client/components/ui"),
      "@client": path.resolve(__dirname, "./src/client"),
      "@server": path.resolve(__dirname, "./src/server"),
    },
  },
});
