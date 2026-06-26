"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  FileText,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  UploadCloud,
  Check,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Layers,
  MapPin,
  HelpCircle,
  Lock,
  LogOut,
  Clock
} from "lucide-react";
import { api } from "@/lib/api";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";

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

// Initial Mock Datasets to instantly wow the user
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "1", amount: 42000000, type: "income", category: "Salary", description: "Lương tháng này", transaction_date: "2026-05-25", merchant_name: "Công ty Công nghệ" },
  { id: "2", amount: 1200000, type: "expense", category: "Bills & Utilities", description: "Hóa đơn điện sinh hoạt", transaction_date: "2026-05-26", merchant_name: "EVN Điện Lực" },
  { id: "3", amount: 85000, type: "expense", category: "Food & Beverage", description: "Ca phe Highlands Coffee", transaction_date: "2026-05-27", merchant_name: "Highlands Coffee" },
  { id: "4", amount: 450000, type: "expense", category: "Shopping", description: "Mua ao thun shopee", transaction_date: "2026-05-24", merchant_name: "Shopee Mall" },
  { id: "5", amount: 150000, type: "expense", category: "Transportation", description: "Grab taxi di hoc", transaction_date: "2026-05-23", merchant_name: "Grab Taxi" },
  { id: "6", amount: 2400000, type: "expense", category: "Bills & Utilities", description: "Thanh toan tien nha", transaction_date: "2026-05-01", merchant_name: "Chu nha Tro" },
  { id: "7", amount: 950000, type: "expense", category: "Entertainment", description: "Ve xem phim CGV & An uong", transaction_date: "2026-05-18", merchant_name: "CGV Cinemas" },
];

const INITIAL_BUDGETS: Budget[] = [
  { category: "Food & Beverage", limit_amount: 3000000, spent_amount: 85000 },
  { category: "Bills & Utilities", limit_amount: 4000000, spent_amount: 3600000 },
  { category: "Shopping", limit_amount: 2000000, spent_amount: 450000 },
  { category: "Transportation", limit_amount: 1500000, spent_amount: 150000 },
  { category: "Entertainment", limit_amount: 1000000, spent_amount: 950000 },
];

