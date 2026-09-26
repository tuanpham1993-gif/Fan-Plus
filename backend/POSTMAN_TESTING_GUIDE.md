# 🚀 HƯỚNG DẪN KIỂM THỬ API TRÊN POSTMAN (FAN HUB BACKEND)

Tài liệu này hướng dẫn chi tiết cách cấu hình và kiểm thử đầy đủ các API cho cả **Người dùng (User)** và **Quản trị viên (Admin)** liên quan đến **Login/Logout**, **Profile**, **Dashboard**, **Feedback & Đăng bài** trên ứng dụng **Postman**.

---

## 🌐 Cấu hình Chung (Environment Setup)

* **Base URL:** `http://localhost:5000` (hoặc `http://127.0.0.1:5000`)
* **Headers mặc định cho các Request dạng POST/PUT:**
  * `Content-Type`: `application/json`
* **Headers cho các API yêu cầu đăng nhập:**
  * `Authorization`: `Bearer <access_token>`

---

## 🔑 PHẦN 1: XÁC THỰC & ĐĂNG NHẬP / ĐĂNG XUẤT (AUTH & LOGIN/LOGOUT)

### 1.1 Đăng ký tài khoản User mới (Register)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/register`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "name": "Nguyen Van A",
    "email": "usertest@gmail.com",
    "password": "Password123@",
    "captcha_token": "PASSED_TEST_TOKEN"
  }
  ```
* **Kết quả kỳ vọng (201 Created):**
  ```json
  {
    "message": "Đăng ký tài khoản thành công",
    "user": {
      "id": 2,
      "name": "Nguyen Van A",
      "email": "usertest@gmail.com",
      "role": "user",
      "status": "active"
    }
  }
  ```

---

### 1.2 Đăng nhập User thường (User Login)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "email": "usertest@gmail.com",
    "password": "Password123@",
    "captcha_token": "PASSED_TEST_TOKEN"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  *(Copy chuỗi `access_token` trả về làm `user_access_token`)*
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    "user": {
      "id": 2,
      "email": "usertest@gmail.com",
      "name": "Nguyen Van A",
      "role": "user"
    }
  }
  ```

---

### 1.3 Cấp lại Access Token mới (Refresh Token)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/refresh`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "refresh_token": "<refresh_token_lấy_từ_bước_login>"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 1.4 Đăng xuất (Logout - Linh hoạt không bắt buộc refresh_token)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/logout`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON - Có thể gửi rỗng `{}` hoặc gửi refresh_token):**
  ```json
  {
    "refresh_token": "<refresh_token_lấy_từ_bước_login>"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "message": "Đăng xuất thành công"
  }
  ```

---

### 1.5 Quên mật khẩu (Forgot Password)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/forgot-password`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "email": "usertest@gmail.com"
  }
  ```
* **Kết quả kỳ vọng (200 OK):** Trả về `reset_token` để đổi mật khẩu.

---

### 1.6 Đặt lại mật khẩu mới (Reset Password)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/reset-password`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "reset_token": "<reset_token_ở_bước_1.5>",
    "new_password": "NewPassword123@"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "message": "Đặt lại mật khẩu mới thành công. Vui lòng đăng nhập lại"
  }
  ```

---

## 👤 PHẦN 2: HỒ SƠ NGƯỜI DÙNG & DASHBOARD (USER PROFILE & DASHBOARD)

### 2.1 Xem thông tin tài khoản hiện tại (Get Profile)
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/users/me`
* **Headers:**
  * `Authorization`: `Bearer <user_access_token>`
* **Kết quả kỳ vọng (200 OK):** Trả về thông tin User.

---

### 2.2 Cập nhật Hồ sơ cá nhân & Cài đặt giao diện (Update Profile & Preferences)
* **Method:** `PUT`
* **URL:** `http://localhost:5000/api/users/me`
* **Headers:**
  * `Content-Type`: `application/json`
  * `Authorization`: `Bearer <user_access_token>`
* **Body (raw JSON):**
  ```json
  {
    "name": "Nguyen Van A (Updated)",
    "avatar": "https://example.com/new_avatar.png",
    "favorite_fandoms": ["Anime", "Gaming", "Manga"],
    "display_preferences": {
      "theme": "dark",
      "font_size": "large"
    }
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "message": "Cập nhật hồ sơ cá nhân thành công",
    "user": {
      "id": 2,
      "name": "Nguyen Van A (Updated)",
      "favorite_fandoms": ["Anime", "Gaming", "Manga"],
      "display_preferences": {
        "theme": "dark",
        "font_size": "large"
      }
    }
  }
  ```

---

