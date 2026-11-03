import React from 'react';

export const OFFICIAL_CRIMSON_APEX_LOGO_PATH =
  '/assets/aistudio/file_00000000621c8208a91f8c0401f8700f_94f84c47.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: 'lockup' | 'emblem-only' | 'hero-badge';
}

export const CrimsonApexLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
  variant = 'lockup',
}) => {
  if (variant === 'hero-badge' || size === 'hero') {
    return (
      <div className={`relative flex flex-col items-center select-none ${className}`}>
        {/* Full Official Crimson Apex Tournament Logo */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/40 via-red-600/30 to-rose-600/40 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />
          <img
            src={OFFICIAL_CRIMSON_APEX_LOGO_PATH}
            alt="Crimson Apex Esports — Rise Above. Rule the Arena."
            referrerPolicy="no-referrer"
            className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain filter drop-shadow-[0_0_30px_rgba(225,29,72,0.65)]"
          />
        </div>
      </div>
    );
  }

  const imageSizes = {
    sm: 'w-9 h-9 sm:w-11 sm:h-11',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-36 h-36 sm:w-40 sm:h-40',
    hero: 'w-56 h-56 sm:w-64 sm:h-64',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg tracking-wider',
    md: 'text-lg sm:text-xl tracking-widest',
    lg: 'text-2xl sm:text-3xl tracking-widest',
    xl: 'text-3xl sm:text-4xl tracking-widest',
    hero: 'text-4xl tracking-widest',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Uploaded Logo Image */}
      <div className={`relative ${imageSizes[size]} shrink-0 flex items-center justify-center`}>
        <img
          src={OFFICIAL_CRIMSON_APEX_LOGO_PATH}
          alt="Crimson Apex Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(225,29,72,0.6)]"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-display font-black text-white uppercase leading-none ${textSizes[size]}`}>
            CRIMSON <span className="text-rose-500">APEX</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 mt-1 uppercase">
            ESPORTS TOURNAMENTS
          </span>
          {showTagline && (
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-rose-400 mt-1 uppercase">
              RISE ABOVE. RULE THE ARENA.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
