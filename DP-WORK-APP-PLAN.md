# DP Work App — Project Plan

> **Owner:** Sujit Kumar (sujit.kumar@kensaltensi.org)  
> **SUKs in scope:** Bannerghatta & Banashankari, Bangalore  
> **Created:** May 2026  
> **Purpose:** Replace Google Sheets with a real-time web application to manage Gurubhai outreach, Ishtabhrity tracking, and DP field work activities.

---

## Table of Contents

1. [Background & Context](#1-background--context)
2. [Member Categories](#2-member-categories)
3. [Key Terminology](#3-key-terminology)
4. [Features & Requirements](#4-features--requirements)
5. [Data Model](#5-data-model)
6. [App Screens](#6-app-screens)
7. [User Roles & Access Control](#7-user-roles--access-control)
8. [Tech Stack](#8-tech-stack)
9. [Development Phases](#9-development-phases)
10. [Data Migration from Excel](#10-data-migration-from-excel)
11. [Existing Excel Structure Reference](#11-existing-excel-structure-reference)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Future Scope](#13-future-scope)

---

## 1. Background & Context

DP (Dharma Prachar) work is a weekend outreach activity where Satsangees visit Gurubhais (fellow spiritual practitioners) across their SUK (local chapter). The goals of these visits include:

- Ensuring Ishtabhrity (regular monthly contribution) is submitted on time
- Helping Gurubhais who face difficulties with Ishtabhrity deposits
- Re-engaging Gurubhais who have become inactive or left (Defaulters)
- Nurturing Prospects toward taking Dikhya (spiritual initiation)
- Making all members feel loved, included, and connected to the community
- Encouraging members to keep a Thakur Asthan (prayer space) at home
- Tracking portal registration progress (FW Pending → FW Completed → DA Approved)

Currently this is managed across multiple Google Sheets / Excel files — one per SUK. The app replaces these with a single real-time platform accessible on phones, tablets, and laptops.

The app is currently planned for **Bannerghatta** and **Banashankari** SUKs in Bangalore, with architecture designed to scale to additional SUKs across Karnataka and beyond.

---

## 2. Member Categories

These are the seven distinct categories of people tracked in the system. A person can be in one primary category at a time, but their status evolves over time.

### 2.1 Active DP Workers (`ACTIVE_DP_WORKER`)
- Super-active Satsangees who participate in weekend DP field work
- They are the primary **users** of this application
- Assigned to visit specific Gurubhais each weekend
- Can log visits, update Ishtabhrity status, and report field activity

### 2.2 Regular Contributors (`REGULAR_CONTRIBUTOR`)
- Taken Dikhya, pay Ishtabhrity regularly
- Not yet involved in active DP work
- Goal: Make them feel included, encourage Thakur Asthan at home, gradually bring them into DP work participation
- Ishtabhrity Status: `REGULAR`

### 2.3 Semi-Active / New (`SEMI_ACTIVE`)
- Taken Dikhya but Ishtabhrity is not regular
- May be new initiates still learning, or busy with life circumstances
- Need gentle encouragement, love, and hand-holding
- Goal: First make them regular with Ishtabhrity, then encourage Thakur Asthan
- Ishtabhrity Status: `IRREGULAR` or `NEW`

### 2.4 Defaulters (`DEFAULTER`)
- Previously took Dikhya but have left or stopped practising
- Need to be re-engaged and brought back to the right path
- **Critical tracking**: Visit log (up to 10 visits), last Ishtabhrity date, full address with map, Guardian's name
- Similar care and attention as Prospects
- Ishtabhrity Status: `INACTIVE`

### 2.5 Prospects (`PROSPECT`)
- Have **not** yet taken Dikhya (`isAdikshita = true`)
- Families or individuals who are being nurtured toward initiation
- We visit them regularly, build relationships, provide seva
- Goal: One day they or a family member takes Dikhya
- **Critical tracking**: Full visit log, contact number, address, family members

### 2.6 Super New (`SUPER_NEW`)
- Took Dikhya very recently (within last few months)
- Need special onboarding attention:
  - Ensure they start Ishtabhrity
  - Get their details properly logged in the main DP portal
  - Get them digitized (photos, contact info)
  - Verify Family Code assigned correctly
- DP Status is likely `FW_PENDING` or `FW_COMPLETED`

### 2.7 Removed (`REMOVED`)
- Members who have moved to another city/area and are no longer part of this SUK
- **Soft-deleted** — data is retained for historical reference but hidden from active lists
- A reason and date of removal is logged

---

## 3. Key Terminology

| Term | Meaning |
|------|---------|
| **SUK** | Local chapter/unit (e.g., Bannerghatta, Banashankari) |
| **Dikhya** | Spiritual initiation ceremony |
| **Adikshita** | One who has not yet taken Dikhya |
| **Ishtabhrity** | Regular monthly spiritual contribution (monetary) |
| **Ritwik** | The spiritual guide/priest associated with the member |
| **Thakur Asthan** | Prayer space / altar at member's home |
| **DP Work** | Weekend outreach activity (Dharma Prachar work) |
| **Defaulter** | A person who took Dikhya but left the practice |
| **Prospect** | A person being nurtured toward taking Dikhya |
| **FW Pending** | Form work not yet submitted to main DP portal |
| **FW Completed** | Form work submitted but not yet approved |
| **DA Approved** | Fully registered and approved in the main DP portal |
| **SPOC** | Single Point of Contact — the assigned DP worker for a member |
| **Satsangee** | A member of the spiritual community |
| **Gurubhai** | Fellow initiated member (literally "brother in the Guru") |

---

## 4. Features & Requirements

### 4.1 Core Features (Phase 1)

- **Member management**: Add, edit, remove (soft-delete) members with all fields
- **Member search & filter**: Search by name, phone, Family Code; filter by category, SUK, area, DP Status, Ishtabhrity status
- **Member profile page**: Full profile with all statuses, address, contact, assigned worker
- **Visit log**: Log a visit against any member — date, who visited, notes, outcome, next action
- **Visit history**: See all past visits for a member in chronological order
- **Excel import**: One-time import of existing data from the two Excel files
- **Two SUKs**: Bannerghatta and Banashankari available at launch

### 4.2 Ishtabhrity Features (Phase 2)

- **Today's due list**: Auto-generated list of members whose Ishtabhrity is due today
- **Yesterday's list**: Members whose Ishtabhrity was due yesterday (follow-up)
- **Tomorrow's list**: Members whose Ishtabhrity is due tomorrow (plan ahead)
- **Mark as paid**: Real-time "Done" toggle on the daily list
- **Monthly history**: Per-member payment history showing which months were paid
- **Irregular alert**: Flag members who have missed 2+ consecutive months
- **Running totals**: Count and amount of collected vs outstanding per day

### 4.3 DP Work Planning (Phase 2)

- **Weekend planner**: Create a visit plan for the upcoming weekend
- **Assign workers**: Assign specific DP workers to specific members for the weekend
- **Worker's list**: Each worker can see their personal assignment list
- **Area-based grouping**: Group nearby members together for efficient visits
- **Prayer planning**: Track Green / Orange / Red status for Thakur Asthan

### 4.4 Admin & Reports (Phase 3)

- **Dashboard**: Overview stats — members by category, payments this month, pending visits
- **DA pipeline**: Track how many members are at FW Pending / FW Completed / DA Approved
- **SUK-wise report**: Summary for each SUK
- **Category breakdown**: Counts and trends for each member category
- **Export to Excel**: Download any list as an Excel file
- **Manage workers**: Add/remove DP workers, assign them to SUKs
- **WhatsApp quick-share**: Share a member's address or contact via WhatsApp

### 4.5 Field Work Support

- **Google Maps link**: Tap to open address in Google Maps during field visits
- **Quick call**: Tap phone number to call directly from the app
- **Offline queue** *(Phase 3)*: Log visits even without internet, sync when back online

---

## 5. Data Model

### 5.1 SUK

```
SUK {
  id:           string (auto)
  name:         string           // "Bannerghatta", "Banashankari"
  city:         string           // "Bangalore"
  areas:        string[]         // ["Hulimavu", "JP Nagar", ...]
  createdAt:    timestamp
}
```

### 5.2 Person (Member)

```
Person {
  id:                  string (auto)
  familyCode:          string (unique)   // e.g. "022321293091"
  name:                string
  guardianName:        string
  contactNo:           string
  ritwikName:          string
  sukId:               ref → SUK
  assignedTo:          ref → Worker      // SPOC for this person

  // Category & Statuses
  memberCategory:      enum → MemberCategory
  dpStatus:            enum → DPStatus
  ishtabhritiStatus:   enum → IshtabhritiStatus
  hasAsthan:           boolean           // Has Thakur Asthan at home
  isAdikshita:         boolean           // Has NOT taken Dikhya

  // Address
  area:                string            // locality / neighbourhood
  pinCode:             string
  permanentAddress:    string
  presentAddress:      string
  geoLocation:         string            // Google Maps URL

  // Metadata
  createdAt:           timestamp
  updatedAt:           timestamp
  createdBy:           ref → Worker
  lastVisitDate:       timestamp         // denormalised for easy sorting
  
  // Soft delete
  isRemoved:           boolean
  removedAt:           timestamp
  removedReason:       string            // "Moved to Delhi", etc.
}
```

**MemberCategory enum:**
```
ACTIVE_DP_WORKER | REGULAR_CONTRIBUTOR | SEMI_ACTIVE | 
DEFAULTER | PROSPECT | SUPER_NEW | REMOVED
```

**DPStatus enum:**
```
FW_PENDING | FW_COMPLETED | DA_APPROVED | NOT_APPLICABLE
```

**IshtabhritiStatus enum:**
```
REGULAR | IRREGULAR | NEW | INACTIVE | NOT_APPLICABLE
```

### 5.3 VisitLog

```
VisitLog {
  id:          string (auto)
  personId:    ref → Person
  visitDate:   date
  visitedBy:   ref → Worker
  notes:       string             // free-text field notes from visit
  outcome:     string             // what happened
  nextAction:  string             // what to do next time
  createdAt:   timestamp
}
```

### 5.4 IshtabhritiPayment

```
IshtabhritiPayment {
  id:            string (auto)
  personId:      ref → Person
  familyCode:    string           // denormalised for fast lookup
  paymentDate:   date
  amount:        number
  monthCovered:  string           // "2026-05" (YYYY-MM)
  recordedBy:    ref → Worker
  createdAt:     timestamp
}
```

### 5.5 Worker (DP Worker / App User)

```
Worker {
  id:          string (auto)
  uid:         string            // Firebase Auth UID
  name:        string
  contactNo:   string
  email:       string
  sukIds:      ref[] → SUK       // which SUKs they belong to
  role:        enum → Role       // ADMIN | SATSANGEE
  areas:       string[]          // areas they are responsible for
  isActive:    boolean
  createdAt:   timestamp
}
```

**Role enum:**
```
ADMIN | SATSANGEE
```

---

## 6. App Screens

### 6.1 Authentication
- Email + password login
- "Forgot password" flow
- No self-registration — accounts created by Admin only

### 6.2 Dashboard (Home)
- Stats cards: Total members, Ishtabhrity due today, Pending follow-ups, New this month
- DA Pipeline progress bar: FW Pending → FW Completed → DA Approved
- Today's Ishtabhrity due list (quick preview, top 5)
- Members needing visit soon (not visited in 30+ days)
- Quick action buttons: Log Visit, Add Member, Mark Payment

### 6.3 Members List
- Searchable, filterable list of all members
- Filters: Category, SUK, Area, DP Status, Ishtabhrity Status, Assigned Worker
- Sort by: Name, Last Visit Date, Ishtabhrity Status
- Tap a member to go to their profile
- FAB button to add new member

### 6.4 Member Profile
- Full contact info with tap-to-call and WhatsApp
- Google Maps button for address
- Status chips: Category, DP Status, Ishtabhrity Status, Asthan
- Assigned SPOC worker
- Action buttons: Log Visit, Mark Payment, Edit Profile, Remove Member
- **Visit Log tab**: Chronological list of all visits with notes
- **Ishtabhrity tab**: Month-by-month payment history grid

### 6.5 Add / Edit Member
- Form with all fields from the data model
- Category selector (with descriptions to guide correct selection)
- Address fields + Google Maps URL paste field
- Assign to a DP worker
- Save → navigates to the new member's profile

### 6.6 Log Visit (modal / bottom sheet)
- Date (defaults to today)
- Notes (free text)
- Outcome (free text or dropdown: "Responsive", "Not Home", "Will Resume", "Not Interested")
- Next Action
- Submit → updates `lastVisitDate` on the person

### 6.7 Ishtabhrity Tracker
- Tab bar: Yesterday / Today / Tomorrow
- Each tab shows list of members due for that date
- "Done" toggle per member — marks payment recorded
- Running total at top: X paid / Y total, ₹ collected
- Tap a member to view their full profile

### 6.8 DP Work Planner
- Calendar to select weekend date
- List of unassigned members for that weekend
- Assign members to workers
- Worker view: see your own weekend assignment list
- Area-grouped view for efficient routing

### 6.9 Reports (Admin only)
- SUK-wise summary table
- Category breakdown with counts
- DA approval pipeline (funnel chart)
- Monthly Ishtabhrity collection summary
- Export any report as Excel

### 6.10 Admin Panel (Admin only)
- **Workers tab**: List of DP workers, add/deactivate workers
- **SUKs tab**: Manage SUK names and areas
- **Import Data tab**: Upload Excel to import/refresh member data
- **User Accounts tab**: Reset passwords, change roles

---

## 7. User Roles & Access Control

| Feature | Admin | Satsangee |
|---------|-------|-----------|
| View all members | ✅ | ✅ |
| Add new member | ✅ | ✅ |
| Edit member details | ✅ | ✅ |
| Log a visit | ✅ | ✅ |
| Mark Ishtabhrity paid | ✅ | ✅ |
| View Ishtabhrity tracker | ✅ | ✅ |
| View DP Work Planner | ✅ | ✅ |
| Assign workers in planner | ✅ | ❌ |
| Remove / soft-delete member | ✅ | ❌ |
| View reports | ✅ | ❌ |
| Export to Excel | ✅ | ❌ |
| Manage workers / users | ✅ | ❌ |
| Import Excel data | ✅ | ❌ |
| Manage SUKs | ✅ | ❌ |

---

## 8. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React (Vite) | Fast, component-based, large ecosystem |
| UI Components | shadcn/ui + Tailwind CSS | Clean modern UI, mobile-responsive |
| Database | Firebase Firestore | Real-time sync, generous free tier, offline support |
| Authentication | Firebase Auth | Email/password, easy to manage users |
| Hosting | Firebase Hosting | Free, fast CDN, custom domain support |
| PWA | Vite PWA plugin | Install on phone home screen, offline capability |
| Maps | Google Maps URL links | Simple — paste location URL into the record |
| Excel import | SheetJS (xlsx) | Parse uploaded Excel files for data migration |
| Excel export | SheetJS (xlsx) | Generate downloadable reports |
| State management | React Query + Zustand | Server state + UI state |

### Project Structure (suggested)

```
dp-work-app/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Route-level page components
│   │   ├── Dashboard.jsx
│   │   ├── Members/
│   │   │   ├── MembersList.jsx
│   │   │   ├── MemberProfile.jsx
│   │   │   └── AddEditMember.jsx
│   │   ├── Ishtabhrity/
│   │   │   └── IshtabhritiTracker.jsx
│   │   ├── DPWork/
│   │   │   └── WorkPlanner.jsx
│   │   ├── Reports/
│   │   │   └── Reports.jsx
│   │   └── Admin/
│   │       └── AdminPanel.jsx
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Firebase CRUD operations
│   │   ├── members.js
│   │   ├── visits.js
│   │   ├── payments.js
│   │   └── auth.js
│   ├── utils/             # Helpers (date formatting, Excel parsing, etc.)
│   ├── constants/         # Enums, category definitions, SUK list
│   └── App.jsx
├── public/
├── firebase.json
├── firestore.rules        # Security rules
├── firestore.indexes.json
└── package.json
```

### Firebase Firestore Collections

```
/suks/{sukId}
/workers/{workerId}
/persons/{personId}
/visitLogs/{logId}
/ishtabhritiPayments/{paymentId}
```

### Firestore Security Rules (outline)

```javascript
// Only authenticated users can read/write
// Admins can write to all collections
// Satsangees can read all, write to visitLogs and ishtabhritiPayments
// Satsangees can create/edit persons but cannot delete
// No user can read another user's auth info
```

---

## 9. Development Phases

### Phase 1 — Core App (Target: 2 weeks)

**Goal:** Minimum working product. Replace the spreadsheet for daily member management.

- [ ] Firebase project setup (Auth + Firestore + Hosting)
- [ ] Authentication (login, logout, role check)
- [ ] SUK setup: Bannerghatta + Banashankari
- [ ] Members list page with search and filter
- [ ] Member profile page (view all details)
- [ ] Add Member form
- [ ] Edit Member form
- [ ] Soft-delete / Remove member with reason
- [ ] Log Visit modal
- [ ] Visit history on member profile
- [ ] Excel import tool (one-time data migration from existing files)
- [ ] Deploy to Firebase Hosting

**Deliverable:** Team can view all members, log visits, add new members. Existing data migrated from Excel.

---

### Phase 2 — Ishtabhrity & DP Planning (Target: 1 week after Phase 1)

**Goal:** Support the daily and weekend workflow.

- [ ] Ishtabhrity tracker: Today / Yesterday / Tomorrow lists
- [ ] Mark Ishtabhrity as paid (real-time toggle)
- [ ] Monthly payment history on member profile
- [ ] Irregular members alert list
- [ ] Dashboard with stats cards and DA pipeline
- [ ] DP Work weekend planner
- [ ] Assign workers to members for the weekend
- [ ] Worker's personal assignment list view

**Deliverable:** Team can manage the daily Ishtabhrity workflow and plan weekend DP visits.

---

### Phase 3 — Scale, Reports & Polish (Target: 1 week after Phase 2)

**Goal:** Make it production-ready and scalable.

- [ ] Admin reports page
- [ ] Export any list to Excel
- [ ] PWA manifest + service worker (install on phone)
- [ ] Offline visit log queue (sync when internet restored)
- [ ] WhatsApp share button (share member address/contact)
- [ ] Add more SUKs (parameterised — no code change needed)
- [ ] Prayer planning (Green/Orange/Red Asthan status view)
- [ ] Performance optimisation (pagination, lazy loading)
- [ ] Firestore security rules hardening

**Deliverable:** Full production app. Can onboard other SUKs. Works reliably on phones in the field.

---

## 10. Data Migration from Excel

Two Excel files need to be imported. The import tool should be built as part of Phase 1.

### File 1: `Bannerghatta SUK Details.xlsx`

| Excel Sheet | Maps To | Notes |
|------------|---------|-------|
| `Dikshya_Database` | `persons` collection | Primary member data. See column mapping below. |
| `Defaulter` | `persons` + `visitLogs` | Import as `memberCategory: DEFAULTER`. Visit columns → individual VisitLog entries. |
| `Istabhruti_Database` | `ishtabhritiPayments` | Monthly T/F columns → individual payment records. |

**Dikshya_Database column mapping:**

| Excel Column | Firestore Field |
|-------------|----------------|
| Family Code | `familyCode` |
| Names | `name` |
| Contact No. | `contactNo` |
| Ritwik Name | `ritwikName` |
| Assinged Person | `assignedTo` (name, match to Worker) |
| DP status | `dpStatus` (map: "FW completed"→`FW_COMPLETED`, "DA Approved"→`DA_APPROVED`) |
| Istavrity Status | `ishtabhritiStatus` (map: "Regular"→`REGULAR`, "Irregular"→`IRREGULAR`) |
| _Address_ / Present Add. | `presentAddress` |
| Permanent Add. | `permanentAddress` |
| PIN Code | `pinCode` |
| Thakur Asthan Status | `hasAsthan` |
| No of Visit | Use to pre-populate visit count note |
| Remark | Seed as first VisitLog entry if non-empty |
| Google Map Location | `geoLocation` |
| Adikshita (boolean) | `isAdikshita` |

**Defaulter column mapping:**

| Excel Column | Firestore Field |
|-------------|----------------|
| Full Name | `name` |
| Guardian's Name | `guardianName` |
| Family Code | `familyCode` |
| Last Istavrity Date | Seed as `IshtabhritiPayment` entry |
| Address | `presentAddress` |
| Assigned Person | `assignedTo` |
| VISIT 1 … VISIT 10 | Create individual `VisitLog` entries (date = import date if no date in cell) |

### File 2: `BANASHANKARI-SUK-LIST.xlsx`

| Excel Sheet | Maps To | Notes |
|------------|---------|-------|
| `Banashankari` | `persons` (sukId = Banashankari) | Same column structure as Bannerghatta |
| `siddapa Layout` | `persons` (sukId = Banashankari, area = "Siddapa Layout") | Sub-area of Banashankari |

### Import Process

1. Admin uploads Excel file through the Admin Panel → Import Data tab
2. App parses file using SheetJS
3. Preview shown: X new records, Y potential duplicates (matched by Family Code)
4. Admin confirms → records written to Firestore
5. Duplicate Family Codes are flagged for manual review, not auto-overwritten

---

## 11. Existing Excel Structure Reference

The following sheets exist in the Bannerghatta Excel file and their current purpose:

| Sheet | Purpose | App equivalent |
|-------|---------|---------------|
| `Dikshya_Database` | Master member list | Members collection |
| `Prayer_Planning` | Green/Orange/Red Asthan tracking | `hasAsthan` field + Prayer Planning view |
| `Defaulter` | Defaulter tracking with visit log | Filtered Members view (category=DEFAULTER) |
| `Regular Activity` | Members for regular follow-up | Filtered Members view |
| `2025_SVBNG_UTSAV` | Event attendance | Future: Events feature |
| `Istabhruti_Database` | Monthly payment history | IshtabhritiPayments collection |
| `istavrity_plan_new` | Upcoming month planning | Ishtabhrity Tracker |
| `TODAY_Istabruti_List` | Today's due list | Ishtabhrity Tracker — Today tab |
| `Yesterday_List` | Yesterday's due list | Ishtabhrity Tracker — Yesterday tab |
| `Today+1_List` | Tomorrow's due list | Ishtabhrity Tracker — Tomorrow tab |
| `Current_Action` | Quick follow-up list | Dashboard pending actions |
| `Jajan Chowki` | Area-wise worker distribution | DP Work Planner |
| `Dont Touch` | Archived/sensitive records | Keep as separate Firestore flag |

---

## 12. Non-Functional Requirements

- **Devices**: Works on mobile phones (primary), tablets, and desktops/laptops
- **Language**: English only
- **Browser support**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Performance**: Member list loads in under 2 seconds for up to 1,000 records per SUK
- **Real-time**: Changes made by one user visible to others within 2 seconds
- **Security**: Firebase Auth required for all data access. No public read/write access.
- **Scale**: Architecture supports up to 20 SUKs and 10,000 members without redesign
- **Cost**: Must stay within Firebase free tier (Spark plan) for pilot. Upgrade if needed.
- **Data safety**: No hard deletes. All removed members are soft-deleted with reason and date.

---

## 13. Future Scope

These features are not in the current plan but worth considering once the app is stable:

- **Notifications**: Push notifications for upcoming Ishtabhrity due dates
- **Multi-city**: Extend beyond Bangalore to other cities/states
- **DP Portal sync**: API integration with the main DP portal for FW/DA status updates
- **Events module**: Track event attendance (like the `2025_SVBNG_UTSAV` sheet)
- **Analytics**: Trends over time — conversion of Prospects, Defaulter recovery rate
- **Family view**: See all members of the same family in one place (linked by Family Code)
- **Bulk SMS / WhatsApp**: Send reminders to a group (e.g., all irregular Ishtabhrity members)
- **Photo**: Attach a photo to a member's profile for field identification

---

*This document should be kept updated as the project evolves. If using Claude Code, drop this file in the project root as `CLAUDE.md` and Claude will use it as context automatically.*
