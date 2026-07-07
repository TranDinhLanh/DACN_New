"use client";

import React, { useState, useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";

interface AddTransactionTabProps {
  onSave: (data: {
    amount: number;
    type: "income" | "expense";
    category: string;
    description: string;
    transaction_date: string;
    merchant_name?: string;
    event_id?: string;
  }) => void;
  onCancel: () => void;
  initialType?: "income" | "expense";
  budgets?: { category: string }[];
  events?: { id: string; name: string; budget_limit: number; is_completed: boolean }[];
}

export default function AddTransactionTab({
  onSave,
  onCancel,
  initialType = "expense",
  events = [],
}: AddTransactionTabProps) {
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [merchant, setMerchant] = useState("");
  const [eventId, setEventId] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Sync initialType if it changes from props
  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  // Synchronize category state when type changes to prevent mismatched initial selection
  useEffect(() => {
    if (type === "income") {
      setCategory("Salary");
    } else {
      setCategory("Other");
    }
  }, [type]);

  // Helper to format raw number strings to Vietnamese format (e.g., 15000000 -> 15.000.000)
  const formatVNDString = (valStr: string | number) => {
    if (valStr === undefined || valStr === null || valStr === "") return "";
    const clean = valStr.toString().replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("vi-VN");
  };

  // Helper to clean formatted VND strings back to raw number
  const cleanVNDString = (valStr: string) => {
    if (!valStr) return "";
    return valStr.replace(/\D/g, "");
  };

  // AI Classification engine working on the client-side for dynamic responsiveness
  useEffect(() => {
    if (!description || description.trim().length < 3) {
      setAiSuggestion(null);
      return;
    }

    const descLower = description.toLowerCase();

    if (type === "income") {
      // Income prediction keywords
      if (
        descLower.includes("luong") ||
        descLower.includes("salary") ||
        descLower.includes("cong ty") ||
        descLower.includes("co quan") ||
        descLower.includes("chuyen khoan thang")
      ) {
        setAiSuggestion("Salary");
      } else if (
        descLower.includes("thuong") ||
        descLower.includes("bonus") ||
        descLower.includes("nong") ||
        descLower.includes("le tet")
      ) {
        setAiSuggestion("Bonus");
      } else if (
        descLower.includes("kinh doanh") ||
        descLower.includes("ban hang") ||
        descLower.includes("ban le") ||
        descLower.includes("order") ||
        descLower.includes("tien mat") ||
        descLower.includes("khach hang")
      ) {
        setAiSuggestion("Business");
      } else if (
        descLower.includes("lai") ||
        descLower.includes("tiet kiem") ||
        descLower.includes("dau tu") ||
        descLower.includes("invest") ||
        descLower.includes("co phieu") ||
        descLower.includes("bitcoin")
      ) {
        setAiSuggestion("Investment");
      } else {
        setAiSuggestion("Other Income");
      }
    } else {
      // Expense prediction keywords
      if (
        descLower.includes("coffee") ||
        descLower.includes("tra sua") ||
        descLower.includes("an") ||
        descLower.includes("highlands") ||
        descLower.includes("gongcha") ||
        descLower.includes("phuc long")
      ) {
        setAiSuggestion("Food & Beverage");
      } else if (
        descLower.includes("grab") ||
        descLower.includes("taxi") ||
        descLower.includes("xang") ||
        descLower.includes("bus")
      ) {
        setAiSuggestion("Transportation");
      } else if (
        descLower.includes("shopee") ||
        descLower.includes("lazada") ||
        descLower.includes("tiki") ||
        descLower.includes("quan ao") ||
        descLower.includes("giay")
      ) {
        setAiSuggestion("Shopping");
      } else if (
        descLower.includes("hoa don") ||
        descLower.includes("dien") ||
        descLower.includes("nuoc") ||
        descLower.includes("wifi") ||
        descLower.includes("internet") ||
        descLower.includes("evn")
      ) {
        setAiSuggestion("Bills & Utilities");
      } else if (
        descLower.includes("cgv") ||
        descLower.includes("rap phim") ||
        descLower.includes("netflix") ||
        descLower.includes("game") ||
        descLower.includes("playstation")
      ) {
        setAiSuggestion("Entertainment");
      } else {
        setAiSuggestion("Other");
      }
    }
  }, [description, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = Number(cleanVNDString(amount));
    if (!rawAmount || isNaN(rawAmount)) return;

    // Use AI suggested category if the selected one is default placeholder
    const defaultPlaceholder = type === "income" ? "Salary" : "Other";
    const finalCategory = (category === defaultPlaceholder && aiSuggestion) ? aiSuggestion : category;

    onSave({
      amount: rawAmount,
      type,
      category: finalCategory,
      description: description || "Giao dịch không mô tả",
      transaction_date: transactionDate,
      merchant_name: merchant || undefined,
      event_id: eventId || undefined,
    });

    // Reset Form
    setAmount("");
    setDescription("");
    setMerchant("");
    setCategory(type === "income" ? "Salary" : "Other");
    setEventId("");
  };

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 border border-white/5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Plus className="h-5 w-5 text-indigo-400" /> Thêm khoản Thu / Chi Mới
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Điền thông tin giao dịch để cập nhật ngân sách. Khi nhập mô tả, AI sẽ tự động đoán danh mục chi tiêu ở bên dưới.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Type Choice */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Loại giao dịch</label>
            <select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as "income" | "expense")}
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-bold"
            >
              <option value="expense">Khoản Chi Tiêu (-)</option>
              <option value="income">Khoản Thu Nhập (+)</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Ngày thực hiện</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
              required
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-2">Số tiền giao dịch (VND)</label>
          <input
            type="text"
            placeholder="Ví dụ: 85.000"
            value={amount}
            onChange={(e) => setAmount(formatVNDString(e.target.value))}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-extrabold"
            required
          />
        </div>

        {/* Description & AI Predict */}
        <div className="relative">
          <label className="text-xs text-slate-400 font-semibold block mb-2">Mô tả giao dịch</label>
          <input
            type="text"
            placeholder="Ví dụ: tra sua gongcha size L, di grab taxi ve nha..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-medium"
            required
          />

          {/* AI suggestion badge */}
          {aiSuggestion && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              ✨ Dự đoán AI: Phân loại vào danh mục <b>{aiSuggestion}</b>
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400 font-semibold">Danh mục giao dịch</label>
            <span className="text-[10px] text-slate-500">
              {type === "income" ? "Mặc định Salary để dùng gợi ý AI" : "Mặc định Other để dùng gợi ý AI"}
            </span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
          >
            {type === "income" ? (
              <>
                <option value="Salary">Salary (Lương cố định)</option>
                <option value="Bonus">Bonus (Tiền thưởng)</option>
                <option value="Business">Business (Kinh doanh / Bán hàng)</option>
                <option value="Investment">Investment (Đầu tư / Lãi tiết kiệm)</option>
                <option value="Other Income">Other Income (Thu nhập khác)</option>
              </>
            ) : (
              <>
                <option value="Other">Other (Dùng gợi ý AI)</option>
                <option value="Food & Beverage">Food & Beverage (Ăn uống)</option>
                <option value="Transportation">Transportation (Di chuyển)</option>
                <option value="Shopping">Shopping (Mua sắm)</option>
                <option value="Bills & Utilities">Bills & Utilities (Hóa đơn)</option>
                <option value="Entertainment">Entertainment (Giải trí)</option>
              </>
            )}
          </select>
        </div>

        {/* Event selection */}
        {type === "expense" && events && events.length > 0 && (
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Gán vào Sự kiện / Chuyến đi (Không bắt buộc)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-semibold"
            >
              <option value="">Không gán sự kiện (Chi tiêu thường ngày)</option>
              {events.filter(e => !e.is_completed).map(e => (
                <option key={e.id} value={e.id}>{e.name} (Hạn mức: {e.budget_limit.toLocaleString()}đ)</option>
              ))}
            </select>
          </div>
        )}

        {/* Merchant Store */}
        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-2">Cửa hàng / Đối tác (Không bắt buộc)</label>
          <input
            type="text"
            placeholder="Ví dụ: Highlands Coffee, Shopee..."
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg glow-indigo transition-all duration-200"
          >
            Lưu Giao Dịch
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 text-sm font-bold transition-all duration-200"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
}
