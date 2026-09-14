'use client';

import usePaymentVisualizationModal from "@/app/hooks/usePaymentMetricsModal";
import Modal from "../ui/Modal";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";

const COLORS = ["#22c55e", "#f97316", "#8b5cf6", "#3b82f6", "#ef4444"];

interface PaymentVisualizationModalProps {
  paymentMethodData: { name: string; value: number }[];
  typeData: { name: string; value: number }[];
  categoryData: { name: string; value: number }[];
  monthlyChartData: { month: string; payments: number; refunds: number }[];
}

interface TooltipProps<T, U> {
  active?: boolean;
  payload?: { name: U; value: T }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-gray-600">
            {item.name}:{" "}
            {typeof item.value === "number"
              ? item.value >= 1000
                ? `KES ${item.value.toLocaleString()}`
                : item.value
              : item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PaymentVisualizationModal = ({
  paymentMethodData,
  typeData,
  categoryData,
  monthlyChartData,
}: PaymentVisualizationModalProps) => {
  const { isOpen, close } = usePaymentVisualizationModal();

  const modalContent = (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Payment Methods */}
        {paymentMethodData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4" />
              Payment Methods Distribution
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentage = ((percent ?? 0) * 100).toFixed(0);
                    return percentage !== '0' ? `${name} ${percentage}%` : '';
                  }}
                  outerRadius={80}
                  dataKey="value"
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart: Payment vs Refund */}
        {typeData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4" />
              Payment vs Refund Distribution
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart: Category Distribution 
        {categoryData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4" />
              Category Distribution
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
        */}

        {/* Bar Chart: Monthly Trend with Brush */}
        {monthlyChartData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Monthly Payment Trend
            </h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={monthlyChartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <XAxis dataKey="month" tick={{ fontSize: 12 }} dy={5} />
                <YAxis
                  tickFormatter={(value) =>
                    value >= 1000 ? `KES ${value / 1000}k` : `KES ${value}`
                  }
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: "10px" }} />
                <Bar dataKey="payments" fill="#22c55e" name="Payments" radius={[4, 4, 0, 0]} />
                <Bar dataKey="refunds" fill="#ef4444" name="Refunds" radius={[4, 4, 0, 0]} />

                {monthlyChartData.length > 12 && (
                  <Brush
                    dataKey="month"
                    height={26}
                    stroke="#94a3b8"
                    fill="#f8fafc"
                    startIndex={Math.max(0, monthlyChartData.length - 12)}
                    endIndex={monthlyChartData.length - 1}
                    travellerWidth={10}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      label="Payment Analytics & Visualizations"
      isOpen={isOpen}
      close={close}
      content={modalContent}
      maxWidth="max-w-7xl"
    />
  );
};

export default PaymentVisualizationModal;