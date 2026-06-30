<p align="center">
  <img src="public/logo.png" alt="CurePath Logo" width="120" />
</p>

<h1 align="center">CurePath — Hospital Management Portal</h1>

<p align="center">
  <strong>Blockchain-Verified Hospital Administration Dashboard with Decentralized Medical Record Management</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Blockchain-SHA--256-FF6F00?style=for-the-badge" alt="Blockchain" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Dashboard Modules](#-dashboard-modules)
- [Blockchain System](#-blockchain-system)
- [Authentication & Security](#-authentication--security)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏥 Overview

**CurePath Hospital Portal** is the hospital-facing web application of the CurePath Healthcare Ecosystem. Built with Next.js 16 and React 19, it provides hospital administrators with a comprehensive, enterprise-grade dashboard to manage patients, doctors, appointments, emergency cases, insurance policies, and blockchain-verified medical records — all through a stunning glassmorphic UI.

Each hospital operates as an independent **"node"** on the CurePath trust network. Every critical operation (patient registration, appointments, prescriptions, emergency cases) is cryptographically hashed and appended to a SHA-256 blockchain ledger, ensuring **tamper-proof medical record integrity**.

The portal integrates with the [CurePath Flutter mobile app](https://github.com/Akshith1413/CurePath) to provide a seamless patient-to-hospital data flow, with SOS emergency triggers from mobile devices appearing in real-time on the hospital dashboard.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📊 **Overview Dashboard** | Real-time stats (patients, doctors, appointments, emergencies, ICU) with live animated indicators, patient inflow analytics chart, and critical alert feed |
| 👥 **Patient Management** | Full CRUD for patient records with global identity resolution (CUPAT ID), Aadhar linking, assigned doctor tracking, and auto-creation of global medical records |
| 🩺 **Doctor Directory** | Doctor registration with medical license verification, CUDOC ID generation, specialization tracking, active case count, and credential document uploads |
| 📅 **Appointment Scheduling** | Schedule Regular, Emergency, ICU, and Follow-up appointments with doctor-patient linking, medication tracking, and blockchain-logged prescriptions |
| 🚨 **Emergency Module** | Triage management with CRITICAL/HIGH/MEDIUM/LOW severity levels, ICU flagging, ambulance dispatch status, and priority-sorted case display |
| 🛡️ **Insurance Management** | Register and track insurance policies per patient — policy status, claim status, coverage amounts, and blockchain-verified claim records |
| ✅ **Doctor Verification** | Document upload workflow (degree, license, Aadhar, experience certificates) with multi-stage verification status tracking (Pending → Under Review → Verified/Rejected) |
| ⛓️ **Blockchain Logs** | Full immutable ledger viewer with hash chain verification, SHA-256 integrity auditing, and per-block metadata inspection |
| ⚙️ **Settings Panel** | Hospital profile management, branch management, logo upload, notification preferences, password changes, and TOTP-based 2FA enrollment |
| 🔍 **Enterprise Search** | Global autocomplete search across patients, doctors, appointments, emergencies, insurance policies, and blockchain blocks from the top navbar |
| 🌗 **Dark / Light Theme** | Premium glassmorphic design with OKLCH color system — toggle instantly from any page |
| 📧 **Email Notifications** | Automated SMTP emails for registration welcome, login security alerts, resource deletion audits, and password reset OTPs |
| 🔐 **MFA / 2FA** | Time-Based One-Time Password (TOTP) enrollment with QR code provisioning, compatible with Google Authenticator and Authy |

---

## 🏗️ Architecture

CurePath Hospital Portal follows the **Next.js App Router** architecture with API Route Handlers serving as the backend, and React Server/Client components for the frontend.

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (portal selection)
│   ├── layout.tsx                # Root layout (Inter + Outfit fonts, theme script)
│   ├── globals.css               # Design system (OKLCH colors, glassmorphism, animations)
│   │
│   ├── login/page.tsx            # Hospital sign-in (email or Node ID + MFA challenge)
│   ├── signup/page.tsx           # Hospital registration (multi-field form)
│   ├── forgot-password/page.tsx  # Password recovery (OTP via email)
│   ├── reset-password/page.tsx   # Password reset (OTP verification + new password)
│   ├── retrievedoc/page.tsx      # Public document retrieval page
│   │
│   ├── dashboard/page.tsx        # Main dashboard shell (sidebar nav, overview, module routing)
│   │
│   └── api/                      # Backend API Route Handlers
│       ├── auth/
│       │   ├── [action]/route.ts       # register-hospital, login, forgot-password, reset-password, me
│       │   └── mfa/                    # MFA enrollment, verify-login, disable
│       ├── patients/
│       │   ├── route.ts                # GET (list + search) / POST (create with CUPAT ID resolution)
│       │   ├── [id]/route.ts           # GET / PUT / DELETE individual patient
│       │   ├── global/route.ts         # Cross-hospital patient lookup
│       │   └── summary/route.ts        # Patient summary aggregation
│       ├── doctors/
│       │   ├── route.ts                # GET (list + search + active cases) / POST (create with CUDOC ID)
│       │   └── [id]/route.ts           # GET / PUT / DELETE individual doctor
│       ├── appointments/
│       │   ├── route.ts                # GET (list + filters) / POST (schedule with blockchain log)
│       │   └── [id]/route.ts           # GET / PUT / DELETE individual appointment
│       ├── emergency/
│       │   ├── route.ts                # GET (priority-sorted) / POST (create case)
│       │   └── [id]/route.ts           # GET / PUT / DELETE individual emergency
│       ├── insurance/
│       │   ├── route.ts                # GET (list + filters) / POST (register policy)
│       │   └── [id]/route.ts           # GET / PUT / DELETE individual policy
│       ├── verification/
│       │   ├── route.ts                # GET (list) / POST (upload documents)
│       │   ├── [id]/route.ts           # PUT (approve/reject) / DELETE
│       │   ├── upload/route.ts         # Multi-file document upload
│       │   └── retrieve/route.ts       # Document retrieval
│       ├── blockchain/
│       │   ├── logs/route.ts           # GET all blockchain logs
│       │   ├── create-hash/route.ts    # POST manual hash creation
│       │   ├── verify/route.ts         # POST verify single block
│       │   └── verify-chain/route.ts   # POST full chain integrity audit
│       ├── dashboard/
│       │   └── [action]/route.ts       # stats, emergency-alerts
│       └── settings/
│           ├── profile/route.ts        # Hospital profile CRUD
│           ├── security/route.ts       # Password change, MFA toggle
│           ├── logo/route.ts           # Logo upload/fetch
│           ├── branch/route.ts         # Branch CRUD
│           ├── branches/route.ts       # List all branches
│           └── notifications/route.ts  # Notification preferences
│
├── components/
│   ├── Navbar.tsx                # Public navbar
│   ├── Footer.tsx                # Public footer
│   ├── Logo.tsx                  # Logo component
│   ├── GlowBackground.tsx       # Ambient glow effect
│   ├── ui/
│   │   └── button.tsx            # ShadCN button component (CVA)
│   └── dashboard/
│       ├── PatientsModule.tsx    # Patient CRUD table with search, pagination, add/edit modals
│       ├── DoctorsModule.tsx     # Doctor directory with add form and case assignment
│       ├── AppointmentsModule.tsx # Appointment scheduling and management
│       ├── EmergencyModule.tsx   # Emergency case triage and management
│       ├── InsuranceModule.tsx   # Insurance policy management
│       ├── VerificationModule.tsx # Doctor document verification workflow
│       ├── BlockchainLogsModule.tsx # Blockchain ledger explorer
│       └── SettingsModule.tsx    # Hospital settings (profile, security, branches, notifications)
│
└── lib/
    ├── api.ts                    # Client-side API wrapper (JWT injection, token management)
    ├── authUtils.ts              # Server-side JWT + Supabase Auth verification middleware
    ├── supabaseServer.ts         # Supabase server client (anon/service key)
    ├── supabaseAdmin.ts          # Supabase admin client (service role, bypasses RLS)
    ├── utils.ts                  # Tailwind merge utility
    └── utils/
        ├── blockchain.ts         # SHA-256 hash generation, chain verification, blockchain record creation
        ├── emailService.ts       # SMTP email service (welcome, login alert, deletion alert, password reset)
        └── totp.ts               # RFC 6238 TOTP implementation (Base32, HOTP, verify with drift window)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, React Server Components) |
| **Language** | TypeScript 5.x |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 + ShadCN/UI (base-nova) + Custom OKLCH design system |
| **Backend** | Next.js API Route Handlers (serverless) |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Authentication** | JWT (jsonwebtoken) + Supabase Auth + bcryptjs password hashing |
| **2FA/MFA** | Custom RFC 6238 TOTP implementation (compatible with Google Authenticator) |
| **Blockchain** | Custom SHA-256 hash chain (Node.js crypto) |
| **Email** | Nodemailer (SMTP) |
| **AI** | Google Generative AI SDK (integrated) |
| **QR Codes** | qrcode (for MFA provisioning URIs) |
| **Icons** | Lucide React |
| **Fonts** | Inter (body) + Outfit (headings) via next/font |

---

## 📁 Project Structure

```
curepath_hosp/
├── public/
│   ├── logo.png                  # App logo
│   └── logo_transparent.png      # Transparent logo variant
├── src/                          # Source code (see Architecture)
├── package.json                  # Dependencies and scripts
├── components.json               # ShadCN/UI configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS + Tailwind
├── eslint.config.mjs             # ESLint configuration
├── .env.local                    # Environment variables (not committed)
├── alter_schema.js               # Database migration scripts
├── alter_schema_v2.js            # Schema migration v2
├── alter_doctors.js              # Doctor table alterations
├── disable_rls.js                # RLS policy management
├── check_tables.js               # Database introspection utility
├── check_cols.js                 # Column introspection utility
├── check_appts.js                # Appointment data check
└── test_admin.js                 # Admin client test script
```

---

## 🔌 API Reference

All API routes are protected with JWT authentication (except auth endpoints). Requests must include:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register-hospital` | Register new hospital node (name, reg number, branch, state, city, admin email, password) |
| `POST` | `/api/auth/login` | Login via admin email or registration number + password. Returns JWT or triggers MFA challenge |
| `GET` | `/api/auth/me` | Get authenticated hospital profile |
| `POST` | `/api/auth/forgot-password` | Send OTP to admin email for password recovery |
| `POST` | `/api/auth/reset-password` | Verify OTP and set new password |
| `POST` | `/api/auth/mfa/*` | MFA enrollment (QR provisioning), verify-login, and disable |

### Core Resources

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients` | List patients (search, pagination) with assigned doctor JOINs |
| `POST` | `/api/patients` | Create patient with global CUPAT ID resolution and medical record |
| `GET/PUT/DELETE` | `/api/patients/[id]` | Individual patient CRUD |
| `GET` | `/api/doctors` | List doctors (search, status filter) with active case counts |
| `POST` | `/api/doctors` | Register doctor with CUDOC ID and verification record |
| `GET/PUT/DELETE` | `/api/doctors/[id]` | Individual doctor CRUD |
| `GET` | `/api/appointments` | List appointments (type, status, date, search filters) |
| `POST` | `/api/appointments` | Schedule appointment with blockchain prescription log |
| `GET/PUT/DELETE` | `/api/appointments/[id]` | Individual appointment CRUD |
| `GET` | `/api/emergency` | List emergencies (priority-sorted by level) |
| `POST` | `/api/emergency` | Create emergency case (CRITICAL/HIGH/MEDIUM/LOW) |
| `GET/PUT/DELETE` | `/api/emergency/[id]` | Individual emergency CRUD |
| `GET` | `/api/insurance` | List insurance policies (status, claim, search filters) |
| `POST` | `/api/insurance` | Register insurance policy with blockchain claim log |
| `GET/PUT/DELETE` | `/api/insurance/[id]` | Individual policy CRUD |

### Verification & Blockchain

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/verification` | List doctor verification records |
| `POST` | `/api/verification` | Upload verification documents (degree, license, Aadhar, experience) |
| `PUT` | `/api/verification/[id]` | Approve/reject verification |
| `GET` | `/api/blockchain/logs` | Fetch all blockchain log entries |
| `POST` | `/api/blockchain/create-hash` | Create manual blockchain hash |
| `POST` | `/api/blockchain/verify` | Verify single block integrity |
| `POST` | `/api/blockchain/verify-chain` | Full chain integrity audit for hospital node |

### Dashboard & Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Real-time dashboard statistics |
| `GET` | `/api/dashboard/emergency-alerts` | Active emergency alert feed |
| `GET/PUT` | `/api/settings/profile` | Hospital profile management |
| `POST` | `/api/settings/security` | Password change, MFA toggle |
| `POST/GET` | `/api/settings/logo` | Hospital logo upload/fetch |
| `POST/GET/DELETE` | `/api/settings/branch` | Branch CRUD |
| `GET` | `/api/settings/branches` | List all branches |
| `GET/PUT` | `/api/settings/notifications` | Notification preferences |

---

## 📊 Dashboard Modules

The dashboard consists of 9 tabbed modules, each a self-contained React component:

| Module | Component | Features |
|---|---|---|
| **Overview** | `dashboard/page.tsx` | Stats cards with live pulse indicators, patient inflow bar chart, critical alerts feed, upcoming appointments table |
| **Patients** | `PatientsModule.tsx` | Searchable data table, add/edit modal forms, assigned doctor dropdown, CUPAT ID display, status badges |
| **Doctors** | `DoctorsModule.tsx` | Doctor directory, add form with specialization/license/Aadhar, active cases count, CUDOC ID generation |
| **Appointments** | `AppointmentsModule.tsx` | Schedule management, type filters (Regular/Emergency/ICU/Follow-up), status badges, doctor-patient linking |
| **Emergency** | `EmergencyModule.tsx` | Priority-sorted triage board, severity indicators (CRITICAL=red, HIGH=orange), ICU flags, ambulance dispatch tracking |
| **Insurance** | `InsuranceModule.tsx` | Policy registry, provider management, coverage/premium tracking, claim status workflow |
| **Verification** | `VerificationModule.tsx` | Document upload workflow, multi-stage status (Pending→Under Review→Verified/Rejected), file preview |
| **Blockchain** | `BlockchainLogsModule.tsx` | Ledger explorer, hash chain visualization, integrity verification button, block metadata viewer |
| **Settings** | `SettingsModule.tsx` | Hospital profile, branch management, logo upload, password change, TOTP 2FA enrollment with QR code, notification toggles |

---

## ⛓️ Blockchain System

CurePath implements a **SHA-256 hash chain** for immutable medical record verification:

### How It Works

1. **Every critical operation** (patient creation, prescription, appointment, emergency case, insurance claim) generates a blockchain log entry
2. Each entry contains:
   - `record_type` — e.g., `PATIENT_RECORD`, `PRESCRIPTION`, `EMERGENCY_CASE`, `INSURANCE_CLAIM`, `DOCTOR_VERIFICATION`
   - `action_type` — `CREATED`, `UPDATED`, `DELETED`
   - `metadata` — JSON payload of the record data
   - `previous_hash` — Hash of the previous block (genesis = `0x000...`)
   - `current_hash` — `SHA-256(metadata + previous_hash + timestamp)`
   - `verified_status` — `VALID`, `TAMPERED`, `PENDING`

3. **Chain Verification** audits the entire ledger chronologically:
   - Validates each block's `previous_hash` matches the preceding block's `current_hash`
   - Recomputes each block's hash and compares with stored `current_hash`
   - Returns exact tamper point if corruption is detected

### Blockchain API

```
POST /api/blockchain/verify-chain  →  Full chain integrity audit
POST /api/blockchain/verify        →  Single block verification
POST /api/blockchain/create-hash   →  Manual hash creation
GET  /api/blockchain/logs          →  Browse all ledger entries
```

---

## 🔒 Authentication & Security

| Security Layer | Implementation |
|---|---|
| **Password Hashing** | bcryptjs with 10 salt rounds |
| **Session Tokens** | JWT signed with configurable secret, 24h expiry |
| **Dual Auth Strategy** | Supabase Auth (primary) with local JWT fallback |
| **MFA / 2FA** | RFC 6238 TOTP (custom implementation) — Base32 secret generation, HMAC-SHA1, 30-second time steps, ±1 drift window |
| **MFA Enrollment** | QR code provisioning URI for Google Authenticator / Authy |
| **Password Recovery** | Email OTP (6-digit code, 15-minute expiry) |
| **Route Protection** | `protect()` middleware validates JWT on every API route |
| **Admin Operations** | Service role Supabase client bypasses RLS for cross-hospital operations |
| **Input Validation** | Password strength regex (uppercase + lowercase + digit + special char, 8+ chars) |
| **Email Alerts** | Login alerts, deletion audits, and welcome notifications sent via SMTP |
| **Login by Node ID** | Hospitals can authenticate using registration number instead of email |

---

## 🗄️ Database Schema

The portal uses Supabase (PostgreSQL) with the following core tables:

| Table | Purpose |
|---|---|
| `hospitals` | Hospital node registry — name, registration number, branch, state, city, admin email, password hash, verification status, MFA config, logo, coordinates |
| `patients` | Local patient records per hospital — demographics, diagnosis, assigned doctor, medication, admission date, CUPAT ID, Aadhar, Flutter profile link |
| `doctors` | Doctor registry — name, specialization, qualification, license number, Aadhar, experience, verification status, CUDOC ID, email |
| `appointments` | Medical appointments — type (Regular/Emergency/ICU/Follow-up), date/time, diagnosis, medication, treatment duration, status, follow-up dates |
| `emergency_cases` | Emergency triage — severity level, symptoms, assigned doctor, ICU requirement, ambulance status, admission time, triage status |
| `insurance_policies` | Insurance records — provider, policy name, coverage/premium amounts, policy dates, claim status, verification status |
| `doctor_verifications` | Verification workflow — document URLs (degree, license, Aadhar, experience), verification status, reviewer notes |
| `blockchain_logs` | Immutable ledger — hospital ID, record type, record ID, action type, current/previous hash, verified status, metadata JSON, timestamp |
| `profiles` | Global identity registry — shared across all hospital nodes (CUPAT/CUDOC IDs, Aadhar, full name, role, avatar, email) |
| `medical_records` | Global medical records — patient-centric view across all hospitals (diagnosis, treatment, prescription, notes) |
| `hospital_branches` | Branch locations per hospital |
| `hospital_notifications` | Notification preference settings |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **pnpm**
- A **Supabase** project with the database schema initialized
- (Optional) SMTP credentials for email notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Akshith1413/CurePath_Hosp.git
   cd CurePath_Hosp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** — Create `.env.local` from the template:
   ```bash
   cp .env.local.example .env.local
   ```
   See [Environment Variables](#-environment-variables) below.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

5. **Build for production** (optional)
   ```bash
   npm run build
   npm start
   ```

---

## 🔧 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# SMTP Email Configuration (Optional — emails are skipped if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Public API URL (auto-detected in most cases)
NEXT_PUBLIC_API_URL=/api
```

---

## 🎨 Design System

The portal uses a premium, healthcare-themed design system built with **OKLCH colors** and **glassmorphism**:

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--primary` | Royal Blue | Vibrant Indigo | Primary actions, navigation highlights |
| `--secondary` | Teal/Cyan | Cyber Teal | Secondary accents, gradients |
| `--destructive` | Red | Dark Red | Errors, critical alerts |
| `--muted` | Cool Grey | Dark Slate | Disabled states, subtle backgrounds |

### Glass Effects

- **`glass-panel`** — Deep blur (20px) frosted panels with subtle inner glow
- **`glass-card`** — Lighter blur (12px) stat cards with layered shadows
- **`text-gradient-primary`** — Blue→Teal gradient text for brand elements

### Animations

- `animate-float` — Gentle vertical float (6s)
- `animate-pulse-slow` — Slow opacity pulse (8s)
- `animate-pulse-glow` — Box-shadow glow pulse (3s)
- `grid-background` — Subtle animated grid pattern

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of the **CurePath Healthcare Ecosystem** — a comprehensive decentralized medical records platform connecting hospitals, patients, and insurance providers.

| Component | Repository |
|---|---|
| 📱 **Patient Mobile App** | [CurePath (Flutter)](https://github.com/Akshith1413/CurePath) |
| 🏥 **Hospital Portal** | CurePath Hospital (this repo) |

---

<p align="center">
  Built with ❤️ using Next.js, React, and Supabase
</p>
