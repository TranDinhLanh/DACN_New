"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";

export default function SecurityTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword !== confirmPassword) {
      setSecurityError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    setSecurityLoading(true);

    try {
      await api.changePassword(oldPassword, newPassword);
      setSecuritySuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setSecurityError(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto glass-card rounded-2xl p-8 border border-white/5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-400" /> Thay Đổi Mật Khẩu
        </h2>
        <p className="text-slate-400 text-xs mt-1">Vui lòng điền thông tin bên dưới để đổi mật khẩu truy cập của bạn.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        {securityError && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium">
            ⚠️ {securityError}
          </div>
        )}

        {securitySuccess && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium">
            ✓ {securitySuccess}
          </div>
        )}

        {/* Old Password */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold block">Mật khẩu cũ</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
            required
          />
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold block">Mật khẩu mới (tối thiểu 6 ký tự)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
            minLength={6}
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold block">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
            minLength={6}
            required
          />
        </div>

        {/* Actions */}
        <button
          type="submit"
          disabled={securityLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-bold transition-all glow-indigo flex items-center justify-center gap-2"
        >
          {securityLoading ? (
            <span className="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
          ) : (
            "Cập nhật mật khẩu"
          )}
        </button>
      </form>
    </div>
  );
}