### 2.3 Xem Dashboard cá nhân hóa (Personalized Dashboard)
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/users/dashboard`
* **Headers:**
  * `Authorization`: `Bearer <user_access_token>`
* **Kết quả kỳ vọng (200 OK):** Trả về câu chào, danh sách fandom yêu thích, bookmark gần đây & bài viết đóng góp.

---

## 💬 PHẦN 3: PHẢN HỒI NGUỜI DÙNG (USER FEEDBACK SUBMISSION)

### 3.1 Người dùng gửi Phản hồi / Báo lỗi (Submit Feedback)
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/feedback`
* **Headers:**
  * `Content-Type`: `application/json`
  * `Authorization`: `Bearer <user_access_token>`
* **Body (raw JSON):** (Loại chấp nhận: `bug`, `suggestion`, `query`)
  ```json
  {
    "type": "bug",
    "content": "Tôi gặp lỗi không hiển thị danh sách bài viết khi lọc theo danh mục Gaming"
  }
  ```
* **Kết quả kỳ vọng (201 Created):**
  ```json
  {
    "message": "Gửi phản hồi thành công. Cảm ơn ý kiến của bạn!",
    "feedback": {
      "id": 1,
      "user_id": 2,
      "type": "bug",
      "content": "Tôi gặp lỗi không hiển thị danh sách bài viết khi lọc theo danh mục Gaming",
      "status": "pending"
    }
  }
  ```

---

## 👑 PHẦN 4: DÀNH CHO ADMIN - ĐĂNG NHẬP & KIỂM DUYỆT PHẢN HỒI (ADMIN MANAGEMENT)

### 4.1 Admin Đăng nhập (Admin Login)
Sử dụng tài khoản Admin mặc định được tự động tạo sẵn khi khởi tạo CSDL:
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "email": "admin@fanhub.com",
    "password": "Admin1234@",
    "captcha_token": "PASSED_TEST_TOKEN"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  *(Copy chuỗi `access_token` này làm `admin_access_token`)*
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "user": {
      "id": 1,
      "name": "Administrator",
      "email": "admin@fanhub.com",
      "role": "admin"
    }
  }
  ```

---

### 4.2 Admin xem Thống kê Hệ thống (Get Admin Stats)
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/admin/stats`
* **Headers:**
  * `Authorization`: `Bearer <admin_access_token>`
* **Kết quả kỳ vọng (200 OK):** Trả về tổng số users, contents, categories, bookmarks, characters, views và `pending_feedback`.

---

### 4.3 Admin xem danh sách Phản hồi từ Người dùng (Admin List Feedback)
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/admin/feedback`
* **Query Params (Tùy chọn lọc theo status):** `http://localhost:5000/api/admin/feedback?status=pending`
* **Headers:**
  * `Authorization`: `Bearer <admin_access_token>`
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "count": 1,
    "feedbacks": [
      {
        "id": 1,
        "user_id": 2,
        "type": "bug",
        "content": "Tôi gặp lỗi không hiển thị danh sách bài viết khi lọc theo danh mục Gaming",
        "status": "pending",
        "created_at": "2026-09-26T15:00:00"
      }
    ]
  }
  ```

---

### 4.4 Admin Duyệt / Xử lý bài Phản hồi (Admin Moderate & Resolve Feedback)
* **Method:** `PUT`
* **URL:** `http://localhost:5000/api/admin/feedback/1`
* **Headers:**
  * `Content-Type`: `application/json`
  * `Authorization`: `Bearer <admin_access_token>`
* **Body (raw JSON):** (Trạng thái chấp nhận: `pending`, `resolved`, `dismissed`)
  ```json
  {
    "status": "resolved"
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "message": "Cập nhật trạng thái phản hồi thành resolved thành công",
    "feedback": {
      "id": 1,
      "user_id": 2,
      "type": "bug",
      "content": "Tôi gặp lỗi không hiển thị danh sách bài viết khi lọc theo danh mục Gaming",
      "status": "resolved"
    }
  }
  ```

---

## 🚫 PHẦN 5: KIỂM THỬ CÁC TRƯỜNG HỢP BẮT LỖI & BẢO MẬT (SECURITY & ERRORS)

| Kịch bản kiểm thử | Request | Header | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **Chưa đăng nhập** | `GET /api/users/me` | Không có Header Auth | **401 Unauthorized** (`{"message": "Vui lòng đăng nhập..."}`) |
| **Token hết hạn / Sai** | `GET /api/users/me` | `Authorization: Bearer invalid_token` | **401 Unauthorized** (`{"message": "Phiên đăng nhập không hợp lệ..."}`) |
| **User thường truy cập API Admin** | `GET /api/admin/feedback` | `Authorization: Bearer <user_access_token>` | **403 Forbidden** (`{"message": "Truy cập bị từ chối. Bạn không có quyền Admin"}`) |
| **Tên Đăng nhập / Mật khẩu sai** | `POST /api/auth/login` | Email/pass sai | **401 Unauthorized** (`{"message": "Email hoặc mật khẩu không chính xác"}`) |
| **Loại Feedback không hợp lệ** | `POST /api/feedback` | `{"type": "invalid"}` | **400 Bad Request** (`{"message": "Loại phản hồi không hợp lệ..."}`) |
