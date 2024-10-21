import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/outlooks")({
  component: WxMapComponent,
});

function WxMapComponent() {
  return (
    <div className="p-2">
      <h3>Weather Outlooks here!</h3>
    </div>
  );
}
