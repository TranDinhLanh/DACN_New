"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Shield,
  Trash2,
  Crown,
  Search,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  total_transactions: number;
  total_spent: number;
  total_income: number;
}

interface AdminTabProps {
  currentUser?: { email: string; full_name?: string; role?: string } | null;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
  askConfirmation?: (title: string, message: string, onConfirmAction: () => void) => void;
}

export default function AdminTab({ currentUser, showToast, askConfirmation }: AdminTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleAction, setRoleAction] = useState<string>("");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  // Fetch users with SWR
  const { data: fetchedUsers, mutate: mutateUsers } = useSWR(
    currentUser?.role === "admin" ? "admin-users" : null,
    () => api.getAdminUsers(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Sync fetched users to state
  useEffect(() => {
    if (fetchedUsers) {
      setUsers(fetchedUsers);
      applySearch(searchTerm, fetchedUsers);
    }
  }, [fetchedUsers]);

  const applySearch = (term: string, userList: User[] = users) => {
    const filtered = userList.filter(
      (u) =>
        u.email.toLowerCase().includes(term.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applySearch(term);
  };

  const handlePromoteUser = (user: User) => {
    if (user.role === "admin") {
      showToast?.("Người dùng này đã là admin", "info");
      return;
    }

    askConfirmation?.(
      "Nâng cấp thành Admin",
      `Bạn có chắc chắn muốn nâng cấp ${user.email} lên Admin?`,
      async () => {
        setLoadingUserId(user.id);
        try {
          await api.updateUserRole(user.id, "admin");
          mutateUsers();
          showToast?.("Nâng cấp thành công!", "success");
          setSelectedUser(null);
        } catch (err: any) {
          showToast?.(err.message || "Nâng cấp thất bại", "error");
        } finally {
          setLoadingUserId(null);
        }
      }
    );
  };

  const handleDemoteUser = (user: User) => {
    // Only admins can demote, and users CANNOT demote admins
    if (currentUser?.role !== "admin") {
      showToast?.("Chỉ admin mới có thể hạ cấp người dùng", "error");
      return;
    }

    if (user.role === "user") {
      showToast?.("Người dùng này đã là user", "info");
      return;
    }

    askConfirmation?.(
      "Hạ cấp từ Admin",
      `Bạn có chắc chắn muốn hạ cấp ${user.email} về User?`,
      async () => {
        setLoadingUserId(user.id);
        try {
          await api.updateUserRole(user.id, "user");
          mutateUsers();
          showToast?.("Hạ cấp thành công!", "success");
          setSelectedUser(null);
        } catch (err: any) {
          showToast?.(err.message || "Hạ cấp thất bại", "error");
        } finally {
          setLoadingUserId(null);
        }
      }
    );
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.email) {
      showToast?.("Không thể xóa chính mình", "error");
      return;
    }

    askConfirmation?.(
      "Xóa người dùng",
      `Bạn có chắc chắn muốn xóa ${user.email}? Hành động này không thể hoàn tác.`,
      async () => {
        setLoadingUserId(user.id);
        try {
          await api.deleteAdminUser(user.id);
          mutateUsers();
          showToast?.("Xóa người dùng thành công!", "success");
          setSelectedUser(null);
        } catch (err: any) {
          showToast?.(err.message || "Xóa thất bại", "error");
        } finally {
          setLoadingUserId(null);
        }
      }
    );
  };

  // Check if current user is admin
  const isCurrentUserAdmin = currentUser?.role === "admin";

  if (!isCurrentUserAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-slate-400">Chỉ quản trị viên mới có thể truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Quản trị hệ thống</h2>
        </div>
        <button
          onClick={() => mutateUsers()}
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
          placeholder="Tìm kiếm theo email hoặc tên..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/30 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Tên</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Vai trò</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Giao dịch</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Tổng thu</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Tổng chi</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "Không tìm thấy người dùng" : "Không có người dùng"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs break-all">{user.email}</td>
                    <td className="px-4 py-3 text-slate-300">{user.full_name || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-900/40 text-purple-300 border border-purple-700/50"
                            : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                        }`}
                      >
                        {user.role === "admin" && <Crown className="h-3.5 w-3.5" />}
                        {user.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {user.total_transactions}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {Number(user.total_income).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                      {Number(user.total_spent).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setRoleAction(user.role === "admin" ? "demote" : "promote");
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            user.role === "admin"
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-purple-900/30 hover:bg-purple-900/50 text-purple-300"
                          }`}
                          title={user.role === "admin" ? "Hạ cấp" : "Nâng cấp"}
                          disabled={loadingUserId === user.id}
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors disabled:opacity-50"
                          title="Xóa người dùng"
                          disabled={loadingUserId === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
        <p className="font-semibold mb-1">ℹ️ Ghi chú về quyền:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>User thường có thể nâng cấp người khác lên Admin</li>
          <li>Admin không thể hạ cấp Admin về User</li>
          <li>Chỉ Admin mới có thể xóa người dùng</li>
        </ul>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">
              {roleAction === "promote" ? "Nâng cấp thành Admin" : "Hạ cấp về User"}
            </h3>
            <p className="text-slate-300 mb-6">
              {roleAction === "promote"
                ? `Bạn có chắc chắn muốn nâng cấp ${selectedUser.email} lên Admin?`
                : `Bạn có chắc chắn muốn hạ cấp ${selectedUser.email} về User?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (roleAction === "promote") {
                    handlePromoteUser(selectedUser);
                  } else {
                    handleDemoteUser(selectedUser);
                  }
                }}
                disabled={loadingUserId === selectedUser.id}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleAction === "promote"
                    ? "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                }`}
              >
                {loadingUserId === selectedUser.id ? "Đang xử lý..." : roleAction === "promote" ? "Nâng cấp" : "Hạ cấp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
