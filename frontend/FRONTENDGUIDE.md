# Fan Hub Plus Frontend Architecture & Usage Guide 🚀

## 🚀 How to Run the Frontend

### 1. Prerequisites

* **Node.js:** v22.12.0 or newer
* **Flask Backend:** Optional, but recommended

  * Backend URL: `http://127.0.0.1:5000`

### 2. Available Run Commands

Run the following commands from the frontend directory:

```text
projectHubPlus2/Fan-Plus/frontend
```

#### Install Dependencies

If this is the first time running the frontend, install the required packages:

```bash
npm install
```

#### Run in Development Mode

Start the Vite development server:

```bash
npm run dev
```

The development server will normally run at:

```text
http://127.0.0.1:4173
```

or another port if configured in Vite.

The development server proxies `/api` requests directly to the Flask backend:

```text
Frontend
http://127.0.0.1:4173
        │
        │ /api/*
        ▼
Flask Backend
http://127.0.0.1:5000
```

#### Build for Production

Create a production build:

```bash
npm run build
```

#### Preview the Production Build

Preview the generated production build locally:

```bash
npm run preview
```

---

# 🗂️ Project & Folder Map

```text
frontend/
│
├── public/
│   ├── runtime.js
│   └── ...                    # Static assets
│
├── src/
│   ├── App.tsx                # Main application root,
│   │                          # Suspense & route dispatcher
│   │
│   ├── main.tsx               # React DOM entry point
│   │                          # & context providers
│   │
│   ├── styles.css             # Global design system,
│   │                          # tokens, animations & utilities
│   │
│   ├── components/            # Reusable shared UI & layout
│   │   ├── Layout.tsx         # Global header, navigation,
│   │   │                       # footer & search overlay
│   │   └── ui.tsx             # Reusable UI primitives
│   │                           # Button, Modal, Card, Badge, etc.
│   │
│   ├── pages/                 # Main top-level page views
│   │   ├── Home.tsx           # Discovery & featured landing page
│   │   ├── Explore.tsx        # Catalog grid & search/filter page
│   │   ├── Detail.tsx         # Content detail view
│   │   ├── Events.tsx         # Fan events & map view
│   │   ├── Account.tsx        # User workspace, collection
│   │   │                       # & submissions
│   │   ├── Admin.tsx          # Editorial & admin panel
│   │   └── Auth.tsx           # Login, register & verification
│   │
│   ├── features/              # Feature-specific business logic & UI
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ...            # Authentication API/client
│   │   │
│   │   ├── catalog/
│   │   │   └── api.ts         # Catalog API, data sources & filters
│   │   │
│   │   ├── bookmarks/
│   │   │   └── BookmarksProvider.tsx
│   │   │                       # Reading list state
│   │   │
│   │   ├── admin/             # Admin data services & API endpoints
│   │   │
│   │   ├── Lore.tsx           # AI Lore Master & knowledge base view
│   │   │
│   │   └── Giveaways.tsx      # Quarterly fan giveaways
```
