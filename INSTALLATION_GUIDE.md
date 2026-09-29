# Installation Guide for Fan-Plus Project

This guide provides step-by-step instructions for cloning the repository using Git and installing all required dependencies for both the **Backend** and **Frontend**.

---

## Prerequisites

Make sure you have the following installed on your machine:
- **Git**
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js** (v22.12.0 or higher recommended) & **npm**

---

## 1. Cloning the Repository via Git

Open your terminal or command prompt and clone the repository:

```bash
git clone <REPOSITORY_URL>
cd Fan-Plus
```

---

## 2. Backend Setup & Dependency Installation

The Python backend uses dependencies defined in `backend/requirements.txt`.

### Step 1: Navigate to the Backend folder
```bash
cd backend
```

### Step 2: Create and Activate a Virtual Environment (Recommended)

- **On Windows (PowerShell / CMD):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```

- **On macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 3: Install Required Python Packages
```bash
pip install -r requirements.txt
```

#### Installed Backend Packages:
- `Flask==3.0.3` (Web Framework)
- `Flask-SQLAlchemy==3.1.1` (ORM for Database management)
- `Flask-JWT-Extended==4.6.0` (JWT Authentication)
- `Flask-Cors==4.0.0` (Cross-Origin Resource Sharing)
- `PyJWT==2.8.0` (JSON Web Token implementation)
- `PyMySQL==1.1.0` (MySQL Database Connector)
- `python-dotenv==1.0.1` (Environment variables management)
- `requests==2.31.0` (HTTP client library)
- `pytest==8.1.1` (Testing framework)
- `werkzeug==3.0.1` (WSGI web application library)
- `pydantic>=2.0.0` (Data validation)
- `Flask-Migrate==4.0.7` (Database migrations)

### Step 4: Run Backend Server
```bash
python app.py
```

---

## 3. Frontend Setup & Dependency Installation

The React / Vite frontend dependencies are managed via Node.js (`package.json` / `requirements.txt`).

### Step 1: Navigate to the Frontend folder
```bash
cd ../frontend
```

### Step 2: Install Node.js Packages
Run either of the following commands:
```bash
npm install
```

### Step 3: Run Frontend Development Server
```bash
npm run dev
```

---

## Summary Directory Structure

```
Fan-Plus/
├── README.md
├── INSTALLATION_GUIDE.md   <-- (This Guide)
├── backend/
│   ├── app.py
│   └── requirements.txt    <-- Python requirements
└── frontend/
    ├── package.json
    ├── requirements.txt    <-- Frontend requirements specification
    └── src/
```
