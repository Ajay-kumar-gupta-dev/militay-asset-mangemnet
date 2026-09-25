# Military Asset Management System (MAMS) — Initial Framework

A role-based platform for tracking asset purchases, inter-base transfers,
personnel assignments, and expenditures across multiple bases, with a full
audit trail.

This repo is a **working framework**, not a finished product: the core
domain model, RBAC, auditing, and one full vertical slice of each feature
are implemented end-to-end. It's meant to be extended, not rewritten.

```
military-asset-management/
├── backend/    Node.js / Express / PostgreSQL API
└── frontend/   React (Vite) SPA
```

---

## 1. Tech stack & justification

### Backend: Node.js + Express
- Single language across frontend and backend (JavaScript/React on both
  sides) — matches a MERN-style stack and keeps the team's cognitive
  overhead low.
- Express's middleware chain maps directly onto the two things this spec
  cares about most: **RBAC** and **audit logging**. Both are implemented
  as composable middleware (`middleware/rbac.js`, `middleware/auditLogger.js`)
  rather than being scattered through business logic — every route
  declares its own access rules and logging in one line.
- Mature ecosystem for the auth/security pieces needed here: `jsonwebtoken`,
  `bcryptjs`, `helmet`, `express-rate-limit`.

### Database: PostgreSQL (relational)
The spec explicitly calls for a relational choice, and the domain is a
strong fit for one:

- **The domain is inherently relational.** Every transaction (purchase,
  transfer, assignment, expenditure) references a base and an equipment
  type, and transfers reference *two* bases. Foreign keys are the natural
  way to guarantee a transfer can never point at a base or equipment type
  that doesn't exist — a NoSQL document store would push that integrity
  check into application code, and it would be easy to miss in a rushed
  future feature.
- **ACID transactions matter for accountability.** A transfer is really
  two things happening together (stock leaves base A, stock arrives at
  base B); if either wrote incompletely, the org's books would be wrong
  and unaccountable. Postgres transactions give an all-or-nothing
  guarantee for free.
- **Aggregation is the dashboard's whole job.** Opening/closing balance
  and net movement are `SUM()`s over date ranges, grouped by base and
  equipment type. SQL is purpose-built for this; recreating it in a
  NoSQL aggregation pipeline is more code for the same result.
- **JSONB where it earns its keep.** `audit_logs.request_body` is stored
  as JSONB rather than a rigid schema, since the shape of "what was in
  the request" legitimately varies by endpoint — Postgres lets us keep
  that flexible without giving up relational integrity everywhere else.

