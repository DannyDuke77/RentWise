# RentWise

RentWise is a full-stack, multi-tenant rental management platform for landlords and property managers in Kenya. It centralizes property, unit, tenant, and rent-payment management, with M-Pesa integration for automatic payment reconciliation and separate portals for landlords and tenants sharing a single account system.

## Overview

A landlord signs up, creates a business, and adds properties, units, and tenants. Tenants pay rent via M-Pesa and can track their own balance through a dedicated tenant portal. A single user account can hold both landlord access (through business membership) and tenant access (through a linked tenant profile) at the same time — for example, someone who manages their own rental business while also renting a unit elsewhere.

## Features

- **Multi-business support** — a user can belong to multiple businesses, each with its own properties, units, and tenants, isolated by business context (`X-Business-ID`).
- **Property & unit management** — track properties, units, floors, occupancy status (occupied / vacant / maintenance), and rent per unit.
- **Tenant management** — tenant profiles, roommates on a shared tenancy, tenancy history, and unit vacate/reassignment flows.
- **Rent accrual as a ledger, not a live calculation** — monthly rent is generated as an explicit charge record each billing period, rather than computed on the fly from the current date, so balances stay accurate and auditable.
- **Charges** — manual charges (damage, penalties, fees) alongside system-generated rent accrual, clearly distinguished so tenant-facing views only show what a landlord actually billed.
- **Negotiated first-month rent & billing grace periods** — a tenancy's billing start date can be set independently of its move-in date, with an optional negotiated amount for the first billing period.
- **Payments** — manual and M-Pesa (Lipa Na M-Pesa / STK Push) payment recording, refunds, and CSV export of the payment ledger.
- **Balance tracking** — per-tenancy running balance (arrears / credit / settled), kept in sync automatically whenever a charge or payment is created, edited, or removed.
- **Role-based access** — landlord roles (owner, manager, staff) via business membership, plus a separate tenant portal, both resolved from the same underlying user account.
- **Invitations** — separate, token-based invitation flows for landlord team members (business invitations) and tenants (tenant invitations), each identified explicitly by the invitation link rather than inferred from which site it's opened on.
- **Dashboards** — occupancy rates, rent collected vs. outstanding, overdue tenancies, and recent activity, per business and per property.
- **Audit-friendly corrections** — billing corrections (e.g. fixing an incorrect billing start date) void affected charges with a recorded reason instead of deleting history, with guardrails against accidentally voiding a large amount of already-paid history.

## Architecture

```
RentWise/
├── backend/rentwise/   # Django + Django REST Framework API
├── frontend/           # Next.js app (landlord portal, tenant portal, shared auth & marketing pages)
├── nginx/              # Reverse proxy / routing config
├── docker-compose.dev.yml
└── Makefile
```

### Backend

- **Django / Django REST Framework** — REST API serving all frontend portals from one backend.
- **PostgreSQL** — primary datastore.
- **Redis** — used for background/async workflows (e.g. Django signals, task scheduling).
- Core apps:
  - `accounts` — users, businesses, business memberships, and business invitations.
  - `properties` — properties, units, tenants, tenancies, charges, payments, and tenant invitations.
  - `payments` - mpesa configurations and mpesa transactions
- Signals keep derived state consistent automatically: creating, editing, or deleting a charge or payment recomputes the tenancy's balance; creating a tenancy generates its first rent charge; changing billing-relevant fields on a tenancy reconciles any charges that are now out of date.
- A scheduled job generates the next billing period's rent charge for every active tenancy, using the same logic the creation-time signal uses, so the two can never drift out of sync.

### Frontend

- **Next.js (App Router)** with a single codebase serving multiple logical portals by hostname/route:
  - **Landlord portal** — dashboard, properties, units, tenants, payments, charges, team & business settings.
  - **Tenant portal** — a tenant's own units, balance, and payment history.
  - A shared public surface for authentication, registration, and invitation acceptance — independent of either portal, since accepting an invitation is how a user *obtains* portal access in the first place, not something that requires it beforehand.
- **TanStack Query (React Query)** for data fetching, caching, and mutations.
- **Tailwind CSS** for styling.
- Session cookies are scoped to a shared parent domain so a single authenticated session works across the landlord portal, tenant portal, and public/auth pages without re-authenticating on each subdomain.

### Payments

- **M-Pesa (Lipa Na M-Pesa)** integration for tenants to pay rent directly by phone, with payments reconciled automatically against the correct tenancy.
- Manual payment recording for cash/bank transfers, with support for refunds against either rent credit or held deposits.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for local frontend tooling outside Docker, if needed)
- Python 3.12+ (for local backend tooling outside Docker, if needed)

See the `Makefile` for common shortcuts (migrations, shell access, etc.).

### Environment configuration

Both the backend and frontend expect environment-specific configuration (database credentials, JWT settings, M-Pesa API credentials, portal hostnames, and cookie domain settings for cross-subdomain sessions). Copy the relevant `.env` templates for each service before starting the stack.

## API

All endpoints are served under `/api/`. Key resource groups:

| Path | Description |
|---|---|
| `/api/auth/` | Authentication (login, token refresh) |
| `/api/business-invitations/` | Landlord/team invitation acceptance |
| `/api/tenants/` | Tenant records, tenant invitations, unit assignment |
| `/api/properties/` | Property CRUD and dashboards |
| `/api/units/` | Unit CRUD, rent-status filtering, per-unit payment ledger |
| `/api/payments/` | Payment recording, refunds, analytics, CSV export |

Requests scoped to a business include an `X-Business-ID` header identifying which business context the request applies to.

## Roadmap

- Automated rent reminders and notifications
- Deeper landlord-facing analytics
- Expanded mobile money integration

## Author

**Daniel Gitau**
GitHub: [github.com/DannyDuke77](https://github.com/DannyDuke77)
LinkedIn: [linkedin.com/in/daniel-g-76ab1b246](https://www.linkedin.com/in/daniel-g-76ab1b246)
