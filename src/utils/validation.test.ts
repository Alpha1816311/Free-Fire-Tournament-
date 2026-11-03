import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidPhone,
  isValidFreeFireUid,
  formatRegistrationCode,
  formatTeamCode,
  calculateFee,
  validateRegistrationData,
  normalizePhone,
} from './validation.ts';

test('normalizePhone handles formats and country codes', () => {
  assert.equal(normalizePhone('+91 9876543210'), '9876543210');
  assert.equal(normalizePhone('09876543210'), '9876543210');
  assert.equal(normalizePhone('98765-43210'), '9876543210');
});

test('isValidPhone validates 10-digit mobile numbers', () => {
  assert.equal(isValidPhone('9876543210'), true);
  assert.equal(isValidPhone('8123456789'), true);
  assert.equal(isValidPhone('1234567890'), false); // Starts with 1
  assert.equal(isValidPhone('98765'), false); // Too short
  assert.equal(isValidPhone('abcdefghij'), false);
});

test('isValidFreeFireUid validates 8-12 numeric digit UIDs', () => {
  assert.equal(isValidFreeFireUid('12345678'), true);
  assert.equal(isValidFreeFireUid('98765432101'), true);
  assert.equal(isValidFreeFireUid('1234567'), false); // 7 digits (too short)
  assert.equal(isValidFreeFireUid('1234567890123'), false); // 13 digits (too long)
  assert.equal(isValidFreeFireUid('12345ABC'), false); // Alphanumeric
});

test('formatRegistrationCode formats sequential codes with prefixes', () => {
  assert.equal(formatRegistrationCode('SOLO', 1), 'CA-S-0001');
  assert.equal(formatRegistrationCode('DUO', 42), 'CA-D-0042');
  assert.equal(formatRegistrationCode('SQUAD', 123), 'CA-SQ-0123');
});

test('formatTeamCode formats team and solo player codes', () => {
  assert.equal(formatTeamCode('SOLO', 1), 'CA-P-0001');
  assert.equal(formatTeamCode('DUO', 42), 'CA-TM-0042');
  assert.equal(formatTeamCode('SQUAD', 123), 'CA-SQD-0123');
});

test('calculateFee returns server configured fees per mode', () => {
  const config = { soloFee: 30, duoFee: 50, squadFee: 100 };
  assert.equal(calculateFee('SOLO', config), 30);
  assert.equal(calculateFee('DUO', config), 50);
  assert.equal(calculateFee('SQUAD', config), 100);
});

test('validateRegistrationData detects duplicate UIDs in team', () => {
  const input = {
    gameMode: 'DUO' as const,
    teamName: 'Apex Duo',
    leaderName: 'Arjun Sharma',
    leaderPhone: '9876543210',
    collegeName: 'IIT Delhi',
    leaderUid: '1029384756',
    leaderIgn: 'APEX_HUNTER',
    consent: true,
    members: [
      {
        fullName: 'Arjun Sharma',
        freeFireUid: '1029384756',
        inGameName: 'APEX_HUNTER',
        isTeamLeader: true,
      },
      {
        fullName: 'Sameer Sen',
        freeFireUid: '1029384756', // Duplicate UID!
        inGameName: 'SAM_SNIPER',
        isTeamLeader: false,
      },
    ],
  };

  const result = validateRegistrationData(input);
  assert.equal(result.valid, false);
  assert.ok(result.errors.member_1_uid);
});

test('validateRegistrationData blocks submission when registration is closed', () => {
  const input = {
    gameMode: 'SOLO' as const,
    teamName: '',
    leaderName: 'Rohit Roy',
    leaderPhone: '9876543210',
    collegeName: 'BITS Pilani',
    leaderUid: '8765432109',
    leaderIgn: 'ROHIT_FF',
    consent: true,
    members: [
      {
        fullName: 'Rohit Roy',
        freeFireUid: '8765432109',
        inGameName: 'ROHIT_FF',
        isTeamLeader: true,
      },
    ],
  };

  const result = validateRegistrationData(input, { registrationOpen: false, registrationLimit: 100 });
  assert.equal(result.valid, false);
  assert.match(result.errors.general, /closed/i);
});

test('validateRegistrationData allows players of all levels without level restriction', () => {
  const input = {
    gameMode: 'SOLO' as const,
    teamName: '',
    leaderName: 'Arjun Newbie',
    leaderPhone: '9876543210',
    collegeName: 'IIT Delhi',
    leaderUid: '1029384756', // Valid Free Fire UID
    leaderIgn: 'ROOKIE_1',
    consent: true,
    members: [
      {
        fullName: 'Arjun Newbie',
        freeFireUid: '1029384756',
        inGameName: 'ROOKIE_1',
        isTeamLeader: true,
      },
    ],
  };

  const result = validateRegistrationData(input, { registrationOpen: true, registrationLimit: 100, currentCount: 5 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});
