import React from 'react';
import { CrimsonApexLogo } from './CrimsonApexLogo';
import { ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';

interface FooterProps {
  onAdminClick: () => void;
  onLookupClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick, onLookupClick }) => {
  return (
    <footer className="bg-[#050507] border-t border-rose-950/40 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <CrimsonApexLogo size="sm" showTagline={true} />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-2">
              Crimson Apex is an independent esports tournament platform. Delivering verified competitive Free Fire battle royale events, digital pass generation, and high-trust tournament operations.
            </p>
          </div>

          {/* Quick Access */}
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block mb-3">
              TOURNAMENT GATEWAY
            </span>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a href="#modes" className="hover:text-rose-400 transition-colors">
                  Registration Modes & Fees
                </a>
              </li>
              <li>
                <button
                  onClick={onLookupClick}
                  className="hover:text-rose-400 transition-colors text-left"
                >
                  Verify Registration Pass
                </button>
              </li>
              <li>
                <button
                  onClick={onAdminClick}
                  className="hover:text-rose-400 transition-colors text-left"
                >
                  Organizer Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Fair Play */}
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block mb-3">
              COORDINATOR CONTACT
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <a
                  href="mailto:yashhkumar0007@gmail.com"
                  className="text-slate-300 hover:text-rose-400 transition-colors"
                >
                  yashhkumar0007@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <a
                  href="tel:+918878995680"
                  className="text-slate-300 hover:text-rose-400 transition-colors"
                >
                  +91 88789 95680
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar with legal & disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} CRIMSON APEX ESPORTS. ALL RIGHTS RESERVED.
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-600 max-w-md">
            Independent esports event. Not affiliated with, endorsed by, or sponsored by Garena or Free Fire.
          </div>
        </div>
      </div>
    </footer>
  );
};
