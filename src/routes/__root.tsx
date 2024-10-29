import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const LinkDetails = [
        { longName: "Public", shortName: "PUB", endpoint: "/public" },
        { longName: "Aviation", shortName: "AVN", endpoint: "/aviation" },
        { longName: "Observations", shortName: "OBS", endpoint: "/observations" },
        { longName: "Weather Map", shortName: "MAP", endpoint: "/wxmap" },
        { longName: "Outlooks", shortName: "OTLK", endpoint: "/outlooks" },
    ];

    return (
        <>
            <nav className="flex justify-between px-4 place-items-center portrait:hidden">
                <img src="/site-icon.svg" className="w-10 h-10 inline mb-2" />
                {LinkDetails.map((l, i) => (
                    <Link
                        key={i}
                        className={
                            "px-6 py-3 text-center [&.active]:bg-neutral-800 [&.active]:text-white [&.active]:rounded-t-md"
                        }
                        to={l.endpoint}
                    >
                        {l.longName}
                    </Link>
                ))}
            </nav>
            <nav className="flex justify-between px-4 place-items-center landscape:hidden ">
                <img src="/site-icon.svg" className="w-6 h-6 inline" />
                {LinkDetails.map((l, i) => (
                    <Link
                        key={i}
                        className={
                            "px-3 py-1 text-center [&.active]:bg-neutral-800 [&.active]:text-white [&.active]:rounded-t-md"
                        }
                        to={l.endpoint}
                    >
                        {l.shortName}
                    </Link>
                ))}
            </nav>

            <Outlet />
            {/* <ReactQueryDevtools /> */}
            {/* <TanStackRouterDevtools position="bottom-right" /> */}
        </>
    );
}
