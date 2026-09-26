# 📘 Fan-Plus API Documentation

> **Base URL:** `http://localhost:5000` (hoặc `http://127.0.0.1:5000`)  
> **Headers mặc định:**
> - JSON request: `Content-Type: application/json`
> - Multipart request (có upload file): `Content-Type: multipart/form-data`
> - Đăng nhập / Xác thực: `Authorization: Bearer <access_token>`

---

## 📑 Danh mục API

1. [Authentication (`/api/auth`)](#1-authentication-apiauth)
2. [User Profile & Dashboard (`/api/users`)](#2-user-profile--dashboard-apiusers)
3. [User Feedback (`/api/feedback`)](#3-user-feedback-apifeedback)
4. [Admin Management (`/api/admin`)](#4-admin-management-apiadmin)
5. [Contents (`/contents`)](#5-contents-contents)
6. [Characters (`/characters`)](#6-characters-characters)
7. [Bookmarks (`/bookmarks`)](#7-bookmarks-bookmarks)
8. [Events (`/events`)](#8-events-events)
9. [Reviews (`/reviews`)](#9-reviews-reviews)

---

## 🔑 1. Authentication (`/api/auth`)

### 1.1 Đăng ký tài khoản (Register)
- **Endpoint:** `POST /api/auth/register`
- **Auth required:** Không
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "Password123@",
  "captcha_token": "PASSED_TEST_TOKEN"
}
```
- **Response (201 Created):**
```json
{
  "message": "Đăng ký tài khoản thành công",
  "user": {
    "id": 2,
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "role": "user",
    "status": "active"
  }
}
```

---

### 1.2 Đăng nhập (Login)
- **Endpoint:** `POST /api/auth/login`
- **Auth required:** Không
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123@",
  "captcha_token": "PASSED_TEST_TOKEN"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "<jwt_access_token>",
  "refresh_token": "<refresh_token_uuid>",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "role": "user"
  }
}
```

---

### 1.3 Cấp lại Access Token (Refresh Token)
- **Endpoint:** `POST /api/auth/refresh`
- **Auth required:** Không
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "refresh_token": "<refresh_token_uuid>"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "<new_jwt_access_token>"
}
```

---

### 1.4 Đăng xuất (Logout)
- **Endpoint:** `POST /api/auth/logout`
- **Auth required:** Không (Tuỳ chọn kèm refresh token)
- **Content-Type:** `application/json`
- **Body (Tùy chọn):**
```json
{
  "refresh_token": "<refresh_token_uuid>"
}
```
- **Response (200 OK):**
```json
{
  "message": "Đăng xuất thành công"
}
```

---

### 1.5 Quên mật khẩu (Forgot Password)
- **Endpoint:** `POST /api/auth/forgot-password`
- **Auth required:** Không
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "email": "user@example.com"
}
```
- **Response (200 OK):**
```json
{
  "message": "Đã tạo yêu cầu khôi phục mật khẩu thành công",
  "reset_token": "<reset_token>",
  "reset_link": "/reset-password?token=<reset_token>"
}
```

---

### 1.6 Đặt lại mật khẩu (Reset Password)
- **Endpoint:** `POST /api/auth/reset-password`
- **Auth required:** Không
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "reset_token": "<reset_token>",
  "new_password": "NewPassword123@"
}
```
- **Response (200 OK):**
```json
{
  "message": "Đặt lại mật khẩu mới thành công. Vui lòng đăng nhập lại"
}
```

---

### 1.7 Lấy thông tin tài khoản đăng nhập (Get Auth User Info)
- **Endpoint:** `GET /api/auth/me`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "user": {
    "id": 2,
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

## 👤 2. User Profile & Dashboard (`/api/users`)

### 2.1 Xem thông tin Profile cá nhân
- **Endpoint:** `GET /api/users/me`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "user": {
    "id": 2,
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.png",
    "favorite_fandoms": ["Anime", "Gaming"],
    "display_preferences": { "theme": "dark" }
  }
}
```

---

### 2.2 Cập nhật Profile cá nhân
- **Endpoint:** `PUT /api/users/me`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
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
- **Response (200 OK):**
```json
{
  "message": "Cập nhật hồ sơ cá nhân thành công",
  "user": {
    "id": 2,
    "name": "Nguyen Van A (Updated)",
    "favorite_fandoms": ["Anime", "Gaming", "Manga"],
    "display_preferences": { "theme": "dark", "font_size": "large" }
  }
}
```

---

### 2.3 Xem Dashboard cá nhân
- **Endpoint:** `GET /api/users/dashboard`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):** Trả về thông tin tổng quan dashboard cá nhân (chào mừng, fandoms, bookmarks gần đây, bài viết đóng góp).

---

## 💬 3. User Feedback (`/api/feedback`)

### 3.1 Gửi phản hồi / báo lỗi
- **Endpoint:** `POST /api/feedback`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "type": "bug",
  "content": "Gặp lỗi không tải được danh sách bài viết"
}
```
*(Loại `type` hỗ trợ: `bug`, `suggestion`, `query`)*

- **Response (201 Created):**
```json
{
  "message": "Gửi phản hồi thành công. Cảm ơn ý kiến của bạn!",
  "feedback": {
    "id": 1,
    "user_id": 2,
    "type": "bug",
    "content": "Gặp lỗi không tải được danh sách bài viết",
    "status": "pending"
  }
}
```

---

## 👑 4. Admin Management (`/api/admin`)

### 4.1 Xem thống kê hệ thống (Stats)
- **Endpoint:** `GET /api/admin/stats`
- **Auth required:** `Bearer <admin_access_token>` (Quyền Admin)
- **Response (200 OK):** Trả về tổng số users, contents, categories, bookmarks, characters, views và pending_feedback.

---

### 4.2 Xem danh sách phản hồi từ người dùng
- **Endpoint:** `GET /api/admin/feedback`
- **Auth required:** `Bearer <admin_access_token>` (Quyền Admin)
- **Query Parameters:**
  - `status` (String, tùy chọn): Lọc theo `pending`, `resolved`, hoặc `dismissed`.
- **Response (200 OK):**
```json
{
  "count": 1,
  "feedbacks": [
    {
      "id": 1,
      "user_id": 2,
      "type": "bug",
      "content": "Gặp lỗi không tải được danh sách bài viết",
      "status": "pending",
      "created_at": "2026-09-26T15:00:00"
    }
  ]
}
```

---

### 4.3 Cập nhật trạng thái xử lý phản hồi
- **Endpoint:** `PUT /api/admin/feedback/<feedback_id>`
- **Auth required:** `Bearer <admin_access_token>` (Quyền Admin)
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "status": "resolved"
}
```
*(Trạng thái hợp lệ: `pending`, `resolved`, `dismissed`)*

- **Response (200 OK):**
```json
{
  "message": "Cập nhật trạng thái phản hồi thành resolved thành công",
  "feedback": {
    "id": 1,
    "status": "resolved"
  }
}
```

---

## 📝 5. Contents (`/contents`)

### 5.1 Lấy danh sách bài viết / nội dung
- **Endpoint:** `GET /contents`
- **Auth required:** Không
- **Query Parameters:**
  - `category_id` (int, tùy chọn)
  - `title` (string, tùy chọn)
  - `content_type` (string, tùy chọn)
  - `skip` (int, mặc định `0`)
  - `limit` (int, mặc định `20`)
- **Response (200 OK):** Trả về object `{ "total": int, "items": [...] }` kèm thông tin reaction & nhân vật liên quan.

---

### 5.2 Xem chi tiết bài viết
- **Endpoint:** `GET /contents/<content_id>`
- **Auth required:** Không
- **Response (200 OK):** Trả về thông tin bài viết kèm danh sách `medias` và `characters`.

---

### 5.3 Tạo bài viết mới
- **Endpoint:** `POST /contents`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `category_id` (int)
  - `title` (string)
  - `body` (string)
  - `content_type` (string)
  - `media` (File array, tùy chọn)
- **Response (201 Created):** Trả về thông tin bài viết vừa tạo kèm danh sách `medias`.

---

### 5.4 Thêm Reaction (Like / Dislike / ...) vào bài viết
- **Endpoint:** `POST /contents/<content_id>/reactions`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "reaction_type": "LIKE"
}
```
- **Response (201 Created):** Trả về thông tin reaction vừa tạo.

---

### 5.5 Cập nhật bài viết
- **Endpoint:** `PATCH /contents/<content_id>`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "category_id": 1,
  "title": "Tiêu đề mới",
  "body": "Nội dung mới",
  "content_type": "ARTICLE",
  "status": "PUBLISHED"
}
```
- **Response (200 OK):** Trả về bài viết đã cập nhật.

---

### 5.6 Xóa bài viết
- **Endpoint:** `DELETE /contents/<content_id>`
- **Auth required:** `Bearer <admin_access_token>` (Quyền Admin)
- **Response (200 OK):**
```json
{
  "message": "Content deleted successfully"
}
```

---

## 🎭 6. Characters (`/characters`)

### 6.1 Lấy danh sách nhân vật
- **Endpoint:** `GET /characters`
- **Auth required:** Không
- **Query Parameters:**
  - `category_id` (int, tùy chọn)
  - `name` (string, tùy chọn)
  - `skip` (int, mặc định `0`)
  - `limit` (int, mặc định `20`)
- **Response (200 OK):** Danh sách mảng thông tin nhân vật.

---

### 6.2 Xem chi tiết nhân vật
- **Endpoint:** `GET /characters/<character_id>`
- **Auth required:** Không
- **Response (200 OK):** Trả về thông tin nhân vật.

---

### 6.3 Tạo nhân vật mới
- **Endpoint:** `POST /characters`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `name` (string)
  - `description` (string)
  - `category_id` (int)
  - `image` (File upload)
- **Response (201 Created):** Trả về thông tin nhân vật vừa tạo.

---

## 🔖 7. Bookmarks (`/bookmarks`)

### 7.1 Lấy danh sách Bookmark của người dùng
- **Endpoint:** `GET /bookmarks`
- **Auth required:** `Bearer <access_token>`
- **Query Parameters:**
  - `skip` (int, mặc định `0`)
  - `limit` (int, mặc định `20`)
- **Response (200 OK):** Danh sách bài viết người dùng đã lưu.

---

### 7.2 Kiểm tra bài viết đã được Bookmark chưa
- **Endpoint:** `GET /bookmarks/<content_id>`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "bookmarked": true,
  "bookmark": { ... }
}
```

---

### 7.3 Tạo Bookmark bài viết
- **Endpoint:** `POST /bookmarks`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "content_id": 10
}
```
- **Response (201 Created):** Trả về object bookmark.

---

### 7.4 Xóa Bookmark bài viết
- **Endpoint:** `DELETE /bookmarks/<content_id>`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "message": "Bookmark deleted successfully"
}
```

---

## 📅 8. Events (`/events`)

### 8.1 Lấy danh sách sự kiện
- **Endpoint:** `GET /events`
- **Auth required:** Không
- **Query Parameters:**
  - `city` (string, tùy chọn)
  - `start_time` (string ISO, tùy chọn)
  - `end_time` (string ISO, tùy chọn)
  - `skip` (int, mặc định `0`)
  - `limit` (int, mặc định `20`)
  - `sort_by` (string, mặc định `"start_time"`)
  - `sort_order` (string, mặc định `"asc"`)
- **Response (200 OK):** `{ "total": int, "items": [...] }`

---

### 8.2 Xem chi tiết sự kiện
- **Endpoint:** `GET /events/<event_id>`
- **Auth required:** Không
- **Response (200 OK):** Thông tin chi tiết sự kiện.

---

### 8.3 Tạo sự kiện mới
- **Endpoint:** `POST /events`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `category_id` (int)
  - `title` (string)
  - `body` (string)
  - `location_name` (string)
  - `city` (string)
  - `latitude` (float, tùy chọn)
  - `longitude` (float, tùy chọn)
  - `start_time` (ISO format string, ví dụ `2026-10-01T08:00:00`)
  - `end_time` (ISO format string, ví dụ `2026-10-01T17:00:00`)
  - `register_url` (string, tùy chọn)
  - `media` (File array, tùy chọn)
- **Response (201 Created):** Trả về chi tiết bài viết + sự kiện + medias.

---

### 8.4 Cập nhật sự kiện
- **Endpoint:** `PUT /events/<event_id>`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "location_name": "Nhà thi đấu Phú Thọ",
  "city": "TP.HCM",
  "latitude": 10.77,
  "longitude": 106.65,
  "start_time": "2026-10-01T08:00:00",
  "end_time": "2026-10-01T18:00:00",
  "register_url": "https://event.example.com"
}
```
- **Response (200 OK):** Thông tin sự kiện đã cập nhật.

---

### 8.5 Xóa sự kiện
- **Endpoint:** `DELETE /events/<event_id>`
- **Auth required:** `Bearer <admin_access_token>` (Quyền Admin)
- **Response (200 OK):**
```json
{
  "message": "Event deleted successfully"
}
```

---

## ⭐ 9. Reviews (`/reviews`)

### 9.1 Viết Đánh giá / Review bài viết
- **Endpoint:** `POST /reviews`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "content_id": 10,
  "rating": 5,
  "comment": "Bài viết rất hay và chi tiết!"
}
```
- **Response (201 Created):** Trả về thông tin đánh giá vừa tạo.

---

### 9.2 Xem chi tiết một Review
- **Endpoint:** `GET /reviews/<review_id>`
- **Auth required:** Không
- **Response (200 OK):** Thông tin chi tiết của review.

---

### 9.3 Lấy danh sách Review của bài viết
- **Endpoint:** `GET /reviews/content/<content_id>`
- **Auth required:** Không
- **Query Parameters:**
  - `skip` (int, mặc định `0`)
  - `limit` (int, mặc định `20`)
- **Response (200 OK):** Danh sách mảng review.

---

### 9.4 Cập nhật Review cá nhân
- **Endpoint:** `PATCH /reviews/<review_id>`
- **Auth required:** `Bearer <access_token>`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "rating": 4,
  "comment": "Nội dung đã được cập nhật nhận xét."
}
```
- **Response (200 OK):** Trả về review đã chỉnh sửa.

---

### 9.5 Xóa Review
- **Endpoint:** `DELETE /reviews/<review_id>`
- **Auth required:** `Bearer <access_token>`
- **Response (200 OK):**
```json
{
  "message": "Review deleted successfully"
}
```
