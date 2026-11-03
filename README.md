# CRIMSON APEX — PLAYER GATEWAY
> **"RISE ABOVE. RULE THE ARENA."**

An esports tournament registration web platform and management console engineered for **Crimson Apex**, hosting competitive Free Fire Battle Royale championships.

---

## 1. Overview & Key Capabilities

- **Esports Player Gateway**: High-impact, dark/crimson/metallic responsive interface with authentic vector insignia and arena visual assets.
- **Dynamic Roster Modes & Pricing**:
  - **SOLO**: 1 Operative — ₹30 / player
  - **DUO**: 2 Operatives — ₹50 / duo team
  - **SQUAD**: 4 Operatives — ₹100 / 4-player team
- **Collision-Resistant Automatic Code Generation**:
  - Atomic server-side sequence generation with readable prefixes (`CA-S-XXXX`, `CA-D-XXXX`, `CA-SQ-XXXX`) and team codes (`CA-P-XXXX`, `CA-TM-XXXX`, `CA-SQD-XXXX`).
  - Serialized transactions (`BEGIN IMMEDIATE`) preventing duplicate numbers even under concurrency.
- **Roster Validation & Duplicate Guard**:
  - Indian 10-digit phone verification (`^[6-9]\d{9}$`).
  - Free Fire UID validation (8–12 numeric digits).
  - Internal roster duplication checks (prevents registering the same player twice in a squad).
  - Duplicate registration protection (blocks duplicate entries for existing phone numbers or leader UIDs).
- **Digital Registration Pass**:
  - Animated code reveal banner.
  - Holographic pass with verification QR simulator, sanitized team dossier, copy actions, and print/save PDF styles (`@media print`).
- **Public Pass Lookup Gate**:
  - Instant code lookup for players to check admission status (`Submitted`, `Awaiting Payment Verification`, `Confirmed`, `Rejected`, `Cancelled`).
  - Strict privacy guard: player phone numbers and internal IDs are filtered out of public lookup responses.
- **Protected Organizer Admin Operations**:
  - First-time setup wizard to initialize administrator master password (no hardcoded passwords).
  - Cryptographic password hashing (`scryptSync` with random salt).
  - HMAC SHA256 session token management (`Bearer`).
  - Real-time KPI Overview (Total entries, Solo/Duo/Squad breakdown, Confirmed, Pending, Rejected, Expected Pool, Verified Collections).
  - Search, filter, inspect full dossiers, independent status approval, rejection with mandatory reason dialog, and payment verification toggles.
  - Live tournament configuration editor (adjust fees, capacity limits, toggle registration open/closed, set announced match date, edit UPI payment details).
  - Chronological audit logging.
  - Authorized CSV roster export.

---

## 2. Database Schema (SQLite / Relational SQL)

Stored persistently in `data/crimson_apex.db` (WAL mode enabled):

### `tournaments`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `slug` TEXT UNIQUE NOT NULL
- `tagline` TEXT NOT NULL
- `status` TEXT NOT NULL DEFAULT 'open'
- `registration_open` INTEGER NOT NULL DEFAULT 1
- `registration_limit` INTEGER NOT NULL DEFAULT 100
- `solo_fee` INTEGER NOT NULL DEFAULT 30
- `duo_fee` INTEGER NOT NULL DEFAULT 50
- `squad_fee` INTEGER NOT NULL DEFAULT 100
- `announced_date` TEXT (nullable)
- `rules` TEXT NOT NULL
- `payment_upi_id` TEXT NOT NULL
- `payment_instructions` TEXT NOT NULL
- `contact_email` TEXT NOT NULL
- `contact_phone` TEXT NOT NULL
- `created_at`, `updated_at` TEXT

### `sequences`
- `mode` TEXT PRIMARY KEY ('SOLO', 'DUO', 'SQUAD')
- `current_val` INTEGER NOT NULL DEFAULT 0

### `registrations`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `registration_code` TEXT UNIQUE NOT NULL
- `team_code` TEXT UNIQUE NOT NULL
- `tournament_id` INTEGER NOT NULL REFERENCES `tournaments(id)`
- `team_name` TEXT
- `game_mode` TEXT NOT NULL
- `leader_name` TEXT NOT NULL
- `leader_phone` TEXT NOT NULL
- `college_name` TEXT NOT NULL
- `status` TEXT NOT NULL DEFAULT 'Submitted'
- `payment_status` TEXT NOT NULL DEFAULT 'Pending'
- `payment_reference` TEXT
- `fee` INTEGER NOT NULL
- `rejection_reason` TEXT
- `created_at`, `updated_at` TEXT

### `players`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `registration_id` INTEGER NOT NULL REFERENCES `registrations(id)` ON DELETE CASCADE
- `full_name` TEXT NOT NULL
- `free_fire_uid` TEXT NOT NULL
- `inGame_name` TEXT NOT NULL
- `is_team_leader` INTEGER NOT NULL DEFAULT 0
- `phone` TEXT

### `admin_users`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `username` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `salt` TEXT NOT NULL
- `role` TEXT NOT NULL DEFAULT 'admin'
- `created_at` TEXT

### `admin_audit_logs`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `admin_username` TEXT NOT NULL
- `registration_id` INTEGER
- `registration_code` TEXT
- `action` TEXT NOT NULL
- `reason` TEXT
- `created_at` TEXT

---

## 3. Local Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   Configure `ADMIN_SESSION_SECRET` with any secure string.

3. **Run Unit Tests**:
   ```bash
   npx --yes tsx --test src/utils/validation.test.ts
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:3000`.

---

## 4. Production Deployment Instructions

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This compiles the Vite React frontend into `dist/`.

2. **Run Full-Stack Server**:
   ```bash
   NODE_ENV=production npx tsx server.ts
   # or node server.js when compiled
   ```

3. **Persistent Volume Mounting**:
   Ensure the `data/` directory is mounted on a persistent volume (e.g. Cloud Run Volume Mount or Docker named volume) so `crimson_apex.db` persists across container restarts.

---

## 5. Verification & Testing Checklist

- [x] **SOLO Registration**: Created single-operative pass with fee ₹30 and sequence `CA-S-0001` / `CA-P-0001`.
- [x] **SQUAD Registration**: Created 4-player roster with fee ₹100 and sequence `CA-SQ-0001` / `CA-SQD-0001`.
- [x] **Roster Duplicate Prevention**: Verified that duplicate Free Fire UIDs within a team are blocked.
- [x] **Submission Duplicate Guard**: Attempting to register with an existing leader phone/UID returns an explicit 400 error.
- [x] **Pass Verification Lookup**: Verified that searching `CA-S-0001` retrieves the pass without exposing private phone numbers.
- [x] **Initial Admin Setup**: Tested administrator master account initialization and scrypt password hashing.
- [x] **Admin Approval & Payment Separation**: Successfully updated registration to `Confirmed` and payment to `Verified`.
- [x] **Authorized CSV Export**: Verified that the CSV export includes formatted rosters, fees, contact numbers, and status.
- [x] **Responsive Mobile Layout**: Tested at 390x844 mobile viewport for clean touch-friendly navigation.
