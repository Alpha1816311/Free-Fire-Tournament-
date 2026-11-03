export type GameMode = 'SOLO' | 'DUO' | 'SQUAD';

export type RegistrationStatus =
  | 'Submitted'
  | 'Awaiting Payment Verification'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Verified' | 'Waived';

export interface PlayerRecord {
  id?: number;
  fullName: string;
  freeFireUid: string;
  inGameName: string;
  isTeamLeader: boolean;
  phone?: string;
}

export interface RegistrationInput {
  gameMode: GameMode;
  teamName: string;
  leaderName: string;
  leaderPhone: string;
  collegeName: string;
  leaderUid: string;
  leaderIgn: string;
  members: PlayerRecord[];
  consent: boolean;
  paymentReference?: string;
}

export interface RegistrationRecord {
  id: number;
  registrationCode: string;
  teamCode: string;
  tournamentId: number;
  teamName: string;
  gameMode: GameMode;
  leaderName: string;
  leaderPhone: string;
  collegeName: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  fee: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  members: PlayerRecord[];
}

export interface TournamentSettings {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  registrationOpen: boolean;
  registrationLimit: number;
  soloFee: number;
  duoFee: number;
  squadFee: number;
  announcedDate: string | null;
  rules: string;
  paymentUpiId: string;
  paymentInstructions: string;
  contactEmail: string;
  contactPhone: string;
  totalSubmissions?: number;
  confirmedCount?: number;
}

export interface AdminAuditLog {
  id: number;
  adminUsername: string;
  registrationId?: number;
  registrationCode?: string;
  action: string;
  reason?: string;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalSubmissions: number;
  soloCount: number;
  duoCount: number;
  squadCount: number;
  confirmedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalExpectedCollection: number;
  verifiedCollection: number;
}
