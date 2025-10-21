import ReactDOM from "react-dom/client";
import { StrictMode, useState } from "react";
import { HashRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// map css
import "maplibre-gl/dist/maplibre-gl.css";

import "./index.css";
import { App } from "./App";
import { queryClient } from "./lib/trpc";

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}
