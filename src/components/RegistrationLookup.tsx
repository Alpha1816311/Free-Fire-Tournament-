import React, { useState } from 'react';
import { RegistrationPass } from './RegistrationPass';
import { Search, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface RegistrationLookupProps {
  onBack: () => void;
}

export const RegistrationLookup: React.FC<RegistrationLookupProps> = ({ onBack }) => {
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchCode.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.lookupRegistration(trimmed);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Lookup failed. Please verify your registration code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button
        onClick={onBack}
        className="mb-8 px-4 py-2 text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors flex items-center gap-1.5 border border-slate-800 bg-black/60"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tournament Gateway</span>
      </button>

      {!result ? (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black border border-slate-800 text-rose-500 font-mono text-xs font-bold uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>REGISTRATION VERIFICATION GATE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight">
              LOOKUP REGISTRATION PASS
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Enter your assigned Registration ID (e.g., <code className="text-rose-400">CA-S-0001</code>, <code className="text-rose-400">CA-SQ-0001</code>) or Team Code to view your verified pass and admission status.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CA-SQ-0001"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-black/90 border border-slate-700 text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className={`px-6 py-3 font-display font-bold uppercase tracking-wider text-sm text-white apex-chamfer flex items-center gap-2 ${
                  loading || !searchCode.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <span>{loading ? 'VERIFYING...' : 'VERIFY'}</span>
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {error && (
            <div className="max-w-md mx-auto p-4 bg-rose-950/70 border border-rose-600 text-rose-200 text-xs font-mono flex items-start gap-3 apex-chamfer">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>{error}</div>
            </div>
          )}

          <div className="max-w-md mx-auto p-4 bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono leading-relaxed">
            <strong className="text-slate-200 uppercase block mb-1">Privacy & Security Guard:</strong>
            Public pass verification shows official roster handles, in-game UIDs, and organizer payment instructions. Sensitive contact phone numbers are withheld from public lookup for player privacy.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              Showing verified pass for <strong className="text-white">{result.registrationCode}</strong>
            </span>
            <button
              onClick={() => setResult(null)}
              className="text-xs font-mono text-rose-400 hover:underline"
            >
              Search Another Code
            </button>
          </div>

          <RegistrationPass data={result} onReturnHome={onBack} />
        </div>
      )}
    </div>
  );
};
