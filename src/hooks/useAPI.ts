import { useQuery } from "@tanstack/react-query";
import axios from "axios";

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
  const url = `/${endpoint}?` + searchParams.map((p) => `${p.param}=${p.value}`).join("&");

  const getData = async () => {
    const data = await api.get(url).then((res) => res.data);
    return data as T;
  };

  return useQuery({
    queryKey: [endpoint],
    queryFn: getData,
    refetchInterval: 5 * 1000 * 60,
    retry: false,
  });
};

export default useAPI;
