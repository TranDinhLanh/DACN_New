import os
import logging
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Transaction, Budget, User
from app.schemas.schemas import ChatRequest, ChatResponse, ChatMessage

logger = logging.getLogger(__name__)
router = APIRouter()

# Try to import google-generativeai
HAS_GEMINI = False
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    logger.warning("⚠️ google-generativeai chưa được cài đặt.")

@router.post("/", response_model=ChatResponse)
def chat_with_ai(
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint xử lý chat với AI Gemini.
    Tự động truy xuất dữ liệu chi tiêu và ngân sách của người dùng để trả lời chính xác.
    """
    message = chat_req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")

    # 1. Truy xuất dữ liệu giao dịch của người dùng
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc()).all()

    # 2. Truy xuất ngân sách của người dùng
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()

    # 3. Tính toán các chỉ số cơ bản
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    net_balance = total_income - total_expense

    # Tính toán số tiền đã chi tiêu cho từng ngân sách trong tháng hiện tại
    today_date = date.today()
    start_of_month = date(today_date.year, today_date.month, 1)

    budgets_list = []
    for b in budgets:
        # Lấy số tiền thực tế đã chi trong tháng này cho danh mục này
        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == b.category,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_of_month
        ).scalar()
        spent_val = float(total_spent) if total_spent else 0.0
        budgets_list.append({
            "category": b.category,
            "limit": b.limit_amount,
            "spent": spent_val,
            "period": b.period
        })

    # Định dạng chuỗi thông tin để truyền vào prompt
    budgets_str = "\n".join([
        f"- {b['category']}: Đã chi {b['spent']:,.0f}đ / Hạn mức {b['limit']:,.0f}đ ({b['period']})"
        for b in budgets_list
    ]) if budgets_list else "Chưa thiết lập ngân sách."

    recent_txs = transactions[:15]  # Lấy tối đa 15 giao dịch gần đây
    transactions_str = "\n".join([
        f"- {t.transaction_date}: {t.description} | {t.category} | {t.merchant_name or '-'} | {'Thu' if t.type == 'income' else 'Chi'}: {t.amount:,.0f}đ"
        for t in recent_txs
    ]) if recent_txs else "Chưa có giao dịch nào được ghi nhận."

    current_date_str = datetime.now().strftime("%d/%m/%Y")
    user_name = current_user.full_name or "Người dùng"

    # Kiểm tra API Key
    gemini_key = os.getenv("GEMINI_API_KEY")

    if HAS_GEMINI and gemini_key:
        try:
            logger.info("Initializing Gemini Session...")
            genai.configure(api_key=gemini_key)
            
            # System Instruction định hình nhân vật và cung cấp dữ liệu tài chính
            system_instruction = f"""
Bạn là AuraAI, một trợ lý tài chính cá nhân thông minh tích hợp trong ứng dụng quản lý tài chính AuraFinance.
Nhiệm vụ của bạn là giúp người dùng hiểu và quản lý tình hình tài chính của họ dựa trên dữ liệu thực tế được cung cấp.

Hôm nay là ngày: {current_date_str}
Thông tin người dùng:
- Tên: {user_name}
- Email: {current_user.email}

DỮ LIỆU TÀI CHÍNH THỰC TẾ CỦA NGƯỜI DÙNG:

HẠN MỨC NGÂN SÁCH THÁNG NÀY:
{budgets_str}

DANH SÁCH GIAO DỊCH GẦN ĐÂY:
{transactions_str}

TỔNG HỢP:
- Tổng thu nhập: {total_income:,.0f} VND
- Tổng chi tiêu: {total_expense:,.0f} VND
- Số dư khả dụng: {net_balance:,.0f} VND

HƯỚNG DẪN TRẢ LỜI:
1. Luôn trả lời bằng tiếng Việt, thân thiện, lịch sự, xưng hô tôn trọng (ví dụ: "Chào bạn", "Tôi có thể giúp gì cho bạn").
2. Trả lời trực tiếp vào câu hỏi của người dùng bằng cách sử dụng các số liệu tài chính cụ thể từ dữ liệu được cung cấp ở trên.
3. Khi người dùng hỏi về ngân sách (budget), hãy so sánh số tiền đã chi (spent) với hạn mức (limit) để đưa ra cảnh báo nếu họ sắp hoặc đã chi tiêu vượt hạn mức.
4. Khi người dùng hỏi về chi tiêu (spending/chi phí), hãy tóm tắt các khoản chi tiêu lớn gần đây hoặc phân tích theo danh mục.
5. Đưa ra các lời khuyên tài chính hữu ích, ngắn gọn, cá nhân hóa dựa trên hành vi chi tiêu của họ (ví dụ: khuyên họ giảm chi tiêu ở danh mục đang vượt hạn mức).
6. Định dạng câu trả lời rõ ràng bằng markdown (in đậm, danh sách gạch đầu dòng, bảng nếu cần) để người dùng dễ đọc.
"""
            # Sử dụng model gemini-1.5-flash để phản hồi nhanh và chính xác
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )

            # Chuyển đổi lịch sử chat từ request sang định dạng Gemini mong muốn
            gemini_history = []
            if chat_req.history:
                # Chỉ lấy tối đa 10 tin nhắn gần nhất để tránh overload token
                for msg in chat_req.history[-10:]:
                    role = "user" if msg.role == "user" else "model"
                    gemini_history.append({
                        "role": role,
                        "parts": [msg.content]
                    })

            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(message)
            ai_reply = response.text

            # Gợi ý các câu hỏi tiếp theo dựa trên nội dung câu hỏi hiện tại
            suggested = get_suggested_questions(message, budgets_list, net_balance)

            return ChatResponse(
                response=ai_reply,
                suggested_questions=suggested
            )

        except Exception as e:
            logger.error(f"Lỗi khi gọi Gemini API: {e}")
            # Fallback sang mock responder nếu có lỗi gọi API
            return get_fallback_ai_response(message, user_name, total_income, total_expense, net_balance, budgets_list, recent_txs, api_error=True)

    else:
        # Nếu chưa cấu hình API Key, sử dụng smart fallback response
        return get_fallback_ai_response(message, user_name, total_income, total_expense, net_balance, budgets_list, recent_txs, api_error=False)


def get_suggested_questions(message: str, budgets: list, net_balance: float) -> List[str]:
    """Tự động gợi ý câu hỏi thông minh tiếp theo cho người dùng."""
    msg_lower = message.lower()
    
    # Gợi ý mặc định
    suggestions = [
        "Ngân sách của tôi thế nào?",
        "Tôi đã chi tiêu bao nhiêu tháng này?",
        "Số dư tài khoản hiện tại?",
        "Làm thế nào để tiết kiệm tiền?"
    ]
    
    if "ngân sách" in msg_lower or "hạn mức" in msg_lower:
        suggestions = [
            "Tôi đã chi bao nhiêu cho Ăn uống?",
            "Tôi có bị vượt hạn mức nào không?",
            "Làm thế nào để đổi hạn mức ngân sách?",
            "Tóm tắt chi tiêu tháng này"
        ]
    elif "chi tiêu" in msg_lower or "chi phí" in msg_lower or "đã tiêu" in msg_lower:
        suggestions = [
            "Giao dịch gần đây nhất của tôi?",
            "Số dư hiện tại còn bao nhiêu?",
            "Cho tôi lời khuyên chi tiêu tiết kiệm",
            "Xem hạn mức ngân sách"
        ]
    elif "số dư" in msg_lower or "còn lại" in msg_lower or "tiền" in msg_lower:
        suggestions = [
            "Dự báo chi tiêu 30 ngày tới?",
            "Khoản thu nhập lớn nhất của tôi?",
            "Ngân sách ăn uống còn bao nhiêu?",
            "Tải lên hóa đơn để quét chi tiêu"
        ]
        
    return suggestions


def get_fallback_ai_response(
    message: str,
    user_name: str,
    total_income: float,
    total_expense: float,
    net_balance: float,
    budgets_list: list,
    recent_txs: list,
    api_error: bool = False
) -> ChatResponse:
    """Bộ phân tích heurictics thông minh trả về phản hồi khi không có API key hoặc lỗi API."""
    msg_lower = message.lower()
    
    notice = ""
    if api_error:
        notice = "> ⚠️ *Chú ý: Hệ thống gặp sự cố khi kết nối tới API Gemini. Trợ lý đang hoạt động ở chế độ phân tích cục bộ.*"
    else:
        notice = "> 💡 *Chú ý: Chưa cấu hình GEMINI_API_KEY trong file `.env`. Trợ lý đang hoạt động ở chế độ phân tích dữ liệu cục bộ.*"

    response_content = ""
    
    if any(k in msg_lower for k in ["chào", "hello", "hi", "xin chào", "tên là gì", "ai đó"]):
        response_content = f"""
Chào **{user_name}**! Tôi là **AuraAI** - Trợ lý Tài chính Cá nhân của bạn. 

Tôi có thể giúp bạn kiểm tra:
1. **Số dư khả dụng** và tổng quan thu chi.
2. **Chi tiết ngân sách** và cảnh báo vượt hạn mức.
3. **Lịch sử giao dịch gần đây**.
4. Quét hóa đơn chi tiêu bằng AI OCR.

Bạn muốn hỏi về điều gì hôm nay? (Ví dụ: "Hạn mức ngân sách thế nào?", "Tổng chi tiêu tháng này của tôi?",...)
"""

    elif any(k in msg_lower for k in ["ngân sách", "hạn mức", "budget", "hạn mức chi"]):
        if not budgets_list:
            response_content = f"""
Hiện tại bạn **chưa thiết lập hạn mức ngân sách** nào trong tháng này. 
Hãy chuyển sang tab **Hạn mức ngân sách** ở thanh menu bên trái để tạo hạn mức mới nhằm quản lý chi tiêu tốt hơn nhé!
"""
        else:
            budget_rows = []
            warnings = []
            for b in budgets_list:
                percent = (b['spent'] / b['limit']) * 100 if b['limit'] > 0 else 0
                status_emoji = "✅ An toàn"
                if percent >= 100:
                    status_emoji = "❌ Vượt hạn mức!"
                    warnings.append(f"Danh mục **{b['category']}** đã vượt hạn mức chi tiêu ({percent:.1f}%).")
                elif percent >= 75:
                    status_emoji = "⚠️ Sắp vượt hạn mức"
                    warnings.append(f"Danh mục **{b['category']}** sắp chạm ngưỡng hạn mức ({percent:.1f}%).")
                
                budget_rows.append(f"| {b['category']} | {b['spent']:,.0f}đ | {b['limit']:,.0f}đ | {percent:.0f}% | {status_emoji} |")
                
            warnings_str = "\n".join([f"- {w}" for w in warnings]) if warnings else "- Tất cả các danh mục chi tiêu đều đang nằm trong tầm kiểm soát!"
            
            response_content = f"""
### Báo Cáo Ngân Sách Tháng Này:
Dưới đây là chi tiết hạn mức ngân sách của bạn:

| Danh mục | Thực chi | Hạn mức | Tiến độ | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
{chr(10).join(budget_rows)}

**Đánh giá nhanh:**
{warnings_str}

*Lời khuyên:* Hãy chú ý giảm thiểu chi tiêu ở các danh mục có cảnh báo màu đỏ hoặc vàng để giữ tài chính cân bằng.
"""

    elif any(k in msg_lower for k in ["chi tiêu", "chi phí", "spending", "tiêu bao nhiêu", "đã mua", "chi"]):
        # Phân tích chi tiêu theo danh mục
        category_spending = {}
        for t in recent_txs:
            if t.type == "expense":
                category_spending[t.category] = category_spending.get(t.category, 0.0) + t.amount
                
        cat_rows = [f"- **{cat}**: {amt:,.0f}đ" for cat, amt in category_spending.items()]
        cat_str = "\n".join(cat_rows) if cat_rows else "- Không có giao dịch chi tiêu nào gần đây."
        
        response_content = f"""
### Báo Cáo Chi Tiêu:
Tháng này bạn đã thực hiện tổng cộng **{total_expense:,.0f}đ** chi tiêu.

**Chi tiết theo danh mục:**
{cat_str}

**Giao dịch chi tiêu gần đây:**
{chr(10).join([f"- {t.transaction_date}: {t.description} ({t.category}) -> **-{t.amount:,.0f}đ**" for t in recent_txs if t.type == 'expense'][:5])}
"""

    elif any(k in msg_lower for k in ["số dư", "tiền còn", "balance", "còn lại", "còn bao nhiêu"]):
        status_text = ""
        if net_balance > 10000000:
            status_text = "Tài khoản của bạn đang có số dư rất tốt! Hãy xem xét trích lập thêm quỹ tiết kiệm hoặc đầu tư."
        elif net_balance > 2000000:
            status_text = "Số dư ở mức trung bình. Hãy duy trì chi tiêu hợp lý."
        else:
            status_text = "Số dư khả dụng hiện tại khá thấp. Bạn nên thắt chặt chi tiêu và hạn chế mua sắm không thiết yếu."
            
        response_content = f"""
### Báo Cáo Số Dư Tài Khoản:
- **Tổng thu nhập**: `+{total_income:,.0f}đ`
- **Tổng chi tiêu**: `-{total_expense:,.0f}đ`
- **Số dư khả dụng**: **{net_balance:,.0f}đ**

**Đánh giá:**
{status_text}
"""

    else:
        # Câu trả lời chung
        response_content = f"""
Chào **{user_name}**, tôi đã ghi nhận câu hỏi của bạn: *"{message}"*.

Dưới đây là một số thống kê nhanh từ tài khoản của bạn để bạn tham khảo:
- **Số dư khả dụng**: `{net_balance:,.0f}đ` (Thu nhập: `{total_income:,.0f}đ` | Chi tiêu: `{total_expense:,.0f}đ`)
- **Số danh mục ngân sách**: `{len(budgets_list)}` danh mục.
- **Số giao dịch gần đây**: `{len(recent_txs)}` giao dịch.

*Lưu ý: Để tôi có thể trả lời các câu hỏi mang tính chất lập luận, tư vấn tài chính thông minh hoặc trò chuyện linh hoạt hơn, vui lòng cấu hình **GEMINI_API_KEY** trong tệp `.env` của backend.*
"""

    final_response = f"{notice}\n\n{response_content}"
    suggested = get_suggested_questions(message, budgets_list, net_balance)
    
    return ChatResponse(
        response=final_response,
        suggested_questions=suggested
    )
