import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

function AviationComponent() {
  return (
    <div className="p-2">
      <h3>Aviation Forecasts here!</h3>
    </div>
  );
}
