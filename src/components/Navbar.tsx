import React, { useState } from 'react';
import { CrimsonApexLogo } from './CrimsonApexLogo';
import {
  ShieldAlert,
  ArrowRight,
  Menu,
  X,
  Search,
  Trophy,
  UserCheck,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  activeView: 'landing' | 'register' | 'lookup' | 'admin';
  setActiveView: (view: 'landing' | 'register' | 'lookup' | 'admin') => void;
  onEnterArena: () => void;
  isAdminAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onEnterArena,
  isAdminAuthenticated,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'landing' | 'register' | 'lookup' | 'admin') => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070709]/95 backdrop-blur-md border-b border-rose-950/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark & Official Logo */}
        <button
          onClick={() => handleNavClick('landing')}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded p-1 text-left shrink-0"
          aria-label="Crimson Apex Home"
        >
          <CrimsonApexLogo size="sm" showTagline={false} />
        </button>

        {/* Zone 2: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => handleNavClick('landing')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeView === 'landing' ? 'text-rose-500 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Tournament Info
          </button>
          <a
            href="#modes"
            onClick={(e) => {
              if (activeView !== 'landing') {
                handleNavClick('landing');
              }
            }}
            className="whitespace-nowrap shrink-0 text-slate-300 hover:text-white transition-colors"
          >
            Modes & Pricing
          </a>
          <button
            onClick={() => handleNavClick('register')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeView === 'register' ? 'text-rose-500 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Player Registration
          </button>
          <button
            onClick={() => handleNavClick('lookup')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeView === 'lookup' ? 'text-rose-500 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Pass Verification
          </button>
        </nav>

        {/* Zone 3: Actions (Visible on BOTH Mobile and Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Always Visible ADMIN LOGIN Button */}
          {activeView === 'admin' ? (
            <button
              onClick={() => handleNavClick('landing')}
              className="px-3 sm:px-4 py-2 text-xs font-mono font-bold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors apex-chamfer whitespace-nowrap"
            >
              Exit Dashboard
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('admin')}
              className="px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 apex-chamfer border bg-black/90 hover:bg-slate-900 border-slate-700 hover:border-rose-500/70 text-slate-200 hover:text-white shadow-sm"
              title="Organizer Admin Login"
              aria-label="Organizer Admin Login"
            >
              <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>ADMIN LOGIN</span>
            </button>
          )}

          {/* Primary Arena CTA Button (hidden on very narrow screens if admin is active, or responsive text) */}
          {activeView !== 'admin' && (
            <button
              onClick={() => {
                onEnterArena();
                setMobileMenuOpen(false);
              }}
              className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-display font-bold tracking-wider uppercase text-white bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/50 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 apex-chamfer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">ENTER THE ARENA</span>
              <span className="sm:hidden">REGISTER</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white bg-black/60 border border-slate-800 apex-chamfer focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070709] border-b border-rose-900/40 px-4 py-4 space-y-3 font-mono text-xs">
          <button
            onClick={() => handleNavClick('landing')}
            className={`w-full text-left py-2.5 px-3 border border-slate-800 ${
              activeView === 'landing' ? 'bg-rose-950/30 text-rose-400 border-rose-600' : 'text-slate-300'
            }`}
          >
            Tournament Info & Rules
          </button>
          <a
            href="#modes"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left py-2.5 px-3 border border-slate-800 text-slate-300"
          >
            Modes & Pricing (Solo/Duo/Squad)
          </a>
          <button
            onClick={() => handleNavClick('register')}
            className={`w-full text-left py-2.5 px-3 border border-slate-800 ${
              activeView === 'register' ? 'bg-rose-950/30 text-rose-400 border-rose-600' : 'text-slate-300'
            }`}
          >
            Player Registration Wizard
          </button>
          <button
            onClick={() => handleNavClick('lookup')}
            className={`w-full text-left py-2.5 px-3 border border-slate-800 ${
              activeView === 'lookup' ? 'bg-rose-950/30 text-rose-400 border-rose-600' : 'text-slate-300'
            }`}
          >
            Pass Verification & Status Lookup
          </button>
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full text-left py-2.5 px-3 border flex items-center justify-between ${
              activeView === 'admin'
                ? 'bg-rose-950/50 text-rose-300 border-rose-500'
                : 'bg-black text-rose-400 border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <strong>ADMIN LOGIN / DASHBOARD</strong>
            </span>
            <span className="text-[10px] text-slate-400">Restricted</span>
          </button>
        </div>
      )}
    </header>
  );
};
