import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { GameMode, RegistrationInput, RegistrationRecord, TournamentSettings, AdminOverviewStats } from '../src/types';
import { formatRegistrationCode, formatTeamCode, calculateFee, validateRegistrationData } from '../src/utils/validation';

// Ensure data directory exists
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'crimson_apex.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for durability and concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      registration_open INTEGER NOT NULL DEFAULT 1,
      registration_limit INTEGER NOT NULL DEFAULT 64,
      solo_fee INTEGER NOT NULL DEFAULT 30,
      duo_fee INTEGER NOT NULL DEFAULT 50,
      squad_fee INTEGER NOT NULL DEFAULT 100,
      announced_date TEXT,
      rules TEXT NOT NULL,
      payment_upi_id TEXT NOT NULL DEFAULT 'crimsonapex@upi',
      payment_instructions TEXT NOT NULL,
      contact_email TEXT NOT NULL DEFAULT 'yashhkumar0007@gmail.com',
      contact_phone TEXT NOT NULL DEFAULT '+91 88789 95680',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sequences (
      mode TEXT PRIMARY KEY,
      current_val INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_code TEXT UNIQUE NOT NULL,
      team_code TEXT UNIQUE NOT NULL,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
      team_name TEXT,
      game_mode TEXT NOT NULL,
      leader_name TEXT NOT NULL,
      leader_phone TEXT NOT NULL,
      college_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      payment_reference TEXT,
      fee INTEGER NOT NULL,
      rejection_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      free_fire_uid TEXT NOT NULL,
      in_game_name TEXT NOT NULL,
      is_team_leader INTEGER NOT NULL DEFAULT 0,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT NOT NULL,
      registration_id INTEGER,
      registration_code TEXT,
      action TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reg_code ON registrations(registration_code);
    CREATE INDEX IF NOT EXISTS idx_team_code ON registrations(team_code);
    CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(status);
    CREATE INDEX IF NOT EXISTS idx_reg_mode ON registrations(game_mode);
    CREATE INDEX IF NOT EXISTS idx_players_reg ON players(registration_id);
    CREATE INDEX IF NOT EXISTS idx_players_uid ON players(free_fire_uid);
  `);

  const officialTournamentRules = `1. Players of ALL Free Fire levels are eligible to participate. There is NO minimum level requirement.
2. Emulators and modified iPad/tablet devices are strictly prohibited. Mobile devices only.
3. Exploitation of map bugs, speed hacks, aimbots or other cheats will result in disqualification.
4. Room ID and Password will be distributed exclusively through registered contact details 20 minutes before the match.
5. Point System: 1st (12 pts), 2nd (9 pts), 3rd (8 pts), 4th (7 pts), 5th (6 pts), 6th (5 pts), 7th (4 pts), 8th (3 pts), 9th (2 pts), 10th (1 pt). +1 pt per Kill.
6. Organizers' decisions regarding technical rulings and lobby recreates are final.`;

  // Seed default tournament if not exists
  const existingTournament = db.prepare('SELECT id, rules FROM tournaments WHERE slug = ?').get('battle-royale-001') as any;
  if (!existingTournament) {
    db.prepare(`
      INSERT INTO tournaments (
        name, slug, tagline, status, registration_open, registration_limit,
        solo_fee, duo_fee, squad_fee, announced_date, rules, payment_upi_id,
        payment_instructions, contact_email, contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'BATTLE ROYALE CHAMPIONSHIP #001',
      'battle-royale-001',
      'RISE ABOVE. RULE THE ARENA.',
      'open',
      1,
      100,
      30,
      50,
      100,
      null, // Tournament date unannounced until announced by organizer
      officialTournamentRules,
      'crimsonapex.pay@okaxis',
      'Send tournament entry fee via any UPI app (GPay, PhonePe, Paytm, BHIM) to UPI ID: crimsonapex.pay@okaxis. Mention your assigned Registration ID (e.g., CA-S-0001) in the transaction notes. Save the UTR/Reference number for verification.',
      'yashhkumar0007@gmail.com',
      '+91 88789 95680'
    );
  } else {
    // Ensure rules and coordinator contact details are up to date on existing database row
    if (existingTournament.rules && existingTournament.rules.includes('level 35')) {
      db.prepare('UPDATE tournaments SET rules = ? WHERE slug = ?').run(officialTournamentRules, 'battle-royale-001');
    }
    db.prepare(`
      UPDATE tournaments 
      SET contact_email = 'yashhkumar0007@gmail.com',
          contact_phone = '+91 88789 95680'
      WHERE slug = 'battle-royale-001'
    `).run();
  }

  // Ensure sequence counters exist
  ['SOLO', 'DUO', 'SQUAD'].forEach(mode => {
    const seq = db.prepare('SELECT mode FROM sequences WHERE mode = ?').get(mode);
    if (!seq) {
      db.prepare('INSERT INTO sequences (mode, current_val) VALUES (?, 0)').run(mode);
    }
  });
}

// Get active tournament
export function getActiveTournament(): TournamentSettings {
  const row = db.prepare('SELECT * FROM tournaments WHERE slug = ?').get('battle-royale-001') as any;
  if (!row) {
    throw new Error('Tournament configuration not found');
  }

  const counts = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed
    FROM registrations WHERE tournament_id = ?
  `).get(row.id) as any;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    registrationOpen: Boolean(row.registration_open),
    registrationLimit: row.registration_limit,
    soloFee: row.solo_fee,
    duoFee: row.duo_fee,
    squadFee: row.squad_fee,
    announcedDate: row.announced_date,
    rules: row.rules,
    paymentUpiId: row.payment_upi_id,
    paymentInstructions: row.payment_instructions,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    totalSubmissions: Number(counts?.total || 0),
    confirmedCount: Number(counts?.confirmed || 0),
  };
}

