import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <nav className="bg-neutral-800 text-white">
        <img src="/site-icon.svg" className="w-16 h-16 inline invert" />
        <div className="p-2 inline-flex justify-between gap-2 text-lg">
          <Link
            to="/public"
            activeProps={{
              className: "font-bold",
            }}
          >
            Public
          </Link>
          <Link
            to="/aviation"
            activeProps={{
              className: "font-bold",
            }}
          >
            Aviation
          </Link>
          <Link
            to="/observations"
            activeProps={{
              className: "font-bold",
            }}
          >
            Observations
          </Link>
          <Link
            to="/wxmap"
            activeProps={{
              className: "font-bold",
            }}
          >
            Weather Map
          </Link>
          <Link
            to="/outlooks"
            activeProps={{
              className: "font-bold",
            }}
          >
            Outlooks
          </Link>
        </div>
      </nav>

      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}

