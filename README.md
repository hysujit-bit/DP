# DP Work App — Setup Guide

## Quick Start

**Requirements:** Node.js installed (you already have this ✅)

### Step 1 — Install dependencies
Open your terminal/command prompt in the `dp-work-app` folder and run:
```
npm install
```
This will download React, Tailwind CSS, and all dependencies (~2-3 minutes).

### Step 2 — Start the app
```
npm run dev
```

### Step 3 — Open in browser
Go to: **http://localhost:5173**

---

## Login Credentials (Demo)

| Role      | Email               | Password       |
|-----------|---------------------|----------------|
| Admin     | admin@dp.app        | admin123       |
| Satsangee | pritosh@dp.app      | satsangee123   |
| Satsangee | debajyoti@dp.app    | satsangee123   |
| Satsangee | ashok@dp.app        | satsangee123   |
| Satsangee | ramesh@dp.app       | satsangee123   |
| Satsangee | priya@dp.app        | satsangee123   |

---

## What's in the App

- **Dashboard** — Stats overview, DA pipeline, members needing visits
- **Members** — Full list with search + filters. Click any member to see their profile.
- **Member Profile** — Log visits, mark Ishtabhrity paid, view full history
- **Add/Edit Member** — Complete form with all fields
- **Ishtabhrity Tracker** — Yesterday / Today / Tomorrow payment lists
- **DP Work Planner** — Weekend assignments grouped by worker
- **Admin Panel** — Manage workers, reset demo data (Admin only)

## Demo Data

Pre-loaded with 20 members across Bannerghatta and Banashankari SUKs, realistic visit logs, and payment history. All data is stored in your browser's localStorage — no server needed.

## Next Steps (Phase 2 — Firebase)

When you're ready to move to a real database, we'll:
1. Create a Firebase project (free)
2. Replace the `src/data/storage.js` layer with Firestore calls
3. Replace the mock auth with Firebase Auth
4. Deploy to Firebase Hosting (free, permanent URL)

All the UI, routing, and business logic stays the same — only the data layer changes.
