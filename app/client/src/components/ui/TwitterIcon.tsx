import { Icon, type IconNode, type LucideProps } from "lucide-react";

export const TwitterIcon = (props: LucideProps) => {
  const path: IconNode = [
    [
      "path",
      {
        key: "twitter-path",
        d: "M22 6q-1 .5-2.4.6 1.3-.8 1.8-2.3-1 .7-2.6 1a4.1 4.1 0 0 0-7 3.7C8.5 9 5.5 7.2 3.5 4.8a4 4 0 0 0 1.3 5.4 4 4 0 0 1-1.9-.5c0 2 1.4 3.7 3.3 4a4 4 0 0 1-1.9.2c.6 1.6 2 2.8 3.9 2.8A8 8 0 0 1 2 18.4q2.8 1.9 6.3 1.9A11.6 11.6 0 0 0 20 8q1.1-1 2-2.2Z",
      },
    ],
  ];

  return <Icon iconNode={path} {...props} />;
};
