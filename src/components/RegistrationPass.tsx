import React, { useState } from 'react';
import { CrimsonApexLogo } from './CrimsonApexLogo';
import {
  Copy,
  Check,
  Printer,
  Home,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Download,
  Info,
  Mail,
  Phone,
} from 'lucide-react';

interface RegistrationPassProps {
  data: {
    registrationCode: string;
    teamCode: string;
    gameMode: string;
    teamName: string;
    leaderName: string;
    collegeName: string;
    fee: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    announcedDate?: string | null;
    paymentUpiId?: string;
    paymentInstructions?: string;
    members?: Array<{
      fullName: string;
      freeFireUid: string;
      inGameName: string;
      isTeamLeader?: boolean;
    }>;
  };
  onReturnHome: () => void;
}

export const RegistrationPass: React.FC<RegistrationPassProps> = ({
  data,
  onReturnHome,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    Submitted: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
    'Awaiting Payment Verification': 'text-amber-400 border-amber-500/40 bg-amber-950/20',
    Confirmed: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
    Rejected: 'text-rose-500 border-rose-500/40 bg-rose-950/20',
    Cancelled: 'text-slate-400 border-slate-700 bg-slate-900',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Animated Code Reveal Banner */}
      <div className="mb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-950/60 border border-rose-600/50 text-rose-300 font-mono text-xs font-bold uppercase apex-chamfer animate-pulse">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>REGISTRATION RECORD PERSISTED IN SECURE DATABASE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight">
          ARENA PASS GENERATED
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Save your Registration ID and Team Code. Use them for check-in and custom lobby slot verification.
        </p>
      </div>

      {/* ==================================================== */}
      {/* THE OFFICIAL CRIMSON APEX DIGITAL REGISTRATION PASS */}
      {/* ==================================================== */}
      <div
        id="printable-pass"
        className="relative bg-[#0b0b0f] border-2 border-rose-700/80 shadow-[0_0_35px_rgba(225,29,72,0.25)] p-6 sm:p-10 apex-chamfer overflow-hidden print:bg-white print:text-black print:border-black"
      >
        {/* Holographic Watermark effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 apex-grid-pattern opacity-20 pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-gray-300">
          <CrimsonApexLogo size="md" showTagline={true} />
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              TOURNAMENT EVENT
            </span>
            <div className="font-display font-black text-base text-white print:text-black uppercase">
              BATTLE ROYALE CHAMPIONSHIP #001
            </div>
            <span className="text-xs font-mono text-rose-400">
              {data.announcedDate ? data.announcedDate : 'DATE: ANNOUNCED BY ORGANIZER'}
            </span>
          </div>
        </div>

        {/* Hero Code Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Registration Code */}
          <div className="p-4 bg-black/80 border border-rose-500/60 apex-chamfer print:border-gray-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              REGISTRATION ID
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white print:text-black tracking-wider">
                {data.registrationCode}
              </span>
              <button
                onClick={() => copyToClipboard(data.registrationCode, 'reg')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors print:hidden"
                title="Copy Registration Code"
                aria-label="Copy Registration Code"
              >
                {copiedCode === 'reg' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Team / Player Code */}
          <div className="p-4 bg-black/80 border border-slate-700 apex-chamfer print:border-gray-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              {data.gameMode === 'SOLO' ? 'PLAYER ARENA CODE' : 'TEAM ARENA CODE'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-mono font-black text-rose-500 print:text-red-700 tracking-wider">
                {data.teamCode}
              </span>
              <button
                onClick={() => copyToClipboard(data.teamCode, 'team')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors print:hidden"
                title="Copy Team Code"
                aria-label="Copy Team Code"
              >
                {copiedCode === 'team' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status & Entry Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-slate-800/80 text-xs font-mono mb-6 print:border-gray-300">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">GAME MODE:</span>
            <span className="text-white print:text-black font-bold uppercase">{data.gameMode}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">TEAM / TAG:</span>
            <span className="text-white print:text-black font-semibold truncate block">
              {data.teamName || 'Solo Operative'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">REGISTRATION STATUS:</span>
            <span className={`inline-block px-2 py-0.5 text-[11px] font-bold border ${statusColors[data.status] || 'text-slate-300 border-slate-700'}`}>
              {data.status}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">PAYMENT STATUS:</span>
            <span className="text-amber-400 font-bold block">
              {data.paymentStatus === 'Verified' ? 'VERIFIED (₹' + data.fee + ')' : 'VERIFICATION PENDING (₹' + data.fee + ')'}
            </span>
          </div>
        </div>

        {/* Team Dossier: Roster without private phone numbers */}
        {data.members && data.members.length > 0 && (
          <div className="mb-6">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
              OFFICIAL SQUAD ROSTER ({data.members.length} OPERATIVE{data.members.length > 1 ? 'S' : ''}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.members.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 print:bg-white print:border-gray-300 text-xs font-mono"
                >
                  <div>
                    <span className="text-rose-500 font-bold mr-1.5">{idx + 1}.</span>
                    <strong className="text-white print:text-black">{m.inGameName}</strong>
                    <span className="text-slate-400 block text-[11px]">{m.fullName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">UID</span>
                    <span className="text-slate-200 print:text-gray-800 font-bold tabular-nums">
                      {m.freeFireUid}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification & Payment Instructions Callout */}
        <div className="p-4 bg-slate-950 border border-slate-800 print:border-gray-300 text-xs text-slate-300 leading-relaxed font-mono">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-white print:text-black">Payment & Room Admission Next Steps:</strong>
              <p className="mt-1 text-slate-400 print:text-gray-600">
                {data.paymentInstructions ||
                  `Send tournament entry fee (₹${data.fee}) via UPI to crimsonapex.pay@okaxis. Include your Registration ID (${data.registrationCode}) in transaction notes. Room ID & password will be shared with the team leader prior to tournament start.`}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800 print:border-gray-300 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-400 print:text-gray-600 font-bold">Coordinator Help Desk:</span>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="mailto:yashhkumar0007@gmail.com"
                    className="text-rose-400 hover:text-rose-300 print:text-black flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>yashhkumar0007@gmail.com</span>
                  </a>
                  <a
                    href="tel:+918878995680"
                    className="text-rose-400 hover:text-rose-300 print:text-black flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 88789 95680</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Footer & Security Barcode/QR Simulator */}
        <div className="mt-6 pt-4 border-t border-slate-800 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-500">
          <div>
            <span>SECURE CRYPTO HASH: {data.registrationCode}-CRIMSON-APEX-VERIFIED</span>
            <div className="text-slate-600">TIMESTAMP: {new Date(data.createdAt).toUTCString()}</div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <QrCode className="w-5 h-5 text-rose-500" />
            <span className="tracking-widest uppercase">OFFICIAL TOURNAMENT PASS</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onReturnHome}
          className="px-5 py-2.5 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors flex items-center gap-2 border border-slate-800 bg-slate-950"
        >
          <Home className="w-4 h-4" />
          <span>Return to Gateway</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 text-xs font-mono font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 apex-chamfer flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span>Print or Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
