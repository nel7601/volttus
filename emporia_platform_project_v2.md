
# Emporia Vue Multi-Tenant Energy Monitoring Platform
## Technical Project Description and Implementation Blueprint
### Version 2.0 – Architecture for Development Team

---

## 1. Purpose of This Document

This document defines the target architecture, functional structure, data model, user roles, grouping logic, ingestion flow, and implementation scope for a cloud-based energy monitoring platform built around the **Emporia Vue 16-channel device**.

The purpose of this document is to give the development team a **clear and detailed reference** for building the first production-ready version of the system.

This version of the architecture assumes the following:

- The project will start with **Emporia Vue** hardware
- The solution will **not use Raspberry Pi or any other local gateway**
- The Emporia device will continue sending data to the **Emporia cloud**
- The platform will retrieve data from the cloud using **PyEmVue**
- The product frontend/backend application layer will be deployed on **Vercel**
- The platform must support **landlords, tenants, and system administrators**
- The platform must support **channel grouping and apartment-based access control**

---

# 2. Business Goal

The system is intended to monitor electrical consumption in a residential building where all monitored circuits are physically connected to breakers inside the electrical panel.

Each Emporia account will be associated with one physical Emporia device installed in one building or one monitored property.

The software must allow the building owner or landlord to:

- view all monitored channels from one main screen
- classify channels into logical groups
- separate common-area usage from apartment-specific usage
- create tenant accounts associated with a specific apartment group
- allow each tenant to see only the data that belongs to their apartment
- keep a historical record of measurements for reporting and future billing logic

---

# 3. Physical System Description

## 3.1 Field Hardware

The physical measurement device is:

- **Emporia Vue**
- **16 channels**
- installed in the electrical panel
- each CT clamp is physically connected to a circuit/breaker

The monitored electrical circuits will belong to one of the following logical categories:

- **Income**  
  Main incoming supply data

- **Common Channels**  
  Circuits that belong to common/shared areas

- **Apartment 1 Channels**

- **Apartment 2 Channels**

- ...

- **Apartment N Channels**

This means that the physical channels are fixed at installation time, but the logical meaning of each channel must be defined inside the software.

---

# 4. Main Functional Requirements

## 4.1 Channel Grouping

The platform must allow each measured channel to be assigned to a logical group.

Supported group types:

1. **Income**
2. **Common**
3. **Apartment**

A group must contain one or more channels.

Examples:

- Group `Income` may contain channels 1 and 2
- Group `Common` may contain channels 3, 4, and 5
- Group `Apartment 1` may contain channels 6 and 7
- Group `Apartment 2` may contain channels 8 and 9
- Group `Apartment 3` may contain channels 10 and 11

This grouping must be configurable from an administration screen.

---

## 4.2 Roles and Access

The system must support at least the following user roles:

### System Administrator
Global platform administrator.

Permissions:
- create and manage landlord accounts
- create and manage buildings/devices
- create and manage apartment groups
- map channels to groups
- create and manage tenant accounts
- configure Emporia credentials and device linkage
- monitor ingestion status and system errors

### Landlord
Property owner or manager.

Permissions:
- access a main dashboard for the property
- see all device channels and all groups
- see total consumption
- see common-area channels
- see apartment groups
- see historical data for all groups
- potentially manage tenant invitations in later versions

### Tenant
Apartment user.

Permissions:
- log in with their own credentials
- see only the channels/groups assigned to their apartment
- view current and historical data for that apartment only

Important:
A tenant must never see:
- common channels
- income channels
- other apartments
- device configuration screens
- raw platform administration functions

---

# 5. Target Software Structure

The system will be divided into the following major layers:

1. **Emporia Cloud Data Source**
2. **Cloud Ingestion Layer**
3. **Application Database**
4. **Backend/API Layer**
5. **Frontend/UI Layer**
6. **Authentication and Authorization Layer**
7. **Administration Layer**

---

# 6. Proposed High-Level Architecture

