import { api } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export default function Outlooks() {
  const { data: swoData } = useQuery(api.charts.swo.queryOptions());
  const { data: tsoData } = useQuery(api.charts.tso.queryOptions());

  return (
    <div className="p-2">
      <h3>{JSON.stringify(swoData)}</h3>
      <h3>{JSON.stringify(tsoData)}</h3>
    </div>
  );
}
