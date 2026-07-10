"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { AlertTriangle, Trash2, Edit, Search, RefreshCw, Save, X } from "lucide-react";
import { api } from "@/lib/api";

interface MiscategorizedTransaction {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  type: string;
  category: string;
  description: string | null;
  merchant_name: string | null;
  transaction_date: string;
  note: string | null;
  created_at: string;
}

interface MiscategorizedTransactionsProps {
  showToast?: (message: string, type: "success" | "error" | "info") => void;
  askConfirmation?: (title: string, message: string, onConfirmAction: () => void) => void;
}

export default function MiscategorizedTransactions({
  showToast,
  askConfirmation,
}: MiscategorizedTransactionsProps) {
  const [transactions, setTransactions] = useState<MiscategorizedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<MiscategorizedTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [loadingTxId, setLoadingTxId] = useState<string | null>(null);

  // Category options
  const categories = [
    "Food & Beverage",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Housing",
    "Other",
  ];

  // Fetch miscategorized transactions with SWR
  const { data: fetchedTransactions, mutate: mutateTransactions } = useSWR(
    "admin-miscategorized-transactions",
    () => api.getAdminMiscategorizedTransactions(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Sync fetched transactions to state
  useEffect(() => {
    if (fetchedTransactions && Array.isArray(fetchedTransactions)) {
      setTransactions(fetchedTransactions);
      applySearch(searchTerm, fetchedTransactions);
    }
  }, [fetchedTransactions]);

  const applySearch = (term: string, txList: MiscategorizedTransaction[] = transactions) => {
    const filtered = txList.filter(
      (tx) =>
        tx.user_email.toLowerCase().includes(term.toLowerCase()) ||
        (tx.user_name && tx.user_name.toLowerCase().includes(term.toLowerCase())) ||
        (tx.description && tx.description.toLowerCase().includes(term.toLowerCase())) ||
        (tx.merchant_name && tx.merchant_name.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTransactions(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applySearch(term);
  };

  const handleFixTransaction = (tx: MiscategorizedTransaction) => {
    setEditingTx(tx.id);
    setNewCategory(tx.category);
  };

  const handleSaveFix = (tx: MiscategorizedTransaction) => {
    if (!newCategory.trim()) {
      showToast?.("Vui lòng chọn danh mục", "error");
      return;
    }

    setLoadingTxId(tx.id);
    api
      .fixMiscategorizedTransaction(tx.id, newCategory)
      .then(() => {
        mutateTransactions();
        showToast?.("Sửa danh mục thành công!", "success");
        setEditingTx(null);
      })
      .catch((err) => {
        showToast?.(err.message || "Sửa danh mục thất bại", "error");
      })
      .finally(() => {
        setLoadingTxId(null);
      });
  };

  const handleDeleteTransaction = (tx: MiscategorizedTransaction) => {
    askConfirmation?.(
      "Xóa giao dịch",
      `Bạn có chắc chắn muốn xóa giao dịch này từ ${tx.user_email}? Hành động này không thể hoàn tác.`,
      async () => {
        setLoadingTxId(tx.id);
        try {
          await api.deleteMiscategorizedTransaction(tx.id);
          mutateTransactions();
          showToast?.("Xóa giao dịch thành công!", "success");
        } catch (err: any) {
          showToast?.(err.message || "Xóa thất bại", "error");
        } finally {
          setLoadingTxId(null);
        }
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getTypeColor = (type: string) => {
    return type === "income"
      ? "bg-green-900/30 text-green-300 border-green-700/50"
      : "bg-red-900/30 text-red-300 border-red-700/50";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">Giao dịch phân loại sai</h2>
        </div>
        <button
          onClick={() => mutateTransactions()}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm kiếm email, tên, mô tả hoặc tên cửa hàng..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
        <p className="text-amber-200 font-semibold">
          ⚠️ {transactions.length} giao dịch cần kiểm duyệt
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-950/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Người dùng</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Mô tả</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Số tiền</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Loại</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Danh mục</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Ghi chú</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Ngày</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "Không tìm thấy giao dịch" : "Không có giao dịch phân loại sai"}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div className="text-white font-medium">{tx.user_email}</div>
                      <div className="text-slate-500">{tx.user_name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div>{tx.description || tx.merchant_name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                          tx.type
                        )}`}
                      >
                        {tx.type === "income" ? "Thu" : "Chi"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {editingTx === tx.id ? (
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium">{tx.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {tx.note ? (
                        <div className="max-w-xs truncate" title={tx.note}>
                          {tx.note}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(tx.transaction_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingTx === tx.id ? (
                          <>
                            <button
                              onClick={() => handleSaveFix(tx)}
                              disabled={loadingTxId === tx.id}
                              className="p-2 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 transition-colors disabled:opacity-50"
                              title="Lưu"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingTx(null)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Hủy"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFixTransaction(tx)}
                              disabled={loadingTxId === tx.id}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx)}
                              className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors disabled:opacity-50"
                              title="Xóa"
                              disabled={loadingTxId === tx.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-blue-200 text-sm">
        <p className="font-semibold mb-1">ℹ️ Về giao dịch phân loại sai:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Đây là những giao dịch được đánh dấu là phân loại sai</li>
          <li>Bạn có thể chọn danh mục đúng và lưu để sửa chữa</li>
          <li>Bạn cũng có thể xóa giao dịch nếu không cần</li>
          <li>Người dùng có thể tự báo cáo giao dịch phân loại sai từ dashboard</li>
        </ul>
      </div>
    </div>
  );
}
