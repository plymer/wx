import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

// define the search params shape
type SearchParam = {
  param: string;
  value: string | number;
};

// configure axios behaviour
const api = axios.create({ baseURL: "https://api.prairiewx.ca" });

/**
 *
 * @param endpoint specify the API endpoint you are retrieving data from ex. `"alpha/metars"` or `"charts/sigwx"`
 * @param searchParams an array of objects in the format of `[{param: "param", value: "value"}]`
 * ex. `[{param: "site", value: "cyeg"}, {param: "hrs", value: 24}]`
 * @returns a react-query object
 */

const useAPI = <T>(endpoint: string, searchParams: SearchParam[]) => {
  // build the url that will query the api, creating a valid queryParam string
  const url = `/${endpoint}?` + searchParams.map((p) => `${p.param}=${p.value}`).join("&");

  // the function that returns the data
  const getData = async () => {
    const data = await api.get(url).then((res) => res.data);
    return data as T;
  };

  // destructure the queryObject from react-query to give us access to the params and methods we need
  const { data, error, isLoading, fetchStatus, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: getData,
    refetchInterval: 5 * 1000 * 60,
    retry: false,
  });

  // set up to refetch the data whenever the search string changes
  useEffect(() => {
    refetch();
  }, [url]);

  // return all of the relevant data and methods for the UI
  return { data, error, isLoading, fetchStatus };
};

export default useAPI;
