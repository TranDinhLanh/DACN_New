import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Bỏ qua kiểm tra lỗi kiểu dữ liệu TypeScript để rút ngắn thời gian build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua kiểm tra lỗi ESLint khi build
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