```text
Emporia Vue (16 CT channels)
        ↓
Emporia Cloud
        ↓
Cloud Ingestion Service (PyEmVue)
        ↓
Normalization / Mapping Logic
        ↓
Application Database
        ↓
Backend API
        ↓
Web Application
        ├── Admin Portal
        ├── Landlord Portal
        └── Tenant Portal
```

---

# 7. Key Architectural Decision

## 7.1 No Local Gateway

The project will **not use Raspberry Pi** or any on-premise collector.

Reason:
- lower deployment cost
- simpler installation
- fewer points of failure
- easier scaling
- no SD cards, power supplies, or local Linux maintenance

The device flow becomes:

```text
Emporia Vue → Emporia Cloud → Our Cloud Platform
```

This means all ingestion logic must run in the cloud.

---

# 8. Vercel-Based Cloud Architecture

## 8.1 Target Deployment Strategy

The web application and server-side application endpoints will be hosted on **Vercel**.

However, the architecture must recognize an important implementation detail:

Vercel is ideal for:
- frontend hosting
- API routes / server functions
- scheduled tasks
- queue-triggered processing
- authenticated dashboards

Vercel is **not** the place to keep raw long-term measurement state in memory. Persistent state must be stored in external services.

Therefore, the recommended production architecture is:

```text
Vercel Web App
    ├── Frontend
    ├── API Routes / Server Functions
    ├── Scheduled Ingestion Trigger
    └── Worker Trigger Endpoints
            ↓
External Database
External Queue / Managed Queue
External Object / Log Storage (optional)
```

---

## 8.2 Recommended Deployment Components

### On Vercel
- frontend application
- authentication routes
- admin routes
- landlord routes
- tenant routes
- ingestion trigger endpoints
- internal processing endpoints
- scheduled jobs

### Outside Vercel
- primary relational database
- time-series optimized storage strategy
- queue or durable asynchronous processing
- monitoring/log retention if needed

---

# 9. Recommended Stack

## 9.1 Frontend
Recommended:
- **Next.js**
- TypeScript
- component-based UI
- charting library for time-series

## 9.2 Backend
Recommended:
- Next.js server routes or server actions for platform APIs
- TypeScript for consistency across frontend and backend

Alternative:
- dedicated Python ingestion microservice outside Vercel

## 9.3 Ingestion Runtime
Recommended first version:
- Python ingestion worker using **PyEmVue**

Reason:
- PyEmVue already solves the Emporia cloud access problem
- fastest path to production with the current device

## 9.4 Database
Recommended:
- **PostgreSQL** as the system of record

Recommended extension strategy:
- if high time-series volume is expected, use a PostgreSQL provider or setup that supports time-series optimization

Suggested deployment options:
- managed PostgreSQL connected to Vercel
- optional future migration to Timescale-compatible PostgreSQL if needed for scale

## 9.5 Queue / Async Processing
Recommended:
- queue-based ingestion flow for scalability

Possible approaches:
1. lightweight first version using scheduled direct ingestion
2. scalable version using queue + workers

---

# 10. Recommended Evolution Path

## Phase 1 – MVP
- one Emporia device per Emporia account
- one property per device
- one landlord per property
- multiple apartment groups per property
- scheduled polling from cloud
- normalized storage in PostgreSQL
- landlord portal
- tenant portal
- admin portal

## Phase 2 – Scalable Multi-Device
- support multiple properties per landlord
- support multiple devices per landlord
- queue-based worker architecture
- ingestion monitoring
- alerting
- billing support
- anomaly detection

---

# 11. Functional Modules

## 11.1 Authentication Module
Responsibilities:
- login
- logout
- role-based session enforcement
- password reset
- invitation flow

Supported roles:
- admin
- landlord
- tenant

---

## 11.2 Property Module
Responsibilities:
- create property/building
- assign landlord
- assign Emporia device
- define apartment groups
- define common and income groups

A property is the main container for:
- device
- channels
- groups
- tenants

---

## 11.3 Device Module
Responsibilities:
- store Emporia account linkage
- store Emporia device reference
- sync channel list
- track device health
- track last successful ingestion

---

## 11.4 Channel Module
Responsibilities:
- store raw Emporia channels
- preserve original Emporia channel identifiers
- store editable display name
- assign each channel to one logical group

