# Product Overview

## Project Purpose
Job India is a full-stack job aggregation platform targeting Indian job seekers. It automatically scrapes, aggregates, and presents government and private sector job listings through a mobile app, reducing the effort of manually checking multiple portals.

## Value Proposition
- Single platform for government (central/state), corporate, freelance, and internship jobs in India
- Automated scraping pipeline eliminates manual job discovery
- Localization support for Indian regional languages
- Premium tier with AI-powered career tools (resume analyzer, mock interview, HR chat, salary insights)

## Key Features

### Job Aggregation
- Automated scraping of 12+ Tripura state government portals (TPSC, TRBT, JRBT, Tripura Police, etc.)
- Corporate, freelance, and internship job scrapers
- Smart deduplication to avoid redundant listings
- Real-time updates via Celery task scheduler

### Mobile App (React Native / Expo)
- Browse, search, and filter jobs by category, location, and type
- Smart filter component with advanced filtering UI
- Save jobs and track applications
- Push notifications for new job alerts
- Company profiles and suggestions

### Authentication & User Management
- JWT-based authentication (register, login, token refresh)
- User profiles with photo upload and preferences
- Job preferences and notification settings

### Premium Subscription
- Resume analyzer
- AI mock interview
- HR chat assistant
- Salary insights
- Subscription management and checkout flow

### Admin & Backend
- FastAPI REST API with versioned endpoints (`/api/v1/`)
- Admin dashboard (HTML templates)
- Celery-based background scraping tasks
- Redis caching for performance
- Alembic database migrations

## Target Users
- Indian job seekers (government and private sector)
- Students and fresh graduates looking for internships
- Freelancers seeking short-term contracts
- Premium users wanting career development tools

## Use Cases
1. Daily job discovery across multiple portals from one app
2. Filtering jobs by state, department, or job type
3. Receiving instant notifications when new jobs are posted
4. Using AI tools to prepare for interviews and optimize resumes
5. Companies registering to post jobs directly via company portal
