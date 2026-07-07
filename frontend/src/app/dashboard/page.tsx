"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  Sparkles,
  Layers,
  Clock,
  FileText,
  Plus,
  AlertTriangle,
  Lock,
  LogOut,
  Trash2,
  Edit,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

// Import our modular components
import OverviewTab from "../page/Overview";
import HistoryTab from "../page/History";
import AddTransactionTab from "../page/AddTransaction";
import OcrTab from "./components/Ocr";
import BudgetsTab from "../page/Budgets";
import SecurityTab from "../page/Security";
import RecurringTab from "../page/Recurring";

// Interfaces
interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  transaction_date: string;
  merchant_name?: string;
}

interface Budget {
  category: string;
  limit_amount: number;
  spent_amount: number;
}

// Initial Mock Datasets
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "1", amount: 42000000, type: "income", category: "Salary", description: "Lương tháng này", transaction_date: "2026-05-25", merchant_name: "Công ty Công nghệ" },
  { id: "2", amount: 1200000, type: "expense", category: "Bills & Utilities", description: "Hóa đơn điện sinh hoạt", transaction_date: "2026-05-26", merchant_name: "EVN Điện Lực" },
  { id: "3", amount: 85000, type: "expense", category: "Food & Beverage", description: "Ca phe Highlands Coffee", transaction_date: "2026-05-27", merchant_name: "Highlands Coffee" },
  { id: "4", amount: 450000, type: "expense", category: "Shopping", description: "Mua ao thun shopee", transaction_date: "2026-05-24", merchant_name: "Shopee Mall" },
  { id: "5", amount: 150000, type: "expense", category: "Transportation", description: "Grab taxi di hoc", transaction_date: "2026-05-23", merchant_name: "Grab Taxi" },
  { id: "6", amount: 2400000, type: "expense", category: "Bills & Utilities", description: "Thanh toan tien nha", transaction_date: "2026-05-01", merchant_name: "Chu nha Tro" },
  { id: "7", amount: 950000, type: "expense", category: "Entertainment", description: "Ve xem phim CGV & An uong", transaction_date: "2026-05-18", merchant_name: "CGV Cinemas" },
];

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Jars Budget Allocator states (synchronized on load)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(10000000);
  const [jarPercentages, setJarPercentages] = useState<{ [key: string]: number }>({
    "Food & Beverage": 35,
    "Transportation": 15,
    "Shopping": 15,
    "Bills & Utilities": 15,
    "Entertainment": 10,
    "Other": 10
  });
  // Tab/Screen navigation State
  const [activeTab, setActiveTab] = useState<
    "overview" | "add" | "ocr" | "budgets" | "security" | "history" | "recurring" | "events"
  >("overview");

  // Edit Transaction states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("Other");
  const [editDescription, setEditDescription] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string | null>(null);

  // Sync editCategory when editType changes in the Edit modal
  useEffect(() => {
    if (editingTransaction) {
      if (editType === "income") {
        const incomeCats = ["Salary", "Bonus", "Business", "Investment", "Other Income"];
        if (!incomeCats.includes(editCategory)) {
          setEditCategory("Salary");
        }
      } else {
        const expenseCats = ["Other", "Food & Beverage", "Transportation", "Shopping", "Bills & Utilities", "Entertainment"];
        if (!expenseCats.includes(editCategory)) {
          setEditCategory("Other");
        }
      }
    }
  }, [editType, editingTransaction]);

  // Chatbox UI States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatView, setChatView] = useState<"chat" | "history">("chat");
  const [pastChats, setPastChats] = useState<{ id: string; title: string; messages: { role: string; content: string }[]; createdAt: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([
    "Ngân sách tháng này thế nào?",
    "Tôi đã chi tiêu bao nhiêu?",
    "Số dư tài khoản hiện tại?"
  ]);

  // Events tab states
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventBudget, setNewEventBudget] = useState("");
  const [newEventStartDate, setNewEventStartDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventCompleted, setNewEventCompleted] = useState(false);
  
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<any | null>(null);
  const [eventId, setEventId] = useState<string>("");

  const fetchEvents = () => {
    api.getEvents()
      .then(data => {
        setEvents(data || []);
      })
      .catch(err => console.error("Failed to load events:", err));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const rawBudget = Number(cleanVNDString(newEventBudget)) || 0;
    
    api.createEvent({
      name: newEventName,
      budget_limit: rawBudget,
      start_date: newEventStartDate || undefined,
      end_date: newEventEndDate || undefined,
      is_completed: newEventCompleted
    })
      .then(() => {
        setNewEventName("");
        setNewEventBudget("");
        setNewEventStartDate("");
        setNewEventEndDate("");
        setNewEventCompleted(false);
        setShowCreateEventForm(false);
        fetchEvents();
      })
      .catch(err => console.error("Failed to create event:", err));
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện này? Các giao dịch liên quan sẽ không bị xóa nhưng sẽ được gỡ khỏi sự kiện.")) {
      api.deleteEvent(id)
        .then(() => {
          if (selectedEventForDetail?.id === id) {
            setSelectedEventForDetail(null);
            setSelectedEventDetail(null);
          }
          fetchEvents();
          api.getTransactions()
            .then(data => setTransactions(data || []))
            .catch(err => console.error(err));
        })
        .catch(err => console.error("Failed to delete event:", err));
    }
  };

  const handleSelectEventForDetail = (id: string) => {
    if (selectedEventForDetail?.id === id) {
      setSelectedEventForDetail(null);
      setSelectedEventDetail(null);
    } else {
      const event = events.find(e => e.id === id);
      setSelectedEventForDetail(event);
      api.getEventDetail(id)
        .then(detail => {
          setSelectedEventDetail(detail);
        })
        .catch(err => console.error("Failed to load event details:", err));
    }
  };

  // Load chats from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPastChats = localStorage.getItem("aura_past_chats");
      const savedActiveChatId = localStorage.getItem("aura_active_chat_id");
      const savedChatMessages = localStorage.getItem("aura_chat_messages");

      if (savedPastChats) {
        setPastChats(JSON.parse(savedPastChats));
      }

      if (savedActiveChatId && savedChatMessages) {
        setActiveChatId(savedActiveChatId);
        setChatMessages(JSON.parse(savedChatMessages));
      } else {
        const newId = Date.now().toString();
        const initialMsg = [
          {
            role: "assistant",
            content: "Chào bạn! Tôi là **AuraAI**, trợ lý tài chính cá nhân của bạn. Tôi có thể giúp bạn kiểm tra ngân sách, xem chi tiêu và đưa ra các lời khuyên hữu ích. Bạn có câu hỏi nào cho tôi không?"
          }
        ];
        setActiveChatId(newId);
        setChatMessages(initialMsg);
        localStorage.setItem("aura_active_chat_id", newId);
        localStorage.setItem("aura_chat_messages", JSON.stringify(initialMsg));
      }
    }
  }, []);

  // Save current chat messages to localStorage whenever they change
  useEffect(() => {
    if (activeChatId && chatMessages.length > 0) {
      localStorage.setItem("aura_chat_messages", JSON.stringify(chatMessages));
    }
  }, [chatMessages, activeChatId]);

  const handleEndChat = () => {
    if (chatMessages.length <= 1) {
      return;
    }

    const firstUserMsg = chatMessages.find(m => m.role === "user");
    let title = firstUserMsg ? firstUserMsg.content : "Cuộc trò chuyện ngắn";
    if (title.length > 30) {
      title = title.substring(0, 27) + "...";
    }

    const completedChat = {
      id: activeChatId,
      title: title,
      messages: chatMessages,
      createdAt: new Date().toLocaleString("vi-VN")
    };

    const updatedPastChats = [completedChat, ...pastChats];
    setPastChats(updatedPastChats);
    localStorage.setItem("aura_past_chats", JSON.stringify(updatedPastChats));

    // Reset active chat
    const newId = Date.now().toString();
    const initialMsg = [
      {
        role: "assistant",
        content: "Chào bạn! Tôi là **AuraAI**, trợ lý tài chính cá nhân của bạn. Tôi có thể giúp bạn kiểm tra ngân sách, xem chi tiêu và đưa ra các lời khuyên hữu ích. Bạn có câu hỏi nào cho tôi không?"
      }
    ];
    setActiveChatId(newId);
    setChatMessages(initialMsg);
    localStorage.setItem("aura_active_chat_id", newId);
    localStorage.setItem("aura_chat_messages", JSON.stringify(initialMsg));
    setChatView("chat");
  };

  const handleViewPastChat = (session: { id: string; title: string; messages: { role: string; content: string }[]; createdAt: string }) => {
    if (chatMessages.length > 1) {
      const firstUserMsg = chatMessages.find(m => m.role === "user");
      let title = firstUserMsg ? firstUserMsg.content : "Cuộc trò chuyện ngắn";
      if (title.length > 30) {
        title = title.substring(0, 27) + "...";
      }

      setPastChats(prev => {
        const filtered = prev.filter(c => c.id !== activeChatId);
        const updated = [{
          id: activeChatId,
          title: title,
          messages: chatMessages,
          createdAt: new Date().toLocaleString("vi-VN")
        }, ...filtered];
        localStorage.setItem("aura_past_chats", JSON.stringify(updated));
        return updated;
      });
    }

    setActiveChatId(session.id);
    setChatMessages(session.messages);
    localStorage.setItem("aura_active_chat_id", session.id);
    localStorage.setItem("aura_chat_messages", JSON.stringify(session.messages));
    setChatView("chat");
  };

  const handleDeletePastChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pastChats.filter(c => c.id !== id);
    setPastChats(updated);
    localStorage.setItem("aura_past_chats", JSON.stringify(updated));

    if (activeChatId === id) {
      const newId = Date.now().toString();
      const initialMsg = [
        {
          role: "assistant",
          content: "Chào bạn! Tôi là **AuraAI**, trợ lý tài chính cá nhân của bạn. Tôi có thể giúp bạn kiểm tra ngân sách, xem chi tiêu và đưa ra các lời khuyên hữu ích. Bạn có câu hỏi nào cho tôi không?"
        }
      ];
      setActiveChatId(newId);
      setChatMessages(initialMsg);
      localStorage.setItem("aura_active_chat_id", newId);
      localStorage.setItem("aura_chat_messages", JSON.stringify(initialMsg));
    }
  };

  // Fetch transactions and budgets using SWR for automatic updates
  const { data: fetchedTransactions } = useSWR(
    mounted && user ? "transactions" : null,
    () => api.getTransactions(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const { data: fetchedBudgets } = useSWR(
    mounted && user ? "budgets" : null,
    () => api.getBudgets(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const { data: recurringTemplates, mutate: mutateRecurring } = useSWR(
    mounted && user ? "recurring-templates" : null,
    () => api.getRecurringTemplates(),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Sync SWR data to component state
  useEffect(() => {
    if (fetchedTransactions) {
      setTransactions(fetchedTransactions);

      const totalIncome = fetchedTransactions
        .filter((t: Transaction) => t.type === "income")
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      if (totalIncome > 0) {
        setMonthlyIncome(totalIncome);
      }
    }
  }, [fetchedTransactions]);

  useEffect(() => {
    if (fetchedBudgets) {
      setBudgets(fetchedBudgets);
      const data = fetchedBudgets;
      if (data && data.length > 0) {
        const totalLimit = data.reduce((sum: number, b: Budget) => sum + b.limit_amount, 0);
        const totalIncome = transactions
          .filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        if (totalLimit > 0 && totalIncome === 0) {
          setMonthlyIncome(totalLimit);
        }

        if (totalLimit > 0) {
          setJarPercentages(prev => {
            const updated = { ...prev };
            data.forEach((b: Budget) => {
              if (b.category in updated) {
                updated[b.category] = Math.round((b.limit_amount / totalLimit) * 100);
              }
            });
            return updated;
          });
        }
      }
    }
  }, [fetchedBudgets, transactions]);

  // Auth and hydration verification shield
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    api.getMe()
      .then(userData => {
        setUser(userData);
        fetchEvents();
      })
      .catch(err => {
        console.error("Auth verification failed:", err);
        api.logout();
        router.push("/login");
      });
  }, [router]);

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

  // Form handlers for adding transactions
  const handleSaveTransaction = (data: {
    amount: number;
    type: "income" | "expense";
    category: string;
    description: string;
    transaction_date: string;
    merchant_name?: string;
  }) => {
    setGlobalLoadingMessage("Đang lưu giao dịch...");
    api.createTransaction({
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      transaction_date: data.transaction_date,
      merchant_name: data.merchant_name,
      event_id: data.event_id || undefined
    })
      .then(savedTx => {
        setTransactions(prev => [savedTx, ...prev]);
        fetchEvents();

        if (data.type === "expense") {
          setBudgets(prev => prev.map(b => {
            if (b.category === data.category) {
              return { ...b, spent_amount: b.spent_amount + data.amount };
            }
            return b;
          }));
        }
        mutate("transactions");
        mutate("budgets");
        setActiveTab("overview");
      })
      .catch(err => {
        console.error("Failed to save transaction to database:", err);
        const newTx: Transaction = {
          id: Date.now().toString(),
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          transaction_date: data.transaction_date,
          merchant_name: data.merchant_name
        };
        setTransactions(prev => [newTx, ...prev]);
        setActiveTab("overview");
      })
      .finally(() => {
        setGlobalLoadingMessage(null);
      });
  };

  const handleOcrSaveSuccess = (savedTx: any) => {
    setTransactions(prev => [savedTx, ...prev]);
    if (savedTx.type === "expense") {
      setBudgets(prev => prev.map(b => {
        if (b.category === savedTx.category) {
          return { ...b, spent_amount: b.spent_amount + savedTx.amount };
        }
        return b;
      }));
    }
    mutate("transactions");
    mutate("budgets");
    setActiveTab("overview");
  };

  // CRUD handlers for edit/delete
  const handleStartEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditAmount(formatVNDString(tx.amount.toString()));
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditDescription(tx.description);
    setEditMerchant(tx.merchant_name || "");
    setEditTransactionDate(tx.transaction_date);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const oldTx = editingTransaction;
    const newAmount = Number(cleanVNDString(editAmount));
    if (!newAmount || isNaN(newAmount)) return;

    setGlobalLoadingMessage("Đang cập nhật giao dịch...");
    api.updateTransaction(oldTx.id, {
      amount: newAmount,
      type: editType,
      category: editCategory,
      description: editDescription,
      transaction_date: editTransactionDate,
      merchant_name: editMerchant || undefined
    })
      .then(updatedTx => {
        setTransactions(prev => prev.map(t => t.id === oldTx.id ? updatedTx : t));
        setEditingTransaction(null);
        mutate("transactions");
        mutate("budgets");
      })
      .catch(err => {
        console.error("Failed to save transaction edits:", err);
        const updatedLocalTx: Transaction = {
          ...oldTx,
          amount: newAmount,
          type: editType,
          category: editCategory,
          description: editDescription,
          transaction_date: editTransactionDate,
          merchant_name: editMerchant || undefined
        };
        setTransactions(prev => prev.map(t => t.id === oldTx.id ? updatedLocalTx : t));
        setEditingTransaction(null);
      })
      .finally(() => {
        setGlobalLoadingMessage(null);
      });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    setGlobalLoadingMessage("Đang xóa giao dịch...");
    api.deleteTransaction(id)
      .then(() => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        mutate("transactions");
        mutate("budgets");
      })
      .catch(err => {
        console.error("Failed to delete transaction:", err);
        setTransactions(prev => prev.filter(t => t.id !== id));
      })
      .finally(() => {
        setGlobalLoadingMessage(null);
      });
  };

  const handleResetTransactions = () => {
    setTransactions(INITIAL_TRANSACTIONS);
  };

  // Chatbox Send handler
  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    if (!textToSend) {
      setChatInput("");
    }

    const updatedMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const historyToSend = chatMessages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content
      }));

      const data = await api.chatWithAI(text, historyToSend);

      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      if (data.suggested_questions) {
        setChatSuggestions(data.suggested_questions);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Đã xảy ra lỗi kết nối với trợ lý AI: ${err.message || "Vui lòng thử lại sau."}`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Simple Markdown & Table parser for chat bubbles
  const renderMessageContent = (content: string) => {
    if (content.includes("|")) {
      const lines = content.split("\n");
      const beforeParts: string[] = [];
      const afterParts: string[] = [];
      const tableRows: string[][] = [];
      let tableStarted = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("|")) {
          tableStarted = true;
          if (line.includes("---") || line.includes(":-")) continue;

          const cells = line.split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cells.length > 0) {
            tableRows.push(cells);
          }
        } else {
          if (!tableStarted) {
            beforeParts.push(lines[i]);
          } else {
            afterParts.push(lines[i]);
          }
        }
      }

      if (tableRows.length > 0) {
        return (
          <div className="space-y-2">
            {beforeParts.join("\n") && <div className="whitespace-pre-line">{parseBoldText(beforeParts.join("\n"))}</div>}
            <div className="overflow-x-auto my-2 border border-white/10 rounded-lg">
              <table className="w-full text-[10px] text-left border-collapse border-spacing-0">
                <thead>
                  <tr className="bg-slate-800 border-b border-white/10 text-slate-300">
                    {tableRows[0].map((cell, idx) => (
                      <th key={idx} className="p-2 font-bold">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableRows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-white/[0.02]">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 text-slate-400">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {afterParts.join("\n") && <div className="whitespace-pre-line">{parseBoldText(afterParts.join("\n"))}</div>}
          </div>
        );
      }
    }

    return <span className="whitespace-pre-line">{parseBoldText(content)}</span>;
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Đang tải cấu hình AuraFinance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col md:flex-row">

      {/* 1. Sidebar Panel */}
      <aside className="w-full md:w-64 bg-slate-950/40 border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center glow-indigo">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">Aura</span>
              <span className="font-semibold text-lg text-indigo-400">Finance</span>
            </div>
          </div>

          {/* User Brief profile */}
          <div className="p-6 border-b border-white/5 bg-slate-950/20">
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Thành viên hệ thống</span>
            <span className="text-sm font-bold text-white block mt-0.5">{user?.full_name || "Đang tải..."}</span>
            <span className="text-xs text-indigo-400 block mt-1">{user?.email || "..."}</span>
          </div>

          {/* Nav items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "overview"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Layers className="h-4.5 w-4.5" />
              Tổng quan Dashboard
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "history"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Clock className="h-4.5 w-4.5" />
              Lịch sử thu chi
            </button>

            <button
              onClick={() => setActiveTab("ocr")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "ocr"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4.5 w-4.5" />
                Đọc Hóa Đơn AI
              </div>
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider glow-indigo">OCR</span>
            </button>

            <button
              onClick={() => setActiveTab("add")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "add"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Plus className="h-4.5 w-4.5" />
              Thêm giao dịch
            </button>

            <button
              onClick={() => setActiveTab("budgets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "budgets"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
              Hạn mức ngân sách
            </button>

            <button
              onClick={() => setActiveTab("recurring")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "recurring"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <RefreshCw className="h-4.5 w-4.5" />
              Giao dịch định kỳ
            </button>

            <button 
              onClick={() => {
                setActiveTab("events");
                fetchEvents();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "events" 
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              Sự kiện & Chuyến đi
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "security"
                ? "bg-indigo-600/25 border border-indigo-500/30 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Lock className="h-4.5 w-4.5" />
              Đổi mật khẩu
            </button>
          </nav>
        </div>

        {/* Back Link */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={() => {
              api.logout();
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/20 border border-rose-900/35 hover:border-rose-500/50 text-rose-300 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất tài khoản
          </button>

          <Link href="/" className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all duration-200">
            Quay lại trang chủ
          </Link>
        </div>
      </aside>

      {/* 2. Main Dashboard Content Grid */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeTab === "overview" && (
          <OverviewTab
            transactions={transactions}
            budgets={budgets}
            monthlyIncome={monthlyIncome}
            jarPercentages={jarPercentages}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab
            transactions={transactions}
            onResetTransactions={handleResetTransactions}
            onStartEdit={handleStartEdit}
            onDeleteTransaction={handleDeleteTransaction}
            onNavigateToAdd={() => setActiveTab("add")}
          />
        )}

        {activeTab === "add" && (
          <AddTransactionTab
            onSave={handleSaveTransaction}
            onCancel={() => setActiveTab("overview")}
            initialType="expense"
            budgets={budgets}
            events={events}
          />
        )}

        {activeTab === "ocr" && (
          <OcrTab
            onSaveSuccess={handleOcrSaveSuccess}
            onCancel={() => setActiveTab("overview")}
          />
        )}

        {activeTab === "budgets" && (
          <BudgetsTab
            monthlyIncome={monthlyIncome}
            setMonthlyIncome={setMonthlyIncome}
            jarPercentages={jarPercentages}
            setJarPercentages={setJarPercentages}
            budgets={budgets}
            setBudgets={setBudgets}
            mutate={mutate}
          />
        )}

        {activeTab === "recurring" && (
          <RecurringTab
            templates={recurringTemplates || []}
            isLoading={!recurringTemplates}
            onRefresh={() => mutateRecurring()}
          />
        )}

        {activeTab === "security" && (
          <SecurityTab />
        )}

        {/* TAB 6: EVENTS & TRIP BUDGETING */}
        {activeTab === "events" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  Sự kiện & Chuyến đi <Calendar className="h-5 w-5 text-indigo-400" />
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Phân vùng ngân sách cho các chuyến đi chơi, đám cưới, dự án...</p>
              </div>
              <button 
                onClick={() => {
                  setShowCreateEventForm(!showCreateEventForm);
                  setSelectedEventForDetail(null);
                }} 
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white glow-indigo hover:bg-indigo-500 transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> {showCreateEventForm ? "Đóng Form" : "Tạo Sự kiện Mới"}
              </button>
            </div>

            {/* Form tạo sự kiện mới */}
            {showCreateEventForm && (
              <div className="max-w-xl glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white">Thêm Sự Kiện / Chuyến Đi Mới</h3>
                <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Tên sự kiện</label>
                    <input 
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="Ví dụ: Du lịch Đà Lạt, Mua quà tết..."
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Ngân sách dự trù (VND)</label>
                      <input 
                        type="text"
                        value={newEventBudget}
                        onChange={(e) => setNewEventBudget(formatVNDString(e.target.value))}
                        placeholder="Ví dụ: 5.000.000"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Trạng thái hoàn thành</label>
                      <select 
                        value={newEventCompleted ? "true" : "false"}
                        onChange={(e) => setNewEventCompleted(e.target.value === "true")}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white"
                      >
                        <option value="false">Đang diễn ra</option>
                        <option value="true">Đã hoàn thành</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Ngày bắt đầu</label>
                      <input 
                        type="date"
                        value={newEventStartDate}
                        onChange={(e) => setNewEventStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Ngày kết thúc</label>
                      <input 
                        type="date"
                        value={newEventEndDate}
                        onChange={(e) => setNewEventEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all">
                    Tạo Sự Kiện
                  </button>
                </form>
              </div>
            )}

            {/* Grid danh sách sự kiện */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => {
                const isSelected = selectedEventForDetail?.id === event.id;
                const percent = event.budget_limit > 0 ? Math.min(100, Math.round((event.total_spent / event.budget_limit) * 100)) : 0;
                
                return (
                  <div key={event.id} className={`glass-card rounded-2xl p-6 border transition-all ${isSelected ? 'border-indigo-500' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between">
                       <div>
                         <h3 className="text-base font-extrabold text-white">{event.name}</h3>
                         <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                           <Calendar className="h-3 w-3 text-indigo-400" />
                           {event.start_date ? event.start_date : "?"} đến {event.end_date ? event.end_date : "?"}
                         </p>
                       </div>
                       <div className="flex items-center gap-2">
                         {event.is_completed ? (
                           <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                             Hoàn thành
                           </span>
                         ) : (
                           <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                             Đang diễn ra
                           </span>
                         )}
                         <button 
                           onClick={() => handleDeleteEvent(event.id)} 
                           className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all" 
                           title="Xóa sự kiện"
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                       </div>
                    </div>

                    {/* Tiến trình ngân sách */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Ngân sách chi tiêu</span>
                        <span className="text-slate-300 font-bold">
                          Đã chi <span className={event.is_over_budget ? "text-rose-400" : "text-emerald-400"}>{event.total_spent.toLocaleString()}đ</span> / {event.budget_limit.toLocaleString()}đ ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full rounded-full ${event.is_over_budget ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
                        <span>Còn lại: {event.remaining_budget.toLocaleString()}đ</span>
                        {event.is_over_budget && <span className="text-rose-400 font-bold flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> Vượt ngân sách!</span>}
                      </div>
                    </div>

                    {/* Nút xem giao dịch chi tiết */}
                    <div className="mt-5 flex gap-2">
                       <button 
                         onClick={() => handleSelectEventForDetail(event.id)}
                         className="flex-1 py-2 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-bold text-slate-300 transition-all"
                       >
                         {isSelected ? "Đóng xem giao dịch" : "Xem chi tiết giao dịch"}
                       </button>
                       {!event.is_completed && (
                         <button 
                           onClick={() => {
                             setCategory("Food & Beverage");
                             setEventId(event.id);
                             setActiveTab("add");
                           }}
                           className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-xs font-bold text-indigo-400 transition-all"
                           title="Ghi thêm khoản chi cho sự kiện này"
                         >
                           + Ghi chi tiêu
                         </button>
                       )}
                    </div>

                    {/* Hiển thị chi tiết giao dịch nếu được chọn */}
                    {isSelected && selectedEventDetail && (
                       <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
                         <h4 className="text-xs font-bold text-slate-300">Danh sách giao dịch thuộc Sự kiện</h4>
                         {selectedEventDetail.transactions && selectedEventDetail.transactions.length > 0 ? (
                           <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                             {selectedEventDetail.transactions.map((tx: any) => (
                               <div key={tx.id} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                                 <div>
                                   <p className="font-bold text-slate-200">{tx.description}</p>
                                   <p className="text-[9px] text-slate-500">{tx.transaction_date}</p>
                                 </div>
                                 <span className="font-extrabold text-rose-400">-{tx.amount.toLocaleString()}đ</span>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <p className="text-[10px] text-slate-500 italic">Chưa có giao dịch chi tiêu nào được gán cho sự kiện này.</p>
                         )}
                       </div>
                    )}

                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="col-span-2 text-center py-10 glass-card rounded-2xl border border-white/5 text-slate-500 text-xs">
                  <Calendar className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  Bạn chưa tạo sự kiện hoặc chuyến đi nào. Nhấn nút "Tạo Sự kiện Mới" để bắt đầu!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- FLOATING AI CHATBOX WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="w-80 sm:w-96 h-[480px] mb-4 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600/30 to-cyan-500/30 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center glow-indigo">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    {chatView === "chat" ? "AuraAI Assistant" : "Lịch sử trò chuyện"}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-semibold">Trực tuyến</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {chatView === "chat" ? (
                  <>
                    <button
                      onClick={handleEndChat}
                      disabled={chatMessages.length <= 1}
                      title="Kết thúc & Lưu cuộc trò chuyện"
                      className="text-[9px] text-rose-300 hover:text-rose-200 font-bold border border-rose-500/20 hover:border-rose-500/40 bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded-lg transition-all duration-200"
                    >
                      Kết thúc
                    </button>
                    <button
                      onClick={() => setChatView("history")}
                      title="Xem lịch sử trò chuyện"
                      className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setChatView("chat")}
                    className="text-[9px] text-indigo-300 hover:text-indigo-200 font-bold border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-950/30 px-2 py-1 rounded-lg transition-all duration-200"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <Plus className="h-4 w-4 rotate-45" />
                </button>
              </div>
            </div>

            {/* Chat Messages Log OR History View */}
            {chatView === "chat" ? (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium rounded-tr-none shadow-md"
                        : "bg-slate-900 border border-white/5 text-slate-300 rounded-tl-none"
                        }`}>
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  ))}

                  {/* Chat Loading State */}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-white/5 text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                        <span>AuraAI đang phân tích...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Questions */}
                {chatSuggestions.length > 0 && !chatLoading && (
                  <div className="px-3 py-2 border-t border-white/5 bg-slate-950/50 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                    {chatSuggestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChatMessage(q)}
                        className="text-[9px] bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 px-2.5 py-1 rounded-full font-semibold transition-all duration-200 shrink-0"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Form */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                  className="p-3 bg-slate-950 border-t border-white/10 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Hỏi về ngân sách, chi tiêu của bạn..."
                    className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed glow-indigo"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
                  {pastChats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Clock className="h-8 w-8 mb-2 opacity-30 text-slate-400" />
                      <span>Chưa có lịch sử trò chuyện</span>
                    </div>
                  ) : (
                    pastChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleViewPastChat(chat)}
                        className={`p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all duration-200 flex justify-between items-center group ${activeChatId === chat.id ? "border-indigo-500/40 bg-indigo-950/10" : ""
                          }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h5 className="text-xs font-bold text-white truncate">{chat.title}</h5>
                          <span className="text-[9px] text-slate-500 block mt-1">{chat.createdAt}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeletePastChat(chat.id, e)}
                          title="Xóa cuộc trò chuyện này"
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3.5 bg-slate-950 border-t border-white/10 text-center text-[10px] text-slate-500 font-semibold">
                  Chọn cuộc trò chuyện cũ để tiếp tục hoặc xem lại
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 glow-indigo relative group"
        >
          {isChatOpen ? (
            <Plus className="h-6 w-6 rotate-45 transition-transform duration-300" />
          ) : (
            <>
              <Sparkles className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* EDIT TRANSACTION MODAL */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-white/10 max-w-md w-full space-y-6 shadow-2xl relative">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-400" /> Chỉnh Sửa Giao Dịch
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Cập nhật thông tin chi tiết của giao dịch này.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Type Choice */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-bold">Loại giao dịch</label>
                  <select
                    value={editType}
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="expense">Khoản Chi Tiêu (-)</option>
                    <option value="income">Khoản Thu Nhập (+)</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-bold">Ngày thực hiện</label>
                  <input
                    type="date"
                    value={editTransactionDate}
                    onChange={(e) => setEditTransactionDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-bold">Số tiền (VND)</label>
                <input
                  type="text"
                  value={editAmount}
                  onChange={(e) => setEditAmount(formatVNDString(e.target.value))}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-emerald-400 font-extrabold text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Store Name / Merchant */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-bold">Cửa hàng / Đối tác (Merchant)</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                  placeholder="Ví dụ: Highlands Coffee, WinMart..."
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-bold">Danh mục giao dịch</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  {editType === "income" ? (
                    <>
                      <option value="Salary">Salary (Lương cố định)</option>
                      <option value="Bonus">Bonus (Tiền thưởng)</option>
                      <option value="Business">Business (Kinh doanh / Bán hàng)</option>
                      <option value="Investment">Investment (Đầu tư / Lãi tiết kiệm)</option>
                      <option value="Other Income">Other Income (Thu nhập khác)</option>
                    </>
                  ) : (
                    <>
                      {Array.from(new Set([
                        "Other",
                        "Food & Beverage",
                        "Transportation",
                        "Shopping",
                        "Bills & Utilities",
                        "Entertainment",
                        ...budgets.map(b => b.category)
                      ])).map((cat) => {
                        let displayName = cat;
                        if (cat === "Other") displayName = "Other (Khác)";
                        if (cat === "Food & Beverage") displayName = "Food & Beverage (Ăn uống)";
                        if (cat === "Transportation") displayName = "Transportation (Di chuyển)";
                        if (cat === "Shopping") displayName = "Shopping (Mua sắm)";
                        if (cat === "Bills & Utilities") displayName = "Bills & Utilities (Hóa đơn)";
                        if (cat === "Entertainment") displayName = "Entertainment (Giải trí)";
                        return (
                          <option key={cat} value={cat}>
                            {displayName}
                          </option>
                        );
                      })}
                    </>
                  )}
                </select>
              </div>

              {/* Description Note */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-bold">Mô tả / Ghi chú</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                  placeholder="Nội dung chi tiêu..."
                  required
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold transition-all glow-indigo"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 font-bold transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL GLASS LOADING BACKDROP TOAST OVERLAY */}
      {globalLoadingMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center space-y-4 max-w-xs text-center shadow-2xl animate-fade-in">
            <div className="relative flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="absolute h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">{globalLoadingMessage}</p>
              <p className="text-[10px] text-slate-500 mt-1">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
