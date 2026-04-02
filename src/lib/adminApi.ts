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
};

export type MiningLogRow = {
  id: number;
  user_id: string;
  amount: number;
  type: string;
  slot_number: number | null;
  created_at: string;
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
};

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
  };
  if (!j?.ok) return rpcError(j?.message ?? 'Request failed');
  return {
    ok: true,
    points_positive_sum: Number(j.points_positive_sum ?? 0),
    points_negative_abs_sum: Number(j.points_negative_abs_sum ?? 0),
    active_users: Number(j.active_users ?? 0),
  };
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
