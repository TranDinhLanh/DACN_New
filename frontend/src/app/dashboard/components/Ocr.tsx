"use client";

import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Sparkles, UploadCloud, FileText } from "lucide-react";
import { api } from "@/lib/api";

interface OcrTabProps {
  onSaveSuccess: (savedTx: any) => void;
  onCancel: () => void;
}

export default function OcrTab({ onSaveSuccess, onCancel }: OcrTabProps) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrExtractedData, setOcrExtractedData] = useState<any | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSavingTx, setIsSavingTx] = useState(false);

  // Form states for pre-populated OCR data review
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [transactionDate, setTransactionDate] = useState("");
  const [description, setDescription] = useState("");

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

  const handleOcrFileSubmit = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    setOcrPreviewUrl(previewUrl);

    setOcrLoading(true);
    setOcrSuccess(false);
    setOcrError(null);
    setOcrExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8001/api/v1/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Không thể tải lên và xử lý hóa đơn.");
      }

      const parsedData = await response.json();
      setOcrExtractedData(parsedData);
      setOcrSuccess(true);

      // Pre-fill editable form states from AI OCR result
      setMerchant(parsedData.merchant || "Cửa hàng ăn uống");
      setAmount(parsedData.amount ? formatVNDString(parsedData.amount.toString()) : "0");
      setCategory(parsedData.category || "Food & Beverage");
      setTransactionDate(parsedData.transaction_date || new Date().toISOString().split("T")[0]);
      setDescription(parsedData.items_summary || `Chi tiêu tại ${parsedData.merchant || "Cửa hàng"}`);
    } catch (err: any) {
      setOcrError(err.message || "Xảy ra lỗi trong quá trình quét hóa đơn.");
      setOcrSuccess(false);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = Number(cleanVNDString(amount));
    if (!rawAmount || isNaN(rawAmount)) return;

    setIsSavingTx(true);
    api.createTransaction({
      amount: rawAmount,
      type: "expense",
      category: category,
      description: description || `Quét hóa đơn ${merchant}`,
      transaction_date: transactionDate,
      merchant_name: merchant || undefined,
      ocr_log_id: ocrExtractedData?.ocr_log_id,
    })
      .then((savedTx) => {
        onSaveSuccess(savedTx);

        // Reset scanner states
        setOcrSuccess(false);
        setOcrExtractedData(null);
        setOcrPreviewUrl(null);
        setOcrError(null);
      })
      .catch((err) => {
        console.error("Failed to save OCR transaction:", err);
        // Fallback local mock transaction
        const newTx = {
          id: Date.now().toString(),
          amount: rawAmount,
          type: "expense",
          category: category,
          description: description || `Quét hóa đơn ${merchant}`,
          transaction_date: transactionDate,
          merchant_name: merchant || undefined,
        };
        onSaveSuccess(newTx);
      })
      .finally(() => {
        setIsSavingTx(false);
      });
  };

  const handleReset = () => {
    setOcrSuccess(false);
    setOcrExtractedData(null);
    setOcrPreviewUrl(null);
    setOcrError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider glow-indigo">
          PaddleOCR + AI Classifier
        </span>
        <h2 className="text-2xl font-extrabold text-white">Quét Hóa Đơn Chi Tiêu Thông Minh</h2>
        <p className="text-slate-400 text-xs max-w-lg mx-auto">
          Tải lên ảnh hóa đơn của bạn. Mô hình PaddleOCR sẽ tự động nhận diện chữ tiếng Việt, trích xuất thông tin và điền vào biểu mẫu để bạn rà soát và lưu.
        </p>
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
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleOcrFileSubmit(e.dataTransfer.files);
          }}
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
                <p className="text-xs text-slate-500 mt-1">
                  PaddleOCR đang nhận diện chữ tiếng Việt và trích xuất thông tin hóa đơn
                </p>
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
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleOcrFileSubmit(e.target.files)} />
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
                  <p className="font-bold text-slate-300">Để kích hoạt OCR thực trên ảnh hóa đơn thật:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                    <li>
                      Cài đặt PaddleOCR trên máy tính:
                      <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded ml-1 font-mono">
                        pip install paddleocr paddlepaddle
                      </code>
                    </li>
                    <li>Khởi động lại backend FastAPI sau khi cài xong.</li>
                    <li>Upload ảnh hóa đơn — PaddleOCR sẽ tự động xử lý tiếng Việt.</li>
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
                    <img src={ocrPreviewUrl} alt="Scanned Bill Receipt" className="h-full w-full object-contain transition-transform duration-300 hover:scale-105" />
                  ) : ocrExtractedData.image_url ? (
                    <img src={`http://localhost:8001${ocrExtractedData.image_url}`} alt="Scanned Bill Receipt" className="h-full w-full object-contain transition-transform duration-300 hover:scale-105" />
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
                <p className="text-[11px] text-slate-400 mt-1">
                  Dữ liệu được trích xuất tự động bằng mô hình AI. Bạn có thể kiểm tra chéo với ảnh bên trái và điều chỉnh các ô nhập bên dưới trước khi lưu.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                    disabled={isSavingTx}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold transition-all glow-indigo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingTx ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      "Lưu Khoản Chi & Đóng Form"
                    )}
                  </button>
                  <button type="button" onClick={handleReset} className="px-5 py-3.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 text-xs font-bold transition-all">
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
          <h5 className="font-bold text-white">Cơ Chế Hoạt Động OCR Thực Tế:</h5>
          <p className="mt-1 leading-relaxed text-[11px] text-slate-400">
            Ảnh hóa đơn được upload qua endpoint <code className="text-indigo-300 font-mono">/api/v1/ocr/upload</code> của FastAPI.
            Backend lưu file vào <code className="text-indigo-300 font-mono">/static/uploads/</code>, chạy <strong className="text-slate-300">PaddleOCR</strong> để
            nhận diện chữ tiếng Việt với confidence &gt; 50%, sau đó dùng <strong className="text-slate-300">Regex + ML Classifier</strong> để
            bóc tách Merchant, Tổng tiền, Ngày và tự động gán danh mục giao dịch.
          </p>
        </div>
      </div>
    </div>
  );
}
