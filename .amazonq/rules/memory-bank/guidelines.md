# Development Guidelines

## Code Quality Standards

### Python (Backend)
- Use `loguru` logger consistently: `from loguru import logger` — never `print()` for runtime info
- All logging follows: `logger.info(...)`, `logger.warning(...)`, `logger.error(...)`
- Wrap every database operation and external call in `try/except`, log the error, return a safe fallback
- Use `with sqlite3.connect(DB_NAME) as conn:` (context manager) for all SQLite access — never manual close
- Set `conn.row_factory = sqlite3.Row` for dict-like row access, then convert with `dict(row)`
- Use parameterized queries exclusively (`?` placeholders) — never f-string SQL
- Bulk operations: prefer `cursor.executemany(...)` with fallback to single-row loop on failure
- Prefer `Optional[str]` and typed return annotations for service/DB functions
- Use `hashlib.sha256(password.encode()).hexdigest()` for password hashing (not bcrypt in legacy modules)

### TypeScript / React Native (Frontend)
- All components use functional style with React hooks
- Use explicit TypeScript interfaces/types for all props and data shapes (no `any` unless bridging dynamic data)
- Export types alongside components: `export type FilterState = {...}`
- Use `export const` for pure functions and data constants
- Use `export default function` for main screen/component exports
- Avoid inline anonymous functions in JSX where reuse is expected; extract named handlers instead

---

## Structural Conventions

### Backend File Organization
- `app/` — structured FastAPI app (routers, services, models, schemas, scrapers, tasks, utils)
- Root-level `*_scraper.py` files are legacy standalone scripts; prefer `app/scrapers/` for new scrapers
- `database.py` at root is the primary legacy data layer; new models go in `app/models/`
- Section headings in `main.py` use this pattern:
  ```python
  # ==========================================
  # SECTION NAME
  # ==========================================
  ```
- All API endpoints follow `{'success': True/False, 'data': ...}` response envelope
- HTTP error responses use `JSONResponse(status_code=..., content={'success': False, 'error': str(e)})`

### Frontend File Organization
- Expo Router file-based routing: each file in `app/` is a route
- Route groups: `(auth)/` for unauthenticated flows, `(tabs)/` for bottom-tab navigation
- Dynamic routes: `[id].tsx`, `[code].tsx`
- Shared components in `components/`, shared hooks in `hooks/`, utilities in `utils/`
- Context providers in `context/` — one file per context (Auth, Settings, Subscription, Notifications)
- Colors accessed via `useColors()` hook — never hard-coded hex values inside components (use theme colors)
- StyleSheet defined at bottom of file as `const ss = StyleSheet.create({...})` (short alias `ss`)

---

## Naming Conventions

### Python
- `snake_case` for all variables, functions, parameters, module names
- `UPPER_SNAKE_CASE` for module-level constants: `DB_NAME`, `MOCK_GOVT_JOBS`, `PRIORITY_STATES`
- Private helpers prefixed with `_`: `_normalize_text()`, `_job_bucket()`, `_check_admin()`
- Pydantic models: `PascalCase` suffixed with data context: `CompanyRegisterData`, `JobPositionUpdate`
- Database helper functions: verb + noun: `save_jobs()`, `get_all_companies()`, `delete_job_admin()`

### TypeScript
- `camelCase` for variables, functions, hooks (`useColors`, `filterCount`, `inferCountry`)
- `PascalCase` for interfaces, types, and components (`FilterState`, `SmartFilter`, `StateSearchPicker`)
- `UPPER_SNAKE_CASE` for static data arrays/maps: `COUNTRIES`, `MOCK_GOVT_JOBS`, `STATE_ALIASES`
- Hook files prefixed with `use`: `useColors.ts`, `useBackendJobs.ts`
- Type aliases exported alongside their consumers: `export type TranslationKey = keyof typeof TRANSLATIONS.English`

---

## API Patterns

### Backend REST Endpoints
All public endpoints use rate limiting via FastAPI `Depends`:
```python
@app.get("/api/jobs", dependencies=[Depends(api_rate_limiter.check_rate_limit)])
async def get_jobs_api(...):
```

Admin endpoints guard with cookie check:
```python
def _check_admin(request: Request):
    if request.cookies.get("master_access_granted") != MASTER_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

Company auth via multi-source helper (cookie OR header OR query param):
```python
def _get_company_id(request: Request) -> Optional[str]:
    return (
        request.cookies.get("company_id")
        or request.headers.get("X-Company-Id")
        or request.query_params.get("company_id")
    )
```

Redis cache pattern (read-through, write-through, TTL=300s):
```python
cache_key = f"jobs_feed:loc:{location}:..."
cached = redis_client.get_json(cache_key)
if cached:
    cached['cache_hit'] = True
    return cached
