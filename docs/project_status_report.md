# Báo cáo Đánh giá Hiện trạng Dự án AuraFinance

Tài liệu này đối chiếu kế hoạch ban đầu (bản thảo thiết kế) với hiện trạng mã nguồn thực tế của dự án **AuraFinance** (trong thư mục `backend` và `frontend`).

---

## 📊 1. Tổng quan bảng đối chiếu tính năng

| Đối tượng | Tính năng theo kế hoạch | Trạng thái hiện tại | Chi tiết kỹ thuật / Vị trí mã nguồn |
| :--- | :--- | :--- | :--- |
| **User** | Đăng ký, Đăng nhập (JWT) | **Đã hoàn thành** | - Backend: [auth.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/api/auth.py) với JWT Auth và Google reCAPTCHA.<br>- Frontend: UI Next.js hoàn chỉnh tại `/register` và `/login`. |
| **User** | Quên mật khẩu (OTP) | **Đã hoàn thành** | - Backend: Endpoint `/forgot-password` (tạo mã OTP 6 số, giả lập gửi email bằng cách in ra terminal/trả về API response) và `/reset-password` để cập nhật mật khẩu mới.<br>- Frontend: UI hoàn chỉnh tại `/forgot-password`. |
| **User** | Xem chi tiêu theo Ngày/Tháng/Năm | **Hoàn thành một phần** | - Backend: Trích xuất trường `transaction_date` từ hóa đơn hoặc lưu từ nhập tay.<br>- Frontend: Hiển thị ngày giao dịch dạng danh sách và biểu đồ xu hướng. **Tuy nhiên**, chưa có bộ lọc (filter) nâng cao để người dùng tự chọn chính xác Ngày/Tháng/Năm trên giao diện. |
| **User** | Biểu đồ trực quan | **Đã hoàn thành** | - Frontend: Tích hợp thư viện **Recharts** vẽ biểu đồ hình quạt (Pie Chart) phân chia danh mục và biểu đồ vùng (Area Chart) vẽ dự báo chi tiêu. |
| **User** | Phân loại danh mục (Ăn uống, xe cộ...) | **Đã hoàn thành** | - Hệ thống đã hỗ trợ các danh mục: *Food & Beverage* (Ăn uống), *Transportation* (Di chuyển/Xe cộ), *Bills & Utilities* (Hóa đơn), *Shopping* (Mua sắm), *Entertainment* (Giải trí), và *Other* (Khác). |
| **User** | Chụp/Tải hóa đơn lên (OCR) | **Đã hoàn thành** | - Backend: Endpoint `/ocr/upload` hỗ trợ upload ảnh, xử lý lưu trữ tĩnh và phân tích AI.<br>- Frontend: Có Tab "Đọc hóa đơn AI" hỗ trợ kéo thả file, hiển thị ảnh gốc đối chiếu song song với biểu mẫu thông tin đã trích xuất. |
| **User** | Nhập tay giao dịch chi tiêu | **Đã hoàn thành** | - Backend: Endpoint `/transactions` (POST) lưu giao dịch thủ công.<br>- Frontend: Tab "Thêm giao dịch" với tính năng tự động gợi ý danh mục bằng AI ngay khi người dùng gõ mô tả (Dynamic Client-side Auto-categorization). |
| **User** | Thiết lập hạn mức & cảnh báo chi tiêu | **Đã hoàn thành** | - Backend: CRUD Budgets tại `/budgets`.<br>- Frontend: Tab "Hạn mức ngân sách" cho phép đặt hạn mức theo danh mục và đổi màu thanh tiến trình cảnh báo mức độ chi tiêu (Xanh lá <75% -> Vàng <90% -> Đỏ nhấp nháy >=90%). |
| **Admin** | Quản lý người dùng (User Management) | **Chưa thực hiện** | - Chưa có phân quyền `role` hay trường `is_admin` trong database model User.<br>- Chưa có giao diện quản lý tài khoản người dùng hoặc danh sách User ở Frontend. |
| **Admin** | Xem xu hướng tiêu dùng chung | **Chưa thực hiện** | - Tính năng dự báo chi tiêu (Forecasting) hiện tại chỉ phục vụ riêng tư cho từng cá nhân (Personal Finance), chưa có phần tổng hợp dữ liệu toàn bộ hệ thống dành cho Admin. |
| **Admin** | Quản lý & chỉnh sửa dịch vụ phân loại sai | **Chưa thực hiện** | - Người dùng có thể tự sửa đổi thủ công trên hóa đơn của họ khi OCR bị sai. Tuy nhiên, Admin chưa có giao diện tập trung để thu thập dữ liệu phân loại lỗi hoặc cập nhật/huấn luyện lại mô hình phân loại ML. |
| **AI Engine** | Trích xuất thông tin hóa đơn (OCR) | **Đã cải tiến sang PaddleOCR** | - Kế hoạch gốc đề xuất Tesseract-OCR/LayoutLMv3. Thực tế đã chuyển sang **PaddleOCR** tối ưu cho tiếng Việt.<br>- Hỗ trợ AI LLM (OpenAI/Gemini) hoặc Regex nếu không có API key. Có cơ chế Mock OCR tự động khi thiếu môi trường chạy cục bộ. |
| **AI Engine** | Tự động phân loại chi tiêu dựa vào dịch vụ | **Đã hoàn thành** | - Sử dụng mô hình **Logistic Regression (TF-IDF)** của `scikit-learn` huấn luyện trên tập dữ liệu tiếng Việt [vietnamese_transactions_dataset.csv](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/vietnamese_transactions_dataset.csv) và lưu thành file `.pkl`. Có bộ luật Regex dự phòng. |

