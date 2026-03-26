import { describe, it, expect, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {},
}));

import { isConflictingExistingReferral } from './referral';

describe('isConflictingExistingReferral', () => {
  const refId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const code = 'ABC123';

  it('empty referred_by → no conflict', () => {
    expect(isConflictingExistingReferral(null, code, refId)).toBe(false);
    expect(isConflictingExistingReferral('', code, refId)).toBe(false);
    expect(isConflictingExistingReferral('   ', code, refId)).toBe(false);
  });

  it('matches entered invite code → no conflict (DB may have set code string only)', () => {
    expect(isConflictingExistingReferral('ABC123', code, refId)).toBe(false);
    expect(isConflictingExistingReferral('  ABC123  ', code, refId)).toBe(false);
  });

  it('matches referrer UUID → no conflict (already normalized)', () => {
    expect(isConflictingExistingReferral(refId, code, refId)).toBe(false);
  });

  it('different code / user → conflict', () => {
    expect(isConflictingExistingReferral('OTHER1', code, refId)).toBe(true);
    expect(isConflictingExistingReferral('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', code, refId)).toBe(
      true
    );
  });
});