// Update tournament settings (Admin only)
export function updateTournamentSettings(settings: Partial<TournamentSettings>, adminUsername: string) {
  const current = getActiveTournament();

  const registrationOpen = settings.registrationOpen !== undefined ? (settings.registrationOpen ? 1 : 0) : (current.registrationOpen ? 1 : 0);
  const registrationLimit = settings.registrationLimit !== undefined ? settings.registrationLimit : current.registrationLimit;
  const soloFee = settings.soloFee !== undefined ? settings.soloFee : current.soloFee;
  const duoFee = settings.duoFee !== undefined ? settings.duoFee : current.duoFee;
  const squadFee = settings.squadFee !== undefined ? settings.squadFee : current.squadFee;
  const announcedDate = settings.announcedDate !== undefined ? settings.announcedDate : current.announcedDate;
  const rules = settings.rules !== undefined ? settings.rules : current.rules;
  const paymentUpiId = settings.paymentUpiId !== undefined ? settings.paymentUpiId : current.paymentUpiId;
  const paymentInstructions = settings.paymentInstructions !== undefined ? settings.paymentInstructions : current.paymentInstructions;
  const contactEmail = settings.contactEmail !== undefined ? settings.contactEmail : current.contactEmail;
  const contactPhone = settings.contactPhone !== undefined ? settings.contactPhone : current.contactPhone;

  db.prepare(`
    UPDATE tournaments SET
      registration_open = ?,
      registration_limit = ?,
      solo_fee = ?,
      duo_fee = ?,
      squad_fee = ?,
      announced_date = ?,
      rules = ?,
      payment_upi_id = ?,
      payment_instructions = ?,
      contact_email = ?,
      contact_phone = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    registrationOpen,
    registrationLimit,
    soloFee,
    duoFee,
    squadFee,
    announcedDate,
    rules,
    paymentUpiId,
    paymentInstructions,
    contactEmail,
    contactPhone,
    current.id
  );

  logAdminAudit(adminUsername, 'UPDATE_TOURNAMENT_SETTINGS', undefined, undefined, 'Updated tournament configuration');
  return getActiveTournament();
}

// Atomic registration submission
export function createRegistration(input: RegistrationInput) {
  const tournament = getActiveTournament();

  // Validate server-side
  const validation = validateRegistrationData(input, {
    registrationOpen: tournament.registrationOpen,
    registrationLimit: tournament.registrationLimit,
    currentCount: tournament.totalSubmissions,
  });

  if (!validation.valid) {
    const errorMsg = Object.values(validation.errors).join(', ');
    throw new Error(errorMsg);
  }

  const fee = calculateFee(input.gameMode, tournament);

  // Check for duplicate submission with same leader phone or leader UID in current tournament
  const duplicate = db.prepare(`
    SELECT r.registration_code FROM registrations r
    JOIN players p ON p.registration_id = r.id
    WHERE r.tournament_id = ? AND (r.leader_phone = ? OR p.free_fire_uid = ?) AND r.status != 'Cancelled'
    LIMIT 1
  `).get(tournament.id, input.leaderPhone, input.leaderUid) as any;

  if (duplicate) {
    throw new Error(`A registration already exists for this leader phone or player UID (Registration ID: ${duplicate.registration_code}).`);
  }

  // Atomic database sequence and creation
  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Advance mode sequence
    db.prepare(`
      UPDATE sequences SET current_val = current_val + 1 WHERE mode = ?
    `).run(input.gameMode);

    const seqRow = db.prepare('SELECT current_val FROM sequences WHERE mode = ?').get(input.gameMode) as any;
    const seq = seqRow.current_val;

    const registrationCode = formatRegistrationCode(input.gameMode, seq);
    const teamCode = formatTeamCode(input.gameMode, seq);

    // 2. Insert registration
    const teamName = input.gameMode === 'SOLO' ? (input.teamName || `${input.leaderIgn} (Solo)`) : input.teamName;

    const regResult = db.prepare(`
      INSERT INTO registrations (
        registration_code, team_code, tournament_id, team_name, game_mode,
        leader_name, leader_phone, college_name, status, payment_status,
        payment_reference, fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 'Pending', ?, ?)
    `).run(
      registrationCode,
      teamCode,
      tournament.id,
      teamName,
      input.gameMode,
      input.leaderName,
      input.leaderPhone,
      input.collegeName,
      input.paymentReference || null,
      fee
    );

    const registrationId = Number(regResult.lastInsertRowid);

    // 3. Insert player members
    const insertPlayer = db.prepare(`
      INSERT INTO players (registration_id, full_name, free_fire_uid, in_game_name, is_team_leader, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    input.members.forEach((m, idx) => {
      insertPlayer.run(
        registrationId,
        m.fullName,
        m.freeFireUid,
        m.inGameName,
        idx === 0 || m.isTeamLeader ? 1 : 0,
        idx === 0 ? input.leaderPhone : (m.phone || null)
      );
    });

    db.exec('COMMIT;');

    return {
      registrationId,
      registrationCode,
      teamCode,
      gameMode: input.gameMode,
      teamName,
      leaderName: input.leaderName,
      collegeName: input.collegeName,
      fee,
      status: 'Submitted' as const,
      paymentStatus: 'Pending' as const,
      createdAt: new Date().toISOString(),
      members: input.members,
    };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Public registration lookup by code (sanitized: no private phone numbers)
export function getPublicRegistrationByCode(code: string) {
  const reg = db.prepare(`
    SELECT 
      r.id, r.registration_code, r.team_code, r.team_name, r.game_mode,
      r.leader_name, r.college_name, r.status, r.payment_status,
      r.fee, r.created_at, r.payment_reference, r.rejection_reason,
      t.name as tournament_name, t.tagline as tournament_tagline,
      t.announced_date, t.payment_upi_id, t.payment_instructions
    FROM registrations r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE UPPER(r.registration_code) = UPPER(?) OR UPPER(r.team_code) = UPPER(?)
  `).get(code, code) as any;

  if (!reg) {
    return null;
  }

  const players = db.prepare(`
    SELECT full_name, free_fire_uid, in_game_name, is_team_leader
    FROM players WHERE registration_id = ?
    ORDER BY is_team_leader DESC, id ASC
  `).all(reg.id) as any[];

  return {
    registrationCode: reg.registration_code,
    teamCode: reg.team_code,
    teamName: reg.team_name,
    gameMode: reg.game_mode,
    leaderName: reg.leader_name,
    collegeName: reg.college_name,
    status: reg.status,
    paymentStatus: reg.payment_status,
    fee: reg.fee,
    paymentReference: reg.payment_reference,
    rejectionReason: reg.rejection_reason,
    createdAt: reg.created_at,
    tournamentName: reg.tournament_name,
    tournamentTagline: reg.tournament_tagline,
    announcedDate: reg.announced_date,
    paymentUpiId: reg.payment_upi_id,
    paymentInstructions: reg.payment_instructions,
    members: players.map(p => ({
      fullName: p.full_name,
      freeFireUid: p.free_fire_uid,
      inGameName: p.in_game_name,
      isTeamLeader: Boolean(p.is_team_leader),
    })),
  };
}

// Admin: Get all registrations with search, filter, and private contact info
export function getAdminRegistrations(query?: {
  search?: string;
  gameMode?: string;
  status?: string;
  paymentStatus?: string;
}) {
  let sql = `
    SELECT 
      r.id, r.registration_code, r.team_code, r.tournament_id,
      r.team_name, r.game_mode, r.leader_name, r.leader_phone,
      r.college_name, r.status, r.payment_status, r.payment_reference,
      r.fee, r.rejection_reason, r.created_at, r.updated_at
    FROM registrations r
    WHERE 1=1
  `;
  const params: any[] = [];

  if (query?.gameMode && query.gameMode !== 'ALL') {
    sql += ` AND r.game_mode = ?`;
    params.push(query.gameMode);
  }

  if (query?.status && query.status !== 'ALL') {
    sql += ` AND r.status = ?`;
    params.push(query.status);
  }

  if (query?.paymentStatus && query.paymentStatus !== 'ALL') {
    sql += ` AND r.payment_status = ?`;
    params.push(query.paymentStatus);
  }

  if (query?.search && query.search.trim()) {
    const s = `%${query.search.trim()}%`;
    sql += ` AND (
      r.registration_code LIKE ? OR
      r.team_code LIKE ? OR
      r.team_name LIKE ? OR
      r.leader_name LIKE ? OR
      r.leader_phone LIKE ? OR
      r.college_name LIKE ? OR
      r.payment_reference LIKE ? OR
      EXISTS (
        SELECT 1 FROM players p 
        WHERE p.registration_id = r.id AND (
          p.full_name LIKE ? OR 
          p.in_game_name LIKE ? OR 
          p.free_fire_uid LIKE ?
        )
      )
    )`;
    params.push(s, s, s, s, s, s, s, s, s, s);
  }

  sql += ` ORDER BY r.id DESC`;

  const rows = db.prepare(sql).all(...params) as any[];

  // Fetch players for these registrations
  const playerStmt = db.prepare(`
    SELECT id, registration_id, full_name, free_fire_uid, in_game_name, is_team_leader, phone
    FROM players WHERE registration_id = ?
    ORDER BY is_team_leader DESC, id ASC
  `);

  return rows.map(r => ({
    id: r.id,
    registrationCode: r.registration_code,
    teamCode: r.team_code,
    tournamentId: r.tournament_id,
    teamName: r.team_name,
    gameMode: r.game_mode,
    leaderName: r.leader_name,
    leaderPhone: r.leader_phone,
    collegeName: r.college_name,
    status: r.status,
    paymentStatus: r.payment_status,
    paymentReference: r.payment_reference,
    fee: r.fee,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    members: (playerStmt.all(r.id) as any[]).map(p => ({
      id: p.id,
      fullName: p.full_name,
      freeFireUid: p.free_fire_uid,
      inGameName: p.in_game_name,
      isTeamLeader: Boolean(p.is_team_leader),
      phone: p.phone,
    })),
  }));
}

// Admin stats overview
export function getAdminStats(): AdminOverviewStats {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN game_mode = 'SOLO' THEN 1 ELSE 0 END) as solo,
      SUM(CASE WHEN game_mode = 'DUO' THEN 1 ELSE 0 END) as duo,
      SUM(CASE WHEN game_mode = 'SQUAD' THEN 1 ELSE 0 END) as squad,
      SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'Submitted' OR status = 'Awaiting Payment Verification' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(fee) as total_expected,
      SUM(CASE WHEN payment_status = 'Verified' THEN fee ELSE 0 END) as verified_collected
    FROM registrations
  `).get() as any;

  return {
    totalSubmissions: Number(stats?.total || 0),
    soloCount: Number(stats?.solo || 0),
    duoCount: Number(stats?.duo || 0),
    squadCount: Number(stats?.squad || 0),
    confirmedCount: Number(stats?.confirmed || 0),
    pendingCount: Number(stats?.pending || 0),
    rejectedCount: Number(stats?.rejected || 0),
    totalExpectedCollection: Number(stats?.total_expected || 0),
    verifiedCollection: Number(stats?.verified_collected || 0),
  };
}

// Update registration status
export function updateRegistrationStatus(
  id: number,
  status: string,
  paymentStatus: string,
  rejectionReason: string | undefined,
  adminUsername: string
) {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(id) as any;
  if (!reg) {
    throw new Error('Registration not found');
  }

  db.prepare(`
    UPDATE registrations SET
      status = ?,
      payment_status = ?,
      rejection_reason = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status, paymentStatus, rejectionReason || null, id);

  logAdminAudit(
    adminUsername,
    `STATUS_CHANGE:${status}|PAYMENT:${paymentStatus}`,
    id,
    reg.registration_code,
    rejectionReason || 'Status updated by administrator'
  );

  return true;
}

// Admin Audit Logging
export function logAdminAudit(
  adminUsername: string,
  action: string,
  registrationId?: number,
  registrationCode?: string,
  reason?: string
) {
  db.prepare(`
    INSERT INTO admin_audit_logs (admin_username, registration_id, registration_code, action, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminUsername, registrationId || null, registrationCode || null, action, reason || null);
}

export function getAdminAuditLogs(limit = 50) {
  return db.prepare(`
    SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT ?
  `).all(limit) as any[];
}

// Authentication Helpers
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function hasAdminUsers(): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as any;
  return Number(row?.count || 0) > 0;
}

export function createAdminUser(username: string, passwordPlain: string) {
  if (passwordPlain.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(passwordPlain, salt);

  db.prepare(`
    INSERT INTO admin_users (username, password_hash, salt, role)
    VALUES (?, ?, ?, 'admin')
  `).run(username, passwordHash, salt);

  logAdminAudit(username, 'ADMIN_USER_INITIALIZED', undefined, undefined, 'Administrator account created');
  return true;
}

export function verifyAdminCredentials(username: string, passwordPlain: string): boolean {
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
  if (!user) return false;
  const computed = hashPassword(passwordPlain, user.salt);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(user.password_hash, 'hex'));
}