---

## 🔍 2. Chi tiết hiện trạng thực tế mã nguồn

### 2.1. Phân hệ Người dùng (User Features)
- **Đăng ký / Đăng nhập / Quên mật khẩu**:
  - Mã nguồn backend hoàn chỉnh tại [auth.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/api/auth.py).
  - Tích hợp Google reCAPTCHA để chống spam lúc đăng ký.
  - Quên mật khẩu sử dụng mã OTP 10 phút. Hiện tại server đang in mã OTP ra console để hỗ trợ dev kiểm thử nhanh chóng.
- **Nhập chi tiêu và thiết lập cảnh báo hạn mức**:
  - Tab "Thêm giao dịch" trên giao diện [page.tsx](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/frontend/src/app/dashboard/page.tsx) kết hợp bộ lắng nghe sự kiện gõ mô tả. Ngay khi người dùng gõ mô tả, frontend sẽ chạy bộ phân loại từ khóa nhanh để gợi ý danh mục ngay lập tức.
  - Phần ngân sách (Budgets) tính toán tỷ lệ tiêu xài thời gian thực, có CSS animation nhấp nháy đỏ (`animate-pulse`) khi vượt ngưỡng 90% ngân sách giúp người dùng nhận biết tức thì.

### 2.2. Phân hệ Quản trị viên (Admin Features)
- **Chưa có hạ tầng kỹ thuật**: 
  - Database Model `User` tại [models.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/models/models.py) chỉ có các thuộc tính cơ bản (`email`, `hashed_password`, `full_name`, `is_active`, `created_at`, `reset_otp`, `reset_otp_expires`).
  - Cần bổ sung cột `role` (ví dụ: Enum 'user', 'admin') hoặc `is_admin` (Boolean) để phân quyền truy cập.
  - Cần viết thêm các API endpoint quản trị (Ví dụ: `/api/v1/admin/users`, `/api/v1/admin/analytics`).
  - Frontend Next.js cần cấu trúc thêm thư mục trang admin (ví dụ: `src/app/admin/dashboard`) và triển khai Middleware để chặn quyền truy cập trái phép từ tài khoản thường.

### 2.3. Phân hệ Trí tuệ nhân tạo (AI/ML Module)
- **Công nghệ OCR hóa đơn**:
  - Tệp xử lý lõi nằm tại [ai_ocr.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/services/ai_ocr.py).
  - Dự án ban đầu định hướng dùng LayoutLMv3 nhưng đã được di trú (migration) sang **PaddleOCR** để giảm tải dung lượng và nâng cao độ chính xác nhận diện chữ tiếng Việt không dấu/có dấu.
  - Sau khi OCR trích xuất văn bản thô, nếu trong `.env` có cấu hình `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`, backend sẽ gửi prompt cấu trúc hóa sang API LLM để nhận về JSON chuẩn. Ngược lại, nếu chạy offline hoàn toàn, backend dùng bộ lọc biểu thức chính quy (Regex Heuristics) định dạng số tiền, ngày tháng, tên cửa hàng.
- **Phân loại giao dịch (Categorizer)**:
  - Tệp xử lý nằm tại [ai_classify.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/services/ai_classify.py).
  - Tích hợp mô hình học máy Logistic Regression (TF-IDF vectorizer) qua thư viện `scikit-learn` để huấn luyện tự động từ file dữ liệu mẫu [vietnamese_transactions_dataset.csv](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/vietnamese_transactions_dataset.csv). Có kịch bản chạy huấn luyện tại [train_classifier.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/train_classifier.py).
- **Dự báo chi tiêu (Forecasting)**:
  - Tệp xử lý tại [ai_forecast.py](file:///d:/HOC%20KI%20FINAL/Project%20DACN/DACN/backend/app/services/ai_forecast.py).
  - Hiện tại, nếu lịch sử giao dịch của người dùng dưới 5 bản ghi, hệ thống tự động sinh dữ liệu dự báo giả lập có tính chu kỳ tuần (chi tiêu nhiều hơn vào thứ 6, thứ 7).
  - Đã chuẩn bị sẵn cấu trúc tích hợp thư viện **Facebook Prophet** (trong tệp tin có code mẫu đọc lịch sử và fit vào mô hình Prophet) chờ kích hoạt khi có đủ lượng dữ liệu lịch sử thực tế của người dùng.

---

## 📈 3. Định hướng phát triển tiếp theo (Roadmap gợi ý)

1. **Phân quyền và Giao diện Admin**:
   - Thêm cột `role: str = Column(String, default="user")` vào model `User` trong database.
   - Viết các API CRUD quản lý người dùng tại backend.
   - Tạo trang `/admin/dashboard` trong dự án frontend Next.js.
2. **Bộ lọc thời gian chi tiết cho người dùng**:
   - Thêm các dropdown/datepicker cho phép người dùng lọc danh sách giao dịch theo Ngày cụ thể, theo Tháng, hoặc theo Năm trên Dashboard.
3. **Admin quản lý phân loại sai**:
   - Thêm bảng database `misclassified_reports` để lưu lại những giao dịch bị phân loại danh mục sai mà người dùng đã sửa đổi thủ công.
   - Cho phép Admin xem danh sách này, phê duyệt và nhấn nút "Huấn luyện lại mô hình" (Retrain) ngay trên giao diện quản trị để cập nhật mô hình học máy (`classifier.pkl`).