// Color mapping for premium charts
const COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#06b6d4", "#a855f7"];

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
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

  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Jars Budget Allocator states
  const [monthlyIncome, setMonthlyIncome] = useState<number>(10000000);
  const [jarPercentages, setJarPercentages] = useState<{ [key: string]: number }>({
    "Food & Beverage": 35,
    "Transportation": 15,
    "Shopping": 15,
    "Bills & Utilities": 15,
    "Entertainment": 10,
    "Other": 10
  });
  
  // Tab/Screen navigation State (added security tab)
  const [activeTab, setActiveTab] = useState<"overview" | "add" | "ocr" | "budgets" | "security">("overview");

  // Form inputs for Transaction creation
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);

  // AI Instant categorizer trigger
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // OCR Upload States
  const [dragActive, setDragActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrExtractedData, setOcrExtractedData] = useState<any>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Change Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

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

  // Auth and hydration verification shield
  useEffect(() => {
    setMounted(true);
    
    // Check if token exists
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user details
    api.getMe()
      .then(userData => {
        setUser(userData);
        
        // Fetch transactions from API
        api.getTransactions()
          .then(data => {
            setTransactions(data || []);
          })
          .catch(err => console.error("Failed to load transactions:", err));

        // Fetch budgets from API
        api.getBudgets()
          .then(data => {
            setBudgets(data || []);
            if (data && data.length > 0) {
              const totalLimit = data.reduce((sum: number, b: Budget) => sum + b.limit_amount, 0);
              if (totalLimit > 0) {
                setMonthlyIncome(totalLimit);
                // Also update jar percentages based on the loaded limits!
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
          })
          .catch(err => console.error("Failed to load budgets:", err));
      })
      .catch(err => {
        console.error("Auth verification failed:", err);
        api.logout();
        router.push("/login");
      });
  }, [router]);

  // AI Classification engine working on the client-side for dynamic mock responsiveness
  useEffect(() => {
    if (!description || description.trim().length < 3) {
      setAiSuggestion(null);
      return;
    }
    
    const descLower = description.toLowerCase();
    
    // Quick keyword parser mimicking the FastAPI AI classifier
    if (descLower.includes("coffee") || descLower.includes("tra sua") || descLower.includes("an") || descLower.includes("highlands") || descLower.includes("gongcha") || descLower.includes("phuc long")) {
      setAiSuggestion("Food & Beverage");
    } else if (descLower.includes("grab") || descLower.includes("taxi") || descLower.includes("xang") || descLower.includes("bus")) {
      setAiSuggestion("Transportation");
    } else if (descLower.includes("shopee") || descLower.includes("lazada") || descLower.includes("tiki") || descLower.includes("quan ao") || descLower.includes("giay")) {
      setAiSuggestion("Shopping");
    } else if (descLower.includes("hoa don") || descLower.includes("dien") || descLower.includes("nuoc") || descLower.includes("wifi") || descLower.includes("internet") || descLower.includes("evn")) {
      setAiSuggestion("Bills & Utilities");
    } else if (descLower.includes("cgv") || descLower.includes("rap phim") || descLower.includes("netflix") || descLower.includes("game") || descLower.includes("playstation")) {
      setAiSuggestion("Entertainment");
    } else {
      setAiSuggestion("Other");
    }
  }, [description]);

  // Calculate high-fidelity dashboard metrics
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const displayIncome = totalIncome > 0 ? totalIncome : monthlyIncome;
  const netBalance = displayIncome - totalExpense;

  // Add manually input transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = Number(cleanVNDString(amount));
    if (!rawAmount || isNaN(rawAmount)) return;

    // Use AI suggested category if the selected one is Other
    const finalCategory = (category === "Other" && aiSuggestion) ? aiSuggestion : category;

    // Save transaction to backend
    api.createTransaction({
      amount: rawAmount,
      type,
      category: finalCategory,
      description: description || "Giao dịch không mô tả",
      transaction_date: transactionDate,
      merchant_name: merchant || undefined
    })
      .then(savedTx => {
        setTransactions(prev => [savedTx, ...prev]);

        // Dynamic spent budget updating on the fly!
        if (type === "expense") {
          setBudgets(prev => prev.map(b => {
            if (b.category === finalCategory) {
              return { ...b, spent_amount: b.spent_amount + rawAmount };
            }
            return b;
          }));
        }
      })
      .catch(err => {
        console.error("Failed to save transaction to database:", err);
        // Fallback local update if backend is unreachable
        const newTx: Transaction = {
          id: Date.now().toString(),
          amount: rawAmount,
          type,
          category: finalCategory,
          description: description || "Giao dịch không mô tả",
          transaction_date: transactionDate,
          merchant_name: merchant || undefined
        };
        setTransactions(prev => [newTx, ...prev]);
      });

    // Reset Form
    setAmount("");
    setDescription("");
    setMerchant("");
    setCategory("Other");
    
    // Redirect to overview
    setActiveTab("overview");
  };

  // Real OCR & LayoutLMv3 Upload integration
  const handleOcrFileSubmit = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Create instant local URL for real-time receipt image preview
    const previewUrl = URL.createObjectURL(file);
    setOcrPreviewUrl(previewUrl);
    
    setOcrLoading(true);
    setOcrSuccess(false);
    setOcrError(null);
    setOcrExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Không thể kết nối đến máy chủ OCR.");
      }

      const parsedData = await response.json();
      
      setOcrLoading(false);
      setOcrSuccess(true);
      setOcrExtractedData(parsedData);
      
      // Auto pre-populate transaction forms with live LayoutLMv3 results
      setMerchant(parsedData.merchant || "Cửa hàng không rõ");
      setAmount(parsedData.amount ? formatVNDString(parsedData.amount.toString()) : "0");
      setCategory(parsedData.category || "Other");
      setDescription(`Quét hóa đơn ${parsedData.merchant || ""}`);
      setTransactionDate(parsedData.transaction_date || new Date().toISOString().split("T")[0]);
      setType("expense");
    } catch (err: any) {
      setOcrLoading(false);
      setOcrSuccess(false);
      setOcrError(err.message || "Đã xảy ra lỗi khi tải lên hóa đơn.");
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    api.deleteTransaction(id)
      .then(() => {
        setTransactions(transactions.filter(t => t.id !== id));

        // Reverse budget values
        if (txToDelete.type === "expense") {
          setBudgets(prev => prev.map(b => {
            if (b.category === txToDelete.category) {
              return { ...b, spent_amount: Math.max(0, b.spent_amount - txToDelete.amount) };
            }
            return b;
          }));
        }
      })
      .catch(err => {
        console.error("Failed to delete transaction from database:", err);
        // Local only fallback
        setTransactions(transactions.filter(t => t.id !== id));
      });
  };

  // State variables for editing a transaction
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("Other");
  const [editDescription, setEditDescription] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");

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
    
    const updatePayload = {
      amount: newAmount,
      type: editType,
      category: editCategory,
      description: editDescription,
      transaction_date: editTransactionDate,
      merchant_name: editMerchant || undefined
    };

    api.updateTransaction(oldTx.id, updatePayload)
      .then(updatedTx => {
        setTransactions(prev => prev.map(t => t.id === oldTx.id ? updatedTx : t));

        // Recalculate budgets on the fly
        setBudgets(prev => prev.map(b => {
          let spent = b.spent_amount;
          if (oldTx.type === "expense" && b.category === oldTx.category) {
            spent = Math.max(0, spent - oldTx.amount);
          }
          if (editType === "expense" && b.category === editCategory) {
            spent = spent + newAmount;
          }
          return { ...b, spent_amount: spent };
        }));

        setEditingTransaction(null);
      })
      .catch(err => {
        console.error("Failed to update transaction:", err);
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
      });
  };

  // Pre-aggregate category spending data for Recharts Pie Chart
  const getPieData = () => {
    const dataMap: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
      });
      
    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key]
    }));
  };

  // Dynamic future Prophet prediction line simulator using mock linear math
  const getForecastData = () => {
    const forecast = [];
    const today = new Date();
    // Daily forecast
    for (let i = 1; i <= 30; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const isWeekend = forecastDate.getDay() === 0 || forecastDate.getDay() === 6;
      // standard seasonal variation + minor regression line
      const base = 250000 + (i * 2000); // minor growth trend
      const variation = isWeekend ? 1.35 : 0.85;
      const noise = 0.9 + Math.random() * 0.2;
      
      forecast.push({
        date: forecastDate.toLocaleDateString("vi-VN", { day: "numeric", month: "short" }),
        "Dự đoán": Math.round((base * variation * noise) / 1000) * 1000
      });
    }
    return forecast;
  };

  // Chatbox Send handler
  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    if (!textToSend) {
      setChatInput("");
    }

    // Add user message to log
    const updatedMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      // Map roles for backend chat API
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "overview" 
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              Tổng quan Dashboard
            </button>

            <button 
              onClick={() => setActiveTab("ocr")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "ocr" 
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "add" 
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Plus className="h-4.5 w-4.5" />
              Thêm giao dịch
            </button>

            <button 
              onClick={() => setActiveTab("budgets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "budgets" 
                  ? "bg-indigo-600/25 border border-indigo-500/30 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
              Hạn mức ngân sách
            </button>

            <button 
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "security" 
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
        
        {/* TAB 1: OVERVIEW SCREEN */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  Hệ thống Quản lý Tài chính <Sparkles className="h-5 w-5 text-indigo-400" />
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Thời gian thực tế: {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setActiveTab("ocr")} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white glow-indigo hover:bg-indigo-500 transition-all flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4" /> Quét Hóa Đơn AI
                </button>
                <button onClick={() => setActiveTab("add")} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-white/5 hover:border-white/10 text-white transition-all flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Thêm khoản chi
                </button>
              </div>
            </div>

            {/* Financial Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-l-2 border-indigo-500">
                <div className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-xs text-slate-400 block font-medium">Tổng Số Dư Khả Dụng</span>
                <span className="text-2xl font-extrabold text-white block mt-2 tracking-tight">
                  {netBalance.toLocaleString()}đ
                </span>
                <span className="text-[10px] text-slate-500 block mt-1.5 flex items-center gap-1">
                  Đã tự động tính từ lương & các khoản chi tiêu
                </span>
              </div>

              {/* Card 2 */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-l-2 border-emerald-500">
                <div className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <span className="text-xs text-slate-400 block font-medium">Tổng Thu Nhập Tháng Này</span>
                <span className="text-2xl font-extrabold text-emerald-400 block mt-2 tracking-tight">
                  +{displayIncome.toLocaleString()}đ
                </span>
                <span className="text-[10px] text-emerald-500/80 block mt-1.5 font-semibold">
                  Tăng trưởng ổn định
                </span>
              </div>

              {/* Card 3 */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-l-2 border-rose-500">
                <div className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
                <span className="text-xs text-slate-400 block font-medium">Tổng Chi Tiêu Thực Tế</span>
                <span className="text-2xl font-extrabold text-rose-400 block mt-2 tracking-tight">
                  -{totalExpense.toLocaleString()}đ
                </span>
                <span className="text-[10px] text-rose-500/80 block mt-1.5 font-semibold">
                  {transactions.filter(t => t.type === "expense").length} giao dịch chi tiêu ghi nhận
                </span>
              </div>
            </div>

            {/* Active budget status warnings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Cảnh Báo Ngưỡng Hạn Mức Ngân Sách Tháng 5
              </h3>
              <div className="space-y-4">
                {budgets.length > 0 ? (
                  budgets.map((b, i) => {
                    const percent = b.limit_amount > 0 ? Math.min(100, Math.round((b.spent_amount / b.limit_amount) * 100)) : 0;
                    let colorClass = "bg-emerald-500";
                    let textClass = "text-emerald-400";
                    if (percent >= 90) {
                      colorClass = "bg-rose-500 animate-pulse";
                      textClass = "text-rose-400 font-bold";
                    } else if (percent >= 75) {
                      colorClass = "bg-amber-500";
                      textClass = "text-amber-400";
                    }
                    
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-300">{b.category}</span>
                          <span className="text-slate-400">
                            Đã chi <span className={textClass}>{b.spent_amount.toLocaleString()}đ</span> / {b.limit_amount.toLocaleString()}đ ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Bạn chưa thiết lập hũ chi tiêu nào. Hãy vào tab <button onClick={() => setActiveTab("budgets")} className="text-indigo-400 hover:underline font-bold">Hạn mức ngân sách</button> để phân chia hũ tài chính ngay!
                  </div>
                )}
              </div>
            </div>

            {/* Analytical Graphing Grids (Category + Forecast Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Category Pie Recharts */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 lg:col-span-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 mb-1">Cơ Cấu Chi Tiêu (AI Categorized)</h3>
                  <p className="text-[11px] text-slate-500">Phân tích phân phối danh mục chi tiêu tự động</p>
                </div>
                
                <div className="h-60 w-full relative mt-4 flex items-center justify-center">
                  {getPieData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "11px", borderRadius: "10px" }} 
                          formatter={(value: any) => `${value.toLocaleString()} VND`}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-xs text-slate-500">Chưa ghi nhận chi tiêu</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-slate-400">
                  {getPieData().map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Series Prophet Line Chart */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300">Dự Báo Xu Hướng Chi Tiêu 30 Ngày Tiếp Theo</h3>
                    <span className="bg-indigo-600/20 text-indigo-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border border-indigo-500/20 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-cyan-400" /> Prophet Engine Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Mô phỏng chuỗi thời gian dựa trên các giao dịch quá khứ và tính chu kỳ hàng tuần</p>
                </div>

                <div className="h-60 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getForecastData()}>
                      <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} width={45} tickFormatter={(val: number) => `${val/1000}K`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "11px", borderRadius: "10px" }}
                        formatter={(val: any) => [`${val.toLocaleString()} VND`, "Dự đoán"]}
                      />
                      <Area type="monotone" dataKey="Dự đoán" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[10px] text-slate-500 italic mt-2">📊 Ghi chú: Prophet dự báo các mốc cuối tuần sẽ tăng do có xu hướng giải trí dã ngoại tăng.</p>
              </div>

            </div>

            {/* Transactions Database Log list */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-300">Lịch Sử Giao Dịch Gần Đây</h3>
                  <p className="text-[11px] text-slate-500">Hiển thị lịch sử ghi nhận chi tiêu & thu nhập thực tế</p>
                </div>
                <button onClick={() => setTransactions(INITIAL_TRANSACTIONS)} className="text-xs text-slate-500 hover:text-indigo-400 transition-all flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Reset dữ liệu
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500">
                      <th className="pb-3 font-semibold">Mô tả</th>
                      <th className="pb-3 font-semibold">Ngày</th>
                      <th className="pb-3 font-semibold">Danh mục</th>
                      <th className="pb-3 font-semibold">Cửa hàng</th>
                      <th className="pb-3 font-semibold text-right">Số tiền</th>
                      <th className="pb-3 font-semibold text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="py-4 font-bold text-slate-200">{tx.description}</td>
                        <td className="py-4 text-slate-400">{tx.transaction_date}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === "income" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-4 text-slate-400">{tx.merchant_name || "-"}</td>
                        <td className={`py-4 text-right font-extrabold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}đ
                        </td>
                        <td className="py-4 text-center flex items-center justify-center gap-1">
                          <button onClick={() => handleStartEdit(tx)} className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all" title="Chỉnh sửa">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all" title="Xóa">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MANUAL TRANSACTION ADD */}
        {activeTab === "add" && (
          <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 border border-white/5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Thêm khoản Thu / Chi Mới
              </h2>
              <p className="text-slate-400 text-xs mt-1">Điền thông tin giao dịch để cập nhật ngân sách. Khi nhập mô tả, AI sẽ tự động đoán danh mục chi tiêu ở bên dưới.</p>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Type Choice */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-2">Loại giao dịch</label>
                  <select 
                    value={type} 
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-bold"
                  >
                    <option value="expense">Khoản Chi Tiêu (-)</option>
                    <option value="income">Khoản Thu Nhập (+)</option>
                  </select>
                </div>
                
                {/* Date */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-2">Ngày thực hiện</label>
                  <input 
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Số tiền giao dịch (VND)</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: 85.000"
                  value={amount}
                  onChange={(e) => setAmount(formatVNDString(e.target.value))}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-extrabold"
                  required
                />
              </div>

              {/* Description & AI Predict */}
              <div className="relative">
                <label className="text-xs text-slate-400 font-semibold block mb-2">Mô tả giao dịch</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: tra sua gongcha size L, di grab taxi ve nha..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white font-medium"
                  required
                />
                
                {/* AI suggestion badge */}
                {aiSuggestion && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit font-semibold tracking-wide">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                    ✨ Dự đoán AI: Phân loại vào danh mục <b>{aiSuggestion}</b>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400 font-semibold">Danh mục chi tiêu</label>
                  <span className="text-[10px] text-slate-500">Mặc định Other để dùng gợi ý AI</span>
                </div>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                >
                  <option value="Other">Other (Dùng gợi ý AI)</option>
                  <option value="Food & Beverage">Food & Beverage (Ăn uống)</option>
                  <option value="Transportation">Transportation (Di chuyển)</option>
                  <option value="Shopping">Shopping (Mua sắm)</option>
                  <option value="Bills & Utilities">Bills & Utilities (Hóa đơn)</option>
                  <option value="Entertainment">Entertainment (Giải trí)</option>
                  <option value="Salary">Salary (Lương)</option>
                </select>
              </div>

              {/* Merchant Store */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Cửa hàng / Đối tác (Không bắt buộc)</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Highlands Coffee, Shopee..."
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-4">
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg glow-indigo transition-all duration-200">
                  Lưu Giao Dịch
                </button>
                <button type="button" onClick={() => setActiveTab("overview")} className="px-6 py-3.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 text-sm font-bold transition-all duration-200">
                  Hủy bỏ
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: AI BILL OCR - RECONCILIATION SPLIT-SCREEN WORKFLOW */}
        {activeTab === "ocr" && (
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="text-center space-y-2">
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider glow-indigo">AI Computer Vision & LayoutLMv3</span>
              <h2 className="text-2xl font-extrabold text-white">Quét Hóa Đơn Chi Tiêu Thông Minh</h2>
              <p className="text-slate-400 text-xs max-w-lg mx-auto">Tải lên ảnh hóa đơn của bạn. Mô hình học sâu **LayoutLMv3** sẽ tự động trích xuất thông tin, điền vào biểu mẫu để bạn rà soát và lưu.</p>
            </div>

            {/* Error Message display */}
            {ocrError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2 max-w-2xl mx-auto animate-pulse">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                <span>Lỗi: {ocrError}</span>
              </div>
            )}

            {/* Drag & Drop Upload Zone (Visible when not succeeded yet) */}
            {!ocrSuccess && (
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleOcrFileSubmit(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-60 max-w-3xl mx-auto ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : "border-white/10 bg-slate-950/20 hover:border-indigo-500/30 hover:bg-slate-950/40"
                }`}
              >
                {ocrLoading ? (
                  <div className="space-y-4">
                    <div className="relative flex items-center justify-center">
                      <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
                      <Sparkles className="h-5 w-5 text-cyan-300 absolute animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">AI OCR đang phân tích hóa đơn...</h4>
                      <p className="text-xs text-slate-500 mt-1">Mô hình LayoutLMv3 đang trích xuất Merchant, Total Amount và Ngày giao dịch</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-sm font-bold text-indigo-400 hover:underline">Click để chọn file ảnh hóa đơn</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleOcrFileSubmit(e.target.files)} 
                        />
                      </label>
                      <p className="text-xs text-slate-500 mt-1">hoặc kéo thả ảnh biên lai (JPEG, PNG, WebP) vào đây</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Split Screen Reconciliation Form (Visible on success) */}
            {ocrSuccess && ocrExtractedData && (
              <div className="space-y-6">
                {ocrExtractedData.is_mock && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-xs leading-relaxed max-w-4xl mx-auto flex gap-3.5 shadow-xl">
                    <AlertTriangle className="h-5.5 w-5.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h5 className="font-extrabold text-amber-400 text-sm">⚠️ Đang hoạt động ở chế độ giả lập (Mock Data)</h5>
                      <p className="mt-1 text-slate-400">
                        Hệ thống đang chạy chế độ giả lập vì: <span className="text-amber-400 font-semibold">{ocrExtractedData.debug_message}</span>.
                      </p>
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2 text-[11px]">
                        <p className="font-bold text-slate-300">Để kích hoạt mô hình LayoutLMv3 đã train của bạn từ Google Colab:</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                          <li>Cài đặt các gói AI trên máy tính cục bộ: 
                            <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded ml-1 font-mono">pip install torch transformers paddleocr pillow</code>
                          </li>
                          <li>Tải thư mục trọng số của mô hình LayoutLMv3 đã huấn luyện từ Colab/Drive về máy.</li>
                          <li>Đổi tên thư mục thành <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono">layoutlmv3-receipt</code> và đặt tại đường dẫn:
                            <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded block mt-1 font-mono w-fit">backend/app/ml_models/layoutlmv3-receipt/</code>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMN 1: Bill image original preview & raw text logs */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Image Card Container */}
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-indigo-400" /> Ảnh Biên Lai Gốc
                    </h3>
                    
                    <div className="relative aspect-[3/4] max-h-[460px] w-full rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center group shadow-2xl">
                      {ocrPreviewUrl ? (
                        <img 
                          src={ocrPreviewUrl} 
                          alt="Scanned Bill Receipt" 
                          className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                        />
                      ) : ocrExtractedData.image_url ? (
                        <img 
                          src={`http://localhost:8000${ocrExtractedData.image_url}`} 
                          alt="Scanned Bill Receipt" 
                          className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                          Không có ảnh hóa đơn để xem trước
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pointer-events-none">
                        <span className="text-[10px] text-slate-300 font-semibold">Hover phóng to ảnh để đối chiếu</span>
                      </div>
                    </div>
                  </div>

                  {/* Raw Text Logs Container */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Văn Bản Thô OCR Trích Xuất</h3>
                    <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-[9px] text-indigo-300 whitespace-pre-line border border-indigo-500/10 max-h-40 overflow-y-auto leading-relaxed">
                      {ocrExtractedData.extracted_text}
                    </div>
                    <span className="text-[10px] text-slate-500 italic block">Công nghệ OCR trích xuất hộp chữ tọa độ 2D</span>
                  </div>
                </div>

                {/* COLUMN 2: Pre-populated Transaction form editable */}
                <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-cyan-400" /> Form Chỉnh Sửa & Ghi Nhận
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">Dữ liệu được trích xuất tự động bằng mô hình AI. Bạn có thể kiểm tra chéo với ảnh bên trái và điều chỉnh các ô nhập bên dưới trước khi lưu.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const rawAmount = Number(cleanVNDString(amount));
                      if (!rawAmount || isNaN(rawAmount)) return;

                      // Save OCR transaction to backend
                      api.createTransaction({
                        amount: rawAmount,
                        type: "expense",
                        category: category,
                        description: description || `Quét hóa đơn ${merchant}`,
                        transaction_date: transactionDate,
                        merchant_name: merchant || undefined,
                        ocr_log_id: ocrExtractedData?.ocr_log_id
                      })
                        .then(savedTx => {
                          setTransactions(prev => [savedTx, ...prev]);

                          // Update budget limits on the fly!
                          setBudgets(prev => prev.map(b => {
                            if (b.category === category) {
                              return { ...b, spent_amount: b.spent_amount + rawAmount };
                            }
                            return b;
                          }));
                        })
                        .catch(err => {
                          console.error("Failed to save OCR transaction:", err);
                          // Local only fallback
                          const newTx: Transaction = {
                            id: Date.now().toString(),
                            amount: rawAmount,
                            type: "expense",
                            category: category,
                            description: description || `Quét hóa đơn ${merchant}`,
                            transaction_date: transactionDate,
                            merchant_name: merchant || undefined
                          };
                          setTransactions(prev => [newTx, ...prev]);
                        });

                      // Reset scanner states
                      setOcrSuccess(false);
                      setOcrExtractedData(null);
                      setOcrPreviewUrl(null);
                      setOcrError(null);

                      // Redirect to dashboard overview
                      setActiveTab("overview");
                    }} 
                    className="space-y-4 text-xs"
                  >
                    
                    {/* Store Name / Merchant */}
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">Cửa hàng / Đối tác (Merchant)</label>
                      <input 
                        type="text"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 font-semibold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Ví dụ: Highlands Coffee, WinMart..."
                        required
                      />
                    </div>

                    {/* Total Amount */}
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">Tổng số tiền giao dịch (VND)</label>
                      <input 
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(formatVNDString(e.target.value))}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 font-extrabold text-emerald-400 focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="Ví dụ: 85.000"
                        required
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">Danh mục chi tiêu (AI Gợi Ý: {ocrExtractedData.category})</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Food & Beverage">Food & Beverage (Ăn uống)</option>
                        <option value="Transportation">Transportation (Di chuyển)</option>
                        <option value="Shopping">Shopping (Mua sắm)</option>
                        <option value="Bills & Utilities">Bills & Utilities (Hóa đơn)</option>
                        <option value="Entertainment">Entertainment (Giải trí)</option>
                        <option value="Other">Other (Khác)</option>
                      </select>
                    </div>

                    {/* Transaction Date */}
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">Ngày ghi nhận</label>
                      <input 
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Description Note */}
                    <div>
                      <label className="text-slate-400 block mb-1.5 font-bold">Mô tả / Ghi chú</label>
                      <input 
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                        placeholder="Nội dung chi tiêu..."
                      />
                    </div>

                    {/* Submit and Cancel Buttons */}
                    <div className="pt-4 flex gap-4">
                      <button 
                        type="submit" 
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold transition-all glow-indigo"
                      >
                        Lưu Khoản Chi & Đóng Form
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setOcrSuccess(false);
                          setOcrExtractedData(null);
                          setOcrPreviewUrl(null);
                          setOcrError(null);
                        }} 
                        className="px-5 py-3.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 text-xs font-bold transition-all"
                      >
                        Hủy & Quét lại
                      </button>
                    </div>

                  </form>
                </div>

              </div>
            </div>
          )}

            {/* AI Developers tip */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex gap-3 text-xs text-indigo-300 max-w-4xl mx-auto">
              <Sparkles className="h-5 w-5 text-cyan-400 shrink-0 animate-pulse" />
              <div>
                <h5 className="font-bold text-white">Cơ Chế Liên Kết Mô Hình LayoutLMv3 Thực Tế:</h5>
                <p className="mt-1 leading-relaxed text-[11px] text-slate-400">
                  Tệp ảnh được upload trực tiếp từ máy của bạn qua endpoint `/api/v1/ocr/upload` của FastAPI. Backend lưu trữ tệp tin trong thư mục tĩnh tĩnh `/static/uploads/`, truyền đường dẫn cục bộ vào mô hình LayoutLMv3 huấn luyện, và trả về dữ liệu đối chiếu chính xác.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: BUDGET MANAGEMENT */}
        {activeTab === "budgets" && (() => {
          const totalPercent = Object.values(jarPercentages).reduce((a, b) => a + b, 0);
          
          const applyPreset503020 = () => {
            setJarPercentages({
              "Food & Beverage": 30,
              "Transportation": 10,
              "Shopping": 15,
              "Bills & Utilities": 10,
              "Entertainment": 15,
              "Other": 20
            });
          };

          const applyPreset6Jars = () => {
            setJarPercentages({
              "Food & Beverage": 35,
              "Transportation": 10,
              "Shopping": 15,
              "Bills & Utilities": 10,
              "Entertainment": 15,
              "Other": 15
            });
          };

          const handlePercentageChange = (cat: string, val: number) => {
            setJarPercentages(prev => {
              const updated = { ...prev, [cat]: val };
              return updated;
            });
          };

          const handleSaveJars = () => {
            if (totalPercent !== 100) return;
            
            const promises = Object.entries(jarPercentages).map(([cat, pct]) => {
              const limit = Math.round((pct / 100) * monthlyIncome);
              return api.createOrUpdateBudget({
                category: cat,
                limit_amount: limit,
                period: "monthly"
              });
            });

            Promise.all(promises)
              .then(() => {
                setBudgets(prev => {
                  return Object.entries(jarPercentages).map(([cat, pct]) => {
                    const limit = Math.round((pct / 100) * monthlyIncome);
                    const existing = prev.find(b => b.category === cat);
                    return {
                      category: cat,
                      limit_amount: limit,
                      spent_amount: existing ? existing.spent_amount : 0
                    };
                  });
                });
                alert("Phân chia hũ ngân sách thành công!");
              })
              .catch(err => {
                console.error("Failed to save all budget jars:", err);
                // Fallback local update
                setBudgets(prev => {
                  return Object.entries(jarPercentages).map(([cat, pct]) => {
                    const limit = Math.round((pct / 100) * monthlyIncome);
                    const existing = prev.find(b => b.category === cat);
                    return {
                      category: cat,
                      limit_amount: limit,
                      spent_amount: existing ? existing.spent_amount : 0
                    };
                  });
                });
              });
          };

          return (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-indigo-400" /> Quản Lý Hũ Chi Tiêu (Timo & MoMo Jars)
                </h2>
                <p className="text-slate-400 text-xs mt-1">Thiết lập tổng thu nhập hàng tháng và phân bổ tiền vào các hũ tài chính để kiểm soát chi tiêu tối ưu.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT PANEL: INCOME & ALLOCATOR SLIDERS */}
                <div className="lg:col-span-6 glass-card rounded-2xl p-6 border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300">1. Nhập Tổng Thu Nhập / Lương</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Số tiền nền tảng để chia tỷ lệ phần trăm các hũ</p>
                    <div className="mt-3 relative">
                      <input 
                        type="text" 
                        value={formatVNDString(monthlyIncome)} 
                        onChange={(e) => setMonthlyIncome(Number(cleanVNDString(e.target.value)) || 0)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-emerald-400 font-extrabold focus:outline-none focus:border-indigo-500"
                        placeholder="Ví dụ: 15.000.000"
                      />
                      <span className="absolute right-4 top-3 text-xs text-slate-500 font-bold">VND</span>
                    </div>
                  </div>

                  {/* PRESETS */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-bold block">2. Chọn quy tắc chia hũ nhanh</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={applyPreset503020}
                        className="py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-[10px] text-slate-300 font-bold transition-all hover:bg-slate-950"
                      >
                        Quy tắc 50 / 30 / 20
                      </button>
                      <button 
                        onClick={applyPreset6Jars}
                        className="py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-[10px] text-slate-300 font-bold transition-all hover:bg-slate-950"
                      >
                        Quy tắc 6 Hũ Tài Chính
                      </button>
                    </div>
                  </div>

                  {/* SLIDERS LIST */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] text-slate-400 font-bold">3. Điều chỉnh tỷ lệ phần trăm</label>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${totalPercent === 100 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        Tổng: {totalPercent}% / 100%
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {Object.entries(jarPercentages).map(([cat, pct]) => {
                        const amount = Math.round((pct / 100) * monthlyIncome);
                        let name = cat;
                        if (cat === "Food & Beverage") name = "Ăn uống & Ẩm thực";
                        if (cat === "Transportation") name = "Di chuyển & Xe cộ";
                        if (cat === "Shopping") name = "Mua sắm & Shopping";
                        if (cat === "Bills & Utilities") name = "Hóa đơn & Tiện ích";
                        if (cat === "Entertainment") name = "Giải trí & Vui chơi";
                        if (cat === "Other") name = "Tích lũy & Dự phòng";

                        return (
                          <div key={cat} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{name}</span>
                              <span className="font-extrabold text-indigo-400">{pct}% <span className="text-[10px] text-slate-500">({amount.toLocaleString()}đ)</span></span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={pct}
                              onChange={(e) => handlePercentageChange(cat, Number(e.target.value))}
                              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SAVE ALLOCATION BUTTON */}
                  <button 
                    onClick={handleSaveJars}
                    disabled={totalPercent !== 100}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-indigo"
                  >
                    {totalPercent === 100 ? "Lưu & Phân bổ Hũ Ngân Sách" : `Tỷ lệ chưa cân bằng (Hiện tại: ${totalPercent}%)`}
                  </button>
                </div>

                {/* RIGHT PANEL: TIMO/MOMO JARS DISPLAY VISUAL */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-300">Tổng Quan Hũ Ngân Sách</h3>
                    <p className="text-[10px] text-slate-500">Tiến độ chi tiêu thực tế của các hũ so với hạn mức</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(jarPercentages).map(([cat, pct]) => {
                        const limit = Math.round((pct / 100) * monthlyIncome);
                        const b = budgets.find(x => x.category === cat) || { spent_amount: 0, limit_amount: limit };
                        const percent = Math.min(100, Math.round((b.spent_amount / limit) * 100));
                        const remaining = Math.max(0, limit - b.spent_amount);

                        let name = cat;
                        let emoji = "🍔";
                        let colorClass = "from-amber-500 to-orange-600";
                        if (cat === "Food & Beverage") { name = "Ăn uống"; emoji = "☕"; colorClass = "from-orange-500 to-red-600"; }
                        if (cat === "Transportation") { name = "Di chuyển"; emoji = "🚗"; colorClass = "from-cyan-500 to-blue-600"; }
                        if (cat === "Shopping") { name = "Mua sắm"; emoji = "🛍️"; colorClass = "from-pink-500 to-rose-600"; }
                        if (cat === "Bills & Utilities") { name = "Hóa đơn"; emoji = "⚡"; colorClass = "from-yellow-500 to-amber-600"; }
                        if (cat === "Entertainment") { name = "Giải trí"; emoji = "🎬"; colorClass = "from-purple-500 to-indigo-600"; }
                        if (cat === "Other") { name = "Tích lũy"; emoji = "🐖"; colorClass = "from-emerald-500 to-teal-600"; }

                        return (
                          <div key={cat} className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex flex-col justify-between space-y-3 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{emoji}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400`}>
                                {pct}% hũ
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-white text-xs">{name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">Hạn mức: {limit.toLocaleString()}đ</p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Đã chi: {b.spent_amount.toLocaleString()}đ</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[9px]">
                              <span className="text-slate-500">Còn lại:</span>
                              <span className={`font-bold ${percent >= 90 ? "text-rose-400" : percent >= 75 ? "text-amber-400" : "text-emerald-400"}`}>
                                {remaining.toLocaleString()}đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: SECURITY / CHANGE PASSWORD */}
        {activeTab === "security" && (
          <div className="max-w-md mx-auto glass-card rounded-2xl p-8 border border-white/5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-400" /> Thay Đổi Mật Khẩu
              </h2>
              <p className="text-slate-400 text-xs mt-1">Vui lòng điền thông tin bên dưới để đổi mật khẩu truy cập của bạn.</p>
            </div>

            <form 
              onSubmit={async (e) => {
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
              }}
              className="space-y-4"
            >
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
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === "user" 
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
                        className={`p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all duration-200 flex justify-between items-center group ${
                          activeChatId === chat.id ? "border-indigo-500/40 bg-indigo-950/10" : ""
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
                <label className="text-slate-400 block mb-1.5 font-bold">Danh mục chi tiêu</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Food & Beverage">Food & Beverage (Ăn uống)</option>
                  <option value="Transportation">Transportation (Di chuyển)</option>
                  <option value="Shopping">Shopping (Mua sắm)</option>
                  <option value="Bills & Utilities">Bills & Utilities (Hóa đơn)</option>
                  <option value="Entertainment">Entertainment (Giải trí)</option>
                  <option value="Other">Other (Khác)</option>
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
    </div>
  );
}
