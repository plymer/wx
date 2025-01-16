import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import { App } from "./App";
import { AviationContextProvider } from "./contexts/aviationContext";
import { ObservationsContextProvider } from "./contexts/observationsContext";

const queryClient = new QueryClient();

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AviationContextProvider>
          <ObservationsContextProvider>
            <App />
          </ObservationsContextProvider>
        </AviationContextProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
