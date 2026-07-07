"use client";

import React, { useState } from "react";
import { Clock, RefreshCw, Plus, Search, Edit, Trash2 } from "lucide-react";

interface HistoryTabProps {
  transactions: any[];
  onResetTransactions: () => void;
  onStartEdit: (tx: any) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToAdd: () => void;
}

export default function HistoryTab({
  transactions,
  onResetTransactions,
  onStartEdit,
  onDeleteTransaction,
  onNavigateToAdd,
}: HistoryTabProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "income" | "expense">("all");

  const filteredTxs = transactions.filter((tx) => {
    // filter type
    if (historyFilter !== "all" && tx.type !== historyFilter) return false;
    // filter search
    if (historySearch) {
      const query = historySearch.toLowerCase();
      const desc = (tx.description || "").toLowerCase();
      const cat = (tx.category || "").toLowerCase();
      const merchant = (tx.merchant_name || "").toLowerCase();
      return desc.includes(query) || cat.includes(query) || merchant.includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Lịch Sử Giao Dịch Thu Chi <Clock className="h-5 w-5 text-indigo-400" />
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Quản lý và theo dõi toàn bộ các khoản chi tiêu & thu nhập thực tế
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onResetTransactions}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-white/5 hover:border-white/10 hover:text-indigo-400 text-slate-400 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Reset dữ liệu mẫu
          </button>
          <button
            onClick={onNavigateToAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white glow-indigo hover:bg-indigo-500 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Filtering Controls */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm mô tả, danh mục, cửa hàng..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
            />
            <div className="absolute left-3 top-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
          </div>

          {/* Sub Tab Segmented Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setHistoryFilter("all")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                historyFilter === "all"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tất cả ({transactions.length})
            </button>
            <button
              onClick={() => setHistoryFilter("income")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                historyFilter === "income"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Thu nhập ({transactions.filter(t => t.type === "income").length})
            </button>
            <button
              onClick={() => setHistoryFilter("expense")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                historyFilter === "expense"
                  ? "bg-rose-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Chi tiêu ({transactions.filter(t => t.type === "expense").length})
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Database Table Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-500">
                <th className="pb-3 font-semibold">Mô tả</th>
                <th className="pb-3 font-semibold">Ngày thực hiện</th>
                <th className="pb-3 font-semibold">Danh mục</th>
                <th className="pb-3 font-semibold">Cửa hàng/Đơn vị</th>
                <th className="pb-3 font-semibold text-right">Số tiền</th>
                <th className="pb-3 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="py-4 font-bold text-slate-200">{tx.description}</td>
                  <td className="py-4 text-slate-400">{tx.transaction_date}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    }`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-4 text-slate-400">{tx.merchant_name || "-"}</td>
                  <td className={`py-4 text-right font-extrabold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}đ
                  </td>
                  <td className="py-4 text-center flex items-center justify-center gap-1">
                    <button onClick={() => onStartEdit(tx)} className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all" title="Chỉnh sửa">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy giao dịch nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
