# Voice Agents – Jeenora Autonomous Multi-Tenant AI Voice CRM Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0+-2D3748.svg)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Bulbul_V3_/_V4-purple.svg)](https://sarvam.ai/)

> **Jeenora Voice Agents** is an enterprise-grade, multi-tenant AI CRM platform featuring autonomous conversational voice telephony, dynamic Gemini-powered agent configuration, and native Indic speech synthesis via Sarvam AI. It allows businesses across **any industry** (Real Estate, IT & Cloud, Education, Healthcare, Financial Services, etc.) to configure, test, and deploy production AI voice agents without code changes.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Complete Functional Modules](#complete-functional-modules)
   - [1. Voice Agent Studio & Testing Workspace](#1-voice-agent-studio--testing-workspace)
   - [2. Fully Dynamic Gemini AI Configuration Engine](#2-fully-dynamic-gemini-ai-configuration-engine)
   - [3. Sarvam AI Voice Provider Integration](#3-sarvam-ai-voice-provider-integration)
   - [4. Multi-Tenant Enterprise CRM & Sales Pipeline](#4-multi-tenant-enterprise-crm--sales-pipeline)
   - [5. Telephony & Automated Calling Engine](#5-telephony--automated-calling-engine)
   - [6. Credit Accounting & Billing Infrastructure](#6-credit-accounting--billing-infrastructure)
   - [7. Platform Administration & Governance](#7-platform-administration--governance)
3. [Supported Indic Languages & Bulbul Voices](#supported-indic-languages--bulbul-voices)
4. [Complete API Reference](#complete-api-reference)
5. [Directory Structure](#directory-structure)
6. [Environment Variables](#environment-variables)
7. [Installation & Quick Start](#installation--quick-start)
8. [Multi-Industry Verification](#multi-industry-verification)

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["Jeenora SaaS Frontend (Next.js 14 App Router)"]
        VAS["Voice Agent Studio (/workspace/ai-calling)"]
        TestWorkspace["Testing Console (Mic Voice / Phone / Chat)"]
        ConfigModal["Dynamic Configuration Modal"]
        CRMViews["CRM: Leads, Pipeline, Services, Reports"]
    end

    subgraph Backend["ACRM Backend (NestJS + TypeScript)"]
        AgentCtrl["AgentConfigurationController"]
        RuntimeCtrl["SarvamRuntimeController"]
        TelephonyCtrl["TelephonyController"]
        CRMServices["Lead & Pipeline Services"]
        
        GeminiService["GeminiService<br/>(Dynamic Agent Persona & Guardrails)"]
        SarvamService["SarvamService<br/>(TTS & Capabilities Cache)"]
        TelephonyService["TelephonyService<br/>(Outbound Calls & Webhooks)"]
    end

    subgraph External["External AI & Telephony Engines"]
        GeminiAPI["Google Gemini 2.5 Flash API"]
        SarvamAPI["Sarvam AI Bulbul TTS API"]
        TelephonyProvider["Telephony Trunk (Twilio / Exotel)"]
    end

    subgraph Database["PostgreSQL (Prisma ORM)"]
        TenantDB["Tenant Profile & Business Context"]
        ConfigDB["TenantAgentConfiguration (v1, v2...)"]
        ServiceDB["Registered Offerings & Pricing"]
        LedgerDB["Calling Logs & Credit Ledger"]
    end

    VAS --> AgentCtrl
    TestWorkspace --> RuntimeCtrl
    ConfigModal --> AgentCtrl
    
    AgentCtrl --> GeminiService
    AgentCtrl --> SarvamService
    RuntimeCtrl --> SarvamService
    TelephonyCtrl --> TelephonyService

    GeminiService --> GeminiAPI
    SarvamService --> SarvamAPI
    TelephonyService --> TelephonyProvider

    AgentCtrl --> ConfigDB
    AgentCtrl --> TenantDB
    AgentCtrl --> ServiceDB
    TelephonyService --> LedgerDB
```

---

## Complete Functional Modules

### 1. Voice Agent Studio & Testing Workspace
- **Zero Technical Clutter**: Displays only the dynamically resolved agent identity, role, active version badge, and a high-fidelity testing workspace.
- **Three Testing Modes**:
  1. **Microphone Voice Test**: Full real-time voice streaming with speech recognition, dynamic conversation turns, live audio playback, and interruption handling.
  2. **Outbound Phone Test**: Dials an actual mobile device through the backend telephony engine to test agent greetings, qualification logic, and audio clarity.
  3. **Text Chat Test**: Simulates conversational turns via text to test objection handling, guardrails, and question progression.
- **100% Real Provider Audio**: Completely eliminates browser robotic speech synthesis (`window.speechSynthesis`). All audio streams as high-quality WAV/PCM synthesized via the Sarvam Bulbul engine.
- **Live Conversation Transcript**: Displays caller and agent messages in real time with timestamp markers, status indicators (`IDLE`, `CONNECTING`, `LIVE`, `ENDED`), and call duration timers.

### 2. Fully Dynamic Gemini AI Configuration Engine
- **Cross-Industry Usability**: Works seamlessly across any industry (Healthcare, Real Estate, Higher Education, SaaS/Cloud, Financial Services) with zero source code changes.
- **Dynamic Identity Generation**: Agent names and professional roles are derived from the organization's business profile and registered offerings (no hardcoded names like "Maya" or "Alex").
- **Natural Opening Greeting**: Synthesized dynamically based on company name, agent persona, and primary offering in the selected Indic language.
- **Structured Qualification Instructions**: Generates tailored qualification questions, target parameters (budget, timeline, authority, use case), and objection-handling rules strictly from verified company records.
- **Anti-Hallucination Guardrails**: Generates explicit `prohibitedClaims` protecting against unauthorized price promises, fabricated warranties, or speculative legal claims. Unspecified details are flagged in `missingInformation`.
- **Change Detection & Outdated Alerts**: Modifying the company profile or service catalog automatically marks active configurations as `isOutdated: true`, prompting the user with an inline alert and a 1-click "Regenerate with Gemini" action.
- **Safe Versioning (Draft Forking)**: Editing an approved configuration forks it into a new `DRAFT` version (`v1 APPROVED` → `v2 DRAFT`). The active production voice bot is never overwritten until the client explicitly reviews and approves the draft.

### 3. Sarvam AI Voice Provider Integration
- **Provider API-Driven**: Capability dropdowns are populated dynamically via `GET /api/ai-calling/provider-capabilities`, returning real supported languages, voices, and models.
- **11 Indic Languages**: Full support for Indian regional languages with native accents.
- **14 Bulbul Voices**: Male and female natural voices with expressive prosody.
- **Engine Models**: Supports both `bulbul:v3` (high quality) and `bulbul:v4-flash` (ultra-low latency).
- **Backend Capability Validation**: All user selections are validated against provider capabilities on the backend before database persistence. Provider API keys are never exposed to the client.

### 4. Multi-Tenant Enterprise CRM & Sales Pipeline
- **Complete Tenant Isolation**: Every tenant operates in a cryptographically isolated context identified by JWT claims and validated by `TenantGuard`.
- **Lead & Contact Management**: Comprehensive lead tracking with interest levels (`HOT`, `WARM`, `COLD`), lead sources, call attempt counters, and CSV import wizards.
- **Sales Pipeline Kanban**: Drag-and-drop opportunity management with stages: `New Lead`, `AI Contacted`, `Meeting Scheduled`, `Proposal Sent`, `Negotiation`, `Won`, and `Lost`.
- **Service Catalog**: Tenant-specific offerings, pricing guidelines, delivery locations, and qualification criteria that directly feed the AI agent's knowledge base.
- **Follow-up Automation**: Automatically schedules follow-up tasks, callback reminders, and site visit appointments based on AI conversation outcomes.

### 5. Telephony & Automated Calling Engine
- **Inbound & Outbound Calling**: Integrates with Twilio and Exotel SIP trunks for carrier-grade telephony.
- **Calling Window Constraints**: Enforces business operating hours (e.g. 10:00 AM - 7:00 PM), retry intervals, and maximum daily calling caps to ensure regulatory compliance.
- **Automatic Call Recording & Transcription**: Stores MP3 audio recordings and synchronized two-way dialog transcripts for quality review.
- **Webhook Handlers**: Secure webhook endpoints (`/api/telephony/webhook/*`) with HMAC signature verification for call initiation, status callbacks, and recording completions.

### 6. Credit Accounting & Billing Infrastructure
- **Real-Time Usage Metering**: Tracks billable seconds and calculates consumption based on tenant-specific per-minute rates.
- **Balance Enforcement**: Pre-call balance checks ensure outbound calls only connect when sufficient credit balance exists.
- **Audit Ledger**: Every call generates an immutable `AiUsageLedger` transaction recording duration, provider costs, and billed client charges.

### 7. Platform Administration & Governance
- **Super Admin Dashboard**: Real-time visibility into total platform calling minutes, active tenants, total revenues, and system health.
- **Tenant Management**: Provision new client organizations, allocate monthly minute quotas, adjust credit balances, and configure calling concurrency limits.
- **Global Provider Key Management**: Configure platform-wide Sarvam API keys, default minute pricing, and calling window defaults.

---

## Supported Indic Languages & Bulbul Voices

| Language Code | Language Name | Native Script | Supported Voices |
|:---:|:---:|:---:|:---|
| `en-IN` | Indian English | English | Kavya, Anushka, Priya, Neha, Rahul, Rohan, Ishaan, Amit |
| `hi-IN` | Hindi | हिन्दी | Kavya, Anushka, Priya, Neha, Pooja, Rahul, Rohan, Dev |
| `ta-IN` | Tamil | தமிழ் | Kavya, Anushka, Shreya, Rahul, Rohan, Dev, Ratan |
| `te-IN` | Telugu | తెలుగు | Kavya, Anushka, Neha, Rahul, Rohan, Amit |
| `kn-IN` | Kannada | ಕನ್ನಡ | Kavya, Anushka, Shreya, Rahul, Rohan |
| `bn-IN` | Bengali | বাংলা | Kavya, Anushka, Priya, Rahul, Rohan, Abhilash |
| `mr-IN` | Marathi | मराठी | Kavya, Anushka, Neha, Rahul, Rohan, Dev |
| `gu-IN` | Gujarati | ગુજરાતી | Kavya, Anushka, Priya, Rahul, Rohan, Amit |
| `ml-IN` | Malayalam | മലയാളം | Kavya, Anushka, Shreya, Rahul, Rohan |
| `pa-IN` | Punjabi | ਪੰਜਾਬੀ | Kavya, Simran, Rahul, Rohan, Amit |
| `od-IN` | Odia | ଓଡ଼ିଆ | Kavya, Anushka, Rahul, Rohan, Abhilash |

---

## Complete API Reference

### 1. AI Voice Agent Configuration & Runtime
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/ai-calling/provider-capabilities` | Returns 11 Indic languages, 14 voices, and models | Tenant JWT |
| `GET` | `/api/ai-calling/agent-config` | Retrieves active approved configuration and version history | Tenant JWT |
| `POST` | `/api/ai-calling/agent-config/generate` | Generates a new Gemini draft from company profile & services | Tenant JWT |
| `PUT` | `/api/ai-calling/agent-config/:id` | Edits draft configuration (safely forks if modifying approved) | Tenant JWT |
| `POST` | `/api/ai-calling/agent-config/:id/approve` | Approves and publishes draft configuration for live calling | Tenant JWT |
| `GET` | `/api/ai-calling/agent-config/history` | Retrieves full configuration version and audit history | Tenant JWT |
| `POST` | `/api/ai-calling/synthesize-speech` | Synthesizes authentic WAV audio stream via Sarvam Bulbul TTS | Tenant JWT |
| `POST` | `/api/ai-calling/start-test` | Initiates a real-time voice, phone, or chat testing session | Tenant JWT |
| `POST` | `/api/ai-calling/end-test` | Concludes active testing session and records duration | Tenant JWT |
| `GET` | `/api/ai-calling/test-history` | Fetches recent testing sessions and conversation transcripts | Tenant JWT |

### 2. Authentication & Tenancy
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `POST` | `/api/auth/login` | Authenticates tenant client or platform admin | Public |
| `GET` | `/api/auth/profile` | Fetches authenticated user profile and tenant metadata | JWT |
| `POST` | `/api/auth/activate-account` | Validates invitation token and sets client password | Public |

### 3. CRM, Leads & Pipeline
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/leads` | Lists leads with pagination, search, and status filters | Tenant JWT |
| `POST` | `/api/leads` | Creates a new contact and sales lead | Tenant JWT |
| `POST` | `/api/leads/import` | Bulk imports leads from CSV/Excel files | Tenant JWT |
| `PATCH` | `/api/leads/:id/stage` | Updates lead pipeline stage (drag-and-drop Kanban) | Tenant JWT |
| `GET` | `/api/calls` | Lists outbound and inbound call history with recordings | Tenant JWT |
| `GET` | `/api/calls/:id` | Fetches call recording URL, AI transcript, and summary | Tenant JWT |

### 4. Services & Offerings
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/services` | Lists tenant services and offerings | Tenant JWT |
| `POST` | `/api/services` | Creates offering (flags agent config as outdated) | Tenant JWT |
| `PUT` | `/api/services/:id` | Updates offering details and pricing | Tenant JWT |
| `DELETE` | `/api/services/:id` | Deactivates offering | Tenant JWT |

### 5. Settings & Company Profile
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/settings/company` | Retrieves company profile and business categorization | Tenant JWT |
| `PUT` | `/api/settings/company` | Updates company profile (flags agent config as outdated) | Tenant JWT |
| `GET` | `/api/settings/calling` | Retrieves calling hours, max retries, and timezone rules | Tenant JWT |
| `PUT` | `/api/settings/calling` | Updates automated calling rules | Tenant JWT |

### 6. Platform Administration
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/platform-admin/dashboard` | Platform metrics (total tenants, revenue, minutes) | Admin JWT |
| `GET` | `/api/platform-admin/clients` | Lists all client tenant organizations | Admin JWT |
| `POST` | `/api/platform-admin/clients` | Provisions a new tenant with initial credit allocation | Admin JWT |
| `PUT` | `/api/platform-admin/clients/:id` | Updates tenant quotas, calling limits, and status | Admin JWT |
| `GET` | `/api/platform-admin/settings` | Retrieves global settings (Sarvam keys, minute rate) | Admin JWT |
| `PUT` | `/api/platform-admin/settings` | Updates global platform parameters | Admin JWT |

---

## Directory Structure

```text
ACRM/
├── backend/
│   ├── prisma/
│   │   ├── migrations/             # Database schema migrations
│   │   └── schema.prisma           # Multi-tenant PostgreSQL models
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── ai-calling/         # Agent configuration & runtime endpoints
│   │   │   ├── auth/               # JWT authentication & account activation
│   │   │   ├── leads/              # Lead management & Excel imports
│   │   │   ├── platform-admin/     # Super admin management endpoints
│   │   │   ├── services/           # Service catalog endpoints
│   │   │   ├── settings/           # Company profile & calling settings
│   │   │   └── telephony/          # Twilio / Exotel webhook endpoints
│   │   ├── database/
│   │   │   └── prisma.service.ts   # Resilient DB service with in-memory fallback
│   │   ├── integrations/
│   │   │   ├── gemini/             # Google Gemini dynamic configuration engine
│   │   │   ├── sarvam/             # Sarvam AI Bulbul TTS & capabilities service
│   │   │   └── telephony/          # Telephony trunk provider service
│   │   └── services/               # Core business logic services
│   ├── .env                        # Backend environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login & password reset pages
│   │   │   ├── (client)/           # Tenant client workspace
│   │   │   │   └── workspace/
│   │   │   │       ├── ai-calling/ # Voice Agent Studio
│   │   │   │       ├── calls/      # Call records & audio playback
│   │   │   │       ├── customers/  # Contact directory
│   │   │   │       ├── dashboard/  # Tenant analytics dashboard
│   │   │   │       ├── sales-pipeline/ # Kanban opportunity board
│   │   │   │       └── services/   # Service offerings management
│   │   │   └── (platform-admin)/   # Super admin management portal
│   │   ├── components/             # Reusable UI components & modals
│   │   ├── features/
│   │   │   └── ai-calling/         # SarvamVoiceTestAgent & config modals
│   │   └── lib/                    # Axios API client & interceptors
│   ├── .env.local                  # Frontend environment configuration
│   └── package.json
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)
```bash
PORT=5000
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/acrm_db?schema=public"
JWT_SECRET="super-secret-acrm-jwt-key-change-in-production-2026"
JWT_EXPIRATION="7d"

# AI Voice Provider Credentials
SARVAM_API_KEY="sk_pg7requi_aWPL1e5Yz34tvhfFiUHfJTEK"
SARVAM_APP_RUNTIME_URL="https://apps.sarvam.ai/api/app-runtime/"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Telephony
TELEPHONY_WEBHOOK_SECRET="whsec_enterprise_telephony_secret"

APP_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
BACKEND_BASE_URL=http://localhost:5000
```

---

## Installation & Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL 15+ (optional, fallback in-memory store activates if offline)
- npm or yarn

### 1. Clone & Setup Backend
```bash
git clone https://github.com/Jeena-softwareDeveloper/voice-agents.git
cd voice-agents/backend
npm install
npm run build
npm run start:dev
```
Backend API will be running on `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run build
npm run start -p 3000
```
Frontend Web UI will be running on `http://localhost:3000`.

### Default Demo Credentials

| Role | Email | Password | Access |
|:---|:---|:---|:---|
| **Platform Super Admin** | `admin@acrmplatform.com` | `Admin@123456` | Full platform control, client management, billing |
| **Real Estate Tenant Admin** | `client@jjrealestate.in` | `Client@123456` | JJ Real Estate Developers workspace |
| **Cloud/IT Tenant Admin** | `client@cloudscale.io` | `Client@123456` | CloudScale Technologies workspace |
| **Education Tenant Admin** | `admissions@eduspark.edu.in` | `Client@123456` | EduSpark Academy workspace |

---

## Multi-Industry Verification

The system has been verified across 3 distinct business domains:

1. **Real Estate Domain (`JJ Real Estate Developers LLP`)**:
   - Dynamic Persona: Senior Property Consultant
   - Conversation Objective: Qualify homebuyer budget, preferred locations (Baner/Wagholi), and book weekend site visits.
   - Pricing: Starting at ₹35 Lakhs for plots, ₹85 Lakhs for luxury apartments.
   - Speaking Style: Tamil (`ta-IN`), Kavya natural voice, Bulbul v3.

2. **Cloud & IT Cybersecurity Domain (`CloudScale Technologies`)**:
   - Dynamic Persona: Cloud Solutions Specialist
   - Conversation Objective: Qualify engineering leaders for 40-point infrastructure security audits.
   - Pricing: Fixed ₹75,000 per audit with guaranteed cost optimization.
   - Speaking Style: Indian English (`en-IN`), Rohan voice, Bulbul v3.

3. **Higher Education Domain (`EduSpark Academy`)**:
   - Dynamic Persona: Postgraduate Executive Diploma in Generative AI Specialist
   - Conversation Objective: Counsel candidates, verify prerequisite STEM/coding background, and explain flexible 0% EMI tuition.
   - Pricing: ₹1,25,000 with university accreditation.
   - Speaking Style: Indian English / Hindi, Aarav voice, Bulbul v4-flash.

---

## License
Proprietary SaaS Platform. All rights reserved © 2026 Jeenora Technologies.
