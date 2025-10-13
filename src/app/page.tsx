"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("investment");
  const [type, setType] = useState("purchase");
  const [direction, setDirection] = useState("credit");
  const hiddenKeys = ["asset", "debt_linked_asset", "debt", "asset_linked_debt"];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({type: "purchase",});
  const apiTypeMap: Record<string, string> = {invest: "investment",purchase: "purchase",lend: "lend",borrow: "borrow",};
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({type: "",source_id: 0,target_id: 0,});
  const [purchases, setPurchases] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [investments, setInvestments] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleLinkFunds = async () => {
    if (!linkForm.type || !linkForm.source_id || !linkForm.target_id) {
      alert("Please fill all fields");
      return;
    }
  
    try {
      const url = `${API_URL}/link?type=${linkForm.type}&source_id=${linkForm.source_id}&target_id=${linkForm.target_id}`;
      const res = await fetch(url, { method: "POST" });
  
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to link");
      }
  
      // ✅ success
      setShowLinkModal(false);
      setLinkForm({ type: "", source_id: 0, target_id: 0 });
  
      // Optionally refresh stats/transactions after linking
      const statsRes = await fetch(`${API_URL}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
  
      const txRes = await fetch(`${API_URL}/transactions?type=${activeSection}`);
      const txData = await txRes.json();
      setTransactions(txData);
  
    } catch (error) {
      console.error("Error linking funds:", error);
      alert("Failed to link funds");
    }
  };
  
 

  
  type StatsType = {
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
  const [stats, setStats] = useState<StatsType>({
    asset: 0,
    debt_linked_asset: 0,
    debt: 0,
    asset_linked_debt:0,
    investment: 0,
    purchase: 0,
    lent: 0,
    borrow: 0,
    bank_balance: 0,
    credit_card_used:0,
  })
  type Transaction = {
    id: number;
    name: string;
    amount: number;
    date: string;
    person_name?: string;
    fund_name?: string;
    is_linked_fund?: boolean;
    linked_fund_type?: "borrow" | "investment" | "lend" | null;
    payment_method?: string;
    is_repaid?: boolean;
  };

  const getSourceList = () => {
    switch (linkForm.type) {
      case "purchase_to_borrow":
        return purchases;
      case "investment_to_borrow":
        return investments;
      case "borrow_to_investment":
      case "borrow_to_purchase":
        return borrows;
      default:
        return [];
    }
  };
  
  const getTargetList = () => {
    switch (linkForm.type) {
      case "purchase_to_borrow":
      case "investment_to_borrow":
        return borrows;
      case "borrow_to_investment":
        return investments;
      case "borrow_to_purchase":
        return purchases;
      default:
        return [];
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      const [pRes, bRes, iRes] = await Promise.all([
        fetch(`${API_URL}/transactions?type=purchase`),
        fetch(`${API_URL}/transactions?type=borrow`),
        fetch(`${API_URL}/transactions?type=investment`),
      ]);
  
      setPurchases(await pRes.json());
      setBorrows(await bRes.json());
      setInvestments(await iRes.json());
    };
  
    fetchData();
  }, []);
  
  useEffect(() => {
    setLinkForm(prev => ({ ...prev, source_id: 0, target_id: 0 }));
  }, [linkForm.type]);
  
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: StatsType = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
  
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/transactions?type=${activeSection}`);
        if (!res.ok) {
          console.error(`Failed to fetch transactions: ${res.status}`);
          return;
        }
    
        const data = await res.json();
        const mapped = data.map((t: any) => ({
          id: t.id,
          name: t.item_name || t.fund_name || t.person_name || "—",
          amount: t.amount,
          date: new Date(
            t.purchase_date || t.invested_date || t.borrowed_date || t.given_date
          ).toLocaleDateString("en-IN"),                    
          is_linked_fund: t.is_linked_fund || t.is_linked_purchase || false,
          linked_fund_type: t.linked_fund_type || null,
          payment_method: t.payment_method || "",
        }));
    
        setTransactions(mapped);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };    
  
    fetchStats();
    fetchTransactions();
  }, [activeSection]);
  
  
  const totalAsset = stats.investment + stats.lent + stats.bank_balance;
  const totalDebt = stats.borrow;
  const debtLinkedAsset = stats.debt_linked_asset;
  const directAsset = totalAsset - debtLinkedAsset;
  const assetLinkedDebt = stats.asset_linked_debt;
  const directDebt = totalDebt - assetLinkedDebt;
  const creditUsed = stats.credit_card_used
  const getColorForStat = (key: string, value: number, stats: StatsType) => {
    const { investment, purchase, lent, borrow, bank_balance } = stats;
    const avgInvestment = (investment + lent) / 2;
  
    switch (key) {
      case "investment":
        if (value >= purchase && value >= borrow && value >= bank_balance) {
          return "text-green-600"; // strong investment
        }
        return "text-orange-500"; // moderate
  
        case "purchase":
          if (value <= bank_balance) {
            return "text-green-600";
          }
          if (value > bank_balance && value <= bank_balance + avgInvestment) {
            return "text-orange-500";
          }
          return "text-red-600";
        
  
      case "lent":
        if (value > 0 && value < investment) {
          return "text-orange-500"; // moderate lending
        }
        if (value >= investment) {
          return "text-green-600"; // lending strength
        }
        return "text-gray-500";
  
      case "borrow":
        if (value > bank_balance) {
          return "text-red-600"; // debt exceeds liquidity
        }
        if (value > 0) {
          return "text-orange-500"; // manageable debt
        }
        return "text-green-600"; // no debt
  
      case "bank_balance":
        if (value >= purchase && value >= borrow) {
          return "text-green-600"; // good liquidity
        }
        if (value > borrow / 2) {
          return "text-orange-500"; // decent liquidity
        }
        return "text-red-600"; // low liquidity
  
      default:
        return "text-gray-500";
    }
  };

  const getFilteredTransactions = () => {
    switch (activeSection) {
      case "investment":
        // Debt-linked investments only
        return transactions.filter((tx) => tx.is_linked_fund && tx.linked_fund_type === "borrow");
  
      case "purchase":
        // Credit card purchases or debt-linked purchases
        return transactions.filter(
          (tx) =>
            tx.payment_method?.toLowerCase().includes("credit") ||
            tx.linked_fund_type === "borrow"
        );
  
      case "lend":
        // Only debt-linked lend (money lent using borrow funds)
        return transactions.filter(
          (tx) => tx.is_linked_fund && tx.linked_fund_type === "borrow"
        );
  
      case "borrow":
        // Only asset-linked borrow (borrowing against investment/lend)
        return transactions.filter(
          (tx) => tx.linked_fund_type === "investment" || tx.linked_fund_type === "lend"
        );
  
      default:
        return transactions;
    }
  };
  
  

  // Fake API for demo
  useEffect(() => {
    const fetchStats = async () => {
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
    <tbody>
    {getFilteredTransactions().length > 0 ? (
      getFilteredTransactions().map((row, i) => (
        <tr key={row.id} className="border-b hover:bg-gray-50">
          <td className="p-2">{i + 1}</td>
          <td className="p-2">{row.name || row.person_name || row.fund_name}</td>
          <td className="p-2">₹{row.amount}</td>
          <td className="p-2">{row.date}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td className="p-4 text-center text-gray-500" colSpan={4}>
          No data found
        </td>
      </tr>
    )}
  </tbody>
  
  }, []);

  const sections = ["investment", "purchase", "lend", "borrow"];

  const handleRepayBorrow = async (borrowId: number) => {
    try {
      const res = await fetch(`${API_URL}/repay/${borrowId}`, {
        method: "POST",
      });
  
      if (!res.ok) throw new Error("Failed to mark as repaid");
  
      // 🔄 Refresh stats and transactions after repay
      const statsRes = await fetch(`${API_URL}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
  
      const txRes = await fetch(`${API_URL}/transactions?type=${activeSection}`);
      const txData = await txRes.json();
      setTransactions(txData);
  
    } catch (err) {
      console.error("Error repaying borrow:", err);
    }
  };
  


  return (
    
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 🟩 Main Summary */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
    <div className="bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center">
      <span className="text-sm text-gray-500">Total Asset</span>
      <span className="text-2xl font-semibold mt-1 text-green-600">
        ₹{totalAsset.toLocaleString()}
      </span>
    </div>
    <div className="bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center">
      <span className="text-sm text-gray-500">Total Debt</span>
      <span className="text-2xl font-semibold mt-1 text-red-600">
        ₹{totalDebt.toLocaleString()}
      </span>
    </div>
  </div>

  {/* 🧮 Sub Summary */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
    {/* Asset Breakdown */}
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
        Asset Breakdown
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <span className="block text-xs text-gray-500">Debt Linked Asset</span>
          <span className="block text-lg font-semibold text-green-600 mt-1">
            ₹{debtLinkedAsset.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-xs text-gray-500">Direct Asset</span>
          <span className="block text-lg font-semibold text-green-600 mt-1">
            ₹{directAsset.toLocaleString()}
          </span>
        </div>
      </div>
    </div>

    {/* Debt Breakdown */}
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
        Debt Breakdown
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <span className="block text-xs text-gray-500">Asset Linked Debt</span>
          <span className="block text-lg font-semibold text-red-600 mt-1">
            ₹{assetLinkedDebt.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-xs text-gray-500">Direct Debt</span>
          <span className="block text-lg font-semibold text-red-600 mt-1">
            ₹{directDebt.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </div>
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Object.entries(stats)
          .filter(([key]) => !hiddenKeys.includes(key))
          .map(([key, value]) => {
            const colorClass = getColorForStat(key, value, stats);
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
              activeSection === sec
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-700 hover:bg-blue-50"
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
  onClick={() => setShowLinkModal(true)}
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
>
  Link Funds
</button>
      </div>
      

      <div className="flex justify-between items-center mb-4">
  <h2 className="text-lg font-semibold capitalize">
    {activeSection} Transactions
  </h2>
</div>


      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow p-4 mb-8">
  <h2 className="text-lg font-semibold mb-4 capitalize">
    {activeSection} Transactions
  </h2>
  <div className="overflow-x-auto">
    <table className="w-full text-left">
<thead>
  <tr className="bg-gray-100 text-gray-700">
    <th className="p-2">#</th>
    <th className="p-2">Name</th>
    <th className="p-2">Amount</th>
    <th className="p-2">Date</th>
    <th className="p-2">Linked Fund</th>
  </tr>
</thead>
<tbody>
{transactions.length > 0 ? (
  transactions.map((row, i) => {
    const textColor =
      row.linked_fund_type === "investment"
        ? "text-green-600"
        : row.linked_fund_type === "borrow"
        ? "text-red-600"
        : row.linked_fund_type === "lend"
        ? "text-orange-600"
        : "text-gray-700";

    return (
      <tr key={row.id} className="border-b hover:bg-gray-50">
        <td className="p-2 text-gray-700 font-medium w-8 text-center">{i + 1}</td>
        <td className={`p-2 font-medium ${textColor}`}>{row.name}</td>
        <td className={`p-2 font-semibold ${textColor}`}>
          ₹{row.amount.toLocaleString()}
        </td>
        <td className="p-2">{row.date}</td>
        <td className="p-2">
          {row.is_linked_fund ? (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                ${
                  row.linked_fund_type === "investment"
                    ? "bg-green-100 text-green-700"
                    : row.linked_fund_type === "borrow"
                    ? "bg-red-100 text-red-700"
                    : row.linked_fund_type === "lend"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
            >
              {row.linked_fund_type}
            </span>
          ) : (
            <span className="text-gray-400 text-xs italic">None</span>
          )}
        </td>

        {/* ✅ Repay button cell */}
        <td className="p-2 text-center">
          {activeSection === "borrow" ? (
            row.is_repaid ? (
              <span className="text-green-600 text-sm font-semibold">Repaid ✅</span>
            ) : (
              <button
                onClick={() => {
                  if (confirm("Mark this borrow as repaid?")) {
                    handleRepayBorrow(row.id);
                  }
                }}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              >
                Mark Repaid
              </button>
            )
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
      </tr>
    );
  })
) : (
  <tr>
    <td className="p-4 text-center text-gray-500" colSpan={6}>
      No data found
    </td>
  </tr>
)}

</tbody>



    </table>
  </div>
  </div>
{/* 🧾 Add Transaction Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
      <button
        onClick={() => setShowAddModal(false)}
        className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
      >
        ✕
      </button>
      <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>

      {/* Transaction Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border rounded p-2"
        >
          <option value="purchase">Purchase</option>
          <option value="investment">Investment</option>
          <option value="lend">Lend</option>
          <option value="borrow">Borrow</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      {/* Dynamic Fields */}
      {formData.type === "purchase" && (
        <>
          <input
            type="text"
            placeholder="Item Name"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, purchase: { ...formData.purchase, item_name: e.target.value } })
            }
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, purchase: { ...formData.purchase, amount: Number(e.target.value) } })
            }
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, purchase: { ...formData.purchase,  purchase_date: new Date(e.target.value).getTime(), } })
            }
          />
          <select
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, purchase: { ...formData.purchase, payment_method: e.target.value } })
            }
          >
            <option value="bank">Bank</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
          </select>
        </>
      )}

      {formData.type === "investment" && (
        <>
          <input
            type="text"
            placeholder="Fund Name"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, investment: { ...formData.investment, fund_name: e.target.value } })
            }
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, investment: { ...formData.investment, amount: Number(e.target.value) } })
            }
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, investment: { ...formData.investment, invested_date: new Date(e.target.value).getTime() } })
            }
          />
        </>
      )}

      {formData.type === "lend" && (
        <>
          <input
            type="text"
            placeholder="Person Name"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, lend: { ...formData.lend, person_name: e.target.value } })
            }
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, lend: { ...formData.lend, amount: Number(e.target.value) } })
            }
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, lend: { ...formData.lend, given_date: new Date(e.target.value).getTime() } })
            }
          />
        </>
      )}

      {formData.type === "borrow" && (
        <>
          <input
            type="text"
            placeholder="Person/Card Name"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, borrow: { ...formData.borrow, person_name: e.target.value } })
            }
          />
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, borrow: { ...formData.borrow, amount: Number(e.target.value) } })
            }
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, borrow: { ...formData.borrow, borrowed_date:new Date(e.target.value).getTime() } })
            }
          />
        </>
      )}

      {formData.type === "bank" && (
        <>
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, bank: { ...formData.bank, amount: Number(e.target.value) } })
            }
          />
          <select
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, bank: { ...formData.bank, transaction_type: e.target.value } })
            }
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, bank: { ...formData.bank, account_type: e.target.value } })
            }
          >
            <option value="bank_account">Bank Account</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </>
      )}

      {/* Submit Button */}
      <button
        onClick={async () => {
          try {
            const res = await fetch(`${API_URL}/add/transactions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to add transaction");

            setShowAddModal(false);
            setFormData({ type: "purchase" });

            // 🔄 Refresh lists
            const statsRes = await fetch(`${API_URL}/stats`);
            const statsData = await statsRes.json();
            setStats(statsData);

            const txRes = await fetch(`${API_URL}/transactions?type=${activeSection}`);
            const txData = await txRes.json();
            setTransactions(txData);
          } catch (err) {
            console.error("Error adding transaction:", err);
          }
        }}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-3"
      >
        Save Transaction
      </button>
    </div>
  </div>
)}
{showLinkModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
      <button
        onClick={() => setShowLinkModal(false)}
        className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4">Link Funds</h2>

      {/* Link Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Link Type</label>
        <select
          value={linkForm.type}
          onChange={(e) => setLinkForm({ ...linkForm, type: e.target.value })}
          className="w-full border rounded p-2"
        >
          <option value="">Select type</option>
          <option value="purchase_to_borrow">Purchase → Borrow</option>
          <option value="investment_to_borrow">Investment → Borrow</option>
          <option value="borrow_to_investment">Borrow → Investment</option>
          <option value="borrow_to_purchase">Borrow → Purchase</option>
        </select>
      </div>

      {/* Source Selector */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Source</label>
  <select
    className="border p-2 w-full rounded"
    value={linkForm.source_id ?? ""}
    onChange={(e) =>
      setLinkForm({ ...linkForm, source_id: Number(e.target.value) })
    }
    disabled={!linkForm.type}
  >
    <option value="">Select Source</option>
    {getSourceList().map((item: any) => (
      <option key={item.id} value={item.id}>
        #{item.id} — ₹{item.amount} ({item.person_name || item.item_name || item.fund_name})
      </option>
    ))}
  </select>
</div>

{/* Target Selector */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Target</label>
  <select
    className="border p-2 w-full rounded"
    value={linkForm.target_id ?? ""}
    onChange={(e) =>
      setLinkForm({ ...linkForm, target_id: Number(e.target.value) })
    }
    disabled={!linkForm.type}
  >
    <option value="">Select Target</option>
    {getTargetList().map((item: any) => (
      <option key={item.id} value={item.id}>
        #{item.id} — ₹{item.amount} ({item.person_name || item.item_name || item.fund_name})
      </option>
    ))}
  </select>
</div>


      <button
        onClick={handleLinkFunds}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Link
      </button>
    </div>
  </div>
)}


    </div>
  );
}
