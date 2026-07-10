FROM python:3.10-slim

# Thiết lập múi giờ Việt Nam
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Cài đặt các thư viện hệ thống cần thiết cho PaddleOCR và OpenCV (tránh lỗi thiếu thư viện liên kết động .so)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file requirements và cài đặt thư viện trước để tối ưu hóa Docker layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Expose port chạy của Uvicorn bên trong container
EXPOSE 8000

# Lệnh khởi chạy ứng dụng FastAPI bằng Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
