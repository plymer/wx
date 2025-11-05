import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../server/src/main.js";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from "@trpc/client";

export const queryClient = new QueryClient();

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
