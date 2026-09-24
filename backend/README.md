# FAN HUB PLUS - BACKEND REST API SYSTEM

## Fast Setup Guide

1. **Install dependencies:**
   ```bash
   pip install flask flask-sqlalchemy flask-cors flask-jwt-extended pymysql cryptography python-dotenv
   ```

2. **Database Setup:**
   - Execute `schema.sql` and `seed.sql` on your MySQL server.
   - Configure `.env` with your DB credentials.

3. **Run Backend API Server:**
   ```bash
   python app.py
   ```

4. **Verify Health Endpoint:**
   `GET http://127.0.0.1:5000/api/health`
