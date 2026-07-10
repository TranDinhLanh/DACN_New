"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, UserPlus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // reCAPTCHA initialization

  useEffect(() => {
    // Only load if not already loaded
    if (!document.getElementById("recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initRecaptcha();
      };
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      document.body.appendChild(script);
    } else {
      initRecaptcha();
    }

    function initRecaptcha() {
      if (typeof window !== "undefined" && (window as any).grecaptcha && (window as any).grecaptcha.render && recaptchaRef.current) {
        try {
          // Render explicit Captcha widget
          (window as any).grecaptcha.render(recaptchaRef.current, {
            sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfFl0gtAAAAALWLUQ9mSFKi2JJgwNCK9NvKiugW",
            callback: (token: string) => {
              setCaptchaToken(token);
              setError(null);
            },
            "expired-callback": () => {
              setCaptchaToken(null);
            },
            "error-callback": () => {
              console.error("reCAPTCHA failed to load or invalid site key.");
            }
          });
        } catch (e) {
          console.log("reCAPTCHA already rendered", e);
        }
      }
    }

    // Polling check to ensure grecaptcha is ready if script was already loaded
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).grecaptcha && (window as any).grecaptcha.render && recaptchaRef.current) {
        initRecaptcha();
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    // reCAPTCHA validation
    if (!captchaToken) {
      setError("Vui lòng tích chọn xác thực reCAPTCHA");
      return;
    }

    setLoading(true);

    try {
      await api.register(email, password, fullName, captchaToken || "");
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      // Reset recaptcha widget
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        (window as any).grecaptcha.reset();
        setCaptchaToken(null);
      }
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
            <p className="text-slate-400 text-xs mt-1">Đăng ký tài khoản để bắt đầu quản lý tài chính</p>
          </div>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto glow-emerald animate-bounce">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">Đăng ký thành công!</h3>
              <p className="text-slate-400 text-xs">Đang tự động chuyển hướng bạn sang trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-medium">
                  ⚠️ {error}
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Họ và tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1">
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
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Mật khẩu (tối thiểu 6 ký tự)</label>
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
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500 transition-colors"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* reCAPTCHA Widget container */}
              <div className="space-y-2">
                <div className="flex justify-center py-2">
                  <div ref={recaptchaRef} id="recaptcha-container"></div>
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
                    Đăng Ký Tài Khoản <UserPlus className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Prompt Login */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Đã có tài khoản?{" "}
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
