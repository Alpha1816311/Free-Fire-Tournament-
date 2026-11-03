import React from 'react';
import { GameMode, TournamentSettings } from '../types';
import { User, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ModesSectionProps {
  tournament: TournamentSettings | null;
  onSelectMode: (mode: GameMode) => void;
}

export const ModesSection: React.FC<ModesSectionProps> = ({
  tournament,
  onSelectMode,
}) => {
  const soloFee = tournament?.soloFee ?? 30;
  const duoFee = tournament?.duoFee ?? 50;
  const squadFee = tournament?.squadFee ?? 100;

  const modes = [
    {
      id: 'SOLO' as GameMode,
      name: 'SOLO SURVIVOR',
      tag: 'INDIVIDUAL BR',
      icon: User,
      players: '1 Player',
      fee: soloFee,
      feeSubtitle: '₹' + soloFee + ' / player',
      description: 'Single operative battle royale. Showcase pure survival skills, gunplay accuracy, and tactical solo rotations.',
      features: [
        'Individual registration code',
        'Direct custom room slot',
        'Personal kill leader tracking',
        'No team coordination required',
      ],
      popular: false,
    },
    {
      id: 'DUO' as GameMode,
      name: 'DUO SYNDICATE',
      tag: 'PAIR TACTICS',
      icon: Users,
      players: '2 Players',
      fee: duoFee,
      feeSubtitle: '₹' + duoFee + ' / duo team',
      description: 'High-synergy pair combat. Coordinate flanking angles, revives, and tactical utility deployment.',
      features: [
        'Team code + Player 1 & 2 pass',
        'Team leader communication channel',
        'Co-op point aggregation',
        'Shared strategic placement points',
      ],
      popular: false,
    },
    {
      id: 'SQUAD' as GameMode,
      name: 'SQUAD WARFARE',
      tag: 'PREMIER 4v4 BR',
      icon: Shield,
      players: '4 Players',
      fee: squadFee,
      feeSubtitle: '₹' + squadFee + ' / 4-player team',
      description: 'The definitive esports tournament experience. Full squad synergy, designated shot-caller, assaulters, and sniper.',
      features: [
        'Full 4-man verified team dossier',
        'Unique Squad Team Code (CA-SQ-XXXX)',
        'Eligible for main championship bracket',
        'Dedicated team lobby slot',
      ],
      popular: true,
    },
  ];

  return (
    <section id="modes" className="py-20 bg-[#070709] border-b border-rose-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-rose-500 uppercase mb-2">
            <span>01. TOURNAMENT TIERS</span>
            <span aria-hidden="true">·</span>
            <span>OFFICIAL CONFIGURATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white uppercase text-balance">
            SELECT REGISTRATION MODE
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Entry fees are verified and controlled by tournament organizers. Select your battle format to start the registration wizard.
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className={`relative flex flex-col justify-between bg-black/70 border transition-all duration-200 p-6 sm:p-8 apex-chamfer ${
                  mode.popular
                    ? 'border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.2)] bg-gradient-to-b from-rose-950/20 via-black/80 to-black'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                {mode.popular && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-widest px-3 py-1 apex-chamfer">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-700/80 text-rose-500 apex-chamfer">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                      {mode.players}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-rose-400 uppercase tracking-widest font-semibold mb-1">
                    {mode.tag}
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase tracking-wide text-white">
                    {mode.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[50px]">
                    {mode.description}
                  </p>

                  {/* Pricing Box */}
                  <div className="mt-6 p-4 bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      ENTRY FEE
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-display font-black text-white tabular-nums">
                        ₹{mode.fee}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {mode.id === 'SOLO' ? 'per player' : 'per team'}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {mode.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectMode(mode.id)}
                    className="w-full py-3 px-4 font-display font-bold uppercase tracking-wider text-sm text-white bg-slate-900 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 transition-colors apex-chamfer flex items-center justify-center gap-2 group"
                  >
                    <span>SELECT {mode.id} REGISTRATION</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification disclaimer banner */}
        <div className="mt-12 text-center text-xs font-mono text-slate-400 max-w-2xl mx-auto">
          <p>
            NOTICE: Pricing is strictly enforced by the server configuration.
            Organizers verify all entries prior to official custom room slot assignment.
          </p>
        </div>
      </div>
    </section>
  );
};
