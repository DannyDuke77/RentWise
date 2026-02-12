interface SummaryCardProps {
  title: string;
  value: string | number;
}

const SummaryCard = ({ title, value }: SummaryCardProps) => {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">
        {value}
      </p>
    </div>
  );
};

export default SummaryCard;