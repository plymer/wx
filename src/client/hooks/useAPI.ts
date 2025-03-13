import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_CONFIG, EndpointUrls } from "../config/api";
import { APIResponse } from "../lib/types";

// define the search params shape
type SearchParams = {
  [key: string]: any;
};

type FetchConfig = {
  interval?: number;
  queryName?: string;
  enabled?: boolean;
};

// configure axios behaviour
const api = axios.create({ baseURL: API_CONFIG.baseUrl });

/**
 *
 * @param endpoint a string that specifies the API endpoint you are retrieving data from ex. `"/alpha/metars"`
 * @param searchParams an object containing the search params we are sending to the API
 * @param fetchConfig an object containing the configuration for refetch interval, the query name, and the enabled/disabled status of the query. Defaults to `{ interval: 5, queryName: endpoint, enabled: true }`
 * @returns the data, error status, and fetch status from react-query
 */

const useAPI = <TData>(
  endpoint: EndpointUrls,
  searchParams: SearchParams,
  fetchConfig: FetchConfig = { interval: 5, enabled: true }
) => {
  // destructure the fetch configuration
  let { interval, queryName, enabled } = fetchConfig;

  // set our queryName to the endpoint if it is not provided
  if (!queryName) queryName = endpoint;

  // this is the function that returns the data
  const getData = async () => {
    const response = await api
      .request({
        method: "get",
        url: endpoint,
        params: searchParams,
      })
      .then((res) => res.data);

    return response as APIResponse<TData>;
  };

  const searchParamKeys = Object.keys(searchParams);

  // make a unique query name for queries that need to be invalidated when the searchParams change
  const queryKey =
    searchParamKeys.includes("site") || searchParamKeys.includes("layers")
      ? [queryName, JSON.stringify(searchParams)]
      : [queryName];

  // destructure the queryObject from react-query to give us access to the params and methods we need
  return useQuery({
    queryKey: queryKey, // Add searchParams to queryKey
    queryFn: getData,
    refetchInterval: interval! * 60_000, // interval defaults to 5 minutes
    retry: true,
    enabled: enabled,
    refetchIntervalInBackground: true,
    placeholderData: keepPreviousData,
    staleTime: interval! * 50_000,
    gcTime: 1.5 * interval! * 60_000,
  });
};

export default useAPI;