Each physical channel belongs to one device and one property.

---

## 11.5 Grouping Module
Responsibilities:
- create logical groups
- map channels to groups
- support predefined group types

Supported group types:
- `income`
- `common`
- `apartment`

Important:
The system must allow multiple channels to belong to the same apartment group.

Example:
Apartment 4 may consist of:
- kitchen breaker
- receptacle breaker
- AC breaker

All of them must be visible to the tenant as part of one apartment view.

---

## 11.6 Tenant Module
Responsibilities:
- create tenant accounts
- assign tenant to apartment group
- allow one tenant to be associated with one apartment group in MVP
- optionally support multiple tenants per apartment in later versions

---

## 11.7 Measurement Module
Responsibilities:
- receive normalized measurements
- store channel-level values
- compute aggregated group-level values
- expose current and historical data

---

## 11.8 Dashboard Module
Responsibilities:
- show real-time and historical measurements
- respect visibility rules by role
- show summaries per group and per channel

---

# 12. Detailed User Experience

## 12.1 Admin Experience

The system administrator must have access to:

### Property Administration Screen
Fields:
- property name
- address
- landlord assignment
- Emporia account email
- Emporia device selection
- status of last synchronization

### Channel Mapping Screen
Purpose:
- list all physical channels from the Emporia device
- define a friendly name for each channel
- map each channel to one group

Columns:
- channel number
- raw Emporia name
- custom display name
- channel type
- assigned group
- enabled/disabled
- last reading timestamp

### Group Management Screen
Purpose:
- create groups such as:
  - Income
  - Common
  - Apartment 1
  - Apartment 2
  - Apartment N

Fields:
- group name
- group type
- property
- apartment label or unit number
- active/inactive

### Tenant Management Screen
Purpose:
- create tenant accounts
- assign them to a specific apartment group

Fields:
- first name
- last name
- email
- password or invite flow
- assigned property
- assigned apartment group
- active/inactive

---

## 12.2 Landlord Experience

The landlord main screen must show:

### Property Overview
- total current property consumption
- total income channels consumption
- total common channels consumption
- consumption by apartment
- latest synchronization status

### All Channels View
- list of all channels
- current watts
- historical trend
- group assignment
- apartment/common/income classification

### Group Summary View
- card per group
- apartment totals
- common total
- income total

### Historical Analytics
- hourly
- daily
- monthly

Potential future additions:
- estimated cost per apartment
- tenant comparison
- downloadable reports

---

## 12.3 Tenant Experience

The tenant portal must be intentionally simple.

The tenant screen must show only:

- apartment name
- current total apartment consumption
- list of the channels assigned to that apartment
- historical chart of apartment consumption
- optionally channel breakdown inside the apartment

The tenant must never see:
- system settings
- other apartments
- common channels
- income channels
- raw Emporia account details

---

# 13. Data Model – Conceptual Design

## 13.1 Core Entities

Main entities:

- users
- roles
- landlords
- tenants
- properties
- devices
- channels
- channel_groups
- tenant_group_assignments
- measurements
- group_measurements
- ingestion_runs
- ingestion_errors

---

## 13.2 Entity Relationships

```text
User
 ├── Role
 ├── Landlord Profile
 └── Tenant Profile

Property
 ├── Landlord
 ├── Device
 ├── Channel Groups
 ├── Channels
 └── Tenants

Device
 └── Channels

Channel
 └── Group

Tenant
 └── Assigned Apartment Group

Measurements
 ├── Device
 ├── Channel
 └── Timestamp
```

---

# 14. Proposed Database Structure

## 14.1 users
Purpose:
Stores platform login accounts.

Suggested fields:
- id
- email
- password_hash
- full_name
- role (`admin`, `landlord`, `tenant`)
- is_active
- created_at
- updated_at

---

## 14.2 landlords
Purpose:
Profile data for landlord users.

Suggested fields:
- id
- user_id
- company_name (nullable)
- phone
- created_at

---

## 14.3 tenants
Purpose:
Profile data for tenants.

Suggested fields:
- id
- user_id
- property_id
- apartment_group_id
- lease_start_date (optional)
- lease_end_date (optional)
- created_at

