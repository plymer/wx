// import useAPI from "@/hooks/useAPI";
// import { OtherChartData } from "@/lib/types";

interface Props {
  category: string;
}

const AvChartsOther = ({ category }: Props) => {
  // const { data, isLoading, fetchStatus, error } = useAPI<OtherChartData[]>(`charts/${category}`, []);

  return <div>The charts for {category} haven't been implemented yet, sorry!</div>;
};

export default AvChartsOther;
