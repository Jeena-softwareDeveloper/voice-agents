# Sarvam AI Conversational Voice Telephony Architecture

## 1. Outbound Calling Lifecycle

```
[Lead Identified for Calling]
              │
              ▼
[Eligibility Check Engine]
  ├─ 1. Tenant Status Active?
  ├─ 2. Service Approved & AI Config Active?
  ├─ 3. Local Calling Window (9 AM - 8 PM)?
  ├─ 4. Customer Consent Granted?
  ├─ 5. Calling Quota Balance Available?
  └─ 6. Retry Cap Not Exceeded (< 3)?
              │
              ▼
[Sarvam Voice Engine Dispatch]
  ├─ Opening Intro Script
  ├─ Dynamic Company Identity Binding
  ├─ Voice Persona (Meera / Arvind / Kavya)
  ├─ Indian Language (Hindi, English-IN, Tamil, etc.)
  ├─ Qualification Questions Engine
  └─ Real-time Objection Handling
              │
              ▼
[Call Execution & Real-Time Audio Telemetry]
              │
              ▼
[Post-Call Webhook & Reconciliation]
  ├─ Duration & Billable Seconds Captured
  ├─ Transcript & Audio Recording Archived
  ├─ Qualification & Summary Synthesized
  ├─ Immutable AI Usage Ledger Entry (Idempotency Key)
  ├─ Lead Status Advanced (e.g. QUALIFIED / INTERESTED)
  └─ Follow-up / Callback Auto-Scheduled
```

## 2. Voice Personas & Languages Supported
- **Meera (`meera`)**: Warm, professional Indian female voice suitable for high-touch real estate & wealth enquiries.
- **Arvind (`arvind`)**: Authoritative, articulate Indian male voice for commercial finance and B2B services.
- **Kavya (`kavya`)**: Friendly, approachable tone for clinic appointments and customer assistance.
- **Languages**: Hindi (`hi-IN`), English (`en-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Marathi (`mr-IN`), Bengali (`bn-IN`), Kannada (`kn-IN`), Gujarati (`gu-IN`).

## 3. TRAI & Telecom Compliance
- Strict enforcement of permitted calling hours (09:00 - 20:00).
- Transparent caller identification and AI disclosure.
- Instant opt-out handling with contact consent revocation.
