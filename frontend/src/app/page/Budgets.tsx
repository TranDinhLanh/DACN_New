"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { api } from "@/lib/api";

interface BudgetsTabProps {
  monthlyIncome: number;
  setMonthlyIncome: React.Dispatch<React.SetStateAction<number>>;
  jarPercentages: { [key: string]: number };
  setJarPercentages: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  budgets: any[];
  setBudgets: React.Dispatch<React.SetStateAction<any[]>>;
  mutate: any;
}

export default function BudgetsTab({
  monthlyIncome,
  setMonthlyIncome,
  jarPercentages,
  setJarPercentages,
  budgets,
  setBudgets,
  mutate,
}: BudgetsTabProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const totalPercent = Object.values(jarPercentages).reduce((a, b) => a + b, 0);

  const applyPreset503020 = () => {
    setJarPercentages({
      "Food & Beverage": 30,
      Transportation: 10,
      Shopping: 15,
      "Bills & Utilities": 10,
      Entertainment: 15,
      Other: 20,
    });
  };

  const applyPreset6Jars = () => {
    setJarPercentages({
      "Food & Beverage": 35,
      Transportation: 10,
      Shopping: 15,
      "Bills & Utilities": 10,
      Entertainment: 15,
      Other: 15,
    });
  };

  const handlePercentageChange = (cat: string, val: number) => {
    setJarPercentages((prev) => {
      const updated = { ...prev, [cat]: val };
      return updated;
    });
  };

  const handleSaveJars = () => {
    if (totalPercent !== 100) return;

    setIsSaving(true);
    const promises = Object.entries(jarPercentages).map(([cat, pct]) => {
      const limit = Math.round((pct / 100) * monthlyIncome);
      return api.createOrUpdateBudget({
        category: cat,
        limit_amount: limit,
        period: "monthly",
      });
    });

    Promise.all(promises)
      .then(() => {
        setBudgets((prev) => {
          return Object.entries(jarPercentages).map(([cat, pct]) => {
            const limit = Math.round((pct / 100) * monthlyIncome);
            const existing = prev.find((b) => b.category === cat);
            return {
              category: cat,
              limit_amount: limit,
              spent_amount: existing ? existing.spent_amount : 0,
            };
          });
        });
        mutate("budgets");
        alert("Phân chia hũ ngân sách thành công!");
      })
      .catch((err) => {
        console.error("Failed to save all budget jars:", err);
        // Fallback local update
        setBudgets((prev) => {
          return Object.entries(jarPercentages).map(([cat, pct]) => {
            const limit = Math.round((pct / 100) * monthlyIncome);
            const existing = prev.find((b) => b.category === cat);
            return {
              category: cat,
              limit_amount: limit,
              spent_amount: existing ? existing.spent_amount : 0,
            };
          });
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-indigo-400" /> Quản Lý Hũ Chi Tiêu (Timo & MoMo Jars)
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Thiết lập tổng thu nhập hàng tháng và phân bổ tiền vào các hũ tài chính để kiểm soát chi tiêu tối ưu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: INCOME & ALLOCATOR SLIDERS */}
        <div className="lg:col-span-6 glass-card rounded-2xl p-6 border border-white/5 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-300">1. Nhập Tổng Thu Nhập / Lương</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Số tiền nền tảng để chia tỷ lệ phần trăm các hũ</p>
            <div className="mt-3 relative">
              <input
                type="text"
                value={formatVNDString(monthlyIncome)}
                onChange={(e) => setMonthlyIncome(Number(cleanVNDString(e.target.value)) || 0)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-emerald-400 font-extrabold focus:outline-none focus:border-indigo-500"
                placeholder="Ví dụ: 15.000.000"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-500 font-bold">VND</span>
            </div>
          </div>

          {/* PRESETS */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-bold block">2. Chọn quy tắc chia hũ nhanh</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={applyPreset503020}
                className="py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-[10px] text-slate-300 font-bold transition-all hover:bg-slate-950"
              >
                Quy tắc 50 / 30 / 20
              </button>
              <button
                onClick={applyPreset6Jars}
                className="py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-[10px] text-slate-300 font-bold transition-all hover:bg-slate-950"
              >
                Quy tắc 6 Hũ Tài Chính
              </button>
            </div>
          </div>

          {/* SLIDERS LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[11px] text-slate-400 font-bold">3. Điều chỉnh tỷ lệ phần trăm</label>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  totalPercent === 100
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                Tổng: {totalPercent}% / 100%
              </span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(jarPercentages).map(([cat, pct]) => {
                const amount = Math.round((pct / 100) * monthlyIncome);
                let name = cat;
                if (cat === "Food & Beverage") name = "Ăn uống & Ẩm thực";
                if (cat === "Transportation") name = "Di chuyển & Xe cộ";
                if (cat === "Shopping") name = "Mua sắm & Shopping";
                if (cat === "Bills & Utilities") name = "Hóa đơn & Tiện ích";
                if (cat === "Entertainment") name = "Giải trí & Vui chơi";
                if (cat === "Other") name = "Tích lũy & Dự phòng";

                return (
                  <div key={cat} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{name}</span>
                      <span className="font-extrabold text-indigo-400">
                        {pct}% <span className="text-[10px] text-slate-500">({amount.toLocaleString()}đ)</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={pct}
                      onChange={(e) => handlePercentageChange(cat, Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* SAVE ALLOCATION BUTTON */}
          <button
            onClick={handleSaveJars}
            disabled={totalPercent !== 100 || isSaving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-indigo flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang phân bổ...</span>
              </>
            ) : (
              totalPercent === 100 ? "Lưu & Phân bổ Hũ Ngân Sách" : `Tỷ lệ chưa cân bằng (Hiện tại: ${totalPercent}%)`
            )}
          </button>
        </div>

        {/* RIGHT PANEL: TIMO/MOMO JARS DISPLAY VISUAL */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Tổng Quan Hũ Ngân Sách</h3>
            <p className="text-[10px] text-slate-500">Tiến độ chi tiêu thực tế của các hũ so với hạn mức</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(jarPercentages).map(([cat, pct]) => {
                const limit = Math.round((pct / 100) * monthlyIncome);
                const b = budgets.find((x) => x.category === cat) || { spent_amount: 0, limit_amount: limit };
                const percent = Math.min(100, Math.round((b.spent_amount / limit) * 100));
                const remaining = Math.max(0, limit - b.spent_amount);

                let name = cat;
                let emoji = "🍔";
                let colorClass = "from-amber-500 to-orange-600";
                if (cat === "Food & Beverage") {
                  name = "Ăn uống";
                  emoji = "☕";
                  colorClass = "from-orange-500 to-red-600";
                }
                if (cat === "Transportation") {
                  name = "Di chuyển";
                  emoji = "🚗";
                  colorClass = "from-cyan-500 to-blue-600";
                }
                if (cat === "Shopping") {
                  name = "Mua sắm";
                  emoji = "🛍️";
                  colorClass = "from-pink-500 to-rose-600";
                }
                if (cat === "Bills & Utilities") {
                  name = "Hóa đơn";
                  emoji = "⚡";
                  colorClass = "from-yellow-500 to-amber-600";
                }
                if (cat === "Entertainment") {
                  name = "Giải trí";
                  emoji = "🎬";
                  colorClass = "from-purple-500 to-indigo-600";
                }
                if (cat === "Other") {
                  name = "Tích lũy";
                  emoji = "🐖";
                  colorClass = "from-emerald-500 to-teal-600";
                }

                return (
                  <div
                    key={cat}
                    className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex flex-col justify-between space-y-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{emoji}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400">
                        {pct}% hũ
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-xs">{name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Hạn mức: {limit.toLocaleString()}đ</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Đã chi: {b.spent_amount.toLocaleString()}đ</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[9px]">
                      <span className="text-slate-500">Còn lại:</span>
                      <span
                        className={`font-bold ${
                          percent >= 90 ? "text-rose-400" : percent >= 75 ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {remaining.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
