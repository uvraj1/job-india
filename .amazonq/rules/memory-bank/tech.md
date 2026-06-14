# Technology Stack

## Backend

### Language & Runtime
- Python 3.x

### Framework & API
- FastAPI — async REST API framework
- Uvicorn — ASGI server (`uvicorn app.main:app --reload`)
- Pydantic v2 — data validation and settings management (`pydantic[email]`, `pydantic-settings`)

### Database
- SQLAlchemy — ORM
- Alembic — migrations
- SQLite (dev: `jobs.db`) / PostgreSQL (production via Docker)

### Caching & Task Queue
- Redis — caching and Celery message broker
- Celery — background job scheduler for scraping tasks

### Scraping
- BeautifulSoup4 — HTML parsing
- Requests — HTTP client
- Playwright (referenced in README) — headless browser for JS-heavy pages

### Security
- python-jose[cryptography] — JWT tokens
- passlib[bcrypt] — password hashing
- python-multipart — form/file uploads

### Utilities
- loguru — structured logging
- python-dotenv — env var loading
- schedule — simple in-process scheduling (legacy scrapers)

### Infrastructure
- Docker + docker-compose
- Vercel (vercel.json present for potential serverless deployment)

### Key Backend Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A app.tasks.celery_app beat --loglevel=info

# Init DB
python scripts/init_db.py

# Run scraper manually
python scripts/run_scraper.py
```

---

## Frontend

### Language & Runtime
- TypeScript 5.9.x
- Node.js (pnpm workspace)

### Framework
- React 19.1.0
- React Native 0.81.5
- Expo SDK 54 — managed workflow
- Expo Router 6 — file-based navigation

### State Management
- React Context API (Auth, Settings, Subscription, Notifications)
- TanStack React Query 5 — server state / data fetching

### Backend Integration
- Firebase 11 (Firestore, Auth, push notifications)
- Custom REST API client (`utils/robustApiClient.ts`, `utils/authApi.ts`)

### UI & Styling
- React Native core components + StyleSheet
- Expo Linear Gradient
- Expo Blur
- @expo/vector-icons
- React Native Reanimated 4 — animations
- React Native Gesture Handler 2

### Utilities
- Zod 3 — runtime schema validation
- AsyncStorage — local persistence
- expo-location — geolocation
- expo-image-picker / expo-document-picker — file handling
- expo-updates — OTA updates

### Build & Package Management
- pnpm 9+ (workspace with `pnpm-workspace.yaml`)
- EAS Build (`eas.json`) — cloud builds for Android/iOS
- Babel + Metro bundler

### Key Frontend Commands
```bash
# Install dependencies (from workspace root)
pnpm install

# Start Expo dev server
pnpm --filter @workspace/mobile start

# Web dev server
pnpm --filter @workspace/mobile dev      # port 18115

# Android
pnpm --filter @workspace/mobile android

# iOS
pnpm --filter @workspace/mobile ios

# Type check
pnpm typecheck

# Build
pnpm build
```

---

## Environment Variables

### Backend (`.env`)
- `DATABASE_URL` — PostgreSQL/SQLite connection string
- `SECRET_KEY` — JWT signing key
- `REDIS_URL` — Redis connection
- `CELERY_BROKER_URL`

### Frontend (`.env`)
- Firebase config keys
- API base URL
