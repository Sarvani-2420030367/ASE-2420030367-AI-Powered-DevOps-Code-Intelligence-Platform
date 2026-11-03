# DevSight AI — AI-Powered DevOps & Code Intelligence Platform

> Enterprise-grade developer productivity and DevOps intelligence platform. Analyze source code, detect security vulnerabilities, calculate transparent health scores, interact with a context-aware AI assistant, and automatically generate production-ready Docker, CI/CD, and Kubernetes manifests.

---

## 🚀 Overview

**DevSight AI** bridges the gap between software development and continuous cloud delivery. By connecting or uploading software repositories, DevSight automatically parses codebase architecture, checks for code smells and critical security risks, provides an AI pair programmer citing exact source lines, and generates zero-touch deployment artifacts.

### Key Capabilities
- **Modular Static Analysis Engine**: AST parsing and concrete static security rules for **Python**, **JavaScript**, **TypeScript**, **Java**, **C/C++**, and **Go**.
- **Security & Secret Detection**: Proactively detects exposed AWS keys, Stripe tokens, private keys, plain passwords, and SQL injection strings.
- **Transparent Health Scoring**: Evaluates codebases using a deterministic 4-pillar formula (40% Quality, 30% Security, 20% Maintainability, 10% Architecture) with deduction-based penalties.
- **8-Pillar DevOps Readiness Radar**: Interactive Recharts radar scoring testing coverage, containerization, CI/CD, documentation, observability, and Kubernetes maturity.
- **AI Codebase Assistant & Architecture Insights**: Context-aware LLM reasoning with dual-mode support (OpenAI API + deterministic offline AST fallback) citing exact file lines.
- **Automated Manifest Generators**:
  - **Docker Generator**: Multi-stage Dockerfile, `docker-compose.yml`, and `.dockerignore`.
  - **CI/CD Pipelines**: Enterprise GitHub Actions (`.github/workflows/ci.yml`) and GitLab CI (`.gitlab-ci.yml`).
  - **Kubernetes**: Production `deployment.yaml`, `service.yaml`, `configmap.yaml`, `secret.yaml`, and `ingress.yaml`.
- **Interactive Codebase Explorer**: Nested directory tree with syntax-highlighted code viewing and inline issue gutters.
- **One-Click Demo Mode**: Pre-loaded multi-tier microservice with deliberate vulnerabilities for instant offline demonstration.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Lucide React, Axios |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyMySQL, PyJWT, Bcrypt |
| **Database** | MySQL 8.0 with automatic resilient fallback to embedded SQLite (`devsight.db`) |
| **Analysis** | Python AST, Regular Expressions, Dependency Manifest Parsers |
| **AI Layer** | OpenAI GPT-4o-mini + Context-Aware Deterministic Fallback Engine |
| **DevOps** | Docker, Docker Compose, Nginx, Kubernetes, GitHub Actions |

---

## 📁 Repository Structure

```
devsight-ai/
├── frontend/                     # React + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/           # Reusable UI components (ScoreGauge, StatCard, FileTree, etc.)
│   │   ├── pages/                # Dashboard, Explorer, Quality, Security, AI, Generators
│   │   ├── services/             # Axios API client with JWT interceptor
│   │   └── types/                # TypeScript data interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                      # FastAPI Microservice Engine
│   ├── app/
│   │   ├── main.py               # Application entrypoint & CORS middleware
│   │   ├── config.py             # App settings & environment resolution
│   │   ├── database.py           # Resilient SQLAlchemy engine (MySQL + SQLite fallback)
│   │   ├── models/               # User, Project, Repository, Analysis, Finding, Artifact, Chat
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # Auth, Projects, Repository, Analysis, AI, Deployment
│   │   ├── services/             # ScoringService, DemoService
│   │   ├── analyzers/            # Modular analyzers (Python, JS, TS, Java, C++, Go, Security)
│   │   ├── ai/                   # LLMService (OpenAI + Context-Aware Fallback Engine)
│   │   └── utils/                # Password hashing, JWT, ZipSlip protection
│   ├── demo_repo/                # Packaged microservice for instant Demo Mode
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── generated/                    # Upload archives, extracted repos, and SQLite database
├── docker-compose.yml            # Multi-service container orchestration (frontend, backend, mysql)
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js** >= 18.x
- **Python** >= 3.10
- **MySQL** (optional; automatically falls back to SQLite if unavailable)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
> The backend will be live at `http://127.0.0.1:8000`. Swagger API docs are accessible at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
> The dashboard will be live at `http://localhost:5173`.

---

## 🐳 Docker Setup

Run the entire platform (Frontend + Backend + MySQL) with a single command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- MySQL: `localhost:3306`

---

## 🧪 Demo Mode Walkthrough

1. Navigate to `http://localhost:5173`.
2. Click **"View Demo"** or **"Load Demo Project"** on the top navigation bar.
3. The platform instantly analyzes the bundled multi-tier repository and routes to the **Dashboard**:
   - Inspect the **Code Health Score** (e.g. 66/100) and **DevOps Readiness Radar**.
   - Navigate to **Codebase Explorer**: click `app.py` to inspect the inline finding on **Line 24** (`Potential hardcoded secret`).
   - Click **"Explain Issue"** to open the **AI Assistant** with pre-filled context.
   - Navigate to **Deployment Generator** to review auto-generated Dockerfile and docker-compose configurations.
   - Navigate to **CI/CD** and **Kubernetes** to generate production manifests.

---

## 🛡 Security Highlights
- **Safe ZIP Extraction**: Defends against ZipSlip attacks by strictly validating that all uncompressed targets reside within the project root.
- **Rate & Size Limits**: 50MB uploaded ZIP limit and 200MB uncompressed ceiling to prevent ZIP bombs.
- **Credential Storage**: Passwords hashed using bcrypt with salt rounds; stateless JWT tokens signed with HS256.

---

## 📄 License
MIT License. Built for engineering teams, portfolio showcases, and cloud DevOps modernization.
