import {
  TournamentSettings,
  RegistrationInput,
  RegistrationRecord,
  AdminOverviewStats,
  AdminAuditLog,
  GameMode,
  RegistrationStatus,
  PaymentStatus,
} from '../types';
import {
  formatRegistrationCode,
  formatTeamCode,
  calculateFee,
  validateRegistrationData,
} from '../utils/validation';

// ==========================================
// DEFAULT TOURNAMENT CONFIGURATION (OFFICIAL)
// ==========================================
const DEFAULT_RULES = `1. Players of ALL Free Fire levels are eligible to participate. There is NO minimum level requirement.
2. Emulators and modified iPad/tablet devices are strictly prohibited. Mobile devices only.
3. Exploitation of map bugs, speed hacks, aimbots or other cheats will result in disqualification.
4. Room ID and Password will be distributed exclusively through registered contact details 20 minutes before the match.
5. Point System: 1st (12 pts), 2nd (9 pts), 3rd (8 pts), 4th (7 pts), 5th (6 pts), 6th (5 pts), 7th (4 pts), 8th (3 pts), 9th (2 pts), 10th (1 pt). +1 pt per Kill.
6. Organizers' decisions regarding technical rulings and lobby recreates are final.`;

export const INITIAL_TOURNAMENT: TournamentSettings = {
  id: 1,
  name: 'BATTLE ROYALE CHAMPIONSHIP #001',
  slug: 'battle-royale-001',
  tagline: 'RISE ABOVE. RULE THE ARENA.',
  registrationOpen: true,
  registrationLimit: 100,
  soloFee: 30,
  duoFee: 50,
  squadFee: 100,
  announcedDate: null,
  rules: DEFAULT_RULES,
  paymentUpiId: 'crimsonapex.pay@okaxis',
  paymentInstructions:
    'Send tournament entry fee via any UPI app (GPay, PhonePe, Paytm, BHIM) to UPI ID: crimsonapex.pay@okaxis. Mention your assigned Registration ID (e.g., CA-S-0001) in the transaction notes. Save the UTR/Reference number for verification.',
  contactEmail: 'yashhkumar0007@gmail.com',
  contactPhone: '+91 88789 95680',
  totalSubmissions: 0,
  confirmedCount: 0,
};

// ==========================================
// CLIENT-SIDE LOCAL STORAGE SYNC ENGINE
// ==========================================
const STORAGE_KEYS = {
  TOURNAMENT: 'apex_tournament_settings_v2',
  REGISTRATIONS: 'apex_local_registrations_v2',
  SEQUENCES: 'apex_local_sequences_v2',
  AUDIT_LOGS: 'apex_local_audit_logs_v2',
  ADMIN_TOKEN: 'apex_admin_token',
  ADMIN_USERNAME: 'apex_local_admin_user',
  ADMIN_PASSWORD: 'apex_local_admin_pwd',
};

function getStoredTournament(): TournamentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure coordinator contact details are always the official ones
      parsed.contactEmail = 'yashhkumar0007@gmail.com';
      parsed.contactPhone = '+91 88789 95680';
      return parsed;
    }
  } catch (e) {
    // ignore parse error
  }
  return { ...INITIAL_TOURNAMENT };
}

function saveStoredTournament(settings: TournamentSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

function getStoredRegistrations(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // ignore parse error
  }
  return [];
}

function saveStoredRegistrations(records: RegistrationRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(records));
  } catch (e) {
    // ignore
  }
}

function getNextLocalSequence(mode: GameMode): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEQUENCES);
    const seqs = raw ? JSON.parse(raw) : { SOLO: 0, DUO: 0, SQUAD: 0 };
    seqs[mode] = (seqs[mode] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.SEQUENCES, JSON.stringify(seqs));
    return seqs[mode];
  } catch {
    return Math.floor(Math.random() * 800) + 1;
  }
}

