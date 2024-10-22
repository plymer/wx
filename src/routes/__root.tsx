import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <nav className="bg-neutral-100  flex justify-between px-4 place-items-center">
        <img src="/site-icon.svg" className="w-10 h-10 inline mb-2" />

        <Link
          className="px-6 py-3 text-center"
          to="/public"
          activeProps={{
            className: "bg-neutral-800 text-white rounded-t-md",
          }}
        >
          Public
        </Link>
        <Link
          className="px-6 py-3 text-center"
          to="/aviation"
          activeProps={{
            className: "bg-neutral-800 text-white rounded-t-md",
          }}
        >
          Aviation
        </Link>
        <Link
          className="px-6 py-3 text-center"
          to="/observations"
          activeProps={{
            className: "bg-neutral-800 text-white rounded-t-md",
          }}
        >
          Observations
        </Link>
        <Link
          className="px-6 py-3 text-center"
          to="/wxmap"
          activeProps={{
            className: "bg-neutral-800 text-white rounded-t-md",
          }}
        >
          Weather Map
        </Link>
        <Link
          className="px-6 py-3 text-center"
          to="/outlooks"
          activeProps={{
            className: "bg-neutral-800 text-white rounded-t-md",
          }}
        >
          Outlooks
        </Link>
      </nav>

      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
