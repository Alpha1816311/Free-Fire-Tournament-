import { GameMode, RegistrationInput, TournamentSettings } from '../types';

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Valid Indian 10-digit mobile number starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(normalized);
}

export function isValidFreeFireUid(uid: string): boolean {
  if (!uid) return false;
  const trimmed = uid.trim();
  // Free Fire UIDs are 8 to 12 numeric digits
  return /^\d{8,12}$/.test(trimmed);
}

export function formatRegistrationCode(mode: GameMode, seq: number): string {
  const padded = String(seq).padStart(4, '0');
  switch (mode) {
    case 'SOLO':
      return `CA-S-${padded}`;
    case 'DUO':
      return `CA-D-${padded}`;
    case 'SQUAD':
      return `CA-SQ-${padded}`;
  }
}

export function formatTeamCode(mode: GameMode, seq: number): string {
  const padded = String(seq).padStart(4, '0');
  switch (mode) {
    case 'SOLO':
      return `CA-P-${padded}`;
    case 'DUO':
      return `CA-TM-${padded}`;
    case 'SQUAD':
      return `CA-SQD-${padded}`;
  }
}

export function calculateFee(
  mode: GameMode,
  settings: { soloFee: number; duoFee: number; squadFee: number }
): number {
  switch (mode) {
    case 'SOLO':
      return settings.soloFee;
    case 'DUO':
      return settings.duoFee;
    case 'SQUAD':
      return settings.squadFee;
  }
}

export function validateRegistrationData(
  data: RegistrationInput,
  settings?: Pick<TournamentSettings, 'registrationOpen' | 'registrationLimit'> & {
    currentCount?: number;
  }
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (settings && !settings.registrationOpen) {
    errors.general = 'Registrations are currently closed by the tournament organizer.';
    return { valid: false, errors };
  }

  if (settings && settings.registrationLimit > 0 && typeof settings.currentCount === 'number') {
    if (settings.currentCount >= settings.registrationLimit) {
      errors.general = `Tournament registration capacity limit (${settings.registrationLimit} slots) has been reached.`;
      return { valid: false, errors };
    }
  }

  if (!data.gameMode || !['SOLO', 'DUO', 'SQUAD'].includes(data.gameMode)) {
    errors.gameMode = 'Please select a valid game mode (SOLO, DUO, or SQUAD).';
  }

  if (data.gameMode !== 'SOLO' && (!data.teamName || data.teamName.trim().length < 2)) {
    errors.teamName = 'Team name is required and must be at least 2 characters.';
  }

  if (!data.leaderName || data.leaderName.trim().length < 2) {
    errors.leaderName = 'Team leader full name is required.';
  }

  if (!isValidPhone(data.leaderPhone)) {
    errors.leaderPhone = 'Please provide a valid 10-digit mobile number.';
  }

  if (!data.collegeName || data.collegeName.trim().length < 2) {
    errors.collegeName = 'College or institution name is required.';
  }

  if (!isValidFreeFireUid(data.leaderUid)) {
    errors.leaderUid = 'Free Fire UID must be 8 to 12 numeric digits.';
  }

  if (!data.leaderIgn || data.leaderIgn.trim().length < 2) {
    errors.leaderIgn = 'In-game name (IGN) is required.';
  }

  const expectedMembers = data.gameMode === 'SOLO' ? 1 : data.gameMode === 'DUO' ? 2 : 4;
  if (!Array.isArray(data.members) || data.members.length !== expectedMembers) {
    errors.members = `${data.gameMode} mode requires exactly ${expectedMembers} player record(s).`;
  } else {
    const seenUids = new Set<string>();
    data.members.forEach((member, idx) => {
      if (!member.fullName || member.fullName.trim().length < 2) {
        errors[`member_${idx}_fullName`] = `Member ${idx + 1} full name is required.`;
      }
      if (!isValidFreeFireUid(member.freeFireUid)) {
        errors[`member_${idx}_uid`] = `Member ${idx + 1} UID must be 8-12 numeric digits.`;
      } else {
        const uidTrim = member.freeFireUid.trim();
        if (seenUids.has(uidTrim)) {
          errors[`member_${idx}_uid`] = `Free Fire UID ${uidTrim} is duplicated within the team.`;
        }
        seenUids.add(uidTrim);
      }
      if (!member.inGameName || member.inGameName.trim().length < 2) {
        errors[`member_${idx}_ign`] = `Member ${idx + 1} in-game name (IGN) is required.`;
      }
    });
  }

  if (!data.consent) {
    errors.consent = 'You must confirm that your information is accurate and accept tournament rules.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