---

## 14.4 properties
Purpose:
Represents one monitored building, house, or rental property.

Suggested fields:
- id
- landlord_id
- property_name
- address_line_1
- address_line_2
- city
- province_state
- postal_code
- country
- timezone
- is_active
- created_at
- updated_at

---

## 14.5 emporia_accounts
Purpose:
Stores the Emporia account used to fetch data.

Suggested fields:
- id
- property_id
- account_email
- encrypted_password
- status
- last_login_at
- created_at
- updated_at

Note:
Credentials must be encrypted at rest and access to them must be tightly restricted.

---

## 14.6 devices
Purpose:
Represents one physical Emporia device.

Suggested fields:
- id
- property_id
- emporia_account_id
- emporia_device_gid
- device_name
- serial_number (if available)
- channel_count
- is_active
- last_seen_at
- last_successful_sync_at
- created_at
- updated_at

---

## 14.7 channel_groups
Purpose:
Logical groups used by the software.

Suggested fields:
- id
- property_id
- group_name
- group_type (`income`, `common`, `apartment`)
- apartment_number (nullable)
- display_order
- is_active
- created_at
- updated_at

Examples:
- Income
- Common
- Apartment 1
- Apartment 2

---

## 14.8 channels
Purpose:
Stores each physical channel reported by the device.

Suggested fields:
- id
- property_id
- device_id
- emporia_channel_id
- channel_number
- raw_name
- display_name
- assigned_group_id
- is_main_channel
- is_enabled
- created_at
- updated_at

---

## 14.9 measurements
Purpose:
Stores normalized time-series measurements per channel.

Suggested fields:
- id
- property_id
- device_id
- channel_id
- measurement_ts
- watts
- volts (nullable)
- amps (nullable)
- energy_wh_increment (nullable)
- source (`emporia_poll`)
- ingestion_run_id
- created_at

Important:
This table will grow quickly and should be indexed carefully.

Recommended indexes:
- `(device_id, measurement_ts desc)`
- `(channel_id, measurement_ts desc)`
- `(property_id, measurement_ts desc)`

---

## 14.10 group_measurements
Purpose:
Optional denormalized table with pre-aggregated values per group.

Suggested fields:
- id
- property_id
- group_id
- measurement_ts
- total_watts
- total_amps (nullable)
- ingestion_run_id

Reason:
This can accelerate dashboards for landlords and tenants.

---

## 14.11 ingestion_runs
Purpose:
Tracks each ingestion execution.

Suggested fields:
- id
- property_id
- device_id
- started_at
- finished_at
- status (`running`, `success`, `partial`, `failed`)
- records_inserted
- records_updated
- error_count
- trigger_type (`cron`, `manual`, `retry`)
- created_at

---

## 14.12 ingestion_errors
Purpose:
Stores ingestion failures for diagnostics.

Suggested fields:
- id
- ingestion_run_id
- property_id
- device_id
- error_type
- error_message
- stack_trace (nullable)
- created_at

---

# 15. Data Visibility Rules

## 15.1 Admin
Can see:
- all properties
- all users
- all devices
- all channels
- all groups
- all measurements
- ingestion logs

## 15.2 Landlord
Can see:
- only their own properties
- all channels within those properties
- all groups within those properties
- all tenants within those properties
- all measurements within those properties

## 15.3 Tenant
Can see:
- only their assigned property
- only their assigned apartment group
- only the channels mapped to that apartment group
- only the measurements for those channels
- optionally only the aggregated apartment totals

---

# 16. Measurement Processing Logic

## 16.1 Raw Ingestion
The collector reads device/channel measurements from Emporia.

The platform stores them first as normalized channel-level measurements.

## 16.2 Group Aggregation
After storing channel values, the platform computes:

- Income total
- Common total
- Apartment totals

These group totals can be:
- computed on demand for MVP
- pre-aggregated for performance in later versions

## 16.3 Apartment View Logic
When a tenant opens the dashboard:
- find the tenant's assigned apartment group
- find all channels mapped to that group
- calculate current total
- display latest measurements and history only for those channels

