import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/public")({
  component: PublicComponent,
});

function PublicComponent() {
  return (
    <div className="p-2">
      <h3>Public Forecasts here!</h3>
    </div>
  );
}
