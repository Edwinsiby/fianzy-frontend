"use client";

import { useState, useEffect } from "react";

export type StatsType = {
  asset: number;
  debt_linked_asset: number;
  debt: number;
  asset_linked_debt: number;
  investment: number;
  purchase: number;
  lent: number;
  borrow: number;
  bank_balance: number;
  credit_card_used: number;
};

export const useStats = () => {
  const [stats, setStats] = useState<StatsType>({
    asset: 0,
    debt_linked_asset: 0,
    debt: 0,
    asset_linked_debt: 0,
    investment: 0,
    purchase: 0,
    lent: 0,
    borrow: 0,
    bank_balance: 0,
    credit_card_used: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: StatsType = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  return { stats, setStats };
};
