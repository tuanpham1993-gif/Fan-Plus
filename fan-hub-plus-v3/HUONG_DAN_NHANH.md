# Hướng dẫn nhanh - Fan Hub Plus V3

Bản này nâng cấp trực tiếp từ file ZIP V1 bạn gửi. Backend dùng Flask, không dùng FastAPI.

## Chạy giao diện ngay

Cài Node.js 22.12 trở lên. Mở thư mục `frontend`, chạy:

```sh
node tools/serve.mjs
```

Truy cập `http://127.0.0.1:4173`. Hoặc nhấp `START_DEMO.cmd` trên Windows.

Tài khoản thành viên: `fan@fanhub.demo`. Quản trị: `admin@fanhub.demo`. Cả hai dùng mật khẩu `FanHubDemo!26`. Chỉ nhập dữ liệu giả.

## Ba tính năng mới

**Ask Lore / Lore Master:** nút trên thanh điều hướng mở khung chat bên phải. Trang `/assistant` dành cho hội thoại dài. Bản mẫu trích xuất ghi chú, chưa tự gọi AI. Nguồn Gojo được ghi rõ là minh họa chưa kiểm chứng với nguyên tác.

**Community:** đăng nhập, viết bài, gửi duyệt. Admin mở `Review queue` để duyệt. Bài công khai có like, thả tim, bình luận, trả lời và báo cáo. Sửa bài sẽ cần duyệt lại.

**Quarterly gifts:** một lượt miễn phí mỗi tài khoản đủ điều kiện mỗi quý. Admin chốt danh sách và ghi kết quả một lần. Không có giải thưởng thật trong bản thử.

## Chế độ Flask và AI thật

Xem `README.md` để cài backend, tạo khóa `SECRET_KEY`, khởi tạo database và chạy Flask. Khi dùng Flask, mở cổng **5000**, không phải 4173.

Để gọi mô hình AI, cấu hình `LORE_MODE=openai`, `OPENAI_API_KEY` và `OPENAI_MODEL` trong `backend/.env`. Không đặt khóa API vào frontend. Cần bổ sung thư viện nguồn đã duyệt cho các phim thật.

## Giới hạn cần biết

70 kiểm thử Node, 46 kiểm thử Python và 13 nhóm kiểm thử giao diện đã đạt. Một mô-đun kiểm thử HTTP Flask bị bỏ qua do môi trường thiếu thư viện. Chưa chạy AI trực tuyến, MySQL thật hoặc build Vite đầy đủ. Kiểm thử giao diện dùng Chromium với bộ mô phỏng điều hướng/lưu trữ được mô tả trong `docs/TESTING.md`.

Ba mô-đun mới có gateway nối Flask. Những công cụ catalog V1 cũ vẫn là demo trên trình duyệt. Không tự động gộp schema backend V2 vào bản này.