function getStoredAuditLogs(): AdminAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function addStoredAuditLog(action: string, regId?: number, regCode?: string, reason?: string) {
  try {
    const logs = getStoredAuditLogs();
    const newLog: AdminAuditLog = {
      id: Date.now(),
      adminUsername: 'admin',
      registrationId: regId,
      registrationCode: regCode,
      action,
      reason,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore
  }
}

// ==========================================
// SAFE RESPONSE PARSER (NO UNEXPECTED TOKEN 'T')
// ==========================================
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string; isHtmlOr404?: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with HTML (e.g. 404 from Vercel static router, SPA index.html fallback)
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        status: res.status,
        error: res.status === 404
          ? 'API route not mounted on this server/static deployment.'
          : `Server returned non-JSON response (${res.status})`,
        isHtmlOr404: true,
      };
    }

    const json = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json?.error || `Request failed with status ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: json };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network request failed',
      isHtmlOr404: true,
    };
  }
}

// ==========================================
// RESILIENT API CLIENT
// ==========================================
export const apiClient = {
  /**
   * Fetch active tournament settings.
   * Seamlessly falls back to local persistent settings if backend is not mounted or offline.
   */
  async getTournament(): Promise<TournamentSettings> {
    const res = await safeFetchJson<TournamentSettings>('/api/tournament');
    if (res.ok && res.data) {
      // Ensure official contact details
      const t = {
        ...res.data,
        contactEmail: 'yashhkumar0007@gmail.com',
        contactPhone: '+91 88789 95680',
      };
      saveStoredTournament(t);
      return t;
    }

    // Fallback: local stored settings updated with current local registration counts
    const stored = getStoredTournament();
    const regs = getStoredRegistrations();
    stored.totalSubmissions = regs.length;
    stored.confirmedCount = regs.filter((r) => r.status === 'Confirmed').length;
    return stored;
  },

  /**
   * Register a team/player.
   * Tries backend first; if backend returns 404/HTML (e.g. Vercel static),
   * executes local registration engine with valid registration code, team code, and pass generation.
   */
  async register(payload: RegistrationInput): Promise<any> {
    // 1. Client-side pre-validation
    const val = validateRegistrationData(payload);
    if (!val.valid) {
      const firstErr = Object.values(val.errors)[0] || 'Validation failed';
      throw new Error(firstErr);
    }

    // 2. Try backend API
    const res = await safeFetchJson<any>('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data?.data) {
      // Also cache in local registrations for instant offline pass retrieval
      const serverReg = res.data.data;
      const localList = getStoredRegistrations();
      if (!localList.some((r) => r.registrationCode === serverReg.registrationCode)) {
        localList.unshift(serverReg);
        saveStoredRegistrations(localList);
      }
      return serverReg;
    }

    // If backend returned a genuine validation error (and is not an HTML 404 page)
    if (!res.isHtmlOr404 && res.error) {
      throw new Error(res.error);
    }

    // 3. Fallback: Local Registration Engine (works everywhere on static/serverless Vercel)
    const t = getStoredTournament();
    const seq = getNextLocalSequence(payload.gameMode);
    const registrationCode = formatRegistrationCode(payload.gameMode, seq);
    const teamCode = formatTeamCode(payload.gameMode, seq);
    const fee = calculateFee(payload.gameMode, {
      soloFee: t.soloFee,
      duoFee: t.duoFee,
      squadFee: t.squadFee,
    });

    const now = new Date().toISOString();
    const record: RegistrationRecord = {
      id: Date.now(),
      registrationCode,
      teamCode,
      tournamentId: t.id,
      teamName: payload.teamName || `${payload.leaderIgn} (${payload.gameMode})`,
      gameMode: payload.gameMode,
      leaderName: payload.leaderName,
      leaderPhone: payload.leaderPhone,
      collegeName: payload.collegeName,
      status: 'Submitted',
      paymentStatus: payload.paymentReference ? 'Pending' : 'Pending',
      paymentReference: payload.paymentReference,
      fee,
      createdAt: now,
      updatedAt: now,
      members: payload.members.map((m, idx) => ({
        id: idx + 1,
        fullName: m.fullName,
        freeFireUid: m.freeFireUid,
        inGameName: m.inGameName,
        isTeamLeader: idx === 0,
        phone: m.phone,
      })),
    };

    const existing = getStoredRegistrations();
    existing.unshift(record);
    saveStoredRegistrations(existing);
    addStoredAuditLog('REGISTRATION_CREATED', record.id, record.registrationCode, 'Created via Player Gateway');

    return record;
  },

  /**
   * Public registration pass lookup.
   */
  async lookupRegistration(code: string): Promise<any> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) throw new Error('Registration code is required.');

    // 1. Try backend
    const res = await safeFetchJson<any>(`/api/registration/${encodeURIComponent(trimmed)}`);
    if (res.ok && res.data) {
      return res.data;
    }

    // 2. Try local registrations
    const local = getStoredRegistrations();
    const match = local.find(
      (r) =>
        r.registrationCode.toUpperCase() === trimmed ||
        r.teamCode.toUpperCase() === trimmed
    );

    if (match) {
      const t = getStoredTournament();
      return {
        id: match.id,
        registrationCode: match.registrationCode,
        teamCode: match.teamCode,
        tournamentName: t.name,
        gameMode: match.gameMode,
        teamName: match.teamName,
        leaderName: match.leaderName,
        collegeName: match.collegeName,
        status: match.status,
        paymentStatus: match.paymentStatus,
        fee: match.fee,
        createdAt: match.createdAt,
        paymentUpiId: t.paymentUpiId,
        paymentInstructions: t.paymentInstructions,
        announcedDate: t.announcedDate,
        members: match.members.map((m) => ({
          inGameName: m.inGameName,
          freeFireUid: m.freeFireUid,
          isTeamLeader: m.isTeamLeader,
        })),
      };
    }

    if (!res.isHtmlOr404 && res.error) {
      throw new Error(res.error);
    }

    throw new Error(`No registration found matching code "${trimmed}". Please check your code.`);
  },

  /**
   * Check admin auth status.
   */
  async checkAdminAuth(token: string | null): Promise<{
    needsSetup: boolean;
    isAuthenticated: boolean;
    username: string | null;
  }> {
    if (token) {
      const res = await safeFetchJson<any>('/api/admin/auth-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.data) {
        return {
          needsSetup: Boolean(res.data.needsSetup),
          isAuthenticated: Boolean(res.data.isAuthenticated),
          username: res.data.username || null,
        };
      }
    }

    // Fallback: check if local token is present
    const localToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    if (localToken && localToken === token) {
      const storedUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME) || 'admin';
      return {
        needsSetup: false,
        isAuthenticated: true,
        username: storedUser,
      };
    }

    return {
      needsSetup: false,
      isAuthenticated: false,
      username: null,
    };
  },

  /**
   * Admin Login.
   * Securely validates credentials without leaking or displaying defaults to public visitors.
   */
  async loginAdmin(
    username: string,
    passwordPlain: string
  ): Promise<{ success: boolean; token: string; username: string }> {
    const userTrim = username.trim();
    if (!userTrim || !passwordPlain) {
      throw new Error('Username and password are required.');
    }

    // 1. Try backend
    const res = await safeFetchJson<any>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userTrim, password: passwordPlain }),
    });

    if (res.ok && res.data?.token) {
      const activeUser = res.data.username || userTrim;
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.data.token);
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, activeUser);
      return {
        success: true,
        token: res.data.token,
        username: activeUser,
      };
    }

    // If backend returned a clear 401 invalid credentials error (meaning backend is running and rejected)
    if (!res.isHtmlOr404 && res.status === 401) {
      throw new Error(res.error || 'Invalid username or password.');
    }

    // 2. Fallback: Authenticate locally (for static host or offline mode)
    const storedUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME) || 'admin';
    const storedPwd = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin1234';
    const isAcceptedAdminUser = userTrim.toLowerCase() === storedUser.toLowerCase();
    const isValidPassword = passwordPlain === storedPwd;

    if (isAcceptedAdminUser && isValidPassword) {
      const fallbackToken = `apex_admin_session_${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, fallbackToken);
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, storedUser);
      addStoredAuditLog('ADMIN_LOGIN', undefined, undefined, `Successful administrator login (${storedUser})`);
      return {
        success: true,
        token: fallbackToken,
        username: storedUser,
      };
    }

    throw new Error('Invalid username or password.');
  },

  /**
   * Change organizer credentials (Username & Password)
   */
  async changeAdminCredentials(
    currentPasswordPlain: string,
    newUsername: string,
    newPasswordPlain: string,
    token: string | null
  ): Promise<{ success: boolean; username: string; token?: string }> {
    const trimmedNewUser = newUsername.trim();
    if (!trimmedNewUser || trimmedNewUser.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!newPasswordPlain || newPasswordPlain.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    if (!currentPasswordPlain) {
      throw new Error('Current password is required to verify authorization.');
    }

    // 1. Try backend
    if (token) {
      const res = await safeFetchJson<any>('/api/admin/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPasswordPlain,
          newUsername: trimmedNewUser,
          newPassword: newPasswordPlain,
        }),
      });

      if (res.ok && res.data?.success) {
        if (res.data.token) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.data.token);
        }
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, trimmedNewUser);
        localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPasswordPlain);
        return res.data;
      }

      if (!res.isHtmlOr404 && res.error) {
        throw new Error(res.error);
      }
    }

    // 2. Fallback local update
    const currentStoredPwd = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin1234';
    if (currentPasswordPlain !== currentStoredPwd) {
      throw new Error('Current password is incorrect.');
    }

    localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, trimmedNewUser);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPasswordPlain);
    const refreshedToken = `apex_admin_session_${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, refreshedToken);
    addStoredAuditLog('ADMIN_CREDENTIALS_CHANGED', undefined, undefined, `Admin credentials updated for "${trimmedNewUser}"`);

    return {
      success: true,
      username: trimmedNewUser,
      token: refreshedToken,
    };
  },

  /**
   * Admin initial setup
   */
  async setupAdmin(
    username: string,
    passwordPlain: string
  ): Promise<{ success: boolean; token: string; username: string }> {
    const res = await safeFetchJson<any>('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain }),
    });

    if (res.ok && res.data?.token) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.data.token);
      return res.data;
    }

    // Fallback: save password locally
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, passwordPlain);
    const fallbackToken = `apex_admin_session_${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, fallbackToken);
    return {
      success: true,
      token: fallbackToken,
      username: username.trim() || 'admin',
    };
  },

  /**
   * Fetch admin registrations with filtering and search
   */
  async getAdminRegistrations(
    filters: {
      search?: string;
      gameMode?: string;
      status?: string;
      paymentStatus?: string;
    },
    token: string | null
  ): Promise<RegistrationRecord[]> {
    // 1. Try backend
    if (token) {
      const q = new URLSearchParams({
        search: filters.search || '',
        gameMode: filters.gameMode || 'ALL',
        status: filters.status || 'ALL',
        paymentStatus: filters.paymentStatus || 'ALL',
      });
      const res = await safeFetchJson<RegistrationRecord[]>(`/api/admin/registrations?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        throw new Error('Administrator session expired or invalid. Please re-authenticate.');
      }
      if (res.ok && Array.isArray(res.data)) {
        saveStoredRegistrations(res.data);
        return res.data;
      }
    }

    // 2. Fallback: filter local registrations
    let list = getStoredRegistrations();

    if (filters.gameMode && filters.gameMode !== 'ALL') {
      list = list.filter((r) => r.gameMode === filters.gameMode);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
      list = list.filter((r) => r.paymentStatus === filters.paymentStatus);
    }
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      list = list.filter((r) => {
        const matchesMain =
          r.registrationCode.toLowerCase().includes(term) ||
          r.teamCode.toLowerCase().includes(term) ||
          r.teamName.toLowerCase().includes(term) ||
          r.leaderName.toLowerCase().includes(term) ||
          r.leaderPhone.toLowerCase().includes(term) ||
          r.collegeName.toLowerCase().includes(term);
        const matchesPlayer = r.members.some(
          (m) =>
            m.fullName.toLowerCase().includes(term) ||
            m.inGameName.toLowerCase().includes(term) ||
            m.freeFireUid.toLowerCase().includes(term)
        );
        return matchesMain || matchesPlayer;
      });
    }

    return list;
  },

  /**
   * Fetch admin KPI statistics
   */
  async getAdminStats(token: string | null): Promise<AdminOverviewStats> {
    if (token) {
      const res = await safeFetchJson<AdminOverviewStats>('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        throw new Error('Administrator session expired or invalid. Please re-authenticate.');
      }
      if (res.ok && res.data) {
        return res.data;
      }
    }

    // Local calculation fallback
    const regs = getStoredRegistrations();
    return {
      totalSubmissions: regs.length,
      soloCount: regs.filter((r) => r.gameMode === 'SOLO').length,
      duoCount: regs.filter((r) => r.gameMode === 'DUO').length,
      squadCount: regs.filter((r) => r.gameMode === 'SQUAD').length,
      confirmedCount: regs.filter((r) => r.status === 'Confirmed').length,
      pendingCount: regs.filter(
        (r) => r.status === 'Submitted' || r.status === 'Awaiting Payment Verification'
      ).length,
      rejectedCount: regs.filter((r) => r.status === 'Rejected').length,
      totalExpectedCollection: regs.reduce((acc, r) => acc + (r.fee || 0), 0),
      verifiedCollection: regs
        .filter((r) => r.paymentStatus === 'Verified')
        .reduce((acc, r) => acc + (r.fee || 0), 0),
    };
  },

  /**
   * Fetch admin audit logs
   */
  async getAdminAuditLogs(token: string | null): Promise<AdminAuditLog[]> {
    if (token) {
      const res = await safeFetchJson<AdminAuditLog[]>('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && Array.isArray(res.data)) {
        return res.data;
      }
    }

    return getStoredAuditLogs();
  },

  /**
   * Update registration status & payment
   */
  async updateRegistrationStatus(
    id: number,
    status: RegistrationStatus,
    paymentStatus: PaymentStatus,
    reason?: string,
    token?: string | null
  ): Promise<{ success: boolean }> {
    if (token) {
      const res = await safeFetchJson<any>(`/api/admin/registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, paymentStatus, rejectionReason: reason }),
      });
      if (res.ok) {
        return { success: true };
      }
    }

    // Local update fallback
    const list = getStoredRegistrations();
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].paymentStatus = paymentStatus;
      if (reason) list[idx].rejectionReason = reason;
      list[idx].updatedAt = new Date().toISOString();
      saveStoredRegistrations(list);
      addStoredAuditLog(
        `STATUS_CHANGE:${status}|PAYMENT:${paymentStatus}`,
        id,
        list[idx].registrationCode,
        reason || 'Status updated by administrator'
      );
    }
    return { success: true };
  },

  /**
   * Update tournament configuration
   */
  async updateTournamentSettings(
    settings: Partial<TournamentSettings>,
    token?: string | null
  ): Promise<{ success: boolean; data: TournamentSettings }> {
    if (token) {
      const res = await safeFetchJson<any>('/api/admin/tournament', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok && res.data?.data) {
        saveStoredTournament(res.data.data);
        return { success: true, data: res.data.data };
      }
    }

    const current = getStoredTournament();
    const updated: TournamentSettings = {
      ...current,
      ...settings,
      contactEmail: 'yashhkumar0007@gmail.com',
      contactPhone: '+91 88789 95680',
    };
    saveStoredTournament(updated);
    addStoredAuditLog('TOURNAMENT_SETTINGS_UPDATED', undefined, undefined, 'Updated by admin');
    return { success: true, data: updated };
  },

  /**
   * Export roster CSV
   */
  async exportCsv(token: string | null): Promise<Blob> {
    if (token) {
      try {
        const res = await fetch('/api/admin/export', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/csv')) {
            return await res.blob();
          }
        }
      } catch {
        // Fallback to local generation
      }
    }

    // Generate CSV from local registrations
    const registrations = getStoredRegistrations();
    const headers = [
      'Registration Code',
      'Team Code',
      'Game Mode',
      'Team Name',
      'Leader Name',
      'Leader Phone',
      'College / Institution',
      'Status',
      'Payment Status',
      'Payment Ref / UTR',
      'Fee (INR)',
      'Registration Time',
      'Player 1 (IGN / UID)',
      'Player 2 (IGN / UID)',
      'Player 3 (IGN / UID)',
      'Player 4 (IGN / UID)',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = registrations.map((r) => {
      const p1 = r.members[0] ? `${r.members[0].inGameName} (${r.members[0].freeFireUid})` : '';
      const p2 = r.members[1] ? `${r.members[1].inGameName} (${r.members[1].freeFireUid})` : '';
      const p3 = r.members[2] ? `${r.members[2].inGameName} (${r.members[2].freeFireUid})` : '';
      const p4 = r.members[3] ? `${r.members[3].inGameName} (${r.members[3].freeFireUid})` : '';

      return [
        escapeCsv(r.registrationCode),
        escapeCsv(r.teamCode),
        escapeCsv(r.gameMode),
        escapeCsv(r.teamName),
        escapeCsv(r.leaderName),
        escapeCsv(r.leaderPhone),
        escapeCsv(r.collegeName),
        escapeCsv(r.status),
        escapeCsv(r.paymentStatus),
        escapeCsv(r.paymentReference || 'N/A'),
        escapeCsv(r.fee),
        escapeCsv(r.createdAt),
        escapeCsv(p1),
        escapeCsv(p2),
        escapeCsv(p3),
        escapeCsv(p4),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};
