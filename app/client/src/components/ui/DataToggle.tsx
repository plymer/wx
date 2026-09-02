import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import type { ToggleDataOption } from "@/lib/types";

function DataToggle({
  className,
  dataOption,
  disabled = false,
}: {
  className?: string;
  dataOption: ToggleDataOption;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={dataOption.type}
        className={`${disabled ? "text-neutral-400" : !dataOption.state && "text-neutral-400"} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} flex gap-1 items-center`}
      >
        {dataOption.icon}
        {dataOption.name}
      </Label>
      <Switch
        disabled={disabled}
        id={dataOption.type}
        checked={dataOption.state}
        onCheckedChange={() => dataOption.toggle()}
      />
    </div>
  );
}

export default DataToggle;
