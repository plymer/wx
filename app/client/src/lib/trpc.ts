import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../server/src/main.js";
import type { inferRouterOutputs } from "@trpc/server";
import { keepPreviousData, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from "@trpc/client";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { placeholderData: keepPreviousData },
  },
});

const url = import.meta.env.DEV ? "http://localhost:3000/api/" : "/api/";

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        // Define your condition to split links here
        return op.context.skipBatch === true;
      },
      true: httpLink({ url }),

      false: httpBatchLink({
        url,
      }),
    }),
  ],
});

export const api = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
