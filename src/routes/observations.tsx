import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/observations")({
  component: ObsComponent,
});

function ObsComponent() {
  return (
    <div className="p-2">
      <h3>Observations and TAFs here!</h3>
    </div>
  );
}

