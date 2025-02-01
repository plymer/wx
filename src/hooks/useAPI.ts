import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

import { API_CONFIG, EndpointUrls } from "@/config/api";

// define the search params shape
type SearchParams = {
  [key: string]: string | number | undefined;
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
 * @param searchParams an object containing the search params we
 * @param fetchConfig an object containing the configuration for refetch interval, the query name, and the enabled/disabled status of the query. Defaults to `{ interval: 5, queryName: endpoint, enabled: true }`
 * @returns the data, error status, and fetch status from react-query
 */

const useAPI = <T>(
  endpoint: EndpointUrls,
  searchParams: SearchParams,
  fetchConfig: FetchConfig = { interval: 5, queryName: endpoint, enabled: true }
) => {
  // destructure the fetch configuration
  const { interval, queryName, enabled } = fetchConfig;

  // this is the function that returns the data
  const getData = async () => {
    const data = await api
      .request({
        method: "get",
        url: endpoint,
        params: searchParams,
      })
      .then((res) => res.data);

    return data as T;
  };

  // destructure the queryObject from react-query to give us access to the params and methods we need
  const { data, error, fetchStatus, refetch } = useQuery({
    queryKey: [queryName], // defaults to the api endpoint requested
    queryFn: getData,
    refetchInterval: interval! * 6_000, // interval defaults to 5 minutes
    retry: true,
    enabled: enabled,
  });

  // set up to refetch the data whenever the endpoint, search params, or enabled status changes
  useEffect(() => {
    refetch();
  }, [endpoint, searchParams, enabled]);

  // return all of the relevant data and methods for the UI
  return { data, error, fetchStatus };
};

export default useAPI;
