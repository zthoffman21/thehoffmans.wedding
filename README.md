# 💍 thehoffmans.wedding

A modern wedding website and guest portal.  
Built with **React + TypeScript + Vite** on **Cloudflare Pages / Workers**, powered by **D1 (SQLite)**, **R2 (storage)**, and **Resend (email)**.

---

## ✨ Features

### 🖥️ Public Site
- Elegant **landing**, **invite**, and **info** pages with responsive Tailwind design.
- **RSVP Portal** — search by family/name, per‑event toggles, dietary notes.
- **Gallery & Timeline** — photos served from R2 storage.
- **Guide & Travel** — venue maps, lodging, schedule highlights.

### 🔒 Admin Dashboard
- Secured with **Cloudflare Access**.
- Manage parties, members, RSVPs, dietary notes, and contact info.
- Email confirmations and reminders via **Resend**.

### 💌 Email Automation
- Resend integration for transactional messages:
  - RSVP confirmations
  - Reminder emails
  - Optional post‑event updates

---

## 🧱 Tech Stack

| Layer | Technologies |
|:------|:----------------|
| **Frontend** | React + TypeScript + Vite · Tailwind CSS |
| **Backend / API** | Cloudflare Pages Functions (`functions/api/*`) |
| **Jobs / Cron** | Cloudflare Workers (`workers/reminders-cron/*`) |
| **Database** | Cloudflare D1 (SQLite) — see `schema.sql`, `seed.sql` |
| **Storage** | Cloudflare R2 |
| **Email** | Resend API |
| **Deployment** | Cloudflare Pages + Wrangler CLI |

---

## 📁 Project Structure

```text
.
├─ functions/              # Cloudflare Pages Functions (API)
│  └─ api/
├─ workers/                # Scheduled/cron Workers
│  └─ reminders-cron/
├─ src/                    # React + TypeScript app
├─ public/                 # Static assets
├─ schema.sql              # D1 schema
├─ seed.sql                # D1 seed data
├─ wrangler.toml           # CF bindings (D1/R2/secrets) & routes
└─ README.md
```
