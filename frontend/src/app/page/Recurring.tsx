"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { mutate } from "swr";
import {
  RefreshCw, Plus, Trash2, Edit, X, Check,
  Calendar, Repeat, Clock, TrendingDown, TrendingUp,
  AlertCircle, ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RecurringTemplate {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  day_of_week?: number | null;  // 0=Mon…6=Sun
  day_of_month?: number | null; // 1-31
  next_run_date: string;
  end_date?: string | null;
  is_active: boolean;
  is_auto_execute: boolean;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_FULL = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const EXPENSE_CATS = ["Other", "Food & Beverage", "Transportation", "Shopping", "Bills & Utilities", "Entertainment"];
const INCOME_CATS = ["Salary", "Bonus", "Business", "Investment", "Other Income"];

const FREQ_LABELS: Record<string, string> = {
  daily: "Hàng ngày", weekly: "Hàng tuần",
  monthly: "Hàng tháng", yearly: "Hàng năm"
};

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Empty Form State ──────────────────────────────────────────────────────────
const emptyForm = () => ({
  amount: "",
  type: "expense" as "income" | "expense",
  category: "Other",
  description: "",
  frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
  day_of_week: null as number | null,
  day_of_month: null as number | null,
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  is_auto_execute: true,
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface RecurringTabProps {
  templates: RecurringTemplate[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
  onConfirmAction?: (title: string, message: string, onConfirm: () => void) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecurringTab({
  templates,
  isLoading,
  onRefresh,
  onShowToast,
  onConfirmAction,
}: RecurringTabProps) {
  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (onShowToast) onShowToast(msg, type);
    else alert(msg);
  };

  const confirmThenRun = (title: string, msg: string, action: () => void) => {
    if (onConfirmAction) {
      onConfirmAction(title, msg, action);
    } else {
      if (confirm(msg)) action();
    }
  };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (t: RecurringTemplate) => {
    setForm({
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      description: t.description || "",
      frequency: t.frequency,
      day_of_week: t.day_of_week ?? null,
      day_of_month: t.day_of_month ?? null,
      start_date: t.next_run_date,
      end_date: t.end_date || "",
      is_auto_execute: t.is_auto_execute,
    });
    setEditingId(t.id);
    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleFreqChange = (freq: typeof form.frequency) => {
    setForm(f => ({ ...f, frequency: freq, day_of_week: null, day_of_month: null }));
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(/\D/g, ""));
    if (!amount || isNaN(amount)) { setError("Vui lòng nhập số tiền hợp lệ."); return; }
    if (form.frequency === "weekly" && form.day_of_week === null) {
      setError("Vui lòng chọn thứ trong tuần."); return;
    }
    if (form.frequency === "monthly" && form.day_of_month === null) {
      setError("Vui lòng chọn ngày trong tháng."); return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        amount,
        type: form.type,
        category: form.category,
        description: form.description || undefined,
        frequency: form.frequency,
        day_of_week: form.frequency === "weekly" ? form.day_of_week : null,
        day_of_month: form.frequency === "monthly" ? form.day_of_month : null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        is_auto_execute: form.is_auto_execute,
        is_active: true,
      };

      if (editingId) {
        await api.updateRecurringTemplate(editingId, payload);
        notify("Đã cập nhật lịch trình thành công!", "success");
      } else {
        await api.createRecurringTemplate(payload);
        notify("Đã tạo lịch trình định kỳ thành công!", "success");
      }
      // Revalidate cache for transactions and budgets to update Overview and History tabs
      mutate("transactions");
      mutate("budgets");
      onRefresh();
      closeForm();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    confirmThenRun(
      "Xóa lịch trình định kỳ",
      "Bạn có chắc muốn xóa lịch trình này?",
      async () => {
        setDeleting(id);
        try {
          await api.deleteRecurringTemplate(id);
          notify("Đã xóa lịch trình thành công!", "success");
          onRefresh();
        } catch (err: any) {
          notify(err.message || "Xóa thất bại.", "error");
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  // ─── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = async (t: RecurringTemplate) => {
    try {
      await api.updateRecurringTemplate(t.id, { is_active: !t.is_active });
      onRefresh();
    } catch {}
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const categories = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Repeat className="h-5 w-5 text-indigo-400" />
            Giao Dịch Định Kỳ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tự động hóa các khoản thu chi lặp lại theo lịch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-sm font-bold hover:from-indigo-500 hover:to-cyan-400 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Thêm lịch trình
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng lịch trình", value: templates.length, color: "indigo" },
          { label: "Đang hoạt động", value: templates.filter(t => t.is_active).length, color: "emerald" },
          { label: "Tự động ghi sổ", value: templates.filter(t => t.is_auto_execute && t.is_active).length, color: "cyan" },
          { label: "Chi tiêu định kỳ", value: templates.filter(t => t.type === "expense" && t.is_active).length, color: "rose" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold">{label}</p>
            <p className={`text-2xl font-extrabold mt-1 text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Template list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">Đang tải lịch trình...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Repeat className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm font-semibold">Chưa có lịch trình nào</p>
          <p className="text-xs mt-1 opacity-60">Nhấn "Thêm lịch trình" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 transition-all duration-200 ${
                t.is_active ? "border-white/8 hover:border-white/15" : "border-white/3 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.type === "expense" ? (
                      <TrendingDown className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-sm font-extrabold text-white truncate">{t.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      t.is_active
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-500 border border-white/5"
                    }`}>
                      {t.is_active ? "Đang chạy" : "Tạm dừng"}
                    </span>
                    {t.is_auto_execute && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                        Tự động
                      </span>
                    )}
                  </div>

                  <p className={`text-xl font-extrabold mt-1 ${t.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>
                    {t.type === "expense" ? "-" : "+"}{formatVND(t.amount)}
                  </p>

                  {t.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{t.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      {FREQ_LABELS[t.frequency]}
                      {t.frequency === "weekly" && t.day_of_week !== null && t.day_of_week !== undefined &&
                        ` (${WEEKDAY_FULL[t.day_of_week]})`
                      }
                      {t.frequency === "monthly" && t.day_of_month !== null && t.day_of_month !== undefined &&
                        ` (ngày ${t.day_of_month})`
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Lần tới: <span className="text-indigo-400 font-bold ml-1">{formatDate(t.next_run_date)}</span>
                    </span>
                    {t.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Kết thúc: {formatDate(t.end_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(t)}
                    title={t.is_active ? "Tạm dừng" : "Kích hoạt lại"}
                    className={`p-2 rounded-xl border transition-all ${
                      t.is_active
                        ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/40"
                        : "bg-slate-800 border-white/5 text-slate-500 hover:text-white"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-xl border border-white/5 text-slate-400 hover:text-white hover:border-white/15 bg-slate-800/50 transition-all"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="p-2 rounded-xl border border-rose-900/30 text-rose-400 hover:text-rose-300 hover:border-rose-500/40 bg-rose-950/20 transition-all disabled:opacity-50"
                  >
                    {deleting === t.id
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal Form ───────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-indigo-600/15 to-cyan-500/10">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-extrabold text-white">
                  {editingId ? "Chỉnh sửa lịch trình" : "Thêm lịch trình định kỳ"}
                </h3>
              </div>
              <button onClick={closeForm} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Loại giao dịch</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({
                      ...f,
                      type: e.target.value as "income" | "expense",
                      category: e.target.value === "income" ? "Salary" : "Other"
                    }))}
                    className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="expense">Chi tiêu (-)</option>
                    <option value="income">Thu nhập (+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Danh mục</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">Số tiền (VND)</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={e => setForm(f => ({
                    ...f,
                    amount: Number(e.target.value.replace(/\D/g, "")).toLocaleString("vi-VN")
                  }))}
                  placeholder="Ví dụ: 1.200.000"
                  required
                  className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-emerald-400 font-extrabold focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">Mô tả (tuỳ chọn)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ví dụ: Tiền thuê nhà tháng này..."
                  className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">Chu kỳ lặp lại</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleFreqChange(f)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.frequency === f
                          ? "bg-indigo-600/30 border-indigo-500/60 text-indigo-300"
                          : "bg-slate-900 border-white/8 text-slate-400 hover:text-white hover:border-white/15"
                      }`}
                    >
                      {FREQ_LABELS[f].replace("Hàng ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly day picker */}
              {form.frequency === "weekly" && (
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">
                    Chọn thứ trong tuần <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, day_of_week: idx }))}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          form.day_of_week === idx
                            ? "bg-indigo-600/40 border-indigo-500/70 text-white ring-1 ring-indigo-400/30"
                            : "bg-slate-900 border-white/8 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {form.day_of_week !== null && (
                    <p className="text-[11px] text-indigo-400 mt-1.5 font-semibold">
                      Đã chọn: {WEEKDAY_FULL[form.day_of_week]}
                    </p>
                  )}
                </div>
              )}

              {/* Monthly day picker */}
              {form.frequency === "monthly" && (
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">
                    Chọn ngày trong tháng <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, day_of_month: day }))}
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                          form.day_of_month === day
                            ? "bg-indigo-600/40 border-indigo-500/70 text-white ring-1 ring-indigo-400/30"
                            : "bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/15"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {form.day_of_month !== null && (
                    <p className="text-[11px] text-indigo-400 mt-1.5 font-semibold">
                      Đã chọn: ngày {form.day_of_month} hàng tháng
                    </p>
                  )}
                </div>
              )}

              {/* Start + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    required
                    className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Ngày kết thúc (tuỳ chọn)</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    min={form.start_date}
                    className="w-full bg-slate-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Auto execute toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
                <div>
                  <p className="text-xs font-bold text-white">Tự động ghi sổ</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống tự động tạo giao dịch khi đến hạn</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_auto_execute: !f.is_auto_execute }))}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                    form.is_auto_execute ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                    form.is_auto_execute ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/25 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-extrabold transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo lịch trình"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 rounded-xl bg-slate-900 border border-white/8 text-slate-400 hover:text-white text-sm font-bold transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
