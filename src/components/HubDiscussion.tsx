import useAPI from "@/hooks/useAPI";
import { HubData } from "@/lib/types";
import { useState } from "react";
import { Button } from "./ui/button";
import { Binoculars, Loader2, Notebook, Pencil } from "lucide-react";

const HubDiscussion = () => {
  const [site, setSite] = useState<string>("cyyc");

  const { data, isLoading } = useAPI<HubData>("alpha/hubs", [{ param: "site", value: site }]);

  const HUBS = ["cyvr", "cyyc", "cyyz", "cyul"];

  return (
    <>
      <div className="text-center text-2xl mt-2 font-bold py-2 border-y-2 border-black">
        <h2>Hub Discussions</h2>
        {HUBS.map((h, i) => (
          <Button
            variant={"secondary"}
            className="mt-2 rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
            key={i}
            onClick={() => setSite(h)}
          >
            {h.toUpperCase()}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="px-2">
          <Loader2 className="animate-spin" /> "Loading..."
        </div>
      ) : (
        ""
      )}

      {data?.status === "success" ? (
        <div>
          <div className="mt-2 px-4">
            <Notebook className="inline" />
            <h3 className="text-bold px-2 inline">Discussion for {site.toUpperCase()}:</h3>
          </div>
          <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black whitespace-pre-wrap">
            {data?.hubData.header}
            <br />
            <br />
            {data?.hubData.discussion}
          </div>
          <div className="mt-2 px-4">
            <Binoculars className="inline" />
            <h3 className="mt-2 text-bold px-2 inline">Outlook:</h3>
          </div>
          <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black whitespace-pre-wrap">
            {data?.hubData.outlook}
          </div>
          <div className="mt-2 px-4">
            <Pencil className="inline" />
            <h3 className="mt-2 text-bold px-2 inline">Forecaster:</h3>
          </div>
          <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black">
            {data?.hubData.forecaster}/{data?.hubData.office}
          </div>
        </div>
      ) : (
        ""
      )}
      {data?.status === "error" ? <div>{data?.status}</div> : ""}
    </>
  );
};

export default HubDiscussion;
