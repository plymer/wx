import { Binoculars, Loader2, Notebook, Pencil, Plane } from "lucide-react";

import TAF from "../observations/TAF";
import { useAviationActions } from "@/stateStores/aviation";
import { TAFData } from "@/lib/types";
import Button from "../ui/Button";
import { api } from "@/lib/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MINUTE } from "@shared/lib/constants";
import AppLoadingIndicator from "../ui/AppLoadingIndicator";

interface Props {
  hub: string;
}

const HubDiscussion = ({ hub }: Props) => {
  const { setHub } = useAviationActions();

  const { data: hubData, fetchStatus: hubFetchStatus } = useQuery(
    api.alpha.hubs.queryOptions({ site: hub }, { placeholderData: keepPreviousData, refetchInterval: MINUTE }),
  );
  const { data: tafData, fetchStatus: tafFetchStatus } = useQuery(
    api.alpha.taf.queryOptions({ site: hub }, { placeholderData: keepPreviousData, refetchInterval: MINUTE }),
  );

  const HUBS = [
    { ident: "cyvr", name: "Vancouver Intl Airport" },
    { ident: "cyyc", name: "Calgary Intl Airport" },
    { ident: "cyyz", name: "Toronto Pearson Intl Airport" },
    { ident: "cyul", name: "Montreal Trudeau Intl Airport" },
  ];

  const showLoader = hubFetchStatus !== "idle" && !hubData;

  return (
    <>
      <div className="md:ps-2 text-2xl mt-2 font-bold md:py-2 md:border-y-2 border-black portrait:text-center">
        <h2 className="md:inline max-md:hidden me-2">Hub Discussions:</h2>
        {HUBS.map((h, i) => (
          <Button
            className={`${
              hub === h.ident ? "active" : ""
            } md:mt-2 rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/4`}
            key={i}
            onClick={() => {
              setHub(h.ident);
            }}
          >
            {h.ident.toUpperCase()}
          </Button>
        ))}
      </div>

      <div>
        <div className="py-2 px-4 bg-neutral-800">
          <Notebook className="inline" />
          <h3 className="text-bold px-2 inline">
            <span className="max-md:hidden">Discussion for </span>
            {hub.toUpperCase()}:
          </h3>
        </div>

        {showLoader && (
          <AppLoadingIndicator displayText="Loading Discussion" className="px-4 py-2 mt-2 bg-muted text-black" />
        )}
        {hubData && (
          <div
            className={`font-mono px-4 py-2 mt-2 bg-muted ${hubFetchStatus === "idle" ? "text-black" : "text-neutral-300"} whitespace-pre-wrap`}
          >
            {hubData.header}
            <br />
            <br />
            {hubData.discussion.trim()}
          </div>
        )}
      </div>

      <div className="md:grid md:grid-rows-2 md:grid-cols-2 bg-muted">
        <div className="md:row-start-1 md:col-start-1">
          <div className="px-4 py-2 bg-neutral-800">
            <Binoculars className="inline" />
            <h3 className="text-bold p-2 inline">Outlook:</h3>
          </div>
          {showLoader && (
            <AppLoadingIndicator displayText="Loading Outlook" className="px-4 py-2 mt-2 bg-muted text-black" />
          )}
          {hubData && (
            <div
              className={`font-mono p-4 py-2 bg-muted ${hubFetchStatus === "idle" ? "text-black" : "text-neutral-300"} whitespace-pre-wrap`}
            >
              {hubData.outlook.trim()}
            </div>
          )}
        </div>

        <div className="md:row-start-2 md:col-start-1">
          <div className="px-4 py-2 bg-neutral-800">
            <Pencil className="inline" />
            <h3 className="text-bold p-2 inline">Forecaster:</h3>
          </div>
          {showLoader && (
            <AppLoadingIndicator displayText="Loading Forecaster" className="px-4 py-2 mt-2 bg-muted text-black" />
          )}
          {hubData && (
            <div
              className={`font-mono px-4 py-2 bg-muted ${hubFetchStatus === "idle" ? "text-black" : "text-neutral-300"} whitespace-pre-wrap`}
            >
              {hubData.forecaster}/{hubData.office}
            </div>
          )}
        </div>
        <div className="md:col-start-2 md:row-start-1 md:row-span-2 md:border-s-2 md:border-black ">
          <div className="px-4 py-2 bg-neutral-800">
            {tafFetchStatus !== "idle" ? <Loader2 className="animate-spin inline" /> : <Plane className="inline" />}
            <h3 className="text-bold p-2 inline">TAF</h3>
          </div>
          <TAF data={tafData as TAFData} />
        </div>
      </div>
    </>
  );
};

export default HubDiscussion;
