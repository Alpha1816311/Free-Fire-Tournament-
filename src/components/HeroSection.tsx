import React from 'react';
import { TournamentSettings } from '../types';
import { CrimsonApexLogo } from './CrimsonApexLogo';
import { ShieldCheck, Calendar, Trophy, Users, Flame, ArrowRight, Search } from 'lucide-react';

interface HeroSectionProps {
  tournament: TournamentSettings | null;
  onEnterArena: () => void;
  onOpenLookup: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  tournament,
  onEnterArena,
  onOpenLookup,
}) => {
  const isOpen = tournament?.registrationOpen ?? true;
  const totalSubmissions = tournament?.totalSubmissions ?? 0;
  const limit = tournament?.registrationLimit ?? 100;
  const slotsRemaining = Math.max(0, limit - totalSubmissions);

  return (
    <div className="relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden border-b border-rose-950/40">
      {/* Background Arena Hero with Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/crimson_apex_arena_hero_1793625431574.jpg"
          alt="Crimson Apex Championship Arena"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-45 contrast-120"
        />
        {/* Measured Gradient Scrim for WCAG AA readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-[#070709]/60" />
        <div className="absolute inset-0 apex-grid-pattern opacity-40 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        {/* Centered Brand Emblem - Official Uploaded Logo */}
        <div className="flex justify-center mb-6">
          <CrimsonApexLogo variant="hero-badge" size="hero" />
        </div>

        {/* Tournament Meta Strip (Unboxed metadata with typographic separators) */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-black/80 border border-slate-800 text-xs text-slate-300 font-mono tracking-wider uppercase mb-5 apex-chamfer">
          <span className={isOpen ? 'text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
            {isOpen ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>FREE FIRE BATTLE ROYALE</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-amber-400 font-bold">TOTAL CASH PRIZE POOL: ₹1,050</span>
        </div>

        {/* Tournament Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-white uppercase text-balance max-w-4xl mx-auto drop-shadow-md">
          {tournament?.name || 'BATTLE ROYALE CHAMPIONSHIP #001'}
        </h1>

        {/* Tagline */}
        <p className="mt-4 text-lg sm:text-2xl font-display font-bold tracking-[0.2em] text-rose-500 uppercase">
          {tournament?.tagline || 'RISE ABOVE. RULE THE ARENA.'}
        </p>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The premier independent Free Fire tournament gateway. Join top collegiate and community squads, claim your registration pass, and compete under verified esports tournament rules.
        </p>

        {/* Schedule & Slot Proof Notice */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>
              MATCH DATE:{' '}
              <strong className="text-slate-100">
                {tournament?.announcedDate ? tournament.announcedDate : 'TO BE ANNOUNCED BY ORGANIZER'}
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            <span>
              SLOTS REMAINING:{' '}
              <strong className="text-amber-400 font-bold tabular-nums">
                {slotsRemaining} / {limit}
              </strong>
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterArena}
            disabled={!isOpen}
            className={`w-full sm:w-auto px-8 py-3.5 text-base font-display font-black tracking-wider uppercase text-white apex-chamfer transition-all transform flex items-center justify-center gap-3 ${
              isOpen
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_25px_rgba(225,29,72,0.5)] hover:-translate-y-0.5'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>{isOpen ? 'ENTER THE ARENA — REGISTER NOW' : 'REGISTRATIONS CLOSED'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenLookup}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-display font-bold tracking-wider uppercase text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors apex-chamfer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-rose-400" />
            <span>VERIFY PASS & STATUS</span>
          </button>
        </div>

        {/* Verification disclaimer mandatory notice */}
        <div className="mt-8 max-w-xl mx-auto p-3 bg-black/60 border border-slate-800/80 text-[11px] text-slate-400 leading-normal">
          <span className="text-amber-400 font-bold uppercase">Official Notice:</span> Your registration is subject to verification. Your registration ID does not by itself confirm payment or guarantee tournament admission.
        </div>
      </div>
    </div>
  );
};
