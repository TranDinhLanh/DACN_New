"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác");
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
            <p className="text-slate-400 text-xs mt-1">Đăng nhập để quản lý tài chính cá nhân thông minh</p>
          </div>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Địa chỉ Email</label>
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 font-semibold block">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors"
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
                  Đăng Nhập <LogIn className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Prompt Register */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline inline-flex items-center gap-0.5">
              Đăng ký ngay <ArrowRight className="h-3 w-3" />
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
