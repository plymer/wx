interface Props {
  url: string;
}

const AvImageContainer = ({ url }: Props) => {
  return <img className="max-w-full mx-auto px-2 mt-2 pb-2" src={url} />;
};

export default AvImageContainer;
