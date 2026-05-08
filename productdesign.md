# TechMinds Academy Management System  
**Product Design Document (MVP)**

**Version:** 1.0  
**Date:** May 04, 2026  
**Product Owner:** Harry (Founder, Tech Minds Academy)  
**Status:** Approved for Development

---

## Vision

The **TechMinds Academy Management System** is more than just a logger — it is the **Command Center** and single source of truth for the entire academy.

It serves as the central “organizational guide” that provides **real-time visibility** into the academy’s health. Every daily income and every budget demand is tracked transparently, ensuring that the status of the organization is always known and clear to every staff member.

**Tagline:**  
*"One login. Total clarity. Zero guesswork."*

---

## Target Users (Internal Staff Only)

| Role          | Permissions                              | Main Tasks                              |
|---------------|------------------------------------------|-----------------------------------------|
| **Admin**     | Full access                              | Approve/reject budgets, view everything |
| **Clerk**     | Log income + Create budget demands       | Daily income entry, request funds       |
| **Instructor**| View-only + Log income (if they collect fees) | Quick income logging                    |

---

## Core Features (MVP)

### 1. Authentication
- Login with Email + Password
- Role-based access after login
- “Remember me” option

### 2. Smart Dashboard (The Command Center)
- **Real-time Status Banner**: “Optimal”, “Warning”, or “Critical” based on pending demands and cash position
- **Financial Snapshot Cards**:
  - Total Income This Month
  - Total Pending Budget Demands
  - Approved Expenditure This Month
  - Current Cash Position
- **Live Activity Feed**: Chronological view of latest income and approved budget transactions
- Quick action buttons: “Log Income” and “Request Budget”

### 3. Daily Income Logging
- Categorized entry: **Tuition**, **Workspace**, **ID Card**, **Other**
- Naira (₦) formatting with live preview
- Optional fields: Description / Student Name / Date
- Instant audit history table

### 4. Budget & Team Demands
- Any staff can submit a **Budget Demand** with:
  - Title
  - Amount (₦)
  - Justification (textarea)
  - Priority: Low / Medium / High / Urgent
- Admin approval workflow (Approve / Reject)
- Approved demands are automatically added to expenditure
- Clear status badges (Pending / Approved / Rejected)

### 5. Persistence & Reliability
- Real backend (Express.js + MongoDB)
- All data synced across multiple staff members
- Full audit trail (who did what and when)

---

## Design System (Premium Glassmorphism)

**Color Palette**
- Primary: `#6366F1` (Indigo-500) & `#A855F7` (Violet-500)
- Background: Dark mode (`#0F0F1A`)
- Glass cards: `rgba(255,255,255,0.08)` + backdrop blur
- Text: White + `#E2E8F0`

**Typography**
- Font: **Outfit** (Google Fonts)
- Headings: Semi-bold, 24–32px
- Body: 16px

**UI Style**
- Heavy glassmorphism effect
- Smooth hover animations and glows
- Rounded corners (16px–24px)
- Icons: Lucide React / Heroicons

---

## Screen Flow

1. **Login Screen** – Clean centered card with TechMinds logo
2. **Dashboard** – Main screen with status banner, snapshot cards, and activity feed
3. **Log Income** – Fast modal/form
4. **Budget Requests** – Table view + “New Demand” button
5. **Staff Management** – Simple list (Admin only)

---

## Technical Requirements

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS
- Glassmorphism styling

**Backend**
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication

**Other**
- Fully responsive (mobile + desktop)
- Polling for live updates (MVP)
- Deployment: Vercel (frontend) + Render.com (backend)

---
