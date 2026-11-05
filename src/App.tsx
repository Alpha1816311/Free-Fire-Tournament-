/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, TournamentSettings } from './types';
import { apiClient } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ModesSection } from './components/ModesSection';
import { TournamentInfo } from './components/TournamentInfo';
import { RegistrationWizard } from './components/RegistrationWizard';
import { RegistrationPass } from './components/RegistrationPass';
import { RegistrationLookup } from './components/RegistrationLookup';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'register' | 'lookup' | 'admin'>('landing');
  const [selectedMode, setSelectedMode] = useState<GameMode>('SQUAD');
  const [tournament, setTournament] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [registeredData, setRegisteredData] = useState<any | null>(null);
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);

  // Check URL query parameters on initial mount for deep links & autostart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const modeParam = params.get('mode')?.toUpperCase() as GameMode;
    const autostart = params.get('autostart');

    if (viewParam === 'admin') {
      setActiveView('admin');
    } else if (viewParam === 'lookup') {
      setActiveView('lookup');
    } else if (viewParam === 'register' || autostart === '1') {
      setActiveView('register');
    }

    if (modeParam && ['SOLO', 'DUO', 'SQUAD'].includes(modeParam)) {
      setSelectedMode(modeParam);
    }

    fetchTournamentData();
    checkAdminToken();
  }, []);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTournament();
      setTournament(data);
    } catch (err) {
      console.error('Failed to load tournament data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminToken = async () => {
    const token = localStorage.getItem('apex_admin_token');
    if (!token) return;
    try {
      const status = await apiClient.checkAdminAuth(token);
      setIsAdminAuth(status.isAuthenticated);
    } catch {
      setIsAdminAuth(false);
    }
  };

  const handleStartRegistration = (mode: GameMode = 'SQUAD') => {
    setSelectedMode(mode);
    setRegisteredData(null);
    setActiveView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSuccess = (data: any) => {
    setRegisteredData(data);
    fetchTournamentData(); // Refresh slot counts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-slate-200 selection:bg-rose-600 selection:text-white">
      {/* 3-Zone Navigation Top Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view !== 'register') {
            setRegisteredData(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onEnterArena={() => handleStartRegistration('SQUAD')}
        isAdminAuthenticated={isAdminAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing Page View */}
        {activeView === 'landing' && (
          <>
            <HeroSection
              tournament={tournament}
              onEnterArena={() => handleStartRegistration('SQUAD')}
              onOpenLookup={() => setActiveView('lookup')}
            />
            <ModesSection
              tournament={tournament}
              onSelectMode={(mode) => handleStartRegistration(mode)}
            />
            <TournamentInfo tournament={tournament} />
          </>
        )}

        {/* Player Registration Wizard / Generated Pass View */}
        {activeView === 'register' && (
          <div className="py-8">
            {registeredData ? (
              <RegistrationPass
                data={{
                  ...registeredData,
                  announcedDate: tournament?.announcedDate,
                  paymentUpiId: tournament?.paymentUpiId,
                  paymentInstructions: tournament?.paymentInstructions,
                }}
                onReturnHome={() => {
                  setRegisteredData(null);
                  setActiveView('landing');
                }}
              />
            ) : (
              <RegistrationWizard
                tournament={tournament}
                initialMode={selectedMode}
                onSuccess={handleRegistrationSuccess}
                onCancel={() => setActiveView('landing')}
              />
            )}
          </div>
        )}

        {/* Registration Lookup View */}
        {activeView === 'lookup' && (
          <RegistrationLookup onBack={() => setActiveView('landing')} />
        )}

        {/* Admin Console View */}
        {activeView === 'admin' && (
          <AdminDashboard onClose={() => setActiveView('landing')} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onAdminClick={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLookupClick={() => {
          setActiveView('lookup');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
