"use client";

import { useState, useEffect } from "react";
import { useStats } from "@/hooks/useStats";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { StatsCard } from "@/components/StatsCard";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function Page() {
  const sections = ["investment", "purchase", "lend", "borrow"];
  const [activeSection, setActiveSection] = useState("investment");

  const { stats, setStats } = useStats();
  const { transactions, setTransactions } = useTransactions(activeSection);
  const hiddenKeys = ["asset", "debt_linked_asset", "debt", "asset_linked_debt"];


  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "purchase",
    name: "",
    amount: 0,
    notes: "",
    payment_method: "bank",
    transaction_type: "debit",
    linked_id: null,
    linked_type: null,
    is_settled: false,
    expected_return: null,
    expected_return_date: null,
    repayment_date: 0,
    created_at: Math.floor(Date.now() / 1000),
  });

  // Link transaction states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkableBorrows, setLinkableBorrows] = useState<Transaction[]>([]);
  const [linkableInvestments, setLinkableInvestments] = useState<Transaction[]>([]);
  const [selectedBorrowId, setSelectedBorrowId] = useState<number | null>(null);
  const [selectedInvestId, setSelectedInvestId] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const totalAsset = stats.asset;
  const totalDebt = stats.borrow;
  const debtLinkedAsset = stats.debt_linked_asset;
  const directAsset = totalAsset - debtLinkedAsset;
  const assetLinkedDebt = stats.asset_linked_debt;
  const directDebt = totalDebt - assetLinkedDebt;

  const getColorForStat = (key: string, value: number) => {
    switch (key) {
      case "investment": return "text-green-600";
      case "purchase": return "text-orange-500";
      case "lent": return "text-orange-500";
      case "borrow": return "text-red-600";
      case "bank_balance": return "text-green-600";
      default: return "text-gray-500";
    }
  };

  // inside Page component
