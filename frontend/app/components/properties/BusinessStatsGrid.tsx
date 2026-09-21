"use client";

import {
  Building2,
  Home,
  UserCheck,
  UserMinus,
  Wrench,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/app/components/ui/StatCard";

interface BusinessStats {
  total_properties: number;
  total_units: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  occupancy_rate: number;
}

interface Props {
  stats: BusinessStats | undefined;
  isPending: boolean;
}

const BusinessStatsGrid = ({ stats, isPending }: Props) => {
  const cards = [
    {
      key: "total_properties",
      title: "Total Properties",
      value: stats?.total_properties ?? 0,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-500/10",
    },
    {
      key: "total_units",
      title: "Total Units",
      value: stats?.total_units ?? 0,
      icon: Home,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "ring-indigo-500/10",
    },
    {
      key: "occupied",
      title: "Occupied",
      value: stats?.occupied ?? 0,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-500/10",
    },
    {
      key: "vacant",
      title: "Vacant",
      value: stats?.vacant ?? 0,
      icon: UserMinus,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-500/10",
    },
    {
      key: "maintenance",
      title: "Maintenance",
      value: stats?.maintenance ?? 0,
      icon: Wrench,
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-500/10",
    },
    {
      key: "occupancy_rate",
      title: "Occupancy Rate",
      value: `${(stats?.occupancy_rate ?? 0).toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      ring: "ring-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bg={card.bg}
          ring={card.ring}
          isPending={isPending}
        />
      ))}
    </div>
  );
};

export default BusinessStatsGrid;