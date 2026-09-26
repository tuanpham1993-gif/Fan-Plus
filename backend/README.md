# FAN HUB PLUS - BACKEND REST API SYSTEM

**Project Name:** Fan Hub Plus  
**Topic:** Fandom Universe  
**Backend Tech Stack:** Python 3.13, Flask, MySQL (XAMPP / phpMyAdmin), SQLAlchemy ORM, JWT Authentication, Google reCAPTCHA v2 Verification, Werkzeug, python-dotenv, Flask-CORS, Pytest.  

---

## 📌 1. OVERVIEW & RESPONSIBILITY SCOPE

Module Backend này phụ trách các thành phần cốt lõi của hệ thống:
1. **Architecture & Environment**: Flask REST API, cấu hình `.env`, quản lý CORS & môi trường.
2. **Database & Base Models**: MySQL DB (`fan_plus`), các bảng `users`, `refresh_tokens`, `feedbacks`.
3. **Password Security**: Mã hóa Werkzeug `generate_password_hash` & kiểm tra độ phức tạp của mật khẩu khi đăng ký.
4. **Google reCAPTCHA v2 Verification**: Xác minh `captcha_token` với Google API trước khi Đăng ký & Đăng nhập.
5. **JWT Authentication**: Đăng ký, Đăng nhập, Sinh Access Token & Refresh Token, Cấp lại Access Token (`/refresh`), Đăng xuất (`/logout`), Lấy thông tin cá nhân (`/me`).
6. **User Profile API**: Xem & Cập nhật thông tin cá nhân (`/api/users/me`).
7. **Authorization Middleware**: Decorator `@token_required` & `@admin_required` (Phân biệt 401 Unauthorized vs 403 Forbidden).
8. **Feedback API**: Gửi phản hồi/báo lỗi cho người dùng đã đăng nhập (`POST /api/feedback`).
9. **Automated Testing**: Bộ Unit Test toàn diện với Pytest cho Auth, User, và Feedback APIs.

---

## 🛠️ 2. SYSTEM REQUIREMENTS & INSTALLATION

### Yêu Cầu Hệ Thống:
- Python 3.10+ (Đã thử nghiệm trên Python 3.13)
- MySQL Server (XAMPP / phpMyAdmin hoặc MySQL Standalone)

### Bước 1: Khởi Tạo Virtual Environment (venv)
```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo venv
python -m venv venv

# Kích hoạt môi trường ảo (Windows)
venv\Scripts\activate

# Kích hoạt môi trường ảo (Linux / macOS)
source venv/bin/activate
```

### Bước 2: Cài Đặt Các Dependencies
```bash
pip install -r requirements.txt
```

### Bước 3: Cấu Hình Biến Môi Trường (`.env`)
Tạo file `.env` từ file mẫu `.env.example`:
```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fan_plus
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET_KEY=fan_plus_super_secret_jwt_key_2026
JWT_ACCESS_TOKEN_EXPIRES=15
JWT_REFRESH_TOKEN_EXPIRES=7

# Google reCAPTCHA v2 Configuration
RECAPTCHA_SECRET_KEY=your_google_recaptcha_secret_key

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
```

### Bước 4: Khởi Tạo Cơ Sở Dữ Liệu MySQL
1. Mở phpMyAdmin / MySQL Workbench và tạo database: `CREATE DATABASE fan_plus;`
2. Import file schema DDL: `backend/database/schema.sql`.

### Bước 5: Chạy Server Backend Flask
```bash
python app.py
```
Server sẽ lắng nghe tại: `http://127.0.0.1:5000/`

---

## 📡 3. REST API ENDPOINTS SPECIFICATION

### 🗝️ Authentication API (`/api/auth`)

#### 1. Đăng ký tài khoản mới: `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "name": "Nguyen Van A",
    "email": "user@gmail.com",
    "password": "Password123@",
    "captcha_token": "..."
  }
  ```
- **Process:** Xác minh `captcha_token` với Google reCAPTCHA API trước khi tạo user.
- **Password Rules:** >= 8 ký tự, phải chứa chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
- **Errors:** 
  - `400 Bad Request`: Thiếu thông tin, CAPTCHA không hợp lệ (`{"message": "CAPTCHA không hợp lệ hoặc đã hết hạn"}`) hoặc mật khẩu không đủ độ phức tạp.
  - `409 Conflict`: Email đã tồn tại (`{"message": "Email đã tồn tại"}`).

#### 2. Đăng nhập: `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "user@gmail.com",
    "password": "Password123@",
    "captcha_token": "..."
  }
  ```
- **Process:** Xác minh `captcha_token` trước khi xác thực thông tin đăng nhập.
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "8f2a4d17-...",
    "user": {
      "id": 1,
      "name": "Nguyen Van A",
      "email": "user@gmail.com",
      "avatar": null,
      "role": "user",
      "status": "active"
    }
  }
  ```

#### 3. Làm mới Access Token: `POST /api/auth/refresh`
- **Request Body:** `{"refresh_token": "<token_str>"}`
- **Response (200 OK):** `{"access_token": "<new_token_str>"}`

#### 4. Đăng xuất: `POST /api/auth/logout`
- **Request Body:** `{"refresh_token": "<token_str>"}`
- **Action:** Đánh dấu `revoked_at` trong database cho Refresh Token.

#### 5. Lấy thông tin user hiện tại: `GET /api/auth/me`
- **Header:** `Authorization: Bearer <access_token>`

---

## 🔒 4. SECURITY CHECKLIST REVIEW (BAO GỒM CAPTCHA)

- [x] **CAPTCHA Verification**: CAPTCHA được kiểm tra ở Backend với Google API trước khi cho phép Register hoặc Login.
- [x] **No Account Creation on CAPTCHA Failure**: Thất bại CAPTCHA sẽ dừng luồng xử lý lập tức, không tạo user hay token.
- [x] **RECAPTCHA Secret Protection**: `RECAPTCHA_SECRET_KEY` được lưu trong `.env`, không xuất hiện trong Git, không bao giờ gửi xuống Frontend.
- [x] **No Token Logging**: Không bao giờ log `captcha_token` hay `RECAPTCHA_SECRET_KEY`.
- [x] **Password Hashing**: Mã hóa bằng `Werkzeug.security.generate_password_hash`. Không lưu plain password.
- [x] **JWT Secret Protection**: Quản lý bí mật qua file `.env`, không hard-code.
- [x] **Database Credentials**: Không hard-code tài khoản DB.
- [x] **Token Revocation**: Refresh Token được lưu trong DB hỗ trợ cơ chế Revoke (`revoked_at`).
- [x] **Token Lifespan**: Access Token thời gian ngắn (15 phút), Refresh Token thời gian dài (7 ngày).
- [x] **Protected API**: Bắt buộc có HTTP Header `Authorization: Bearer <access_token>`.
- [x] **Role Authorization**: Phân biệt rõ HTTP 401 (Chưa xác thực / Token invalid) và HTTP 403 (Không đủ quyền Admin).
- [x] **Context Security**: `user_id` trong Profile & Feedback được lấy trực tiếp từ JWT Context (`g.current_user.id`), không tin tưởng `user_id` từ Body client.
- [x] **Password Exclusion**: Mật khẩu và Hash không bao giờ bị trả về client.
- [x] **SQL Injection Prevention**: Sử dụng đối tượng ORM SQLAlchemy tự động parameterized query.
