import React, { useState, useEffect } from 'react';
import {
  AdminOverviewStats,
  RegistrationRecord,
  TournamentSettings,
  AdminAuditLog,
  GameMode,
  RegistrationStatus,
  PaymentStatus,
} from '../types';
import {
  ShieldAlert,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Settings,
  FileSpreadsheet,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Lock,
  Key,
  UserCheck,
  Eye,
  History,
} from 'lucide-react';

import { apiClient } from '../services/apiClient';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('apex_admin_token'));
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Setup / Login form state
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'registrations' | 'prizes' | 'settings' | 'security' | 'audit'>('registrations');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);

  // Security & Credentials Form State
  const [currPass, setCurrPass] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [credSuccessMsg, setCredSuccessMsg] = useState<string | null>(null);
  const [credErrorMsg, setCredErrorMsg] = useState<string | null>(null);
  const [credSubmitting, setCredSubmitting] = useState<boolean>(false);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [showPrizeOverrideModal, setShowPrizeOverrideModal] = useState<boolean>(false);
  const [prizeOverrideUnlocked, setPrizeOverrideUnlocked] = useState<boolean>(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Selected registration modal for inspection/action
  const [selectedReg, setSelectedReg] = useState<RegistrationRecord | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  const checkAuthStatus = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const status = await apiClient.checkAdminAuth(token);
      setNeedsSetup(status.needsSetup);
      if (status.isAuthenticated) {
        setAdminUsername(status.username || 'admin');
        loadDashboardData(token);
      } else {
        setAdminUsername(null);
      }
    } catch {
      setAdminUsername(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (setupPassword.length < 8) {
      setAuthError('Admin password must be at least 8 characters long.');
      return;
    }
    if (setupPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      const data = await apiClient.setupAdmin(setupUsername.trim(), setupPassword);
      localStorage.setItem('apex_admin_token', data.token);
      setToken(data.token);
      setAdminUsername(data.username);
      setNeedsSetup(false);
      loadDashboardData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Setup initialization error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const data = await apiClient.loginAdmin(loginUsername.trim(), loginPassword);
      localStorage.setItem('apex_admin_token', data.token);
      setToken(data.token);
      setAdminUsername(data.username);
      loadDashboardData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_admin_token');
    setToken(null);
    setAdminUsername(null);
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredErrorMsg(null);
    setCredSuccessMsg(null);

    const targetUser = (newUsernameInput.trim() || adminUsername || 'admin').trim();
    if (targetUser.length < 3) {
      setCredErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (!currPass) {
      setCredErrorMsg('Please enter your current password to authorize this update.');
      return;
    }

    if (!newPass || newPass.length < 6) {
      setCredErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confirmNewPass) {
      setCredErrorMsg('New password and confirmation do not match.');
      return;
    }

    setCredSubmitting(true);
    try {
      const res = await apiClient.changeAdminCredentials(currPass, targetUser, newPass, token);
      setAdminUsername(res.username);
      if (res.token) {
        setToken(res.token);
      }
      setCredSuccessMsg(`Organizer credentials updated successfully! New username is "${res.username}". Keep your credentials confidential.`);
      setCurrPass('');
      setNewPass('');
      setConfirmNewPass('');
      setNewUsernameInput('');
      loadDashboardData(res.token || token);
    } catch (err: any) {
      setCredErrorMsg(err.message || 'Failed to update credentials. Please check your current password.');
    } finally {
      setCredSubmitting(false);
    }
  };

  const loadDashboardData = async (activeAuthToken = token) => {
    if (!activeAuthToken) return;
    setLoadingData(true);
    try {
      const [st, regList, tSettings, logs] = await Promise.all([
        apiClient.getAdminStats(activeAuthToken),
        apiClient.getAdminRegistrations(
          {
            search: searchTerm,
            gameMode: modeFilter,
            status: statusFilter,
            paymentStatus: paymentFilter,
          },
          activeAuthToken
        ),
        apiClient.getTournament(),
        apiClient.getAdminAuditLogs(activeAuthToken),
      ]);

      setStats(st);
      setRegistrations(regList);
      setTournamentSettings(tSettings);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusUpdate = async (
    id: number,
    status: RegistrationStatus,
    paymentStatus: PaymentStatus,
    reason?: string
  ) => {
    try {
      await apiClient.updateRegistrationStatus(id, status, paymentStatus, reason, token);
      setActionSuccessMsg(`Registration #${id} updated: ${status} / ${paymentStatus}`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setRejectionModalOpen(false);
      setRejectionReason('');
      setSelectedReg(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentSettings) return;

    try {
      const res = await apiClient.updateTournamentSettings(tournamentSettings, token);
      setActionSuccessMsg('Tournament configuration saved successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setTournamentSettings(res.data);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await apiClient.exportCsv(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crimson_apex_roster_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-black/90 border border-slate-800 text-center apex-chamfer">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-slate-400 uppercase">Connecting to Secure Security Gate...</p>
      </div>
    );
  }

  // Initial Administrator Setup Screen
  if (needsSetup) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-black/90 border border-rose-600/80 shadow-[0_0_30px_rgba(225,29,72,0.3)] apex-chamfer">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-950 border border-rose-500 text-rose-400 mx-auto flex items-center justify-center apex-chamfer mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">
            INITIALIZE ORGANIZER ADMIN
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            No administrator credentials found. Set up your master organizer credentials to lock the dashboard.
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono">
            {authError}
          </div>
        )}

        <form onSubmit={handleAdminSetup} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Admin Username
            </label>
            <input
              type="text"
              required
              value={setupUsername}
              onChange={(e) => setSetupUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Master Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-display font-bold uppercase tracking-wider text-sm apex-chamfer mt-4"
          >
            INITIALIZE & ENTER DASHBOARD
          </button>
        </form>
      </div>
    );
  }

  // Admin Login Screen
  if (!adminUsername) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-black/90 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.8)] apex-chamfer">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 border border-slate-700 text-rose-500 mx-auto flex items-center justify-center apex-chamfer mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">
            ORGANIZER GATEWAY LOGIN
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted tournament operations console.
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono">
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Enter username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono uppercase border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-display font-bold uppercase tracking-wider text-sm apex-chamfer"
            >
              AUTHENTICATE
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rose-950/40">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase">
            <ShieldAlert className="w-4 h-4" />
            <span>ORGANIZER OPERATIONS CONSOLE</span>
          </div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight mt-1">
            CRIMSON APEX CONTROL
          </h1>
          <span className="text-xs font-mono text-slate-400">
            Authenticated Admin: <strong className="text-slate-200">{adminUsername}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboardData()}
            className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-mono flex items-center gap-2 apex-chamfer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-mono flex items-center gap-1.5 apex-chamfer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="my-4 p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Overview KPI Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          <div className="p-4 bg-black/80 border border-slate-800 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL ENTRIES</span>
            <div className="text-2xl font-display font-black text-white tabular-nums mt-1">
              {stats.totalSubmissions}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              S:{stats.soloCount} | D:{stats.duoCount} | SQ:{stats.squadCount}
            </div>
          </div>

          <div className="p-4 bg-black/80 border border-emerald-900/50 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">CONFIRMED</span>
            <div className="text-2xl font-display font-black text-emerald-400 tabular-nums mt-1">
              {stats.confirmedCount}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">Approved & Ready</div>
          </div>

          <div className="p-4 bg-black/80 border border-amber-900/50 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">PENDING VERIFY</span>
            <div className="text-2xl font-display font-black text-amber-400 tabular-nums mt-1">
              {stats.pendingCount}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">Awaiting Audit</div>
          </div>

          <div className="p-4 bg-black/80 border border-rose-950 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-rose-500 block">REJECTED</span>
            <div className="text-2xl font-display font-black text-rose-500 tabular-nums mt-1">
              {stats.rejectedCount}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">Denied / Invalid</div>
          </div>

          <div className="p-4 bg-black/80 border border-slate-800 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">EXPECTED POOL</span>
            <div className="text-2xl font-display font-black text-white tabular-nums mt-1">
              ₹{stats.totalExpectedCollection}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">Total Entry Value</div>
          </div>

          <div className="p-4 bg-black/80 border border-emerald-800/40 apex-chamfer">
            <span className="text-[10px] font-mono uppercase text-emerald-300 block">VERIFIED FEES</span>
            <div className="text-2xl font-display font-black text-emerald-300 tabular-nums mt-1">
              ₹{stats.verifiedCollection}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">Cleared Collections</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 mb-6 text-sm font-mono">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
            activeTab === 'registrations'
              ? 'border-rose-500 text-rose-400 bg-rose-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Registrations ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('prizes')}
          className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
            activeTab === 'prizes'
              ? 'border-amber-500 text-amber-400 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Prize Distribution (₹1,050)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
            activeTab === 'settings'
              ? 'border-rose-500 text-rose-400 bg-rose-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tournament Configuration
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
            activeTab === 'security'
              ? 'border-rose-500 text-rose-400 bg-rose-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Security & Credentials
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 border-b-2 font-bold uppercase transition-colors ${
            activeTab === 'audit'
              ? 'border-rose-500 text-rose-400 bg-rose-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: REGISTRATIONS MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-black/70 p-4 border border-slate-800 apex-chamfer">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                placeholder="Search by code, team name, player name, UID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-rose-500"
              />
            </div>

            <div>
              <select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value);
                  setTimeout(() => loadDashboardData(), 10);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
              >
                <option value="ALL">All Modes (Solo/Duo/Squad)</option>
                <option value="SOLO">Solo Only</option>
                <option value="DUO">Duo Only</option>
                <option value="SQUAD">Squad Only</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(() => loadDashboardData(), 10);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Awaiting Payment Verification">Awaiting Payment</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="border border-slate-800 bg-black/80 overflow-x-auto apex-chamfer">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">REG ID</th>
                  <th className="p-3">MODE</th>
                  <th className="p-3">TEAM / LEADER</th>
                  <th className="p-3">LEADER CONTACT</th>
                  <th className="p-3">FEE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">PAYMENT</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                      No registrations found matching criteria.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-rose-400 whitespace-nowrap">
                        {reg.registrationCode}
                        <span className="block text-[10px] text-slate-500">{reg.teamCode}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">{reg.gameMode}</td>
                      <td className="p-3">
                        <strong className="text-white block">{reg.teamName}</strong>
                        <span className="text-slate-400 text-[11px]">{reg.leaderName} ({reg.collegeName})</span>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{reg.leaderPhone}</td>
                      <td className="p-3 tabular-nums font-semibold text-white">₹{reg.fee}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold border ${
                            reg.status === 'Confirmed'
                              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
                              : reg.status === 'Rejected'
                              ? 'text-rose-400 border-rose-500/40 bg-rose-950/20'
                              : 'text-amber-400 border-amber-500/40 bg-amber-950/20'
                          }`}
                        >
                          {reg.status}
                        </span>
                        {reg.rejectionReason && (
                          <span className="block text-[10px] text-rose-400 truncate max-w-[140px]" title={reg.rejectionReason}>
                            Reason: {reg.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold ${
                            reg.paymentStatus === 'Verified' ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {reg.paymentStatus}
                        </span>
                        {reg.paymentReference && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-[120px]" title={reg.paymentReference}>
                            Ref: {reg.paymentReference}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px]"
                          title="Inspect Team Dossier"
                        >
                          Dossier
                        </button>

                        {reg.status !== 'Confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(reg.id, 'Confirmed', 'Verified')}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px]"
                            title="Approve registration and confirm payment"
                          >
                            Approve
                          </button>
                        )}

                        {reg.status !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setSelectedReg(reg);
                              setRejectionModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[11px]"
                            title="Reject registration with reason"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: PRIZE MANAGEMENT (CONFIRMED ₹1,050) */}
      {/* ==================================================== */}
      {activeTab === 'prizes' && (
        <div className="space-y-6">
          <div className="bg-[#0b0b0f] border border-amber-500/40 p-6 sm:p-8 apex-chamfer">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>OFFICIALLY APPROVED CASH PRIZE DISTRIBUTION</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight mt-1">
                  TOTAL CASH PRIZE POOL: ₹1,050
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Fixed and finalized by organizers. Displayed live on the public Player Gateway.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-950/40 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold uppercase apex-chamfer">
                  STATUS: APPROVED & LOCKED
                </span>
              </div>
            </div>

            {/* Four Prize Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <div className="p-4 bg-black/90 border-2 border-amber-500/70 apex-chamfer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🥇</span>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">1ST PLACE</span>
                </div>
                <div className="font-display font-black text-lg text-white uppercase">CHAMPIONS</div>
                <div className="text-3xl font-display font-black text-amber-400 tabular-nums mt-1">₹500</div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">To Champion Team Leader</span>
              </div>

              <div className="p-4 bg-black/90 border border-slate-600 apex-chamfer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🥈</span>
                  <span className="text-[10px] font-mono text-slate-300 uppercase font-bold">2ND PLACE</span>
                </div>
                <div className="font-display font-black text-lg text-white uppercase">RUNNER-UP</div>
                <div className="text-3xl font-display font-black text-slate-200 tabular-nums mt-1">₹300</div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">To Finalist Team Leader</span>
              </div>

              <div className="p-4 bg-black/90 border border-slate-800 apex-chamfer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🥉</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">3RD PLACE</span>
                </div>
                <div className="font-display font-black text-lg text-white uppercase">PODIUM</div>
                <div className="text-3xl font-display font-black text-slate-300 tabular-nums mt-1">₹150</div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">To 3rd Place Team Leader</span>
              </div>

              <div className="p-4 bg-black/90 border-2 border-rose-600 apex-chamfer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🔥</span>
                  <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">INDIVIDUAL</span>
                </div>
                <div className="font-display font-black text-lg text-white uppercase">MOST KILLS</div>
                <div className="text-3xl font-display font-black text-rose-500 tabular-nums mt-1">₹100</div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">Independent Individual Award</span>
              </div>
            </div>

            {/* Most Kills Arbitration Panel */}
            <div className="p-4 bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>ARBITRATION PROTOCOL · MOST KILLS AWARD (₹100)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li><strong>Independent of Team Standing:</strong> The winner can belong to ANY team, even if their team finishes in last place.</li>
                <li><strong>Cumulative Eligibility:</strong> A player who finishes in 1st, 2nd, or 3rd place can ALSO win the ₹100 Most Kills award.</li>
                <li><strong>Tournament Aggregate:</strong> Based on verified individual kill totals across the entire tournament, not just a single match.</li>
                <li><strong>Tie-Break Rule:</strong> (1) Highest kills scored in a single match; (2) Higher placement finish of the player's team in the final match.</li>
              </ul>
            </div>

            {/* Protection Safeguard Against Accidental Edits */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs font-mono text-slate-400">
                <strong className="text-slate-200">Anti-Tamper Lock:</strong> Prize amounts are protected against accidental modifications.
              </div>
              <button
                type="button"
                onClick={() => setShowPrizeOverrideModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 hover:text-amber-300 apex-chamfer"
              >
                Request Prize Override...
              </button>
            </div>
          </div>

          {/* Explicit Confirmation Modal */}
          {showPrizeOverrideModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0b0b0f] border-2 border-amber-500 w-full max-w-lg p-6 apex-chamfer space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>EXPLICIT ADMINISTRATOR CONFIRMATION REQUIRED</span>
                </div>
                <h3 className="text-xl font-display font-black text-white uppercase">
                  CONFIRM PRIZE OVERRIDE
                </h3>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  The ₹1,050 cash prize pool (₹500 / ₹300 / ₹150 / ₹100) has been officially confirmed by organizers and publicized on the arena gateway.
                </p>
                <div className="p-3 bg-amber-950/40 border border-amber-600/60 text-xs font-mono text-amber-200">
                  ⚠️ WARNING: Modifying published prize amounts may breach player trust. Do not change approved amounts unless officially sanctioned by tournament directors.
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={prizeOverrideUnlocked}
                    onChange={(e) => setPrizeOverrideUnlocked(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span className="text-xs font-mono text-slate-300">
                    I explicitly confirm that I am authorized to unlock prize editing.
                  </span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrizeOverrideModal(false);
                      setPrizeOverrideUnlocked(false);
                    }}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  >
                    Keep Approved Values (Recommended)
                  </button>
                  <button
                    type="button"
                    disabled={!prizeOverrideUnlocked}
                    onClick={() => {
                      setShowPrizeOverrideModal(false);
                      alert('Override authorized. Prize values verified at ₹1,050 total.');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-black font-bold uppercase"
                  >
                    Confirm Override
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TOURNAMENT SETTINGS */}
      {/* ==================================================== */}
      {activeTab === 'settings' && tournamentSettings && (
        <form onSubmit={handleSaveSettings} className="bg-black/80 border border-slate-800 p-6 sm:p-8 apex-chamfer space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-xl font-display font-black text-white uppercase">
              TOURNAMENT PARAMETERS & PRICING
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Organizers control entry fees, registration limits, and event schedule from here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Tournament Title
              </label>
              <input
                type="text"
                value={tournamentSettings.name}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={tournamentSettings.tagline}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Pricing Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Solo Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={tournamentSettings.soloFee}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, soloFee: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-black border border-slate-700 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Duo Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={tournamentSettings.duoFee}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, duoFee: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-black border border-slate-700 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Squad Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={tournamentSettings.squadFee}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, squadFee: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-black border border-slate-700 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Status & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Registration Status
              </label>
              <select
                value={tournamentSettings.registrationOpen ? 'true' : 'false'}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, registrationOpen: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              >
                <option value="true">OPEN (Accepting entries)</option>
                <option value="false">CLOSED (Locked)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Capacity Limit (Max slots)
              </label>
              <input
                type="number"
                value={tournamentSettings.registrationLimit}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, registrationLimit: parseInt(e.target.value, 10) || 100 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Match Date & Time
              </label>
              <input
                type="text"
                placeholder="Leave blank to keep UNANNOUNCED"
                value={tournamentSettings.announcedDate || ''}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, announcedDate: e.target.value.trim() ? e.target.value : null })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                {tournamentSettings.announcedDate ? 'Date announced to players' : 'Kept unannounced until set'}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Organizer UPI ID
              </label>
              <input
                type="text"
                value={tournamentSettings.paymentUpiId}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, paymentUpiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Organizer Contact Phone
              </label>
              <input
                type="text"
                value={tournamentSettings.contactPhone}
                onChange={(e) => setTournamentSettings({ ...tournamentSettings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Payment & Verification Instructions (Visible to registered players)
            </label>
            <textarea
              rows={3}
              value={tournamentSettings.paymentInstructions}
              onChange={(e) => setTournamentSettings({ ...tournamentSettings, paymentInstructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Official Tournament Rules
            </label>
            <textarea
              rows={6}
              value={tournamentSettings.rules}
              onChange={(e) => setTournamentSettings({ ...tournamentSettings, rules: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-display font-bold uppercase tracking-wider text-sm apex-chamfer"
          >
            SAVE TOURNAMENT SETTINGS
          </button>
        </form>
      )}

      {/* ==================================================== */}
      {/* TAB: SECURITY & CREDENTIALS MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-black/80 border border-slate-800 p-6 sm:p-8 apex-chamfer">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 bg-rose-950/60 border border-rose-600/40 flex items-center justify-center apex-chamfer">
                <Key className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                  ORGANIZER ACCESS & CREDENTIALS
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Update username and password for the Crimson Apex operations console.
                </p>
              </div>
            </div>

            <div className="my-5 p-3.5 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Logged-in Account:</span>
                <span className="text-rose-400 font-bold px-2 py-0.5 bg-rose-950/50 border border-rose-900/40">
                  {adminUsername}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Notice: Passwords and default credentials are kept private and never exposed on the public login page. Only authorized personnel who know the set credentials can log in.
              </p>
            </div>

            {credSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-mono flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{credSuccessMsg}</span>
              </div>
            )}

            {credErrorMsg && (
              <div className="mb-4 p-3 bg-rose-950 border border-rose-600 text-rose-200 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{credErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangeCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  New Organizer Username
                </label>
                <input
                  type="text"
                  required
                  placeholder={adminUsername || 'admin'}
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Enter new username or keep your current one.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Required to verify your authorization before saving changes.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={credSubmitting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-display font-bold uppercase tracking-wider text-sm apex-chamfer transition-colors"
                >
                  {credSubmitting ? 'UPDATING CREDENTIALS...' : 'SAVE NEW CREDENTIALS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ==================================================== */}
      {activeTab === 'audit' && (
        <div className="border border-slate-800 bg-black/80 overflow-x-auto apex-chamfer">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">ADMIN</th>
                <th className="p-3">ACTION</th>
                <th className="p-3">REG CODE</th>
                <th className="p-3">REASON / DETAILS</th>
                <th className="p-3">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-500">#{log.id}</td>
                    <td className="p-3 text-rose-400 font-bold">{log.adminUsername}</td>
                    <td className="p-3 font-semibold text-white">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.registrationCode || 'N/A'}</td>
                    <td className="p-3 text-slate-400">{log.reason || '—'}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================== */}
      {/* DOSSIER INSPECTION MODAL */}
      {/* ==================================================== */}
      {selectedReg && !rejectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0b0f] border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 apex-chamfer">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-rose-500 uppercase font-bold">
                  REGISTRATION DOSSIER
                </span>
                <h3 className="text-2xl font-display font-black text-white uppercase">
                  {selectedReg.registrationCode} — {selectedReg.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">TEAM CODE:</span>
                <span className="text-white font-bold">{selectedReg.teamCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">LEADER:</span>
                <span className="text-white font-semibold">{selectedReg.leaderName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">LEADER PHONE:</span>
                <span className="text-rose-400 font-bold">{selectedReg.leaderPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">INSTITUTION:</span>
                <span className="text-white">{selectedReg.collegeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">FEE (INR):</span>
                <span className="text-white font-bold">₹{selectedReg.fee}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAYMENT REF / UTR:</span>
                <span className="text-amber-400 font-bold">{selectedReg.paymentReference || 'None provided'}</span>
              </div>
            </div>

            {/* Roster Members */}
            <div className="my-4">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                ROSTER PLAYERS ({selectedReg.members?.length || 0}):
              </span>
              <div className="space-y-2">
                {selectedReg.members?.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 text-xs font-mono"
                  >
                    <div>
                      <span className="text-rose-500 font-bold mr-2">{idx + 1}.</span>
                      <strong className="text-white">{m.inGameName}</strong>
                      <span className="text-slate-400 block text-[11px]">{m.fullName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">FREE FIRE UID</span>
                      <span className="text-white font-bold tabular-nums">{m.freeFireUid}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(selectedReg.id, 'Confirmed', 'Verified')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold uppercase text-xs apex-chamfer"
                >
                  Approve & Verify Payment
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedReg.id, 'Confirmed', 'Pending')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold uppercase text-xs apex-chamfer"
                >
                  Approve (Payment Pending)
                </button>
                <button
                  onClick={() => setRejectionModalOpen(true)}
                  className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-display font-bold uppercase text-xs apex-chamfer"
                >
                  Reject...
                </button>
              </div>

              <button
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* REJECTION REASON MODAL */}
      {/* ==================================================== */}
      {rejectionModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0b0f] border border-rose-600 w-full max-w-md p-6 apex-chamfer">
            <h3 className="text-xl font-display font-black text-rose-500 uppercase">
              REJECT REGISTRATION
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Please enter the official reason for rejecting {selectedReg.registrationCode}. The player will see this reason on pass lookup.
            </p>

            <div className="my-4">
              <textarea
                rows={3}
                required
                placeholder="e.g. Invalid Free Fire UID format, duplicate player detected, or payment verification failed."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectionModalOpen(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={() => handleStatusUpdate(selectedReg.id, 'Rejected', 'Pending', rejectionReason.trim())}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-display font-bold uppercase text-xs apex-chamfer"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