---

# 17. Ingestion Architecture Without Local Hardware

## 17.1 Basic Option – Direct Scheduled Polling
Simplest version.

Flow:
1. scheduled job runs
2. system selects active properties/devices
3. system reads data from Emporia
4. system writes measurements to database

This is acceptable for an MVP with a limited number of devices.

---

## 17.2 Recommended Scalable Option – Scheduler + Queue + Workers

Flow:

```text
Scheduler
   ↓
Ingestion Jobs
   ↓
Queue
   ↓
Workers
   ↓
Emporia Cloud via PyEmVue
   ↓
Database
```

This approach is better because:
- it scales
- it isolates failures
- it supports retries
- it avoids one giant monolithic ingestion job

---

# 18. Recommended Runtime Separation

Because PyEmVue is Python-based and the main web platform is likely TypeScript/Next.js on Vercel, the cleanest structure is:

## Web Platform
- Next.js on Vercel
- admin / landlord / tenant UI
- API routes for app functions

## Ingestion Service
Option A:
- Python worker service deployed separately

Option B:
- Python-based scheduled worker environment outside Vercel

Option C:
- Node-based wrapper that invokes a Python job in a compatible environment

Recommended:
**Keep the web app on Vercel and keep the PyEmVue ingestion worker as an independent service/process.**

Reason:
- cleaner operational boundaries
- easier retries and monitoring
- avoids coupling ingestion lifecycle to the frontend deployment lifecycle

Even though the product frontend is on Vercel, the ingestion worker should be treated as a separate backend process.

---

# 19. Suggested Repository Structure

## Option 1 – Monorepo
```text
/apps
  /web
    Next.js app on Vercel

/services
  /ingestion
    Python PyEmVue collector

/packages
  /ui
  /config
  /types
```

This is the recommended structure.

Benefits:
- shared types and contracts
- independent deployment per service
- easier growth

---

# 20. API Design – Conceptual

## 20.1 Admin APIs
- `POST /api/admin/properties`
- `POST /api/admin/groups`
- `POST /api/admin/channels/map`
- `POST /api/admin/tenants`
- `GET /api/admin/ingestion-runs`
- `GET /api/admin/devices`

## 20.2 Landlord APIs
- `GET /api/landlord/property-summary`
- `GET /api/landlord/channels`
- `GET /api/landlord/groups`
- `GET /api/landlord/history`

## 20.3 Tenant APIs
- `GET /api/tenant/apartment-summary`
- `GET /api/tenant/channels`
- `GET /api/tenant/history`

## 20.4 Internal Ingestion APIs
- `POST /api/internal/ingestion/trigger`
- `POST /api/internal/ingestion/property/:id`
- `POST /api/internal/ingestion/retry/:runId`

These internal APIs must not be exposed publicly without proper authentication.

---

# 21. UI Screens Required

## 21.1 Admin
- login
- properties list
- property detail
- device sync status
- groups management
- channel mapping
- tenant management
- ingestion logs

## 21.2 Landlord
- property overview dashboard
- all channels live view
- all groups summary
- apartment comparisons
- historical charts

## 21.3 Tenant
- login
- apartment overview
- current apartment usage
- apartment historical usage

---

# 22. Landlord Dashboard Detail

The landlord dashboard should include:

## Top Summary Cards
- property total watts
- income total watts
- common total watts
- sum of apartment totals
- last sync timestamp

## Group Cards
One card per group:
- group name
- current watts
- trend indicator
- link to detail page

## Channel Table
Columns:
- channel number
- display name
- group
- current watts
- last update time

## Historical Charts
- property total over time
- common over time
- each apartment over time

---

# 23. Tenant Dashboard Detail

The tenant screen should include:

## Summary Card
- apartment name
- current apartment consumption
- last update time

## Channel Breakdown
- channel name
- current watts
- historical mini trend

## History Chart
- last 24 hours
- last 7 days
- last 30 days

Optional later:
- estimated bill share
- notifications for unusual spikes

---

# 24. Security Requirements

## Credentials
Emporia credentials must:
- be encrypted at rest
- never be exposed to landlord or tenant users
- be readable only by secure backend/worker components

