"use client";

import React from "react";
import { Wallet, Edit, Trash2, Plus, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#06b6d4", "#a855f7", "#ec4899", "#14b8a6", "#3b82f6", "#f43f5e"];

const getCategoryLabel = (cat: string) => {
  if (cat === "Food & Beverage") return "Ăn uống & Ẩm thực";
  if (cat === "Transportation") return "Di chuyển & Xe cộ";
  if (cat === "Shopping") return "Mua sắm & Shopping";
  if (cat === "Bills & Utilities") return "Hóa đơn & Tiện ích";
  if (cat === "Entertainment") return "Giải trí & Vui chơi";
  if (cat === "Other") return "Tích lũy & Dự phòng";
  return cat;
};

interface BudgetsTabProps {
  monthlyIncome: number;
  setMonthlyIncome: React.Dispatch<React.SetStateAction<number>>;
  jarPercentages: { [key: string]: number };
  setJarPercentages: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  budgets: BudgetItem[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  mutate: (key: string) => void;
}

interface BudgetItem {
  id?: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  period?: string;
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
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

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
              id: existing?.id,
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
              id: existing?.id,
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

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (jarPercentages[name] !== undefined) {
      alert("Hũ ngân sách này đã tồn tại!");
      return;
    }

    setJarPercentages((prev) => ({
      ...prev,
      [name]: 0,
    }));

    setNewCategoryName("");
    setShowAddForm(false);
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hũ ngân sách "${cat}"?`)) return;

    const existing = budgets.find((b) => b.category === cat);
    if (existing && existing.id) {
      setIsSaving(true);
      try {
        await api.deleteBudget(existing.id);
      } catch (err) {
        console.error("Failed to delete budget from backend:", err);
      } finally {
        setIsSaving(false);
      }
    }

    setJarPercentages((prev) => {
      const updated = { ...prev };
      delete updated[cat];
      return updated;
    });

    setBudgets((prev) => prev.filter((b) => b.category !== cat));
    mutate("budgets");
  };

  const startRename = (cat: string) => {
    setEditingCategory(cat);
    setRenameValue(cat);
  };

  const handleRenameCategory = async (oldCat: string) => {
    const newCat = renameValue.trim();
    if (!newCat || oldCat === newCat) {
      setEditingCategory(null);
      return;
    }

    if (jarPercentages[newCat] !== undefined) {
      alert("Tên hũ ngân sách này đã tồn tại!");
      return;
    }

    const existingBudget = budgets.find((b) => b.category === oldCat);
    const currentPercent = jarPercentages[oldCat] ?? 0;
    const currentLimit = Math.round((currentPercent / 100) * monthlyIncome);

    setIsSaving(true);
    try {
      await api.createOrUpdateBudget({
        category: newCat,
        limit_amount: currentLimit,
        period: existingBudget?.period || "monthly",
      });

      if (existingBudget && existingBudget.id) {
        await api.deleteBudget(existingBudget.id);
      }

      setJarPercentages((prev) => {
        const updated = { ...prev };
        const val = updated[oldCat];
        delete updated[oldCat];
        updated[newCat] = val;
        return updated;
      });

      setBudgets((prev) =>
        prev
          .filter((b) => b.category !== oldCat)
          .concat({
            id: existingBudget?.id,
            category: newCat,
            limit_amount: currentLimit,
            spent_amount: existingBudget?.spent_amount ?? 0,
          })
      );

      setEditingCategory(null);
      mutate("budgets");
    } catch (err) {
      console.error("Failed to rename category:", err);
      alert("Đã xảy ra lỗi khi đổi tên hũ!");
    } finally {
      setIsSaving(false);
    }
  };

  const pieData = Object.entries(jarPercentages)
    .filter(([, pct]) => pct > 0)
    .map(([cat, pct]) => {
      return {
        name: getCategoryLabel(cat),
        value: pct,
        amount: Math.round((pct / 100) * monthlyIncome),
      };
    });

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1 transition-all"
                >
                  <Plus className="h-3 w-3" /> Thêm danh mục
                </button>
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
            </div>

            {/* INLINE ADD FORM */}
            {showAddForm && (
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/20 flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-150">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Tên hũ chi tiêu mới..."
                  className="flex-1 bg-slate-950 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategoryName("");
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-3.5">
              {Object.entries(jarPercentages).map(([cat, pct]) => {
                const amount = Math.round((pct / 100) * monthlyIncome);
                const name = getCategoryLabel(cat);

                const isEditing = editingCategory === cat;

                return (
                  <div key={cat} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2 group">
                    <div className="flex justify-between items-center text-xs">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleRenameCategory(cat)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">{name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startRename(cat)}
                              className="text-slate-400 hover:text-indigo-400 p-0.5 rounded transition-all"
                              title="Đổi tên danh mục"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-all"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
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
          {/* Biểu đồ phân bổ hũ ngân sách */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Biểu đồ tròn phân bổ hũ chi tiêu</h3>
            <p className="text-[10px] text-slate-500">Biểu đồ thể hiện tỷ lệ phần trăm phân chia thu nhập vào từng hũ</p>

            <div className="h-64 w-full flex items-center justify-center relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        borderColor: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "10px",
                      }}
                      formatter={(value, _name, props) => {
                        const payload = props as { payload?: { amount?: number } };
                        return [`${String(value ?? 0)}% (${(payload.payload?.amount ?? 0).toLocaleString()}đ)`, "Tỷ lệ"];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500">Chưa có hũ ngân sách nào được phân bổ tỷ lệ</span>
              )}
            </div>
          </div>

          {/* Tiến độ chi tiêu các hũ */}
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
                let emoji = "💰";
                let colorClass = "from-indigo-500 to-purple-600";

                const catLower = cat.toLowerCase();
                if (cat === "Food & Beverage" || catLower.includes("ăn") || catLower.includes("uống") || catLower.includes("thực")) {
                  name = cat === "Food & Beverage" ? "Ăn uống" : cat;
                  emoji = "☕";
                  colorClass = "from-orange-500 to-red-600";
                } else if (cat === "Transportation" || catLower.includes("xe") || catLower.includes("di chuyển") || catLower.includes("cộ")) {
                  name = cat === "Transportation" ? "Di chuyển" : cat;
                  emoji = "🚗";
                  colorClass = "from-cyan-500 to-blue-600";
                } else if (cat === "Shopping" || catLower.includes("mua sắm") || catLower.includes("shopping") || catLower.includes("quần áo")) {
                  name = cat === "Shopping" ? "Mua sắm" : cat;
                  emoji = "🛍️";
                  colorClass = "from-pink-500 to-rose-600";
                } else if (cat === "Bills & Utilities" || catLower.includes("hóa đơn") || catLower.includes("điện") || catLower.includes("nước") || catLower.includes("tiện ích")) {
                  name = cat === "Bills & Utilities" ? "Hóa đơn" : cat;
                  emoji = "⚡";
                  colorClass = "from-yellow-500 to-amber-600";
                } else if (cat === "Entertainment" || catLower.includes("giải trí") || catLower.includes("chơi") || catLower.includes("phim")) {
                  name = cat === "Entertainment" ? "Giải trí" : cat;
                  emoji = "🎬";
                  colorClass = "from-purple-500 to-indigo-600";
                } else if (cat === "Other" || catLower.includes("tích lũy") || catLower.includes("khác") || catLower.includes("dự phòng")) {
                  name = cat === "Other" ? "Tích lũy" : cat;
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
