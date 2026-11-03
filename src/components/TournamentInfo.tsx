import React from 'react';
import { TournamentSettings } from '../types';
import { CrimsonApexLogo } from './CrimsonApexLogo';
import {
  Flame,
  Award,
  Smartphone,
  AlertTriangle,
  Target,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';

interface TournamentInfoProps {
  tournament: TournamentSettings | null;
}

export const TournamentInfo: React.FC<TournamentInfoProps> = ({ tournament }) => {
  return (
    <section className="py-20 bg-[#060608] border-b border-rose-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-rose-500 uppercase mb-2">
            <span>02. ARENA INTEL</span>
            <span aria-hidden="true">·</span>
            <span>OFFICIAL CASH PRIZES & RULES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white uppercase text-balance">
            CASH PRIZE DISTRIBUTION & REGULATIONS
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Confirmed and authorized by Crimson Apex tournament organizers. Every match contributes to your final placement and individual standing.
          </p>
        </div>

        {/* Motivational Announcement Banner */}
        <div className="mb-12 p-6 bg-gradient-to-r from-black via-rose-950/40 to-black border-y border-rose-900/50 text-center apex-chamfer">
          <p className="text-lg sm:text-2xl font-display font-black tracking-wide text-white uppercase italic">
            "Every match matters. Every kill counts. Rise above and claim your place in the arena."
          </p>
          <div className="mt-2 text-xs font-mono text-rose-400 uppercase tracking-widest">
            OFFICIAL CRIMSON APEX BATTLE ROYALE CHAMPIONSHIP DIRECTIVE
          </div>
        </div>

        {/* Prominent Total Cash Prize Pool Display */}
        <div className="mb-12 text-center">
          <div className="inline-block p-1 bg-gradient-to-r from-amber-500/30 via-rose-600/40 to-amber-500/30 apex-chamfer">
            <div className="px-8 py-5 bg-[#08080c] border border-amber-500/50 apex-chamfer">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-amber-400 uppercase block mb-1">
                GUARANTEED REWARDS POOL
              </span>
              <div className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white tabular-nums">
                TOTAL CASH PRIZE POOL: <span className="text-amber-400">₹1,050</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                ₹500 (1st) + ₹300 (2nd) + ₹150 (3rd) + ₹100 (Most Kills) = ₹1,050 Total Confirmed Cash
              </span>
            </div>
          </div>
        </div>

        {/* Four Premium Prize Cards (Theme: Black BG, Crimson Highlights, Metallic Silver Type, Gold for Champion) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Card 1: 1ST PLACE — CHAMPIONS */}
          <div className="relative bg-[#09090d] border-2 border-amber-500/70 p-6 apex-chamfer shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col justify-between group hover:border-amber-400 transition-all">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black font-mono text-[10px] font-black uppercase tracking-wider px-3 py-0.5 apex-chamfer">
              CHAMPION
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl select-none" role="img" aria-label="1st place gold medal">
                  🥇
                </span>
                <CrimsonApexLogo size="sm" showText={false} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                CHAMPIONSHIP VICTORY
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wide mt-1">
                1ST PLACE — CHAMPIONS
              </h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                Awarded to the squad or operative with the highest overall tournament points.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-500/30">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">CASH PRIZE</span>
              <div className="text-4xl font-display font-black text-amber-400 tabular-nums mt-0.5">
                ₹500
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Direct UPI disbursement
              </span>
            </div>
          </div>

          {/* Card 2: 2ND PLACE — RUNNER-UP */}
          <div className="relative bg-[#09090d] border border-slate-600 p-6 apex-chamfer shadow-[0_0_15px_rgba(255,255,255,0.05)] flex flex-col justify-between hover:border-slate-400 transition-all">
            <div className="absolute top-0 right-0 bg-slate-800 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider px-3 py-0.5 apex-chamfer">
              FINALIST
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl select-none" role="img" aria-label="2nd place silver medal">
                  🥈
                </span>
                <CrimsonApexLogo size="sm" showText={false} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold block">
                RUNNER-UP FINISH
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wide mt-1">
                2ND PLACE — RUNNER-UP
              </h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                Awarded to the 2nd place overall team in the official standings.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">CASH PRIZE</span>
              <div className="text-4xl font-display font-black text-slate-200 tabular-nums mt-0.5">
                ₹300
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Direct UPI disbursement
              </span>
            </div>
          </div>

          {/* Card 3: 3RD PLACE */}
          <div className="relative bg-[#09090d] border border-slate-800 p-6 apex-chamfer flex flex-col justify-between hover:border-rose-900/60 transition-all">
            <div className="absolute top-0 right-0 bg-slate-900 text-slate-300 font-mono text-[10px] font-black uppercase tracking-wider px-3 py-0.5 apex-chamfer">
              PODIUM
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl select-none" role="img" aria-label="3rd place bronze medal">
                  🥉
                </span>
                <CrimsonApexLogo size="sm" showText={false} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                PODIUM CONTENDER
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wide mt-1">
                3RD PLACE
              </h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                Awarded to the 3rd place overall team in the final leaderboard.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">CASH PRIZE</span>
              <div className="text-4xl font-display font-black text-slate-300 tabular-nums mt-0.5">
                ₹150
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Direct UPI disbursement
              </span>
            </div>
          </div>

          {/* Card 4: MOST KILLS AWARD (Independent) */}
          <div className="relative bg-[#09090d] border-2 border-rose-600 p-6 apex-chamfer shadow-[0_0_25px_rgba(225,29,72,0.3)] flex flex-col justify-between hover:border-rose-500 transition-all">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-red-600 text-white font-mono text-[10px] font-black uppercase tracking-wider px-3 py-0.5 apex-chamfer">
              INDIVIDUAL
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-rose-950/80 border border-rose-500/50 text-rose-500 apex-chamfer">
                  <Flame className="w-6 h-6 text-rose-500 fill-rose-500/20" />
                </div>
                <CrimsonApexLogo size="sm" showText={false} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                INDEPENDENT INDIVIDUAL AWARD
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wide mt-1">
                MOST KILLS AWARD
              </h3>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                Awarded to the single player with the highest verified total kills across all matches.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-rose-900/60">
              <span className="text-[10px] font-mono uppercase text-rose-400 block">CASH PRIZE</span>
              <div className="text-4xl font-display font-black text-rose-500 tabular-nums mt-0.5">
                ₹100
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Eligible to ANY team player
              </span>
            </div>
          </div>
        </div>

        {/* Independent Most Kills Rule Clarification Box */}
        <div className="mb-16 bg-[#09090d] border border-rose-900/50 p-6 sm:p-8 apex-chamfer">
          <div className="flex items-center gap-2 text-rose-500 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Target className="w-4 h-4 text-rose-500" />
            <span>OFFICIAL REGULATIONS · MOST KILLS AWARD (₹100)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase mb-4">
            HOW THE MOST KILLS AWARD WORKS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300 leading-relaxed">
            <div className="p-4 bg-black/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Independent of Team Rank</span>
              </div>
              <p className="text-slate-400">
                The Most Kills award winner can belong to <strong>ANY team</strong>. The player does not need to finish in the top three—even if their team finishes in last place, the individual player remains fully eligible.
              </p>
            </div>

            <div className="p-4 bg-black/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Dual Award Eligibility</span>
              </div>
              <p className="text-slate-400">
                A player whose squad wins 1st, 2nd, or 3rd place can <strong>ALSO win the ₹100 Most Kills award</strong> simultaneously if they achieve the highest verified individual kill tally.
              </p>
            </div>

            <div className="p-4 bg-black/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cumulative Tournament Kills</span>
              </div>
              <p className="text-slate-400">
                The award is based on verified individual kill totals aggregated across the <strong>entire tournament</strong> (all official rounds), not merely a single match.
              </p>
            </div>

            <div className="p-4 bg-black/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Official Tie-Break Procedure</span>
              </div>
              <p className="text-slate-400">
                In case of a tie in total kills, the winner is decided by: (1) Highest individual kills scored in a single match, followed by (2) Higher placement finish of their team in the final match, verified by tournament arbiters.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Matrix & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          <div className="lg:col-span-12 bg-black/80 border border-slate-800 p-6 sm:p-8 apex-chamfer">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Award className="w-4 h-4" />
              <span>OFFICIAL TOURNAMENT RULES</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase mb-4">
              POINT SYSTEM & MATCH CONDUCT
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">1ST PLACE</div>
                <div className="text-xl font-display font-black text-amber-400 mt-1">12 PTS</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">2ND PLACE</div>
                <div className="text-xl font-display font-black text-slate-200 mt-1">9 PTS</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">3RD PLACE</div>
                <div className="text-xl font-display font-black text-slate-300 mt-1">8 PTS</div>
              </div>
              <div className="p-3 bg-slate-950 border border-rose-900/40 text-center">
                <div className="text-[10px] font-mono text-rose-400 uppercase">EACH KILL</div>
                <div className="text-xl font-display font-black text-rose-500 mt-1">+1 PT</div>
              </div>
            </div>

            {/* Official Rules Box */}
            <div className="bg-slate-950/90 border border-slate-800 p-4 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
              {tournament?.rules || `1. Players of ALL Free Fire levels are eligible to participate. There is NO minimum level requirement.
2. Emulators and modified iPad/tablet devices are strictly prohibited. Mobile devices only.
3. Exploitation of map bugs, speed hacks, aimbots or other cheats will result in disqualification.
4. Room ID and Password will be distributed exclusively through registered contact details 20 minutes before the match.
5. Point System: 1st (12 pts), 2nd (9 pts), 3rd (8 pts), 4th (7 pts), 5th (6 pts), 6th (5 pts), 7th (4 pts), 8th (3 pts), 9th (2 pts), 10th (1 pt). +1 pt per Kill.
6. Organizers' decisions regarding technical rulings and lobby recreates are final.`}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400 font-mono">
              <Smartphone className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Mobile-only competition. Handheld smartphones are strictly mandatory.</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Registration Instructions */}
        <div className="bg-black/60 border border-slate-800/80 p-8 apex-chamfer mb-16">
          <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wider mb-6">
            HOW REGISTRATION WORKS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 flex items-center justify-center bg-rose-950 text-rose-400 border border-rose-600 font-mono font-black text-sm">
                01
              </div>
              <h4 className="text-base font-display font-bold text-white uppercase">CHOOSE YOUR MODE</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select SOLO (₹30), DUO (₹50 per team), or SQUAD (₹100 per team). Review your roster requirements.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 flex items-center justify-center bg-rose-950 text-rose-400 border border-rose-600 font-mono font-black text-sm">
                02
              </div>
              <h4 className="text-base font-display font-bold text-white uppercase">SUBMIT PLAYER DATA</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter leader phone, college, and every member’s exact Free Fire UID and IGN.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 flex items-center justify-center bg-rose-950 text-rose-400 border border-rose-600 font-mono font-black text-sm">
                03
              </div>
              <h4 className="text-base font-display font-bold text-white uppercase">RECEIVE DIGITAL PASS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server generates collision-resistant registration & team codes (e.g. CA-SQ-0001).
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 flex items-center justify-center bg-rose-950 text-rose-400 border border-rose-600 font-mono font-black text-sm">
                04
              </div>
              <h4 className="text-base font-display font-bold text-white uppercase">VERIFY & ENTER LOBBY</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Follow administrator payment instructions. Custom room credentials delivered prior to match.
              </p>
            </div>
          </div>
        </div>

        {/* Official Coordinator Contact Section */}
        <div className="bg-[#08080c] border border-rose-900/60 p-6 sm:p-8 apex-chamfer mb-12 shadow-[0_0_25px_rgba(225,29,72,0.15)]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Mail className="w-4 h-4" />
                <span>OFFICIAL ORGANIZER DESK</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                COORDINATOR CONTACT
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-mono max-w-xl">
                Have queries regarding tournament rules, custom room ID distribution, team registration verification, or payment clearance? Contact the official Crimson Apex coordinator:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <a
                href="mailto:yashhkumar0007@gmail.com"
                className="flex items-center gap-3 p-4 bg-black/90 border border-slate-800 hover:border-rose-600/80 transition-all text-xs font-mono group flex-1 sm:flex-initial"
              >
                <div className="w-9 h-9 bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">OFFICIAL EMAIL</span>
                  <span className="text-slate-200 group-hover:text-rose-400 font-bold transition-colors">
                    yashhkumar0007@gmail.com
                  </span>
                </div>
              </a>

              <a
                href="tel:+918878995680"
                className="flex items-center gap-3 p-4 bg-black/90 border border-slate-800 hover:border-rose-600/80 transition-all text-xs font-mono group flex-1 sm:flex-initial"
              >
                <div className="w-9 h-9 bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">OFFICIAL PHONE</span>
                  <span className="text-slate-200 group-hover:text-rose-400 font-bold transition-colors">
                    +91 88789 95680
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer / Non-affiliation notice */}
        <div className="p-4 bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Independent Tournament Organization Notice:</strong> Crimson Apex is an independent esports organizer. This competition is not sponsored, endorsed, or administered by Garena or Free Fire. All trademarks belong to their respective owners.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
