import React from "react";
import { StatsType } from "../hooks/useStats";

interface Props {
  label: string;
  value: number;
  colorClass?: string;
}

export const StatsCard: React.FC<Props> = ({ label, value, colorClass }) => {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center">
      <span className="text-sm text-gray-500 capitalize">{label}</span>
      <span className={`text-xl font-semibold mt-1 ${colorClass || "text-gray-500"}`}>
        ₹{value.toLocaleString()}
      </span>
    </div>
  );
};
