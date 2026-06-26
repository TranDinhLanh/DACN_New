# Kế Hoạch Phát Triển Tính Năng Nâng Cao (AuraFinance Roadmap)

Tài liệu này vạch ra các tính năng chuyên sâu và phân vùng chức năng để bạn giao việc cho các thành viên trong đội ngũ phát triển (đồng đội) triển khai tiếp nối hệ thống AuraFinance hiện tại.

---

## 1. Tính năng Phân Vùng Chi Tiêu Theo Sự Kiện / Chuyến Đi (Event & Trip Budgeting)
* **Ý tưởng**: Cho phép người dùng gom nhóm các khoản chi tiêu vào một sự kiện hoặc chuyến đi cụ thể (ví dụ: *"Du lịch Đà Lạt 2026"*, *"Đám cưới bạn thân"*, *"Dự án thiết kế nhà"*). Giúp theo dõi chi phí độc lập không ảnh hưởng đến hạn mức sinh hoạt hàng tháng.

### 📐 Thiết kế Cơ sở Dữ liệu (Backend Model)
Tạo bảng mới `events`:
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,            -- Ví dụ: "Du lịch Đà Lạt"
    budget_limit NUMERIC(15, 2) DEFAULT 0,  -- Ngân sách dự trù cho sự kiện
    start_date DATE,
    end_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
Cập nhật bảng `transactions` hiện tại:
- Thêm trường `event_id UUID NULL REFERENCES events(id) ON DELETE SET NULL` để liên kết các giao dịch với sự kiện.

### 🛠️ Thiết kế API Endpoints (`/api/v1/events`)
- `POST /` : Tạo sự kiện mới.
- `GET /` : Lấy danh sách sự kiện kèm tổng số tiền đã chi tiêu (tự động `SUM(amount)` các giao dịch có `event_id`).
- `GET /{id}` : Lấy chi tiết sự kiện và danh sách giao dịch thuộc sự kiện đó.
- `PUT /{id}` : Cập nhật ngân sách hoặc trạng thái hoàn thành.
- `DELETE /{id}` : Xóa sự kiện.

---

## 2. Quản Lý & Theo Dõi Vay Nợ (Debt & Loan Tracker)
* **Ý tưởng**: Ghi chép chi tiết các khoản đi vay (Borrow) và cho vay (Lend), tính toán lãi suất (nếu có), hạn thanh toán và nhắc nhở khi đến hạn trả.

### 📐 Thiết kế Cơ sở Dữ liệu (Backend Model)
Tạo bảng mới `debts`:
```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,             -- "borrow" (Đi vay) hoặc "lend" (Cho vay)
    partner_name VARCHAR(255) NOT NULL,    -- Tên người vay / người cho vay
    amount NUMERIC(15, 2) NOT NULL,        -- Số tiền gốc
    paid_amount NUMERIC(15, 2) DEFAULT 0,  -- Số tiền đã thanh toán/thu hồi
    interest_rate NUMERIC(5, 2) DEFAULT 0, -- Lãi suất (% / năm hoặc % / tháng)
    due_date DATE,                         -- Ngày đáo hạn thanh toán
    status VARCHAR(50) DEFAULT 'active',   -- 'active' (đang nợ), 'paid' (đã trả hết)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🛠️ Thiết kế API Endpoints (`/api/v1/debts`)
- `POST /` : Tạo khoản nợ mới.
- `PUT /{id}/pay` : Trả bớt tiền nợ (Cập nhật `paid_amount` và tự động tạo 1 transaction tương ứng).
- `GET /summary` : Trả về báo cáo: *"Tổng tiền tôi đang nợ"* & *"Tổng tiền người khác nợ tôi"*.

---

## 3. Ghi Chép Giao Dịch Bằng Giọng Nói AI (AI Voice Transcriber)
* **Ý tưởng**: Người dùng nhấn giữ nút micro, nói một câu như *"Ăn phở hết 45 nghìn"* hoặc *"Mua áo thun Shopee 200 nghìn bằng ví ShopeePay"*. AI tự động phân tích và điền vào form giao dịch.

### 🔄 Luồng xử lý công nghệ (Pipeline)
1. **Frontend**: Sử dụng Web Audio API ghi âm giọng nói thành file `.wav` hoặc `.mp3` và gửi lên backend.
2. **Backend (FastAPI)**:
   - Nhận file âm thanh qua endpoint `/api/v1/voice/parse`.
   - Gửi file âm thanh sang OpenAI Whisper API hoặc Google Cloud Speech-to-Text để chuyển từ giọng nói thành văn bản thô (Speech-to-Text).
   - Truy vấn LLM (Gemini hoặc GPT-4o) kèm System Prompt để trích xuất dữ liệu JSON có cấu trúc:
     ```json
     {
       "amount": 45000,
       "type": "expense",
       "category": "Food & Beverage",
       "description": "Ăn phở",
       "merchant_name": "Quán Phở"
     }
     ```
   - Trả kết quả JSON về frontend để người dùng xác nhận và lưu.

---

## 4. Xuất Báo Cáo Excel & PDF chuyên nghiệp (Data Exporter)
* **Ý tưởng**: Cho phép xuất dữ liệu lịch sử thu chi theo tháng/năm dưới dạng bảng tính Excel đẹp mắt hoặc file báo cáo PDF để in ấn, báo cáo thuế cá nhân.

### 🛠️ Thư viện Backend đề xuất
- **Excel**: Sử dụng thư viện `pandas` kết hợp `openpyxl` trong Python để tạo file `.xlsx` định dạng cột rõ ràng, tô màu tiêu đề.
- **PDF**: Sử dụng `pdfkit` hoặc `reportlab` để render file PDF từ mẫu template HTML.
- **API Endpoints**:
  - `GET /api/v1/transactions/export/excel?month=05&year=2026`
  - `GET /api/v1/transactions/export/pdf?month=05&year=2026`

---

## 5. Ví Nhóm / Chia Sẻ Hạn Mức Gia Đình (Shared Wallets)
* **Ý tưởng**: Vợ chồng, gia đình hoặc nhóm bạn đi du lịch có chung một quỹ tiền. Mọi thành viên được phân quyền đều có thể add khoản chi vào ví này và cập nhật số dư thời gian thực.

### 📐 Thiết kế Cơ sở Dữ liệu (Backend Model)
Tạo bảng mới `shared_wallets` và bảng trung gian `wallet_members`:
```sql
CREATE TABLE shared_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE wallet_members (
    wallet_id UUID REFERENCES shared_wallets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',    -- 'admin' (toàn quyền) hoặc 'member' (chỉ được xem và add)
    PRIMARY KEY (wallet_id, user_id)
);
```

---

## 📅 Phân Chia Công Việc Cho Đồng Đội (Gợi Ý)

| Thành viên | Nhiệm vụ chính | Công nghệ cần chạm vào |
| :--- | :--- | :--- |
| **Teammate A (Backend)** | Triển khai Schema DB mới & API cho **Chuyến đi (Events)** và **Vay nợ (Debts)**. | PostgreSQL, SQLAlchemy, Pydantic |
| **Teammate B (Frontend)**| Thiết kế Giao diện quản lý Chuyến đi & Vay nợ, tạo các Tab tương ứng trên sidebar. | React, Tailwind, Lucide Icons |
| **Teammate C (AI Integration)**| Triển khai Endpoint phân tích giọng nói sử dụng Whisper & Gemini API. | Python, OpenAI API, Audio File Processing |
| **Teammate D (Reporting)** | Viết service render file Excel và PDF, tích hợp nút tải báo cáo trên Dashboard. | Pandas, ReportLab, Byte stream download |
