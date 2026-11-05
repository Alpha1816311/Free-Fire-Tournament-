# CRIMSON APEX — DATABASE RESTORATION & VERIFICATION GUIDE

This package contains the fully verified, original registration data recovered from the Crimson Apex esports tournament system.

---

## 1. Verified Record Summary

- **Total Registrations Recovered**: 3
- **Total Players Recovered**: 6
- **Status of Original Database**: 100% Intact & Unmodified
- **Total Entry Value**: ₹160

### Verified Teams & Rosters

| Reg Code | Team Code | Game Mode | Team Name | Team Leader | Leader Phone | College / Org | Status | Entry Fee |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CA-SQ-0001** | CA-SQD-0001 | SQUAD | Crimson Titans | Devraj Chauhan | 9876543210 | IIT Delhi | Submitted (Pending) | ₹100 |
| **CA-S-0001** | CA-P-0001 | SOLO | NEWBIE_ROOKIE (Solo) | Level 1 Newbie Player | 9876543219 | National Esports Academy | Submitted (Pending) | ₹30 |
| **CA-S-0002** | CA-P-0002 | SOLO | Solo Slayer | Karan Verma | 8877665544 | SRM University | Submitted (Pending) | ₹30 |

### Verified Player Free Fire UIDs

1. **DEV_APEX** — UID: `1029384756` (Team: Crimson Titans, Leader)
2. **ROHAN_SNIPER** — UID: `1029384757` (Team: Crimson Titans)
3. **KABIR_RUSHER** — UID: `1029384758` (Team: Crimson Titans)
4. **DEV_SCOUT** — UID: `1029384759` (Team: Crimson Titans)
5. **NEWBIE_ROOKIE** — UID: `9988776655` (Solo Entry)
6. **KARAN_FF** — UID: `8877665544` (Solo Entry)

---

## 2. Package Contents

1. `crimson_apex.db`: The SQLite database file containing the tables `tournaments`, `registrations`, `players`, and `sequences`.
2. `crimson_apex.db-wal`: SQLite Write-Ahead Log file ensuring complete atomic transaction state.
3. `recovered_registrations.csv`: Comma-separated spreadsheet containing all team details, leader contacts, and player in-game names and UIDs.
4. `full_database_export.json`: Comprehensive JSON document containing tournament configuration, rules, payment instructions, registration records, and player rosters.
5. `README_DATABASE_RESTORE.md`: This restoration and verification instruction file.

*Security Notice*: All sensitive organizer passwords, HMAC session secrets, and password hashes have been omitted / redacted from this bundle in accordance with security best practices.

---

## 3. How to Restore the Database

### Method A: Restoring to a Local or Containerized Node.js Environment
1. Stop the application server process:
   ```bash
   pkill -f "node server.ts" || pkill -f "tsx server.ts"
   ```
2. Place `crimson_apex.db`, `crimson_apex.db-wal`, and `crimson_apex.db-shm` into the application's `data/` directory:
   ```bash
   mkdir -p ./data
   cp crimson_apex.db crimson_apex.db-wal ./data/
   ```
3. Restart the server:
   ```bash
   npm run dev
   # or
   node server.ts
   ```
4. Navigate to the Admin Dashboard and log in. All 3 teams will load immediately.

### Method B: Importing via Spreadsheet / Tournament Software
- You can directly import `recovered_registrations.csv` into Microsoft Excel, Google Sheets, or any tournament bracket manager (Battlefy, Challengermode, Toornament).
- Every player's Free Fire UID, IGN, and leader phone number is separated into distinct columns for quick copy-pasting into Free Fire custom room lobbies.

### Method C: Restoring into PostgreSQL / Supabase / Firebase
- Use `full_database_export.json` as the source payload to seed records into relational tables or NoSQL document collections.
- The JSON structure maps 1:1 with standard schema conventions.

---

## 4. Important Notice Regarding Vercel Deployments

- Vercel's standard deployment hosts static Single Page Applications (Vite SPA) or stateless Serverless Functions.
- Vercel Serverless Functions have an **ephemeral, temporary filesystem**. Any SQLite database file written to a serverless function is wiped when the container spins down.
- To maintain live multi-user persistence on a public web host, connect the application to an external cloud database (such as Google Cloud SQL PostgreSQL, Firebase Firestore, or Supabase) or host the Node.js Express server on Google Cloud Run or Railway with persistent storage.
