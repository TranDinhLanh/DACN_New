"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Repeat, Trash2, Power, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface RecurringTemplate {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  type: string;
  category: string;
  description: string | null;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_date: string;
  end_date: string | null;
  is_active: boolean;
  is_auto_execute: boolean;
  created_at: string;
}

interface RecurringManagementProps {
  showToast?: (message: string, type: "success" | "error" | "info") => void;
  askConfirmation?: (title: string, message: string, onConfirmAction: () => void) => void;
}

export default function RecurringManagement({ showToast, askConfirmation }: RecurringManagementProps) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<RecurringTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  // Fetch recurring templates with SWR
  const { data: fetchedTemplates, mutate: mutateTemplates } = useSWR(
    "admin-recurring-templates",
    () => api.getAdminRecurringTemplates(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Sync fetched templates to state
  useEffect(() => {
    if (fetchedTemplates && Array.isArray(fetchedTemplates)) {
      setTemplates(fetchedTemplates);
      applySearch(searchTerm, fetchedTemplates);
    }
  }, [fetchedTemplates]);

  const applySearch = (term: string, templateList: RecurringTemplate[] = templates) => {
    const filtered = templateList.filter(
      (t) =>
        t.category.toLowerCase().includes(term.toLowerCase()) ||
        t.user_email.toLowerCase().includes(term.toLowerCase()) ||
        (t.user_name && t.user_name.toLowerCase().includes(term.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTemplates(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applySearch(term);
  };

  const handleDeleteTemplate = (template: RecurringTemplate) => {
    askConfirmation?.(
      "Xóa giao dịch định kỳ",
      `Bạn có chắc chắn muốn xóa giao dịch định kỳ "${template.description || template.category}" của ${template.user_email}?`,
      async () => {
        setLoadingTemplateId(template.id);
        try {
          await api.deleteAdminRecurringTemplate(template.id);
          mutateTemplates();
          showToast?.("Xóa giao dịch định kỳ thành công!", "success");
        } catch (err: any) {
          showToast?.(err.message || "Xóa thất bại", "error");
        } finally {
          setLoadingTemplateId(null);
        }
      }
    );
  };

  const handleToggleStatus = (template: RecurringTemplate) => {
    setLoadingTemplateId(template.id);
    api
      .toggleAdminRecurringTemplate(template.id)
      .then(() => {
        mutateTemplates();
        showToast?.(
          template.is_active ? "Đã tắt giao dịch định kỳ" : "Đã bật giao dịch định kỳ",
          "success"
        );
      })
      .catch((err) => {
        showToast?.(err.message || "Thay đổi trạng thái thất bại", "error");
      })
      .finally(() => {
        setLoadingTemplateId(null);
      });
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

  const getFrequencyText = (template: RecurringTemplate) => {
    const freqMap: { [key: string]: string } = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
      yearly: "Hàng năm",
    };
    return freqMap[template.frequency] || template.frequency;
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
          <Repeat className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Quản lý giao dịch định kỳ</h2>
        </div>
        <button
          onClick={() => mutateTemplates()}
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
          placeholder="Tìm kiếm danh mục, email hoặc tên người dùng..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Tổng giao dịch định kỳ</p>
          <p className="text-2xl font-bold text-white">{templates.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-400">{templates.filter((t) => t.is_active).length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Thu nhập</p>
          <p className="text-2xl font-bold text-green-400">
            {templates.filter((t) => t.type === "income").length}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Chi tiêu</p>
          <p className="text-2xl font-bold text-red-400">
            {templates.filter((t) => t.type === "expense").length}
          </p>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-slate-950/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Danh mục</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Người dùng</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Số tiền</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Loại</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Tần suất</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Lần chạy tiếp theo</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "Không tìm thấy giao dịch định kỳ" : "Không có giao dịch định kỳ"}
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <div>{template.category}</div>
                      <div className="text-xs text-slate-500">{template.description || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div>{template.user_email}</div>
                      <div className="text-slate-500">{template.user_name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {formatCurrency(template.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                          template.type
                        )}`}
                      >
                        {template.type === "income" ? "Thu" : "Chi"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300 text-xs">
                      {getFrequencyText(template)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      <div>{formatDate(template.next_run_date)}</div>
                      {template.end_date && (
                        <div className="text-slate-500">Kết thúc: {formatDate(template.end_date)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          template.is_active
                            ? "bg-green-900/30 text-green-300 border-green-700/50"
                            : "bg-slate-800/50 text-slate-400 border-slate-700/50"
                        }`}
                      >
                        {template.is_active ? "✅ Bật" : "⊘ Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(template)}
                          className={`p-2 rounded-lg transition-colors ${
                            template.is_active
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-green-900/30 hover:bg-green-900/50 text-green-400"
                          }`}
                          title={template.is_active ? "Tắt" : "Bật"}
                          disabled={loadingTemplateId === template.id}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors disabled:opacity-50"
                          title="Xóa giao dịch"
                          disabled={loadingTemplateId === template.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        <p className="font-semibold mb-1">ℹ️ Thông tin giao dịch định kỳ:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Bạn có thể bật/tắt giao dịch định kỳ mà không cần xóa</li>
          <li>Xóa giao dịch định kỳ sẽ không xóa giao dịch đã tạo trước đó</li>
          <li>Giao dịch sẽ chạy tự động theo tần suất được cài đặt</li>
          <li>Ngày chạy tiếp theo là lần tiếp theo hệ thống sẽ tạo giao dịch</li>
        </ul>
      </div>
    </div>
  );
}
