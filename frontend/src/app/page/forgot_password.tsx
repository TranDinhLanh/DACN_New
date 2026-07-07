"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, KeyRound, Check, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Reset Password
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null); // To display for ease of testing!

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.forgotPassword(email);
      // Capture OTP if backend returns it (dev/testing mode)
      if (data.otp) {
        setReceivedOtp(data.otp);
      }
      setSuccess("Mã OTP đã được gửi đến email của bạn (giả lập)");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Không thể gửi mã OTP. Vui lòng kiểm tra email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.resetPassword(email, otp, newPassword);
      setSuccess("Khôi phục mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 overflow-hidden">
      {/* Decorative background radial blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-950/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center glow-indigo mb-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent inline-block">
              Aura<span className="text-indigo-400">Finance</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">Khôi phục quyền truy cập tài khoản</p>
          </div>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="p-3 mb-4 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium">
              ✓ {success}
            </div>
          )}

          {/* Developer Testing Info Helper */}
          {receivedOtp && (
            <div className="p-3 mb-4 text-xs bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 rounded-xl">
              💡 <b>Môi trường Phát triển (Demo OTP):</b> Mã OTP của bạn là <span className="font-extrabold text-white bg-indigo-600/50 px-2 py-0.5 rounded text-sm">{receivedOtp}</span> (Bạn có thể copy để điền bước tiếp theo).
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Nhập địa chỉ Email đăng ký</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg glow-indigo transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="border-2 border-white/30 border-t-white h-5 w-5 rounded-full animate-spin"></span>
                ) : (
                  <>
                    Gửi Mã Xác Thực OTP <KeyRound className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter OTP & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Nhập mã xác thực OTP (6 chữ số)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <KeyRound className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors font-extrabold tracking-widest text-center"
                    required
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg glow-indigo transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="border-2 border-white/30 border-t-white h-5 w-5 rounded-full animate-spin"></span>
                ) : (
                  <>
                    Khôi Phục Mật Khẩu <Check className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Prompt Login */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Nhớ ra mật khẩu?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline inline-flex items-center gap-0.5">
              Đăng nhập tại đây <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
