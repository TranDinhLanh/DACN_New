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
  // reCAPTCHA is temporarily hidden/bypassed
  const [captchaToken, setCaptchaToken] = useState<string | null>("mock_captcha_token");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Fallback CAPTCHA states when Google reCAPTCHA fails/invalid key
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [fallbackAnswer, setFallbackAnswer] = useState("");
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, result: 0 });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setMathQuestion({
      num1,
      num2,
      result: num1 + num2
    });
  };

  useEffect(() => {
    generateMathQuestion();
  }, []);

  // reCAPTCHA loader disabled temporarily (commented out)
  /*
  useEffect(() => {
    // Only load if not already loaded
    if (!document.getElementById("recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        initRecaptcha();
      };
    } else {
      initRecaptcha();
    }

    function initRecaptcha() {
      if (typeof window !== "undefined" && (window as any).grecaptcha && (window as any).grecaptcha.render && recaptchaRef.current) {
        try {
          // Render explicit Captcha widget
          (window as any).grecaptcha.render(recaptchaRef.current, {
            sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyhH71UMIEGNQ_MXjiZKhI", // Google developer test key
            callback: (token: string) => {
              setCaptchaToken(token);
              setError(null);
            },
            "expired-callback": () => {
              setCaptchaToken(null);
            },
            "error-callback": () => {
              console.warn("reCAPTCHA failed or invalid site key. Switching to backup math verification.");
              setRecaptchaError(true);
            }
          });
        } catch (e) {
          // Widget might already be rendered
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
  */

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // reCAPTCHA validation bypassed temporarily (commented out)
    /*
    if (!captchaToken) {
      setError(recaptchaError ? "Vui lòng nhập đúng kết quả phép tính để xác thực" : "Vui lòng tích chọn xác thực reCAPTCHA");
      return;
    }
    */

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

              {/* reCAPTCHA Widget container (Temporarily commented out)
              {!recaptchaError ? (
                <div className="space-y-2">
                  <div className="flex justify-center py-2">
                    <div ref={recaptchaRef} id="recaptcha-container"></div>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRecaptchaError(true);
                        generateMathQuestion();
                      }}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors underline"
                    >
                      Không hiển thị được reCAPTCHA? Nhấp vào đây để xác thực phụ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-3">
                  <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <span>⚠️</span> Hệ thống xác thực reCAPTCHA bị lỗi.
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Vui lòng tính nhẩm kết quả dưới đây để xác thực:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-indigo-300 tracking-wide select-none">
                      {mathQuestion.num1} + {mathQuestion.num2} = ?
                    </div>
                    <input
                      type="number"
                      placeholder="Kết quả"
                      value={fallbackAnswer}
                      onChange={(e) => {
                        setFallbackAnswer(e.target.value);
                        if (parseInt(e.target.value) === mathQuestion.result) {
                          setCaptchaToken("mock_captcha_token");
                          setError(null);
                        } else {
                          setCaptchaToken(null);
                        }
                      }}
                      className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-600 transition-colors"
                      required
                    />
                  </div>
                  {captchaToken === "mock_captcha_token" && (
                    <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      ✓ Xác thực phụ thành công! Bạn có thể nhấn Đăng ký.
                    </div>
                  )}
                </div>
              )}
              */}

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
