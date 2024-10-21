import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/wxmap")({
  component: WxMapComponent,
});

function WxMapComponent() {
  return (
    <div className="p-2">
      <h3>Weather Map here!</h3>
    </div>
  );
}
