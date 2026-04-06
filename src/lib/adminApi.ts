import { supabase } from './supabase';

export type AdminUserRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  point: number;
  role: string;
  account_status: string;
  mining_disabled: boolean;
  invite_code: string | null;
  created_at: string;
  last_mined_at: string | null;
  /** MINING 타입 양수 합 — admin_list_users v2 */
  total_mined?: number;
  last_log_at?: string | null;
};

export type MiningLogRow = {
  id: number;
  user_id: string;
  amount: number;
  type: string;
  slot_number: number | null;
  created_at: string;
  user_email?: string | null;
  user_nickname?: string | null;
};

export type AdminDailyMiningRow = { day: string; total_mined: number };
export type AdminTopMinerRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  total_mined: number;
};

export type WithdrawalRow = {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  note: string | null;
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
  user_email?: string | null;
  nickname?: string | null;
};

export type AuditLogRow = {
  id: number;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  admin_email?: string | null;
  admin_nickname?: string | null;
  target_email?: string | null;
  target_nickname?: string | null;
};

/** admin_list_referral_summaries 행 */
export type ReferralSummaryRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  point: number;
  invite_code: string | null;
  created_at: string;
  referral_count: number;
  referral_points_from_logs: number;
};

/** admin_list_invited_users 행 */
export type InvitedUserRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  created_at: string;
  point: number;
  referred_by: string | null;
};

/** 표시용: 닉네임 → 이메일 → 짧은 ID (UUID만 크게 보이지 않게) */
export function adminUserDisplayLabel(
  nickname: string | null | undefined,
  email: string | null | undefined,
  userId: string | null | undefined,
): string {
  if (nickname?.trim()) return nickname.trim();
  if (email?.trim()) return email.trim();
  if (userId && userId.length >= 8) return `사용자 ${userId.slice(0, 8)}…`;
  return '—';
}

function rpcError(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

export async function adminListUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: AdminUserRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: params.search ?? null,
    p_role: params.role || null,
    p_status: params.status || null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: AdminUserRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, total: Number(j.total ?? 0), rows: j.rows ?? [] };
}

export async function adminSetUserRole(
  userId: string,
  role: 'user' | 'vip' | 'admin',
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Failed');
  return { ok: true };
}

export async function adminSetAccountStatus(
  userId: string,
  status: 'active' | 'suspended' | 'deleted',
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_set_account_status', {
    p_user_id: userId,
    p_status: status,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Failed');
  return { ok: true };
}

export async function adminSetMiningDisabled(
  userId: string,
  disabled: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_set_mining_disabled', {
    p_user_id: userId,
    p_disabled: disabled,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Failed');
  return { ok: true };
}

export async function adminAdjustPoints(
  userId: string,
  delta: number,
  reason: string,
): Promise<{ ok: true; balance?: number } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_adjust_points', {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; message?: string; balance?: number };
  if (!j?.ok) return rpcError(j?.message ?? 'Failed');
  return { ok: true, balance: j.balance };
}

export async function adminListMiningLogs(params: {
  userId?: string | null;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: MiningLogRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_mining_logs', {
    p_user_id: params.userId ?? null,
    p_type: params.type || null,
    p_limit: params.limit ?? 100,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: MiningLogRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, total: Number(j.total ?? 0), rows: j.rows ?? [] };
}

export async function adminListWithdrawals(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: WithdrawalRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_withdrawals', {
    p_status: params.status ?? 'pending',
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: WithdrawalRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, total: Number(j.total ?? 0), rows: j.rows ?? [] };
}

export async function adminDecideWithdrawal(
  id: number,
  approve: boolean,
  note?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_decide_withdrawal', {
    p_id: id,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Failed');
  return { ok: true };
}

export async function adminStatsSummary(): Promise<
  | {
      ok: true;
      points_positive_sum: number;
      points_negative_abs_sum: number;
      active_users: number;
      suspended_users: number;
      total_mining_sum: number;
      today_mining_sum: number;
      abnormal_mining_users_24h: number;
    }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase.rpc('admin_stats_summary');
  if (error) return rpcError(error.message);
  const j = data as {
    ok?: boolean;
    message?: string;
    points_positive_sum?: number;
    points_negative_abs_sum?: number;
    active_users?: number;
    suspended_users?: number;
    total_mining_sum?: number;
    today_mining_sum?: number;
    abnormal_mining_users_24h?: number;
  };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return {
    ok: true,
    points_positive_sum: Number(j.points_positive_sum ?? 0),
    points_negative_abs_sum: Number(j.points_negative_abs_sum ?? 0),
    active_users: Number(j.active_users ?? 0),
    suspended_users: Number(j.suspended_users ?? 0),
    total_mining_sum: Number(j.total_mining_sum ?? 0),
    today_mining_sum: Number(j.today_mining_sum ?? 0),
    abnormal_mining_users_24h: Number(j.abnormal_mining_users_24h ?? 0),
  };
}

export async function adminMiningDailyStats(
  days = 14,
): Promise<{ ok: true; rows: AdminDailyMiningRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_mining_daily_stats', { p_days: days });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; rows?: AdminDailyMiningRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, rows: j.rows ?? [] };
}

export async function adminMiningTopMiners(
  limit = 10,
): Promise<{ ok: true; rows: AdminTopMinerRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_mining_top_miners', { p_limit: limit });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; rows?: AdminTopMinerRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, rows: j.rows ?? [] };
}

export async function adminListAuditLog(
  limit = 100,
  offset = 0,
): Promise<{ ok: true; rows: AuditLogRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_audit_log', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; rows?: AuditLogRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, rows: j.rows ?? [] };
}

export type MissionRow = {
  id: number;
  title: string;
  description: string | null;
  reward_points: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: number;
  title: string;
  description: string | null;
  reward_points: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function adminListMissions(
  includeInactive = true,
): Promise<{ ok: true; rows: MissionRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_missions', {
    p_include_inactive: includeInactive,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; rows?: MissionRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, rows: j.rows ?? [] };
}

export async function adminListEvents(
  includeInactive = true,
): Promise<{ ok: true; rows: EventRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_events', {
    p_include_inactive: includeInactive,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; rows?: EventRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, rows: j.rows ?? [] };
}

export async function adminListReferralSummaries(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: ReferralSummaryRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_referral_summaries', {
    p_search: params.search ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: ReferralSummaryRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  const rows = (j.rows ?? []).map((r) => ({
    ...r,
    point: Number(r.point ?? 0),
    referral_count: Number(r.referral_count ?? 0),
    referral_points_from_logs: Number(r.referral_points_from_logs ?? 0),
  }));
  return { ok: true, total: Number(j.total ?? 0), rows };
}

export async function adminListInvitedUsers(params: {
  referrerId: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: InvitedUserRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_invited_users', {
    p_referrer_id: params.referrerId,
    p_limit: params.limit ?? 80,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: InvitedUserRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  const rows = (j.rows ?? []).map((r) => ({
    ...r,
    point: Number(r.point ?? 0),
  }));
  return { ok: true, total: Number(j.total ?? 0), rows };
}

export async function adminListReferralProgramLogs(params: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; total: number; rows: MiningLogRow[] } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('admin_list_referral_program_logs', {
    p_user_id: params.userId,
    p_limit: params.limit ?? 100,
    p_offset: params.offset ?? 0,
  });
  if (error) return rpcError(error.message);
  const j = data as { ok?: boolean; total?: number; rows?: MiningLogRow[]; message?: string };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return { ok: true, total: Number(j.total ?? 0), rows: j.rows ?? [] };
}
