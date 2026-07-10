"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Calendar, Trash2, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface Event {
  id: string;
  name: string;
  user_id: string;
  user_email: string;
  user_name: string;
  budget_limit: number;
  total_spent: number;
  remaining: number;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  transaction_count: number;
}

interface EventManagementProps {
  showToast?: (message: string, type: "success" | "error" | "info") => void;
  askConfirmation?: (title: string, message: string, onConfirmAction: () => void) => void;
}

export default function EventManagement({ showToast, askConfirmation }: EventManagementProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  // Fetch events with SWR
  const { data: fetchedEvents, mutate: mutateEvents } = useSWR(
    "admin-events",
    () => api.getAdminEvents(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Sync fetched events to state
  useEffect(() => {
    if (fetchedEvents && Array.isArray(fetchedEvents)) {
      setEvents(fetchedEvents);
      applySearch(searchTerm, fetchedEvents);
    }
  }, [fetchedEvents]);

  const applySearch = (term: string, eventList: Event[] = events) => {
    const filtered = eventList.filter(
      (e) =>
        e.name.toLowerCase().includes(term.toLowerCase()) ||
        e.user_email.toLowerCase().includes(term.toLowerCase()) ||
        (e.user_name && e.user_name.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredEvents(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applySearch(term);
  };

  const handleDeleteEvent = (event: Event) => {
    askConfirmation?.(
      "Xóa sự kiện",
      `Bạn có chắc chắn muốn xóa sự kiện "${event.name}" của ${event.user_email}? Các giao dịch liên quan sẽ không bị xóa.`,
      async () => {
        setLoadingEventId(event.id);
        try {
          await api.deleteAdminEvent(event.id);
          mutateEvents();
          showToast?.("Xóa sự kiện thành công!", "success");
        } catch (err: any) {
          showToast?.(err.message || "Xóa sự kiện thất bại", "error");
        } finally {
          setLoadingEventId(null);
        }
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusColor = (event: Event) => {
    if (event.is_completed) {
      return "bg-green-900/30 text-green-300 border-green-700/50";
    }
    if (event.remaining < 0) {
      return "bg-red-900/30 text-red-300 border-red-700/50";
    }
    return "bg-blue-900/30 text-blue-300 border-blue-700/50";
  };

  const getStatusText = (event: Event) => {
    if (event.is_completed) return "✅ Hoàn thành";
    if (event.remaining < 0) return "❌ Vượt quá";
    return "⏳ Đang diễn ra";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Quản lý sự kiện</h2>
        </div>
        <button
          onClick={() => mutateEvents()}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện, email hoặc tên người dùng..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Tổng sự kiện</p>
          <p className="text-2xl font-bold text-white">{events.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Đang diễn ra</p>
          <p className="text-2xl font-bold text-blue-400">
            {events.filter((e) => !e.is_completed && e.remaining >= 0).length}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Vượt quá</p>
          <p className="text-2xl font-bold text-red-400">{events.filter((e) => e.remaining < 0).length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-400">{events.filter((e) => e.is_completed).length}</p>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-950/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Sự kiện</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Người dùng</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Ngân sách</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Đã chi</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Còn lại</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Ngày</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "Không tìm thấy sự kiện" : "Không có sự kiện"}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{event.name}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div>{event.user_email}</div>
                      <div className="text-slate-500">{event.user_name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {formatCurrency(event.budget_limit)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {formatCurrency(event.total_spent)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs font-mono ${
                        event.remaining < 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {formatCurrency(event.remaining)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          event
                        )}`}
                      >
                        {getStatusText(event)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      <div>{formatDate(event.start_date)}</div>
                      {event.end_date && <div className="text-slate-500">→ {formatDate(event.end_date)}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors disabled:opacity-50"
                        title="Xóa sự kiện"
                        disabled={loadingEventId === event.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-blue-200 text-sm">
        <p className="font-semibold mb-1">ℹ️ Thông tin sự kiện:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Xóa sự kiện sẽ không xóa giao dịch liên quan</li>
          <li>Giao dịch sẽ vẫn giữ nguyên nhưng không liên kết với sự kiện</li>
          <li>Các sự kiện hoàn thành vẫn được lưu lại</li>
          <li>Tổng chi được tính từ tất cả giao dịch của sự kiện</li>
        </ul>
      </div>
    </div>
  );
}
