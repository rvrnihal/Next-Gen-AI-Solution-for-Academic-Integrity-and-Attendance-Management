# Aegis AI: Next-Gen Academic Integrity & Attendance SaaS

Aegis AI is an enterprise-grade, production-ready SaaS platform that modernizes student attendance tracking and exam integrity monitoring. The solution brings together real-time computer vision malpractice analysis, dynamic rotating QR verification, GPS geofencing, and automated plagiarism auditing under a single unified, secure architecture.

---

## 1. System Architecture

```text
                                  +-----------------------+
                                  |    Next.js Web App    |
                                  | (Student/Faculty/Admin|
                                  +-----------+-----------+
                                              |
                                              v (HTTPS / REST)
+-----------------------+         +-----------+-----------+
|  Flutter Scanner App  |-------->|   Express API Backend |
| (Offline Cache Sync)  |         |      (TypeScript)     |
+-----------------------+         +-----+-----------+-----+
                                        |           |
                        (Prisma ORM)    v           v (HTTP / WebSockets)
                                  +-----+---+   +---+-------+
                                  | Postgres|   |  FastAPI  |
                                  | Database|   | AI Service| (YOLOv8)
                                  +---------+   +-----------+
```

### Components:
1. **Frontend (Next.js)**: A dark glassmorphism themed dashboard configured with dynamic views for Students, Faculty, HODs, and System Administrators.
2. **Backend (Express + TypeScript + Prisma)**: A robust REST API incorporating JWT authorization, Helmet security headers, rate-limiting, and PostgreSQL transaction models.
3. **AI Service (FastAPI + YOLOv8)**: An async Python backend running OpenCV and YOLOv8 models. Exposes endpoints for real-time malpractice streaming, TF-IDF semantic plagiarism check, and facial verification comparison.
4. **Mobile (Flutter)**: A scanning client utilizing camera plugins to mark attendance, supporting dynamic QR validations and offline database synchronization.

---

## 2. Technology Stack
- **Web App**: Next.js 15, React 19, TypeScript, Vanilla CSS Glassmorphism
- **API Server**: Express.js, TypeScript, Prisma ORM, PostgreSQL (Neon/Supabase), Redis
- **AI Backend**: FastAPI, Uvicorn, YOLOv8 (Ultralytics), OpenCV Headless, Scikit-learn
- **Mobile Client**: Flutter, Mobile Scanner, HTTP
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD

---

## 3. Quick Start Setup

### Prerequisites
- Node.js (v20+)
- Python (3.11+)
- Docker & Docker Compose (Optional)

### Running with Docker Compose (One-Click)
Initialize the database, cache, APIs, and AI models:
```bash
docker-compose up --build
```
- Web Portal: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`

### Running Locally (Manual Development)

#### 1. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

#### 2. Setup AI Service
```bash
cd ai-service
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 3. Setup Frontend Web App
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Key SaaS Capabilities
- **YOLOv8 Exam Monitoring**: Automatic cell phone detection and group-cheating alerts via WebSocket video feeds.
- **Geofence GPS Attendance**: Restricts student clock-ins to within a predefined distance (e.g., 50 meters) of the class coordinates using the Haversine formula.
- **Dynamic QR Generator**: Self-rotating session tokens in the faculty dashboard preventing student proxy attendance.
- **Offline Mode Sync**: Flutter app caches scans during network dropouts and automatically uploads them once connectivity is restored.
