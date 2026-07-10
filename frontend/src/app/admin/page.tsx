"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Shield,
  LogOut,
  Users,
  Home,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

// Import tabs
import UserManagement from "./tabs/UserManagement";
import EventManagement from "./tabs/EventManagement";
import RecurringManagement from "./tabs/RecurringManagement";
import MiscategorizedTransactions from "./tabs/MiscategorizedTransactions";

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string; full_name?: string; role?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "events" | "recurring" | "miscategorized">("users");

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const askConfirmation = (title: string, message: string, onConfirmAction: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Auth verification
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .getMe()
      .then((userData) => {
        // Check if user is admin
        if (userData.role !== "admin") {
          showToast("Bạn không có quyền truy cập trang quản trị", "error");
          router.push("/dashboard");
          return;
        }
        setUser(userData);
      })
      .catch((err) => {
        console.error("Auth verification failed:", err);
        api.logout();
        router.push("/login");
      });
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Đang tải trang quản trị...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Quyền truy cập bị từ chối</h1>
          <p className="text-slate-400 mb-6">Chỉ quản trị viên mới có thể truy cập trang này.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950/40 border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Aura
              </span>
              <span className="font-semibold text-lg text-indigo-400">Admin</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/5 bg-slate-950/20">
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Quản trị viên</span>
            <span className="text-sm font-bold text-white block mt-0.5">{user?.full_name || "Admin"}</span>
            <span className="text-xs text-indigo-400 block mt-1">{user?.email}</span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "users"
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Quản lý người dùng
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "events"
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              Quản lý sự kiện
            </button>

            <button
              onClick={() => setActiveTab("recurring")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "recurring"
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              Giao dịch định kỳ
            </button>

            <button
              onClick={() => setActiveTab("miscategorized")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "miscategorized"
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
              Phân loại sai
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <Home className="h-4 w-4" /> Về Dashboard
          </button>

          <button
            onClick={() => {
              api.logout();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/20 border border-rose-900/35 hover:border-rose-500/50 text-rose-300 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeTab === "users" && <UserManagement showToast={showToast} askConfirmation={askConfirmation} />}

        {activeTab === "events" && <EventManagement showToast={showToast} askConfirmation={askConfirmation} />}

        {activeTab === "recurring" && <RecurringManagement showToast={showToast} askConfirmation={askConfirmation} />}

        {activeTab === "miscategorized" && (
          <MiscategorizedTransactions showToast={showToast} askConfirmation={askConfirmation} />
        )}
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg font-medium text-sm animate-slideIn ${
              toast.type === "success"
                ? "bg-green-900/80 text-green-100 border border-green-700/50"
                : toast.type === "error"
                ? "bg-red-900/80 text-red-100 border border-red-700/50"
                : "bg-blue-900/80 text-blue-100 border border-blue-700/50"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">{confirmDialog.title}</h3>
            <p className="text-slate-300 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
