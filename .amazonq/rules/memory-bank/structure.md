# Project Structure

## Repository Layout

```
App job portal/
├── backend/                        # Python FastAPI backend
│   ├── app/                        # Main application package
│   │   ├── api/v1/                 # Versioned REST API endpoints
│   │   ├── core/                   # Config, DB session, security
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── scrapers/               # Modular web scrapers
│   │   │   └── tripura/            # Tripura state portal scrapers
│   │   ├── services/               # Business logic layer
│   │   ├── tasks/                  # Celery async tasks
│   │   └── utils/                  # Rate limiter, Redis client
│   ├── alembic/                    # Database migration scripts
│   ├── scripts/                    # DB init and scraper run scripts
│   ├── templates/                  # Jinja2 HTML admin templates
│   ├── *_scraper.py                # Legacy standalone scrapers
│   ├── database.py                 # Legacy DB module
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/
    └── Job-india-App/              # pnpm workspace root
        ├── artifacts/mobile/       # Expo React Native app
        │   ├── app/                # Expo Router file-based routing
        │   │   ├── (auth)/         # Auth screens (login, register)
        │   │   ├── (tabs)/         # Bottom tab screens
        │   │   ├── job/[id].tsx    # Dynamic job detail screen
        │   │   ├── career/[code].tsx
        │   │   ├── premium/        # Premium feature screens
        │   │   └── settings/       # Settings screens
        │   ├── components/         # Reusable UI components
        │   ├── constants/          # Theme colors
        │   ├── context/            # React context providers
        │   ├── hooks/              # Custom hooks
        │   ├── utils/              # API clients, Firebase, localization
        │   ├── assets/             # Images and static assets
        │   ├── android/            # Android native project
        │   └── server/             # Simple Node.js web server
        ├── package.json            # Workspace root
        └── pnpm-workspace.yaml
```

## Core Components and Relationships

### Backend Layers
- `app/core/config.py` → central settings via Pydantic `BaseSettings`
- `app/core/database.py` → SQLAlchemy session factory
- `app/core/security.py` → JWT creation and password hashing
- `app/models/` → ORM models: User, Job, Department, State
- `app/schemas/` → Pydantic schemas mirror models for API I/O
- `app/api/v1/` → FastAPI routers consume services
- `app/services/` → Business logic (job_service, link_validator)
- `app/scrapers/` → BaseScraper → concrete scrapers → ScraperFactory
- `app/tasks/` → Celery app + scraping_tasks that call scrapers
- `app/utils/` → Redis client and rate limiter shared across layers

### Frontend Layers
- `app/_layout.tsx` → Root layout wrapping all providers
- `context/` → AuthContext, SettingsContext, SubscriptionContext, NotificationContext
- `app/(tabs)/` → Main tab navigation (index, saved, applications, profile, premium)
- `components/` → JobCard, SmartFilter, PremiumBanner, CompanySuggestions, ErrorBoundary
- `hooks/` → useBackendJobs, useFirebaseJobs, useAggregatorJobs, usePushNotifications
- `utils/` → apiConfig, authApi, firebase, localization, robustApiClient, paymentService

## Architectural Patterns

### Backend
- Layered architecture: Router → Service → Model/Scraper
- Factory pattern for scrapers (`ScraperFactory`)
- Abstract base class for scrapers (`BaseScraper`)
- Async task queue via Celery + Redis broker
- Database migrations via Alembic
- Environment-based config via `.env` + Pydantic Settings

### Frontend
- File-based routing via Expo Router (Next.js-style)
- Context API for global state (auth, settings, subscription)
- Custom hooks abstract data fetching per source (backend, Firebase, aggregator)
- Multi-source job data: Firebase Firestore + backend REST API + aggregator
- Dual navigation groups: `(auth)` and `(tabs)` route groups