## API Security
- role-based authorization required on all application APIs
- internal ingestion endpoints must use machine-to-machine protection
- admin routes must be isolated from landlord/tenant routes

## Auditability
The system should track:
- who changed channel mappings
- who created tenant accounts
- who changed group assignments
- when ingestion failed

---

# 25. Error Handling Requirements

The ingestion layer must handle:
- Emporia authentication failure
- device not found
- channel count changes
- temporary cloud API failure
- malformed or missing channel data
- duplicate measurement timestamps
- queue retry conditions
- partial ingestion success

The admin panel should expose:
- last successful sync
- last failed sync
- error count
- recent ingestion logs

---

# 26. Performance Considerations

## For MVP
A direct scheduled polling model may be enough.

## For Growth
As the number of properties increases:
- move to queue-based ingestion
- pre-aggregate group totals
- index measurements aggressively
- partition or optimize time-series storage
- cache latest summaries

---

# 27. Suggested Development Phases

## Phase 1 – Foundation
- auth
- roles
- property model
- device model
- channel sync
- group model
- manual channel mapping
- tenant creation
- landlord and tenant dashboards (basic)

## Phase 2 – Ingestion
- PyEmVue collector
- normalized measurement storage
- ingestion logs
- error handling
- manual re-run from admin panel

## Phase 3 – Analytics
- group aggregation
- time-series charts
- dashboard optimization
- latest readings cache

## Phase 4 – Production Hardening
- retries
- queue-based workers
- monitoring
- audit logs
- security hardening

---

# 28. Out of Scope for Initial Version

The following items should not block the first release:

- local hardware gateway
- direct local API from Emporia device
- automatic billing
- payment processing
- mobile app
- push notifications
- AI analytics
- multiple devices per property (optional later)
- self-service landlord onboarding (optional later)

---

# 29. Final Recommended Architecture

```text
[ Emporia Vue Device ]
        ↓
[ Emporia Cloud ]
        ↓
[ Python Ingestion Service using PyEmVue ]
        ↓
[ Normalization + Mapping ]
        ↓
[ PostgreSQL Database ]
        ↓
[ Vercel-hosted Web Application ]
        ├── Admin Portal
        ├── Landlord Portal
        └── Tenant Portal
```

Optional scalable extension:

```text
[ Scheduler ]
        ↓
[ Queue ]
        ↓
[ Python Workers ]
        ↓
[ PostgreSQL ]
        ↓
[ Vercel Web Platform ]
```

---

# 30. Development Team Deliverables

The development team should produce:

## Backend / Platform
- authentication system
- role-based authorization
- property/device/group/channel data model
- tenant assignment logic
- measurement ingestion and storage
- dashboard APIs

## Ingestion
- PyEmVue collector
- scheduler
- logging
- retry handling
- health checks

## Frontend
- admin portal
- landlord dashboard
- tenant dashboard
- channel mapping UI
- group management UI

## DevOps
- Vercel deployment for web app
- database provisioning
- secrets management
- worker deployment strategy
- monitoring and logging

---

# 31. Final Notes

This project should be designed as a **multi-tenant energy monitoring platform**, even if the first deployment starts with a single property and a single Emporia device.

That decision is important because the grouping model, access control model, and data model all depend on it.

The most important architectural rules for the first implementation are:

1. **Do not couple physical channels directly to tenant users**
   - always map channels to groups first

2. **Treat apartment visibility through groups**
   - tenant access should be based on apartment group assignment

3. **Separate ingestion from presentation**
   - data collection must remain independent from dashboard rendering

4. **Keep Vercel as the web delivery layer**
   - use external persistent systems for database and asynchronous processing

5. **Design for future growth**
   - even if the first version is small, the platform structure should already support many properties and many tenants

---

# 32. Immediate Next Step Recommendation

Before implementation starts, the team should convert this document into:

1. an ERD
2. API contract definitions
3. UI wireframes for:
   - admin channel mapping
   - landlord dashboard
   - tenant dashboard
4. ingestion sequence diagram
5. deployment diagram
