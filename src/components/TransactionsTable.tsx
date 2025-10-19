import React from "react";
import { Transaction } from "../hooks/useTransactions";

interface Props {
  transactions: Transaction[];
  activeSection: string;
  onSettleTransaction: (id: number) => void; // New prop
}

export const TransactionsTable: React.FC<Props> = ({
  transactions,
  activeSection,
  onSettleTransaction,
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-8 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2">#</th>
            <th className="p-2">Name</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            {activeSection === "borrow" && <th className="p-2">Repayment</th>}
            {activeSection === "purchase" && <th className="p-2">Repayment</th>}
            <th className="p-2">Linked Fund</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((row, i) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-gray-900 font-medium w-8 text-center">{i + 1}</td>
                <td className="p-2 font-medium text-gray-900">{row.name}</td>
                <td className="p-2 font-semibold text-gray-900">₹{row.amount.toLocaleString()}</td>
                <td className="p-2 text-gray-900">{row.date}</td>
                {activeSection === "borrow" && (
                  <td className="p-2 text-center text-gray-900">{row.repayment_date}</td>
                )}
                {activeSection === "purchase" && (
                  <td className="p-2 text-center text-gray-900">{row.repayment_date}</td>
                )}
                <td className="p-2 text-gray-900">
                  {row.linked_id && row.linked_name ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium">
                      {row.linked_name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs italic">None</span>
                  )}
                </td>

                <td className="p-2 text-center flex justify-center gap-2">

                  {/* Settle button for borrow and lend */}
                  {(row.type === "borrow" || row.type === "lend") && !row.is_settled && (
                    <button
                      onClick={() => {
                        if (confirm("Settle this transaction?")) onSettleTransaction(row.id);
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Settle
                    </button>
                  )}

                  {/* If already settled */}
                  {row.is_settled && <span className="text-gray-500 text-xs">Settled ✅</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={7}>
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
