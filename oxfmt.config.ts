import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["*.pbf", "/app/client/src/assets/**/*.json"],
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  bracketSpacing: true,
  proseWrap: "always",
  singleAttributePerLine: false,
});