const handleSettleTransaction = async (txId: number) => {
  try {
    const res = await fetch(`${API_URL}/repay/${txId}`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to settle transaction");

    // Refresh stats
    const statsRes = await fetch(`${API_URL}/stats`);
    setStats(await statsRes.json());

    // Refresh transactions
    const txRes = await fetch(`${API_URL}/get/transactions?type=${activeSection}`);
    setTransactions(await txRes.json());
  } catch (err) {
    console.error(err);
  }
};


  // Add transaction
  const handleAddTransaction = async () => {
    try {
      const res = await fetch(`${API_URL}/add/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add transaction");

      setShowAddModal(false);
      setFormData(prev => ({ ...prev, type: "purchase" }));

      const statsRes = await fetch(`${API_URL}/stats`);
      setStats(await statsRes.json());

      const txRes = await fetch(`${API_URL}/get/transactions?type=${activeSection}`);
      setTransactions(await txRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch linkable transactions
  const fetchLinkableTransactions = async () => {
    try {
      const borrowRes = await fetch(`${API_URL}/get/transactions?type=borrow`);
      const investRes = await fetch(`${API_URL}/get/transactions?type=investment`);

      const borrowData = await borrowRes.json();
      const investData = await investRes.json();

      setLinkableBorrows(borrowData.data || []);
      setLinkableInvestments(investData.data || []);
    } catch (err) {
      console.error("Error fetching linkable transactions:", err);
      setLinkableBorrows([]);
      setLinkableInvestments([]);
    }
  };

  // Open link modal
  const handleLinkTransaction = () => {
    fetchLinkableTransactions();
    setShowLinkModal(true);
  };

  // Perform linking
  const handlePerformLink = async () => {
    if (!selectedBorrowId || !selectedInvestId) return alert("Select both borrow and investment");

    try {
      const res = await fetch(`${API_URL}/link?source_id=${selectedBorrowId}&target_id=${selectedInvestId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to link transactions");

      setShowLinkModal(false);
      setSelectedBorrowId(null);
      setSelectedInvestId(null);

      // Refresh transactions
      const txRes = await fetch(`${API_URL}/get/transactions?type=${activeSection}`);
      setTransactions(await txRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Main and Sub Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard label="Total Asset" value={totalAsset} colorClass="text-green-600" />
        <StatsCard label="Total Debt" value={totalDebt} colorClass="text-red-600" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatsCard label="Debt Linked Asset" value={debtLinkedAsset} colorClass="text-green-600" />
        <StatsCard label="Direct Asset" value={directAsset} colorClass="text-green-600" />
        <StatsCard label="Asset Linked Debt" value={assetLinkedDebt} colorClass="text-red-600" />
        <StatsCard label="Direct Debt" value={directDebt} colorClass="text-red-600" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(stats)
          .filter(([key]) => !hiddenKeys.includes(key))
          .map(([key, value]) => {
            const colorClass = getColorForStat(key, value);
            return (
              <div
                key={key}
                className="bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center"
              >
                <span className="text-sm text-gray-500 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className={`text-xl font-semibold mt-1 ${colorClass}`}>
                  ₹{value.toLocaleString()}
                </span>
              </div>
            );
          })}
      </div>
      {/* Section Tabs */}
      <div className="flex justify-center mb-6 flex-wrap gap-3">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-5 py-2 rounded-full font-medium transition ${
              activeSection === sec ? "bg-blue-600 text-white shadow" : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
          >
            {sec.charAt(0).toUpperCase() + sec.slice(1)}
          </button>
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700"
        >
          + Add Transaction
        </button>

        <button
          onClick={handleLinkTransaction}
          className="px-4 py-2 bg-green-600 text-white rounded-full shadow hover:bg-green-700"
        >
          Link Borrow → Investment
        </button>
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        activeSection={activeSection}
        onSettleTransaction={handleSettleTransaction}
      />

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl">✕</button>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Transaction</h2>
            {/* Add Transaction Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
      <button
        onClick={() => setShowAddModal(false)}
        className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Transaction</h2>

      {/* Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-900">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border rounded p-2 text-gray-900"
        >
          <option value="purchase">Purchase</option>
          <option value="investment">Investment</option>
          <option value="lend">Lend</option>
          <option value="borrow">Borrow</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      {/* Dynamic Fields Based on Type */}
      {formData.type === "purchase" && (
        <>
          <input
            type="text"
            placeholder="Item Name"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) =>
              setFormData({ ...formData, created_at: new Date(e.target.value).getTime() / 1000 })
            }
          />
        </>
      )}

      {formData.type === "investment" && (
        <>
          <input
            type="text"
            placeholder="Fund Name"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) =>
              setFormData({ ...formData, created_at: new Date(e.target.value).getTime() / 1000 })
            }
          />
        </>
      )}
      {formData.type === "lend" && ( <> <input type="text" placeholder="Person Name" className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData, name: e.target.value }) } /> <input type="number" placeholder="Amount" className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) }) } /> <input type="date" className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData, created_at: new Date(e.target.value).getTime() / 1000 }) } /> </> )} 
      {formData.type === "bank" && ( <> <input type="number" placeholder="Amount" className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) },) } /> <input type="text" placeholder="Name" className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData, name: e.target.value }) } /> <select className="border p-2 w-full mb-2 rounded text-gray-900" value= "credit" onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value }) } > <option value="credit">Income / Deposit</option> <option value="credit">Credit Card Repayment</option> </select> <select className="border p-2 w-full mb-2 rounded text-gray-900" onChange={(e) => setFormData({ ...formData,payment_method: e.target.value },) } > <option value="bank_account">Bank Account</option> <option value="credit_card">Credit Card</option> </select> <input type="date" className="border p-2 w-full mb-2 rounded" onChange={(e) => setFormData({ ...formData,created_at: new Date(e.target.value).getTime() / 1000},) } /> </> )}
      {formData.type === "borrow" && (
        <>
          <input
            type="text"
            placeholder="Person/Card Name"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          />
          <label className="block text-gray-700 mb-1">Borrow Date</label>
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, created_at: new Date(e.target.value).getTime() / 1000 })}
          />
          <label className="block text-gray-700 mb-1">Repayment Date</label>
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded text-gray-900"
            onChange={(e) => setFormData({ ...formData, repayment_date: new Date(e.target.value).getTime() / 1000 })}
          />
        </>
      )}

      {/* Save Button */}
      <button
        onClick={handleAddTransaction}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-3"
      >
        Save Transaction
      </button>
    </div>
  </div>
)}

          </div>
        </div>
      )}

      {/* Link Transaction Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setShowLinkModal(false)} className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl">✕</button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Link Borrow → Investment</h2>

            {/* Borrow Dropdown */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Select Borrow</label>
              <select
                className="w-full border p-2 rounded text-gray-700"
                value={selectedBorrowId || ""}
                onChange={(e) => setSelectedBorrowId(Number(e.target.value))}
              >
                <option value="">-- Select Borrow --</option>
                {linkableBorrows.map((tx) => (
                  <option key={tx.id} value={tx.id}>{tx.name} - ₹{tx.amount.toLocaleString()}</option>
                ))}
              </select>
            </div>

            {/* Investment Dropdown */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Select Investment</label>
              <select
                className="w-full border p-2 rounded text-gray-700"
                value={selectedInvestId || ""}
                onChange={(e) => setSelectedInvestId(Number(e.target.value))}
              >
                <option value="">-- Select Investment --</option>
                {linkableInvestments.map((tx) => (
                  <option key={tx.id} value={tx.id}>{tx.name} - ₹{tx.amount.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={handlePerformLink}
            >
              Link Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 

