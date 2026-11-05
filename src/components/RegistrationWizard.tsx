import React, { useState, useEffect } from 'react';
import { GameMode, RegistrationInput, PlayerRecord, TournamentSettings } from '../types';
import { validateRegistrationData, isValidPhone, isValidFreeFireUid, calculateFee } from '../utils/validation';
import { apiClient } from '../services/apiClient';
import confetti from 'canvas-confetti';
import {
  User,
  Users,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface RegistrationWizardProps {
  tournament: TournamentSettings | null;
  initialMode?: GameMode;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  tournament,
  initialMode = 'SQUAD',
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [leaderUid, setLeaderUid] = useState('');
  const [leaderIgn, setLeaderIgn] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Members list (size depends on mode)
  const [members, setMembers] = useState<PlayerRecord[]>([
    { fullName: '', freeFireUid: '', inGameName: '', isTeamLeader: true, phone: '' },
  ]);

  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const soloFee = tournament?.soloFee ?? 30;
  const duoFee = tournament?.duoFee ?? 50;
  const squadFee = tournament?.squadFee ?? 100;
  const currentFee = calculateFee(gameMode, { soloFee, duoFee, squadFee });

  // Sync member count when gameMode changes
  useEffect(() => {
    const targetCount = gameMode === 'SOLO' ? 1 : gameMode === 'DUO' ? 2 : 4;
    setMembers((prev) => {
      const updated = [...prev];
      // Keep leader in slot 0
      updated[0] = {
        fullName: leaderName,
        freeFireUid: leaderUid,
        inGameName: leaderIgn,
        isTeamLeader: true,
        phone: leaderPhone,
      };

      while (updated.length < targetCount) {
        updated.push({
          fullName: '',
          freeFireUid: '',
          inGameName: '',
          isTeamLeader: false,
          phone: '',
        });
      }
      return updated.slice(0, targetCount);
    });
  }, [gameMode]);

  // Keep leader in sync with member[0]
  useEffect(() => {
    setMembers((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = {
        fullName: leaderName,
        freeFireUid: leaderUid,
        inGameName: leaderIgn,
        isTeamLeader: true,
        phone: leaderPhone,
      };
      return copy;
    });
  }, [leaderName, leaderUid, leaderIgn, leaderPhone]);

  const handleMemberChange = (index: number, field: keyof PlayerRecord, value: string) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Step 1 Validation: Mode Selection
  const handleProceedFromStep1 = () => {
    setErrors({});
    setStep(2);
  };

  // Step 2 Validation: Team & Leader info
  const handleProceedFromStep2 = () => {
    const errs: Record<string, string> = {};

    if (gameMode !== 'SOLO' && (!teamName || teamName.trim().length < 2)) {
      errs.teamName = 'Team name is required (min 2 characters).';
    }
    if (!leaderName || leaderName.trim().length < 2) {
      errs.leaderName = 'Team leader full name is required.';
    }
    if (!isValidPhone(leaderPhone)) {
      errs.leaderPhone = 'Enter a valid 10-digit mobile number (e.g. 9876543210).';
    }
    if (!collegeName || collegeName.trim().length < 2) {
      errs.collegeName = 'College or institution name is required.';
    }
    if (!isValidFreeFireUid(leaderUid)) {
      errs.leaderUid = 'Free Fire UID must be 8 to 12 digits (numeric only).';
    }
    if (!leaderIgn || leaderIgn.trim().length < 2) {
      errs.leaderIgn = 'In-game name (IGN) is required.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    if (gameMode === 'SOLO') {
      // Solo has only 1 player, which is already configured
      setStep(4);
    } else {
      setStep(3);
    }
  };

  // Step 3 Validation: Additional Members info
  const handleProceedFromStep3 = () => {
    const errs: Record<string, string> = {};
    const seenUids = new Set<string>();

    members.forEach((m, idx) => {
      if (!m.fullName || m.fullName.trim().length < 2) {
        errs[`member_${idx}_fullName`] = `Player ${idx + 1} full name is required.`;
      }
      if (!isValidFreeFireUid(m.freeFireUid)) {
        errs[`member_${idx}_uid`] = `Player ${idx + 1} UID must be 8-12 numeric digits.`;
      } else {
        const uidTrim = m.freeFireUid.trim();
        if (seenUids.has(uidTrim)) {
          errs[`member_${idx}_uid`] = `Duplicate Free Fire UID (${uidTrim}) detected within team.`;
        }
        seenUids.add(uidTrim);
      }
      if (!m.inGameName || m.inGameName.trim().length < 2) {
        errs[`member_${idx}_ign`] = `Player ${idx + 1} in-game name is required.`;
      }
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStep(4);
  };

  // Final Step: Submit Registration
  const handleSubmit = async () => {
    setSubmitError(null);

    const payload: RegistrationInput = {
      gameMode,
      teamName: gameMode === 'SOLO' ? (teamName || `${leaderIgn} (Solo)`) : teamName,
      leaderName,
      leaderPhone,
      collegeName,
      leaderUid,
      leaderIgn,
      members,
      consent,
      paymentReference: paymentReference.trim() || undefined,
    };

    // Validate using pure helper before calling API
    const localVal = validateRegistrationData(payload);
    if (!localVal.valid) {
      setErrors(localVal.errors);
      setSubmitError('Please fix the highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const registeredRecord = await apiClient.register(payload);

      // Fire celebratory confetti on verified success!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#fbbf24', '#991b1b'],
        });
      } catch (e) {
        // ignore confetti failures
      }

      // Pass success data to parent component
      onSuccess(registeredRecord);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setSubmitError(err.message || 'Registration failed. Please check your data and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Wizard Progress Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
          <span className="text-rose-500 font-bold uppercase">
            STEP {step} OF 4 —{' '}
            {step === 1 && 'SELECT MODE'}
            {step === 2 && 'TEAM & LEADER PROFILE'}
            {step === 3 && 'ROSTER MEMBERS'}
            {step === 4 && 'REVIEW & CONSENT'}
          </span>
          <span className="tabular-nums">FEE: ₹{currentFee}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-rose-600 to-red-500 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-rose-950/80 border border-rose-600 text-rose-200 text-sm flex items-start gap-3 apex-chamfer">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong className="block font-bold">Submission Blocked:</strong>
            {submitError}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 1: SELECT MODE */}
      {/* ==================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase">
              SELECT BATTLE ROYALE MODE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Choose your competitive roster tier. Prices are set by the tournament organizer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Solo */}
            <button
              type="button"
              onClick={() => setGameMode('SOLO')}
              className={`p-5 text-left border apex-chamfer transition-all ${
                gameMode === 'SOLO'
                  ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                  : 'border-slate-800 bg-black/60 hover:border-slate-700'
              }`}
            >
              <User className="w-6 h-6 text-rose-500 mb-2" />
              <div className="font-display font-black text-lg text-white">SOLO</div>
              <div className="text-xs font-mono text-slate-400">1 Player</div>
              <div className="mt-4 text-xl font-display font-black text-rose-400 tabular-nums">
                ₹{soloFee}
              </div>
            </button>

            {/* Duo */}
            <button
              type="button"
              onClick={() => setGameMode('DUO')}
              className={`p-5 text-left border apex-chamfer transition-all ${
                gameMode === 'DUO'
                  ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                  : 'border-slate-800 bg-black/60 hover:border-slate-700'
              }`}
            >
              <Users className="w-6 h-6 text-rose-500 mb-2" />
              <div className="font-display font-black text-lg text-white">DUO</div>
              <div className="text-xs font-mono text-slate-400">2 Players</div>
              <div className="mt-4 text-xl font-display font-black text-rose-400 tabular-nums">
                ₹{duoFee}
              </div>
            </button>

            {/* Squad */}
            <button
              type="button"
              onClick={() => setGameMode('SQUAD')}
              className={`p-5 text-left border apex-chamfer transition-all ${
                gameMode === 'SQUAD'
                  ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                  : 'border-slate-800 bg-black/60 hover:border-slate-700'
              }`}
            >
              <Shield className="w-6 h-6 text-rose-500 mb-2" />
              <div className="font-display font-black text-lg text-white">SQUAD</div>
              <div className="text-xs font-mono text-slate-400">4 Players</div>
              <div className="mt-4 text-xl font-display font-black text-rose-400 tabular-nums">
                ₹{squadFee}
              </div>
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <span className="text-amber-400 font-semibold uppercase">Notice:</span> Each player must have a valid Free Fire UID. Emulators are strictly banned in tournament matches.
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={handleProceedFromStep1}
              className="px-6 py-3 font-display font-bold uppercase tracking-wider text-sm text-white bg-rose-600 hover:bg-rose-500 apex-chamfer flex items-center gap-2"
            >
              <span>CONTINUE TO TEAM INFO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 2: TEAM & LEADER INFORMATION */}
      {/* ==================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase">
              TEAM & LEADER PROFILE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              The team leader receives the Room ID, Password, and official coordinator communications.
            </p>
          </div>

          <div className="space-y-4">
            {/* Team Name (Required for Duo & Squad, Optional for Solo) */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Team Name {gameMode !== 'SOLO' ? <span className="text-rose-500">*</span> : <span className="text-slate-500">(Optional for Solo)</span>}
              </label>
              <input
                type="text"
                placeholder={gameMode === 'SOLO' ? 'Optional team/clan tag' : 'e.g. Crimson Vipers'}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm focus:outline-none focus:border-rose-500 ${
                  errors.teamName ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.teamName && (
                <p className="text-xs text-rose-400 mt-1">{errors.teamName}</p>
              )}
            </div>

            {/* Leader Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Team Leader Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm focus:outline-none focus:border-rose-500 ${
                    errors.leaderName ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.leaderName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.leaderName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Leader Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile (e.g. 9876543210)"
                  value={leaderPhone}
                  onChange={(e) => setLeaderPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm font-mono focus:outline-none focus:border-rose-500 ${
                    errors.leaderPhone ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.leaderPhone && (
                  <p className="text-xs text-rose-400 mt-1">{errors.leaderPhone}</p>
                )}
              </div>
            </div>

            {/* College / Institution */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                College / School / Institution <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Delhi Technological University or Open Esports"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm focus:outline-none focus:border-rose-500 ${
                  errors.collegeName ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.collegeName && (
                <p className="text-xs text-rose-400 mt-1">{errors.collegeName}</p>
              )}
            </div>

            {/* Leader Free Fire UID & IGN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Leader Free Fire UID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="8-12 digits (e.g. 1029384756)"
                  value={leaderUid}
                  onChange={(e) => setLeaderUid(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm font-mono focus:outline-none focus:border-rose-500 ${
                    errors.leaderUid ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.leaderUid && (
                  <p className="text-xs text-rose-400 mt-1">{errors.leaderUid}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Leader In-Game Name (IGN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Exact in-game handle (e.g. VIPER_CHIEF)"
                  value={leaderIgn}
                  onChange={(e) => setLeaderIgn(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-black/80 border text-white text-sm font-mono focus:outline-none focus:border-rose-500 ${
                    errors.leaderIgn ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.leaderIgn && (
                  <p className="text-xs text-rose-400 mt-1">{errors.leaderIgn}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleProceedFromStep2}
              className="px-6 py-3 font-display font-bold uppercase tracking-wider text-sm text-white bg-rose-600 hover:bg-rose-500 apex-chamfer flex items-center gap-2"
            >
              <span>{gameMode === 'SOLO' ? 'CONTINUE TO REVIEW' : 'CONTINUE TO ROSTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: ROSTER MEMBERS (For DUO and SQUAD) */}
      {/* ==================================================== */}
      {step === 3 && gameMode !== 'SOLO' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase">
              REGISTER TEAM ROSTER
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {gameMode === 'DUO' ? 'Enter Player 2 details.' : 'Enter Players 2, 3, and 4 details.'}{' '}
              Player 1 is auto-populated from Team Leader.
            </p>
          </div>

          <div className="space-y-6">
            {members.map((member, idx) => {
              const isLeader = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-5 border apex-chamfer ${
                    isLeader ? 'bg-slate-950/90 border-slate-700' : 'bg-black/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="font-display font-bold text-sm tracking-wider uppercase text-white">
                      PLAYER {idx + 1} {isLeader && <span className="text-rose-500">(TEAM LEADER)</span>}
                    </span>
                    {isLeader && (
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-700">
                        AUTO-FILLED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isLeader}
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)}
                        placeholder="Player full name"
                        className={`w-full px-3 py-2 bg-slate-950 border text-white text-xs ${
                          isLeader ? 'text-slate-400 cursor-not-allowed' : ''
                        } ${errors[`member_${idx}_fullName`] ? 'border-rose-500' : 'border-slate-800'}`}
                      />
                      {errors[`member_${idx}_fullName`] && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          {errors[`member_${idx}_fullName`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Free Fire UID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isLeader}
                        value={member.freeFireUid}
                        onChange={(e) => handleMemberChange(idx, 'freeFireUid', e.target.value)}
                        placeholder="8-12 digits"
                        className={`w-full px-3 py-2 bg-slate-950 border text-white text-xs font-mono ${
                          isLeader ? 'text-slate-400 cursor-not-allowed' : ''
                        } ${errors[`member_${idx}_uid`] ? 'border-rose-500' : 'border-slate-800'}`}
                      />
                      {errors[`member_${idx}_uid`] && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          {errors[`member_${idx}_uid`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        In-Game Name (IGN) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isLeader}
                        value={member.inGameName}
                        onChange={(e) => handleMemberChange(idx, 'inGameName', e.target.value)}
                        placeholder="Exact game tag"
                        className={`w-full px-3 py-2 bg-slate-950 border text-white text-xs font-mono ${
                          isLeader ? 'text-slate-400 cursor-not-allowed' : ''
                        } ${errors[`member_${idx}_ign`] ? 'border-rose-500' : 'border-slate-800'}`}
                      />
                      {errors[`member_${idx}_ign`] && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          {errors[`member_${idx}_ign`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleProceedFromStep3}
              className="px-6 py-3 font-display font-bold uppercase tracking-wider text-sm text-white bg-rose-600 hover:bg-rose-500 apex-chamfer flex items-center gap-2"
            >
              <span>CONTINUE TO REVIEW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: REVIEW, FEE & CONSENT */}
      {/* ==================================================== */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase">
              DOSSIER REVIEW & SUBMISSION
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Verify your team roster and entry fee before generating your official registration code.
            </p>
          </div>

          {/* Dossier Card */}
          <div className="bg-black/90 border border-slate-800 p-6 apex-chamfer space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-rose-500 uppercase tracking-wider font-bold">
                  {gameMode} ENTRY
                </span>
                <h3 className="text-xl font-display font-black text-white uppercase">
                  {gameMode === 'SOLO' ? leaderIgn : teamName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase">PAYABLE ENTRY FEE</span>
                <div className="text-2xl font-display font-black text-white tabular-nums">
                  ₹{currentFee}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">TEAM LEADER:</span>
                <span className="text-slate-200 font-semibold">{leaderName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CONTACT PHONE:</span>
                <span className="text-slate-200 font-semibold">{leaderPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">INSTITUTION:</span>
                <span className="text-slate-200 font-semibold">{collegeName}</span>
              </div>
            </div>

            {/* Members Roster List */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                ROSTER PLAYERS ({members.length}):
              </span>
              <div className="space-y-2">
                {members.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-slate-500">{idx + 1}.</span>
                      <strong className="text-white">{m.inGameName}</strong>
                      <span className="text-slate-400">({m.fullName})</span>
                    </div>
                    <div className="text-slate-400 tabular-nums">
                      UID: <span className="text-rose-400">{m.freeFireUid}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Pre-filled Payment Reference (UTR / UPI Ref) */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                UPI Reference / UTR Number <span className="text-slate-500">(Optional at this stage)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 412984920194 or leave blank if paying after pass generation"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If you have already transferred ₹{currentFee} to <code className="text-slate-300">crimsonapex.pay@okaxis</code>, enter the UTR here. You can also provide it later during pass lookup.
              </p>
            </div>
          </div>

          {/* Mandatory Verification & Consent Checkbox */}
          <div className="p-4 bg-slate-950 border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded-none accent-rose-600 bg-black border-slate-700"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I hereby declare that all submitted Free Fire UIDs, player identities, and contact numbers are accurate. I have read and agree to all Crimson Apex Championship tournament rules, anti-cheat regulations, and acknowledge the mandatory verification policy:
                <em className="block text-amber-400 not-italic font-mono mt-1">
                  "Your registration is subject to verification. Your registration ID does not by itself confirm payment or guarantee tournament admission."
                </em>
              </span>
            </label>
            {errors.consent && (
              <p className="text-xs text-rose-400 mt-2">{errors.consent}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => (gameMode === 'SOLO' ? setStep(2) : setStep(3))}
              className="px-5 py-2.5 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back / Edit Roster</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !consent}
              onClick={handleSubmit}
              className={`px-8 py-3.5 font-display font-black uppercase tracking-wider text-base text-white apex-chamfer flex items-center gap-2 transition-all ${
                isSubmitting || !consent
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
              }`}
            >
              <span>{isSubmitting ? 'VERIFYING & GENERATING CODES...' : 'CONFIRM & ENTER ARENA'}</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
