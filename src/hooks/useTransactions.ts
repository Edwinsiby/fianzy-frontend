import { useState, useEffect } from "react";

export type Transaction = {
  id: number;
  type: string;
  name: string;
  amount: number;
  date: string;
  person_name?: string;
  fund_name?: string;
  linked_id?: number;
  linked_name?: string;
  payment_method?: string;
  repayment_date : string;
  is_settled: boolean;
  is_repaid?: boolean;
};

export const useTransactions = (activeSection: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/get/transactions?type=${activeSection}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");

        // ✅ Ensure data is an array before mapping
        const resJson = await res.json();
        const data = resJson.data || [];
        const mapped = Array.isArray(data) ? data.map((t: any) => ({
          id: t.id,
          type: t.type,
          name: t.name,
          amount: t.amount,
          date: new Date(t.created_at * 1000).toLocaleDateString("en-IN"),
          linked_id : t.linked_id || null,
          linked_name: t.linked_name || null,
          is_settled: t.is_settled || false,
          is_repaid: t.is_settled || false,
          repayment_date: t.repayment_date && t.repayment_date !== 0 
        ? new Date(t.repayment_date * 1000).toLocaleDateString("en-IN") 
        : "",
        })) : [];
        setTransactions(mapped);
        console.log("Mapped transactions:", mapped);
      } catch (err) {
        console.error("Error fetching transactions:", err, "API response:", err instanceof Error ? err.message : err);
        setTransactions([]); // fallback
      }
    };
    fetchTransactions();
  }, [activeSection, API_URL]);

  return { transactions, setTransactions };
};

