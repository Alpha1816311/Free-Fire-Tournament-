import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  initDatabase,
  getActiveTournament,
  updateTournamentSettings,
  createRegistration,
  getPublicRegistrationByCode,
  getAdminRegistrations,
  getAdminStats,
  updateRegistrationStatus,
  hasAdminUsers,
  createAdminUser,
  verifyAdminCredentials,
  getAdminAuditLogs,
  logAdminAudit,
} from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database schemas and tables
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'crimson_apex_secret_key_session_guard_2026';

app.use(express.json());

// Token helper
interface TokenPayload {
  username: string;
  exp: number;
}

function signToken(username: string): string {
  const payload: TokenPayload = {
    username,
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
    if (signature !== expected) return null;
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Middleware: Authenticate Admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Admin token missing.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired administrator session.' });
    return;
  }

  (req as any).adminUser = payload.username;
  next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get active tournament info
app.get('/api/tournament', (req: Request, res: Response) => {
  try {
    const tournament = getActiveTournament();
    res.json(tournament);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load tournament information' });
  }
});

// Submit registration
app.post('/api/register', (req: Request, res: Response) => {
  try {
    const result = createRegistration(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: result,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Registration failed. Please check your submission and try again.',
    });
  }
});

// Public registration lookup (sanitized for privacy)
app.get('/api/registration/:code', (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    if (!code) {
      res.status(400).json({ error: 'Registration or team code is required' });
      return;
    }
    const record = getPublicRegistrationByCode(code);
    if (!record) {
      res.status(404).json({ error: `No registration found matching code "${code}". Please check your code.` });
      return;
    }
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lookup failed' });
  }
});

// Check admin setup status
app.get('/api/admin/auth-status', (req: Request, res: Response) => {
  const hasUsers = hasAdminUsers();
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const payload = token ? verifyToken(token) : null;

  res.json({
    needsSetup: !hasUsers,
    isAuthenticated: Boolean(payload),
    username: payload?.username || null,
  });
});

// Admin initial setup (only allowed if no admin exists yet)
app.post('/api/admin/setup', (req: Request, res: Response) => {
  try {
    if (hasAdminUsers()) {
      res.status(400).json({ error: 'Administrator account has already been initialized. Please log in.' });
      return;
    }

    const { username, password } = req.body;
    if (!username || username.trim().length < 3) {
      res.status(400).json({ error: 'Admin username must be at least 3 characters.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
      return;
    }

    createAdminUser(username.trim(), password);
    const token = signToken(username.trim());

    res.json({
      success: true,
      message: 'Administrator account created successfully.',
      token,
      username: username.trim(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Admin setup failed' });
  }
});

// Admin login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const valid = verifyAdminCredentials(username, password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = signToken(username);
    logAdminAudit(username, 'ADMIN_LOGIN', undefined, undefined, 'Successful administrator login');

    res.json({
      success: true,
      token,
      username,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// ==========================================
// PROTECTED ADMIN ROUTES
// ==========================================

// Get admin registrations
app.get('/api/admin/registrations', requireAdmin, (req: Request, res: Response) => {
  try {
    const { search, gameMode, status, paymentStatus } = req.query;
    const list = getAdminRegistrations({
      search: search as string,
      gameMode: gameMode as string,
      status: status as string,
      paymentStatus: paymentStatus as string,
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch registrations' });
  }
});

// Get admin overview stats
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = getAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// Get admin audit logs
app.get('/api/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  try {
    const logs = getAdminAuditLogs(50);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

// Update registration status / payment status
app.patch('/api/admin/registrations/:id/status', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, paymentStatus, rejectionReason } = req.body;
    const adminUser = (req as any).adminUser;

    if (!status || !paymentStatus) {
      res.status(400).json({ error: 'Status and paymentStatus are required.' });
      return;
    }

    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      res.status(400).json({ error: 'A specific reason is required when rejecting a registration.' });
      return;
    }

    updateRegistrationStatus(id, status, paymentStatus, rejectionReason, adminUser);
    res.json({ success: true, message: 'Registration updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update registration' });
  }
});

// Update tournament settings
app.put('/api/admin/tournament', requireAdmin, (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).adminUser;
    const updated = updateTournamentSettings(req.body, adminUser);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update tournament settings' });
  }
});

// Export CSV for tournament coordinator
app.get('/api/admin/export', requireAdmin, (req: Request, res: Response) => {
  try {
    const registrations = getAdminRegistrations();

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

    const rows = registrations.map(r => {
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

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="crimson_apex_roster_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crimson Apex Server listening on port ${PORT}`);
  });
}

startServer();