# ... fetch from DB ...
redis_client.set_json(cache_key, response_data, expire_seconds=300)
```

Cache invalidation on mutations:
```python
invalidate_jobs_cache()  # call after any write that affects job feed
```

### Background Tasks
Long operations run in daemon threads:
```python
threading.Thread(target=run_sweep, daemon=True).start()
return {'success': True, 'message': 'Started in background'}
```

### Server-Sent Events (SSE)
Live state streamed via async generator:
```python
@app.get("/api/live-stats")
async def live_stats_sse(request: Request):
    async def event_generator():
        while True:
            if await request.is_disconnected(): break
            yield f"data: {json.dumps(LIVE_STATE)}\n\n"
            await asyncio.sleep(2)
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

## Frontend Patterns

### Filter State Management
Filter state uses immutable spread-update pattern:
```typescript
const update = (patch: Partial<FilterState>) =>
  setLocal((prev) => ({ ...prev, ...patch }));
```

Local draft state is synced from parent when modal opens:
```typescript
useEffect(() => {
  if (visible) setLocal(value);
}, [visible, value]);
```

Apply fires both `onChange` and `onApply` then closes:
```typescript
const handleApply = () => {
  onChange(local);
  onApply(local);
  onClose();
};
```

### Localization
Translations live in a static `TRANSLATIONS` object keyed by language name:
```typescript
export const useTranslation = (lang: string) => {
  const t = (key: TranslationKey | string) => {
    const currentLang = (TRANSLATIONS as any)[lang] || TRANSLATIONS.English;
    return currentLang[key] || (TRANSLATIONS.English as any)[key] || key;
  };
  return { t };
};
```
- Supported languages: English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada
- Always fall back to English key, then to the raw key string — never throw

### Job Matching / Filtering Logic
Use regex matcher maps with inference functions for fuzzy matching:
```typescript
const JOB_TYPE_MATCHERS: Record<Exclude<FilterJobType, "all">, RegExp[]> = {
  "full-time": [/full[-\s]?time/i, /permanent/i],
  remote: [/remote/i, /wfh/i, /work from home/i],
  // ...
};

function inferJobType(job: FilterableJob): Exclude<FilterJobType, "all"> | null {
  const haystack = [job.jobType, job.title, ...].filter(Boolean).join(" ");
  for (const [jobType, matchers] of Object.entries(JOB_TYPE_MATCHERS)) {
    if (matchers.some((m) => m.test(haystack))) return jobType;
  }
  return null;
}
```

### Theming
All colors passed via `useColors()` hook — styles reference `colors.primary`, `colors.card`, `colors.border`, `colors.foreground`, `colors.mutedForeground`, `colors.muted`, `colors.success`, `colors.secondary`

Selected state visual pattern (border + light tinted background):
```typescript
style={[
  ss.optionRow,
  {
    borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? colors.primary + "12" : "transparent",
  },
]}
```

---

## Scraping Conventions

- Check `robots.txt` compliance before scraping: `check_robots_txt(domain)`
- Always set a realistic `User-Agent` header
- Apply rate limiting between requests: `apply_rate_limit(5, 15)`
- Limit scraped links per source (`[:5]`, `[:6]`) to avoid overloading
- Convert relative URLs to absolute before storing: `convert_to_absolute_url(href, base)`
- Government domains (`.gov.in`, `.nic.in`) auto-set `is_link_verified = 1`, `verification_source = 'official_domain'`
- Company-portal jobs get `priority += 800` and `is_link_verified = 1`
- Deduplication: collect all links into a `set()` before bulk insert; update existing records instead of duplicating

---

## Database Conventions

- `jobs` table is the central entity; all job types share this table differentiated by `job_class` field
- `job_class` values: `'government'`, `'private'`, `'internship'`, `'freelance'`, `'remote'`
- `link` column has a `UNIQUE` constraint — use `INSERT OR IGNORE` or catch `IntegrityError` for duplicates
- `status` field: `'active'` | `'inactive'` — filter with `WHERE (status = 'active' OR status IS NULL OR status = '')`
- `priority` integer (higher = more prominent); company portal jobs get `+800` boost
- `display_order` integer for pinned positions; `NULL` = unpinned
- Schema migrations done via `ALTER TABLE ... ADD COLUMN` checks in `init_db()` (not Alembic for the legacy DB)
- Always create indexes for frequently-queried columns: `organization`, `location`, `state`, `job_class`, `priority`, `link_status`

---

## Security Notes

- Admin access protected by `MASTER_KEY` cookie (`"JOB_INDIA_OWNER_77"`) — treat this as a secret
- Rate limiting applied on all public API and auth endpoints via `api_rate_limiter` / `auth_rate_limiter`
- CORS configured as `allow_origins=["*"]` currently — restrict in production
- Passwords hashed with SHA-256 (legacy); new code should use bcrypt via `passlib`
- JWT tokens managed in `app/core/security.py`
