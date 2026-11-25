'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Lock, Plus, Trash2, Unlock, X } from 'lucide-react';
import type { AppUserProfile, DynamicRule, ScamReport } from '@/types';

interface AdminModerationPanelProps {
  queue: ScamReport[];
  onModerate: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onNotify: (msg: string) => void;
}

export function AdminModerationPanel({
  queue,
  onModerate,
  onNotify,
}: AdminModerationPanelProps) {
  const [adminTab, setAdminTab] = useState<'queue' | 'rules' | 'users'>('queue');
  const [rules, setRules] = useState<DynamicRule[]>([]);
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [pattern, setPattern] = useState('');
  const [ruleLevel, setRuleLevel] = useState<DynamicRule['level']>('danger');
  const [ruleNote, setRuleNote] = useState('');

  const loadRulesAndUsers = useCallback(async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        fetch('/api/admin/rules', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
      ]);
      if (rulesRes.ok) {
        const d = (await rulesRes.json()) as { rules?: DynamicRule[] };
        setRules(d.rules ?? []);
      }
      if (usersRes.ok) {
        const u = (await usersRes.json()) as { users?: AppUserProfile[] };
        setUsers(u.users ?? []);
      }
    } catch {
      // Ignore network hiccup
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadRulesAndUsers();
    });
    return () => {
      active = false;
    };
  }, [loadRulesAndUsers]);

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!pattern.trim()) return;
    const res = await fetch('/api/admin/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern, level: ruleLevel, note: ruleNote }),
    });
    if (!res.ok) {
      onNotify('Không thêm được luật mới (kiểm tra quyền Admin/Supabase).');
      return;
    }
    setPattern('');
    setRuleNote('');
    onNotify('Đã thêm luật chặn nóng lên Supabase!');
    await loadRulesAndUsers();
  }

  async function handleDeleteRule(id: string) {
    await fetch(`/api/admin/rules?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadRulesAndUsers();
  }

  async function handleToggleLock(targetUser: AppUserProfile) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetUser.id, isLocked: !targetUser.isLocked }),
    });
    if (!res.ok) {
      onNotify('Không cập nhật được trạng thái tài khoản.');
      return;
    }
    onNotify(
      !targetUser.isLocked
        ? `Đã khóa tài khoản @${targetUser.username}`
        : `Đã mở khóa @${targetUser.username}`
    );
    await loadRulesAndUsers();
  }

  return (
    <div className="space-y-2.5 rounded-2xl border-2 border-[#0D685E] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-[#0D685E]">Bảng điều khiển Quản trị Đội TNTN</h2>
        <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-extrabold text-[#92400E]">
          ADMIN
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#F4FBF8] p-1 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setAdminTab('queue')}
          className={`rounded-lg py-1.5 ${adminTab === 'queue' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'}`}
        >
          Duyệt ({queue.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('rules')}
          className={`rounded-lg py-1.5 ${adminTab === 'rules' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'}`}
        >
          Luật chặn ({rules.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('users')}
          className={`rounded-lg py-1.5 ${adminTab === 'users' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'}`}
        >
          Người dùng ({users.length})
        </button>
      </div>

      {adminTab === 'queue' && (
        <div className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-xs text-[#475569]">Đã duyệt hết báo cáo chờ.</p>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-xs">
                <div className="font-extrabold text-[#0D685E]">
                  {item.id} • {item.type} ({item.area})
                </div>
                <div className="tabular-nums mt-0.5 font-bold">{item.targetMasked}</div>
                <div className="mt-1 text-[#475569]">{item.description}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onModerate(item.id, 'approved')}
                    data-screen="M07"
                    data-ui={`btn-approve-${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0D685E] px-2.5 py-1.5 font-bold text-white"
                  >
                    <Check className="h-3.5 w-3.5" /> Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => void onModerate(item.id, 'rejected')}
                    data-screen="M07"
                    data-ui={`btn-reject-${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626] bg-white px-2.5 py-1.5 font-bold text-[#991B1B]"
                  >
                    <X className="h-3.5 w-3.5" /> Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === 'rules' && (
        <div className="space-y-2.5 text-xs">
          <form onSubmit={(e) => void handleAddRule(e)} className="space-y-1.5 rounded-xl bg-[#F4FBF8] p-2.5">
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="SĐT, link hoặc từ khóa cần chặn (VD: vneid-gia.xyz)"
              className="w-full rounded-lg border border-[#CBE4DC] bg-white p-2"
            />
            <div className="flex gap-1.5">
              <select
                value={ruleLevel}
                onChange={(e) => setRuleLevel(e.target.value as DynamicRule['level'])}
                className="rounded-lg border border-[#CBE4DC] bg-white p-2"
              >
                <option value="danger">Nguy hiểm</option>
                <option value="warn">Nghi ngờ</option>
                <option value="safe">Xác thực</option>
              </select>
              <input
                value={ruleNote}
                onChange={(e) => setRuleNote(e.target.value)}
                placeholder="Lý do cảnh báo..."
                className="flex-1 rounded-lg border border-[#CBE4DC] bg-white p-2"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-[#0D685E] px-3 font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm
              </button>
            </div>
          </form>

          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#CBE4DC] p-2">
              <div>
                <div className="font-bold text-[#0F172A]">
                  [{r.level.toUpperCase()}] {r.pattern}
                </div>
                <div className="text-[11px] text-[#475569]">{r.note}</div>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteRule(r.id)}
                className="rounded-lg p-1.5 text-[#991B1B] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'users' && (
        <div className="space-y-1.5 text-xs">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#CBE4DC] p-2">
              <div>
                <div className="font-bold">
                  {u.fullName} (@{u.username})
                </div>
                <div className="text-[11px] text-[#475569]">
                  {u.role === 'admin' ? 'Quản trị' : 'Người dân'} • {u.gameScore}đ ({u.gameBadge})
                </div>
              </div>
              {u.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => void handleToggleLock(u)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                    u.isLocked ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#FEF2F2] text-[#991B1B]'
                  }`}
                >
                  {u.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {u.isLocked ? 'Mở khóa' : 'Khóa'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
