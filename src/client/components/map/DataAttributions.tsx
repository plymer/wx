import React from "react";
import useDataAttributions from "@/hooks/useDataAttributions";

const DataAttributions = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const attributions = useDataAttributions();

  return (
    <div {...props}>
      <p className="text-center border-b-1">Data Sources:</p>
      {[...attributions].map((attr) => (
        <span className="hover:underline ms-1" key={attr} dangerouslySetInnerHTML={{ __html: attr }} />
      ))}
    </div>
  );
};

export default DataAttributions;
