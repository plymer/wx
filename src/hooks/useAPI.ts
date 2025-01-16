import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

// define the search params shape
type SearchParam = {
  param: string;
  value: string | number | undefined;
};

const apiUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://api.prairiewx.ca";

// configure axios behaviour
const api = axios.create({ baseURL: apiUrl });

/**
 *
 * @param endpoint specify the API endpoint you are retrieving data from ex. `"alpha/metars"` or `"charts/sigwx"`
 * @param searchParams an array of objects in the format of `[{param: "param", value: "value"}]`
 * ex. `[{param: "site", value: "cyeg"}, {param: "hrs", value: 24}]`
 * @returns a react-query object
 */

const useAPI = <T>(endpoint: string, searchParams: SearchParam[], queryName?: string, interval?: number) => {
  // build the url that will query the api, creating a valid queryParam string
  const url = `/${endpoint}?` + searchParams.map((p) => `${p.param}=${p.value}`).join("&");

  // the function that returns the data
  const getData = async () => {
    const data = await api.get(url).then((res) => res.data);
    return data as T;
  };

  // destructure the queryObject from react-query to give us access to the params and methods we need
  const { data, error, isLoading, fetchStatus, refetch } = useQuery({
    queryKey: [queryName ? queryName : endpoint], // defaults to the api endpoint requested
    queryFn: getData,
    refetchInterval: interval ? interval * 1000 * 60 : 5 * 1000 * 60, // default is 5 minutes
    retry: true,
  });

  // set up to refetch the data whenever the search string changes
  useEffect(() => {
    refetch();
  }, [url]);

  // return all of the relevant data and methods for the UI
  return { data, error, isLoading, fetchStatus };
};

export default useAPI;
