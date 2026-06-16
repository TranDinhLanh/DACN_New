# Hướng Dẫn Tích Hợp Supabase & Cẩm Nang Next.js Cho Lập Trình Viên React

Tài liệu này tổng hợp **danh sách các tính năng đã dựng**, **cẩm nang Next.js rút gọn cho người đã biết React**, và **từng bước chi tiết để cấu hình Supabase Cloud** làm database dùng chung cho cả nhóm.

---

## 1. Hệ Thống Hiện Tại Đã Làm Được Những Gì?

Hệ thống đã được thiết kế và triển khai hoàn thiện bộ khung cốt lõi (**Core MVP Base**) ở cả 2 đầu:

### A. Frontend (Next.js 14+ & Tailwind CSS v4 & Recharts)
*   **Giao diện Premium**: Đạt tiêu chuẩn tối giản Glassmorphism với gam màu tối thanh lịch (`#0b0f19`), các khối cầu phát sáng và hiệu ứng hover êm ái.
*   **Trang Landing Page (`src/app/page.tsx`)**: Đầy đủ thông tin giới thiệu đề tài đồ án, mô hình kiến trúc xử lý hóa đơn, và nút kêu gọi hành động dẫn thẳng vào Dashboard.
*   **Trang Dashboard chính (`src/app/dashboard/page.tsx`)**: Chạy độc lập hoàn toàn bằng **React States** để phục vụ demo lập tức:
    *   *Tự động dự đoán AI Realtime*: Khi gõ mô tả như `"di grab taxi"` hay `"uong tra sua gongcha"`, giao diện tự nhận diện từ khóa và hiển thị gợi ý danh mục chi tiêu của AI ngay lập tức dưới ô input.
    *   *Mô phỏng OCR Hóa đơn*: Có vùng kéo thả ảnh hóa đơn, khi ném ảnh vào sẽ có spinner xử lý, sau đó tự động phân tích trích xuất dữ liệu của Highlands Coffee (Tên, Số tiền, Ngày hóa đơn) và điền trực tiếp vào form để lưu.
    *   *Hạn mức chi tiêu sinh động*: Các thanh tiến trình theo dõi hạn mức tự động đổi màu và nhấp nháy đỏ cảnh báo nếu chi tiêu vượt quá 90%.
    *   *Biểu đồ trực quan (Recharts)*: Gồm 1 biểu đồ Pie Chart phân tích cơ cấu chi tiêu thực tế và 1 biểu đồ Area Chart vẽ đường dự báo xu hướng chi tiêu tương lai.

### B. Backend (FastAPI & SQLAlchemy ORM & JWT Auth)
*   **Cơ cấu thư mục chuẩn hóa**: Tách biệt rõ ràng thành `core` (cấu hình, db, bảo mật), `models` (database tables), `schemas` (pydantic validate), `api` (routers endpoints), và `services` (stubs AI).
*   **Chức năng xác thực**: Đầy đủ API đăng ký, đăng nhập cấp token JWT bảo mật, lưu mật khẩu băm bcrypt, và lấy thông tin tài khoản hiện tại.
*   **Chức năng nghiệp vụ**: CRUD Giao dịch (`/api/transactions`) và CRUD Ngân sách Hạn mức (`/api/budgets`) hoàn chỉnh.
*   **Tính năng tích hợp AI**: Có các API Router tiếp nhận ảnh upload và xuất dự báo, liên kết trực tiếp với các stubs xử lý ở `app/services`:
    *   *ai_ocr.py*: Có sẵn bộ lọc Regex trích xuất số tiền, ngày tháng và luồng hướng dẫn để đồng đội tích hợp PaddleOCR thật.
    *   *ai_classify.py*: Classifier dựa trên quy tắc lọc từ khóa (rules) hoạt động ổn định và có sẵn template code huấn luyện mô hình học máy Scikit-Learn TF-IDF.
    *   *ai_forecast.py*: Dự báo xu hướng chuỗi thời gian dựa trên thống kê thực tế và có sẵn template kết nối mô hình Facebook Prophet.

---

## 2. Next.js Có Gì Khác So Với React Truyền Thống? (Mental Model)

Vì bạn đã có nền tảng vững chắc về **React (TS/JS)**, việc làm quen với Next.js App Router sẽ cực kỳ đơn giản. Hãy nhớ 3 nguyên tắc vàng sau:

### Nguyên tắc 1: Routing (Định tuyến) theo Thư mục
Thay vì cấu hình thư viện `react-router-dom` với `<Routes>` và `<Route>`, Next.js tự động tạo đường dẫn dựa trên cấu trúc thư mục bên trong `src/app/`:
- `src/app/page.tsx` $\rightarrow$ Đường dẫn trang chủ `/`
- `src/app/dashboard/page.tsx` $\rightarrow$ Đường dẫn `/dashboard`
- Muốn tạo trang đăng nhập `/login`? Chỉ cần tạo thư mục `src/app/login/` và tạo file `page.tsx` bên trong!