### ORM: Sequelize
Chosen over a raw query layer so the schema, validations (e.g. "a transfer's
`from_base_id` and `to_base_id` must differ"), and associations live in one
place as code, and so migrations are trackable. `sequelize.transaction()`
is used explicitly wherever a write must be atomic (see `transferController.js`).

### Frontend: React (Vite) + Tailwind CSS
- Vite over Create React App for fast local dev/HMR.
- Tailwind for the UI so the whole app shares one small design-token
  vocabulary (see `tailwind.config.js`) instead of a growing pile of
  bespoke CSS.
- No heavier state library (Redux/Zustand) yet — the app's state is
  mostly "server state fetched per page," which `useState`/`useEffect` +
  a small `axios` client handle cleanly at this scale. Worth revisiting
  if the app grows real client-side state (e.g. a multi-step transfer
  wizard).

---

## 2. Database design

### Core tables

| Table              | Purpose                                                              |
|---------------------|-----------------------------------------------------------------------|
| `users`             | Login + role (`admin` / `base_commander` / `logistics_officer`) + home base |
| `bases`             | Physical bases assets can be located at / moved between              |
| `equipment_types`   | Catalog of asset kinds (weapon / vehicle / ammunition) and their unit |
| `purchases`         | Append-only ledger: qty of an equipment type bought into a base       |
| `transfers`         | Append-only ledger: qty moved from one base to another                |
| `assignments`       | Qty of an equipment type handed to a named person (reversible: `status: active/returned`) |
| `expenditures`      | Qty of an equipment type permanently consumed/lost (irreversible)     |
| `audit_logs`        | Insert-only record of every write: who, what, when, from where        |

### Why assignments and expenditures are separate tables
An assignment is reversible — a rifle assigned to a soldier can be
returned to stock. An expenditure (ammunition fired, a vehicle
decommissioned) is not. Modeling them as one table with a "type" flag
would blur that distinction in every query that needs it; two tables
keep the reversible/irreversible split explicit in the schema itself.

### Balance calculation — no stored running totals
This is the most important design decision in the system, so it's worth
spelling out. **Nothing in the schema stores "current balance."** Every
balance figure is *derived* at query time from the ledger tables:

```
NetMovement(period)    = Purchases + TransferIn − TransferOut         (within the period)
ClosingBalance(period) = OpeningBalance(period) + NetMovement(period) − Assigned − Expended
OpeningBalance(period) = ClosingBalance evaluated over all activity
                          strictly before the period's start date
```

See `backend/src/controllers/dashboardController.js` for the exact
implementation. The alternative — maintaining a mutable `current_stock`
column and incrementing/decrementing it on every write — was rejected
because it creates two sources of truth that can silently drift apart
(a bug, a failed transaction, a manual DB edit) with no way to detect
or reconcile the drift. Deriving from the ledger means the numbers are
always *provably* consistent with the transaction history, and it's
also how "Opening Balance as of any date" becomes trivial to compute
retroactively — you couldn't get that from a running total at all.

The trade-off is read cost (aggregation queries instead of a single row
read). At the scale this system is likely to run at (bases × equipment
types × transactions is a small-to-medium number of rows), that's the
right trade — and if it ever isn't, a materialized view or a nightly
snapshot table can be added later without changing the ledger schema.

### Entity relationships (simplified)
```
Base ──< Purchase >── EquipmentType
Base ──< Transfer(from) , Transfer(to) >── EquipmentType
Base ──< Assignment >── EquipmentType
Base ──< Expenditure >── EquipmentType
User ──< Purchase / Transfer / Assignment / Expenditure   (who recorded it)
User ──< AuditLog                                          (who did it)
```

---

## 3. Role-based access control

| Role                | Dashboard | Purchases | Transfers | Assignments/Expenditures | Scope        |
|---------------------|-----------|-----------|-----------|---------------------------|--------------|
| `admin`              | Yes         | Read/write | Read/write | Read/write             | All bases    |
| `base_commander`     | Yes (own base) | Read/write (own base) | Read/write (own base) | Read/write (own base) | Own base only |
| `logistics_officer`  | Yes (own base) | Read/write (own base) | Read/write (own base) | No access               | Own base only |

Enforced by two layers of middleware (`backend/src/middleware/rbac.js`):

1. **`requireRole([...])`** — coarse gate: is this role even allowed to
   hit this route at all? (This is how `logistics_officer` is fully
   excluded from `/api/assignments` and `/api/expenditures`.)
2. **`scopeToBase`** — fine-grained: for anyone who isn't `admin`, every
   query is silently filtered to `req.user.base_id`, and any attempt to
   write a `base_id` / `from_base_id` in the request body that doesn't
   match the user's own base is rejected with `403`. Controllers use
   `req.scopedBaseId`, never `req.query.base_id` directly — so a
   compromised or careless frontend can't widen a user's access by
   forging a parameter.

Authentication is a stateless JWT (`Authorization: Bearer <token>`)
carrying `{ sub: userId, role, base_id }`, verified on every request in
`middleware/auth.js`.

---

## 4. API reference

All routes are prefixed `/api`. All except `/auth/login` and
`/health` require `Authorization: Bearer <token>`.

| Method | Endpoint                    | Roles                                   | Notes |
|--------|------------------------------|------------------------------------------|-------|
| POST   | `/auth/login`                | —                                        | Returns JWT + user profile |
| GET    | `/auth/me`                   | any authenticated                        | |
| GET    | `/dashboard/summary`         | admin, base_commander, logistics_officer | Query: `base_id`(admin only), `equipment_type_id`, `from_date`, `to_date` |
| GET    | `/dashboard/movement-detail` | admin, base_commander, logistics_officer | Powers the Net Movement pop-up |
| GET    | `/purchases`                 | all three                                | Filterable, paginated |
| POST   | `/purchases`                 | all three                                | Audit-logged |
| GET    | `/transfers`                 | all three                                | Filterable, paginated |
| POST   | `/transfers`                 | all three                                | Audit-logged, wrapped in a DB transaction |
| GET    | `/assignments`               | admin, base_commander                    | |
| POST   | `/assignments`               | admin, base_commander                    | Audit-logged |
| PATCH  | `/assignments/:id/return`    | admin, base_commander                    | Audit-logged |
| GET    | `/expenditures`              | admin, base_commander                    | |
| POST   | `/expenditures`              | admin, base_commander                    | Audit-logged |
| GET    | `/bases`                     | any authenticated                        | Admin sees all; others see only their own |
| POST   | `/bases`                     | admin                                    | |
| GET    | `/equipment-types`           | any authenticated                        | |
| POST   | `/equipment-types`           | admin                                    | |
| GET    | `/health`                    | —                                        | Liveness check |

---

## 5. Setup — running locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DB_NAME, DB_USER, DB_PASSWORD to match your Postgres setup,
# and set JWT_SECRET to a long random string

npm install

# create the database itself (one-time)
createdb mams          # or: psql -U postgres -c "CREATE DATABASE mams;"

npm run dev             # starts on http://localhost:5000, auto-creates tables in dev
```

In a second terminal, seed some demo data (one admin, one base commander,
one logistics officer, two bases, three equipment types):

```bash
cd backend
node src/utils/seed.js
```

Demo logins after seeding (all use password `ChangeMe123!`):
- `admin@mams.local` — admin, all bases
- `commander.north@mams.local` — base_commander, Northern Command Base
- `logistics.south@mams.local` — logistics_officer, Southern Garrison

### Frontend

```bash
cd frontend
cp .env.example .env    # defaults to http://localhost:5000/api, edit if needed
npm install
npm run dev              # starts on http://localhost:5173
```

Open `http://localhost:5173`, log in with one of the seeded accounts above.

### Production notes (not yet wired up, flagged for follow-up)
- Swap `sequelize.sync()` in `server.js` for real `sequelize-cli`
  migrations before deploying — `sync()` is a dev convenience only.
- Put `JWT_SECRET` and DB credentials in a real secrets manager, not `.env`.
- Add HTTPS termination (e.g. behind a load balancer) — the app itself
  doesn't terminate TLS.
- The `audit_logs` table will grow indefinitely; plan a retention/archival
  policy once volume is known.

---

## 6. What's deliberately left out of this framework

To keep this a reviewable "initial framework" rather than a sprawling
first draft, the following were scoped out — each is a natural next slice:

- Transfer **approval workflow** (the `status` enum on `Transfer` already
  has `pending`/`in_transit` values reserved for this).
- Per-asset **serial number tracking** for weapons/vehicles (currently
  quantity-based like ammunition; `equipment_types.is_serialized` flag
  is there as a hook for this).
- User management UI (creating/deactivating users is currently DB/seed-only).
- Charts on the dashboard (Recharts is already a frontend dependency for this).
- Automated tests.
