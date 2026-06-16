"use main"; // client side component for custom state, wait in NextJS 14+ it's 'use client'
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Cpu, 
  Layers, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Zap, 
  Sparkles,
  PieChart
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("ocr");

  return (
    <div className="relative min-h-screen bg-[#0b0f19] overflow-hidden">
      {/* Decorative background radial blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-rose-950/10 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center glow-indigo">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">Aura</span>
            <span className="font-semibold text-xl text-indigo-400">Finance</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Tính năng AI</a>
          <a href="#architecture" className="hover:text-indigo-400 transition-colors">Kiến trúc</a>
          <a href="#team" className="hover:text-indigo-400 transition-colors">Nhóm dự án</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Đăng nhập
          </Link>
          <Link href="/register" className="relative group px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden glass-card hover:border-indigo-500/50">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative text-white flex items-center gap-2">
              Đăng ký <ArrowRight className="h-4 w-4 text-indigo-400" />
            </span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
              <Zap className="h-3 w-3 text-cyan-400 animate-pulse" /> Đồ án Tốt Nghiệp: Hệ Thống Quản Lý Tài Chính Cá Nhân AI
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Quản Lý Tài Chính <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Thông Minh Bằng AI
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-xl mx-auto lg:mx-0">
              Tự động hóa toàn bộ quy trình ghi chép chi tiêu. Đọc hóa đơn siêu tốc bằng <b>PaddleOCR</b>, phân loại danh mục tự động và dự báo xu hướng dòng tiền với <b>Facebook Prophet</b>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login" className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 font-bold text-white shadow-lg glow-indigo transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Bắt Đầu Ngay <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#features" className="px-8 py-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 font-bold text-slate-300 transition-all duration-300 flex items-center justify-center gap-2">
                Tìm hiểu chi tiết
              </a>
            </div>

            {/* Micro Trust Stats */}
            <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-bold text-white">99.8%</p>
                <p className="text-xs text-slate-500">Tỷ lệ OCR chính xác</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">&lt; 1.5s</p>
                <p className="text-xs text-slate-500">Xử lý hóa đơn AI</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">30 ngày</p>
                <p className="text-xs text-slate-500">Dự đoán chi tiêu</p>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Visual Mockup (Premium CSS Graph/Dashboard mockup) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-10 blur-2xl pointer-events-none" />
            <div className="glass-card rounded-2xl p-6 border border-white/10 glow-indigo relative overflow-hidden">
              
              {/* Fake Dashboard Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-semibold text-slate-500">aura-finance-ai.local</span>
              </div>

              {/* Fake Financial metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
                  <span className="text-xs text-slate-400 block mb-1">Tổng Thu Nhập</span>
                  <span className="text-xl font-bold text-emerald-400">+42.000.000đ</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
                  <span className="text-xs text-slate-400 block mb-1">Tổng Chi Tiêu</span>
                  <span className="text-xl font-bold text-rose-400">-18.450.000đ</span>
                </div>
              </div>

              {/* Mock AI OCR receipt popup */}
              <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 relative group">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  <Cpu className="h-3 w-3 text-cyan-400 animate-spin" /> Auto OCR Active
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tên hóa đơn vừa chụp</span>
                    <span className="text-sm font-bold text-white">highlands_coffee.jpg</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-indigo-500/10 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cửa Hàng</span>
                    <span className="font-semibold text-indigo-300">Highlands Coffee</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số Tiền Trích</span>
                    <span className="font-semibold text-emerald-400">85,000đ</span>
                  </div>
                </div>
              </div>

              {/* Mock Forecast line chart drawing */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> Dự Báo Dòng Tiền Tháng Tới (Prophet)
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">ML Model</span>
                </div>
                {/* SVG Visual line representation */}
                <div className="h-28 w-full bg-slate-950/50 rounded-xl border border-white/5 relative p-2 flex items-end">
                  <svg className="w-full h-20" viewBox="0 0 100 50">
                    {/* Background grid lines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    
                    {/* Historical path */}
                    <path d="M 0 35 Q 10 38 20 30 T 40 28 T 60 42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    
                    {/* Prophet Prediction dotted continuation */}
                    <path d="M 60 42 Q 70 30 80 25 T 100 15" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="3,3" />
                    <circle cx="60" cy="42" r="2.5" fill="#a5b4fc" className="animate-ping" />
                    <circle cx="60" cy="42" r="1.5" fill="#6366f1" />
                    
                    {/* Peak label */}
                    <circle cx="100" cy="15" r="2" fill="#10b981" />
                  </svg>
                  <span className="absolute bottom-2 right-3 text-[9px] text-slate-500">Dự đoán chi tiêu tăng +15%</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <section id="features" className="mt-32 pt-20 border-t border-white/5">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-white">Giải Pháp AI Đột Phá Cho Tài Chính Cá Nhân</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">
              Chúng tôi kết hợp các mô hình Học máy và Thị giác máy tính tiên tiến nhất để tự động hóa hoàn toàn quy trình phân tích tài chính.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="p-6 rounded-2xl glass-card border border-white/5">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Trích Xuất Hóa Đơn AI (PaddleOCR)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Chụp ảnh hóa đơn mua sắm hoặc ăn uống. Engine PaddleOCR và các biểu thức regex thông minh sẽ tự động trích xuất Tên cửa hàng, Số tiền, Ngày tháng một cách chuẩn xác nhất.
              </p>
            </div>
            
            {/* Box 2 */}
            <div className="p-6 rounded-2xl glass-card border border-white/5">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Cpu className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Phân Loại Giao Dịch Tự Động</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sử dụng các mô hình Scikit-Learn (TF-IDF + Logistic Regression/Naive Bayes) học máy thông minh để lập tức phân loại khoản chi vào các nhóm (Ăn uống, Giải trí, Mua sắm...) ngay khi có mô tả.
              </p>
            </div>

            {/* Box 3 */}
            <div className="p-6 rounded-2xl glass-card border border-white/5">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dự Báo Tiêu Dùng Tương Lai (Prophet)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Công cụ dự báo chuỗi thời gian Facebook Prophet tiên tiến giúp xây dựng mô hình dự đoán xu hướng chi tiêu trong 7 ngày và 30 ngày tiếp theo, đưa ra cảnh báo sớm giúp bạn tối ưu ngân sách.
              </p>
            </div>
          </div>
        </section>

        {/* System Architecture Section */}
        <section id="architecture" className="mt-32 pt-20 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/25 text-xs text-cyan-300 font-semibold">
                Kiến trúc Module hóa
              </div>
              <h2 className="text-3xl font-extrabold text-white">Được xây dựng trên nền tảng công nghệ mạnh mẽ</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Chúng tôi tách biệt hoàn toàn luồng giao tiếp client và xử lý AI nặng. Frontend Next.js tương tác không đồng bộ với Backend FastAPI để xử lý các thuật toán Học máy và OCR tối ưu tốc độ phản hồi.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><b>Frontend Next.js:</b> Dashboard mượt mà, biểu đồ tài chính trực quan.</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><b>Backend FastAPI:</b> Nhỏ gọn, tốc độ cực nhanh, hỗ trợ async.</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><b>PostgreSQL:</b> Cơ sở dữ liệu quan hệ lưu trữ an toàn, tin cậy.</span>
                </li>
              </ul>
            </div>

            {/* Premium architecture visual panel */}
            <div className="glass-card rounded-2xl p-8 border border-white/5 space-y-6">
              <h4 className="text-sm font-bold text-indigo-300 tracking-wide uppercase">Quy trình xử lý hóa đơn AI</h4>
              
              <div className="space-y-4 relative">
                <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 via-cyan-500 to-emerald-500" />
                
                {/* Step 1 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="h-11 w-11 rounded-full bg-slate-900 border border-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-400">1</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Client gửi ảnh hóa đơn</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Next.js thực hiện HTTP POST Multipart-form lên API</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="h-11 w-11 rounded-full bg-slate-900 border border-cyan-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-cyan-400">2</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">FastAPI chạy OCR Engine & AI Parse</h5>
                    <p className="text-xs text-slate-500 mt-0.5">PaddleOCR trích xuất chữ. Regex & Model NLP tìm kiếm Số tiền, Cửa hàng</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="h-11 w-11 rounded-full bg-slate-900 border border-emerald-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-400">3</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Trả kết quả & Xác nhận lưu</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Hệ thống phản hồi JSON nhanh chóng, lưu vào PostgreSQL sau khi người dùng rà soát</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950/40 text-center relative z-10 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-300">AuraFinance AI</span>
          </div>
          <p>© 2026 AuraFinance. Dự án Nghiên cứu & Phát triển Quản lý Chi tiêu Thông minh.</p>
        </div>
      </footer>
    </div>
  );
}
