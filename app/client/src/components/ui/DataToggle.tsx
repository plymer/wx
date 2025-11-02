import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import type { ToggleDataOption } from "@/lib/types";

function DataToggle({ className, dataOption }: { className?: string; dataOption: ToggleDataOption }) {
  return (
    <div className={className}>
      <Label htmlFor={dataOption.type} className={`${dataOption.state ? "" : "text-neutral-400"} cursor-pointer`}>
        {dataOption.name}
      </Label>
      <Switch id={dataOption.type} checked={dataOption.state} onCheckedChange={() => dataOption.toggle()} />
    </div>
  );
}

export default DataToggle;
