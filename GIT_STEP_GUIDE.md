# 📖 HƯỚNG DẪN COMMIT VÀ UPLOAD CODE LÊN GIT THEO TỪNG STEP

Tài liệu này hướng dẫn cách thực hiện `git add` và `git commit` từng bước (Step-by-Step) chuẩn quy trình phát triển ứng dụng chuyên nghiệp.

---

## 📌 BẢNG TỔNG HỢP CÁC BƯỚC COMMIT (COMMITS SUMMARY)

| Commit Step | Tên Commit (Message) | Các File Bao Gồm |
| :--- | :--- | :--- |
| **STEP 1** | `feat(step1): setup backend environment configuration and requirements` | `.gitignore`, `backend/requirements.txt`, `backend/.env.example`, `backend/config.py` |
| **STEP 2-4** | `feat(step2-4): add mysql schema and user, refresh_token, feedback models` | `backend/database/schema.sql`, `backend/models/user.py`, `backend/models/refresh_token.py`, `backend/models/feedback.py`, `backend/models/__init__.py` |
| **STEP 3-7** | `feat(step3-7): implement password hashing, jwt utilities, and auth middleware` | `backend/utils/password_utils.py`, `backend/utils/jwt_utils.py`, `backend/utils/__init__.py`, `backend/middleware/auth_middleware.py`, `backend/middleware/__init__.py` |
| **STEP 5-9** | `feat(step5-9): implement auth routes (register, login, refresh, logout, me)` | `backend/routes/auth_routes.py`, `backend/seed.py` |
| **STEP 10-11**| `feat(step10-11): implement user profile and feedback routes` | `backend/routes/user_routes.py`, `backend/routes/feedback_routes.py`, `backend/routes/__init__.py` |
| **STEP 12** | `test(step12): add pytest automated test suite for auth, user, and feedback` | `backend/tests/test_auth.py`, `backend/tests/test_user.py`, `backend/tests/test_feedback.py`, `backend/tests/__init__.py` |
| **STEP 13-14**| `docs(step13-14): update README, security checklist, and step-by-step git guide` | `README.md`, `backend/README.md`, `GIT_STEP_GUIDE.md` |
| **STEP 24** | `feat(step24): add RECAPTCHA_SECRET_KEY environment configuration` | `backend/.env.example`, `backend/config.py` |
| **STEP 27** | `feat(step27): add google recaptcha verification utility service` | `backend/utils/recaptcha_utils.py` |
| **STEP 25-26**| `feat(step25-26): implement recaptcha verification on register and login endpoints` | `backend/routes/auth_routes.py`, `backend/tests/` |
| **STEP 28-29**| `docs(step28-29): update recaptcha security checklist and step guide` | `README.md`, `GIT_STEP_GUIDE.md` |

---

## 💻 CÁC LỆNH GIT CHI TIẾT THEO TỪNG STEP

### 🔹 BƯỚC 1: Commit Cấu Hình Môi Trường & Thư Viện (STEP 1)
```bash
git add .gitignore backend/requirements.txt backend/.env.example backend/config.py
git commit -m "feat(step1): setup backend environment configuration and requirements"
```

### 🔹 BƯỚC 2: Commit Schema CSDL MySQL & Base Models (STEP 2 - STEP 4)
```bash
git add backend/database/schema.sql backend/models/user.py backend/models/refresh_token.py backend/models/feedback.py backend/models/__init__.py
git commit -m "feat(step2-4): add mysql schema and user, refresh_token, feedback models"
```

### 🔹 BƯỚC 3: Commit Password Hashing, JWT Utils & Auth Middleware (STEP 3 & STEP 7)
```bash
git add backend/utils/ backend/middleware/
git commit -m "feat(step3-7): implement password hashing, jwt utilities, and auth middleware"
```

### 🔹 BƯỚC 4: Commit Chức Năng Đăng Ký, Đăng Nhập, Refresh Token, Logout & Me (STEP 5 - STEP 9)
```bash
git add backend/routes/auth_routes.py backend/seed.py
git commit -m "feat(step5-9): implement auth routes (register, login, refresh, logout, me)"
```

### 🔹 BƯỚC 5: Commit User Profile & Feedback APIs (STEP 10 & STEP 11)
```bash
git add backend/routes/user_routes.py backend/routes/feedback_routes.py backend/routes/__init__.py
git commit -m "feat(step10-11): implement user profile and feedback routes"
```

### 🔹 BƯỚC 6: Commit Bộ Unit Tests Tự Động Pytest (STEP 12)
```bash
git add backend/tests/
git commit -m "test(step12): add pytest automated test suite for auth, user, and feedback"
```

### 🔹 BƯỚC 7: Commit Google reCAPTCHA Configuration & Verification (STEP 24 - STEP 27)
```bash
git add backend/.env.example backend/config.py backend/utils/recaptcha_utils.py backend/routes/auth_routes.py backend/tests/
git commit -m "feat(step25-27): implement google recaptcha v2 server-to-server verification"
```

### 🔹 BƯỚC 8: Commit Tài Liệu Hướng Dẫn & Security Checklist (STEP 28 & STEP 29)
```bash
git add README.md GIT_STEP_GUIDE.md
git commit -m "docs(step28-29): update recaptcha security checklist and step guide"
```

---

## 🚀 ĐẨY TOÀN BỘ CÁC COMMITS LÊN GITHUB SERVER

```bash
# Đẩy nhánh captcha cá nhân lên remote
git push origin tuan/feature-captcha
```
