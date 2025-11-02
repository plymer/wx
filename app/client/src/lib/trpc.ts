import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../server/src/main.js";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.DEV ? "http://localhost:3000/api/" : "/api/",
    }),
  ],
});

export const api = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