### Nguyên tắc 2: Mặc định là Server Component (Không có State)
Mặc định các component trong Next.js sẽ được render sẵn trên Server để tải trang nhanh hơn và tốt cho SEO. Các component này không thể dùng các hook như `useState`, `useEffect`, hoặc bắt sự kiện `onClick`.

### Nguyên tắc 3: Khai báo `"use client"` để sử dụng React thuần túy
Để biến một file Next.js thành một component React thông thường (có đầy đủ State, Effect, tương tác click), bạn chỉ cần viết dòng chữ `"use client";` ở **ngay dòng đầu tiên** của file!
> [!NOTE]
> Hãy mở file `frontend/src/app/dashboard/page.tsx` để kiểm tra. Nó bắt đầu bằng `"use client";` và toàn bộ code bên dưới chính là code React TypeScript thuần túy mà bạn đã quen thuộc (sử dụng `useState`, `useEffect` và bắt sự kiện `onSubmit`!).

---

## 3. Các Bước Tích Hợp Supabase Làm Database Dùng Chung Cho Cả Nhóm

Supabase thực chất là một dịch vụ cung cấp PostgreSQL Cloud cực kỳ mạnh mẽ và hoàn toàn miễn phí. Để liên kết FastAPI với Supabase:

### Bước 1: Tạo Project trên Supabase
1. Truy cập vào [Supabase.com](https://supabase.com/) và đăng nhập bằng tài khoản Github của bạn.
2. Bấm vào **New Project**, đặt tên dự án (ví dụ: `pfm-finance`) và đặt **Database Password** (Hãy ghi nhớ mật khẩu này!).
3. Chọn khu vực (Region) gần Việt Nam nhất (ví dụ: `Singapore` hoặc `Southeast Asia`) để tối ưu tốc độ kết nối.
4. Bấm **Create New Project** và đợi khoảng 1-2 phút để Supabase khởi tạo server PostgreSQL cho bạn.

### Bước 2: Lấy Connection String (Chuỗi Kết Nối)
1. Trong giao diện dự án Supabase, bấm vào biểu tượng răng cưa **Project Settings** ở góc dưới cùng bên trái.
2. Chọn mục **Database**.
3. Cuộn xuống phần **Connection string**, chọn tab **URI**.
4. Sao chép chuỗi kết nối đó. Nó sẽ có định dạng tương tự như sau:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`
5. Hãy thay thế phần `[YOUR-PASSWORD]` bằng mật khẩu database thực tế mà bạn đã đặt ở Bước 1.

### Bước 3: Cấu hình file `.env` ở Backend
1. Tại thư mục `backend/`, tạo một file mới tên là `.env` (copy từ file `.env.example` tôi đã tạo sẵn cho bạn).
2. Dán chuỗi kết nối đã sửa mật khẩu của bạn vào biến `DATABASE_URL`:
   ```env
   SECRET_KEY=SUPER_SECRET_KEY_FOR_LOCAL_DEV_CHANGE_IN_PRODUCTION_123456789
   ACCESS_TOKEN_EXPIRE_MINUTES=10080

   # Tích hợp Supabase dùng chung cho cả nhóm:
   DATABASE_URL=postgresql://postgres:mat_khau_cua_ban_123@db.abcxyz.supabase.co:5432/postgres
   ```
3. Cung cấp file `.env` này cho các thành viên trong nhóm. Mọi người chỉ cần dán chung 1 file `.env` này là có thể kết nối chung vào 1 database Supabase trên cloud!

---

## 4. Tự Động Đồng Bộ Khởi Tạo Bảng (Auto-Migration)

Điểm tuyệt vời nhất của FastAPI kết hợp SQLAlchemy trong bộ khung tôi đã viết là: **Bạn không cần phải chạy code SQL thủ công để tạo bảng trên Supabase!**

Ngay tại file `backend/app/main.py`, hệ thống đã có sẵn dòng lệnh kiểm tra và tự động khởi tạo bảng:
```python
# Tự động tạo toàn bộ các table trên Database nếu chưa tồn tại
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    ...
```

**Cách kích hoạt**:
Ngay khi bạn hoặc bất kỳ đồng đội nào đổi `DATABASE_URL` trong `.env` sang link Supabase và khởi động Server FastAPI bằng lệnh:
```bash
uvicorn app.main:app --reload
```
SQLAlchemy sẽ tự động kết nối lên cloud Supabase, tự kiểm tra và tự tạo toàn bộ 5 bảng dữ liệu gồm: `users`, `transactions`, `budgets`, `ocr_logs`, `forecasts` với đầy đủ cấu trúc khóa ngoại và ràng buộc.

Bạn có thể vào tab **Table Editor** trên Supabase Web UI để kiểm tra: bạn sẽ thấy toàn bộ các bảng dữ liệu đã xuất hiện rực rỡ và sẵn sàng để lưu trữ dữ liệu thực tế!
