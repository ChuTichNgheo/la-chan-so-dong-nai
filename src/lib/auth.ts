import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '@/lib/db';
import type { AppUserProfile, UserRole } from '@/types';

export const SESSION_COOKIE_NAME = 'lacd_session';

export interface SessionPayload {
  id: string;
  username: string;
  role: UserRole;
  exp: number;
}

export interface DbUserRow {
  id: string;
  username: string;
  full_name: string;
  password_hash: string;
  role: UserRole;
  is_locked: boolean;
  trusted_name: string;
  trusted_phone: string;
  game_score: number;
  game_badge: string;
}

export const FALLBACK_USERS: DbUserRow[] = [
  {
    id: 'usr-demo-01',
    username: 'nguoidan',
    full_name: 'Bác Tư (P. Trấn Biên)',
    password_hash:
      'lacd_seed_user:56c34b43af3de728b39ca03b99f2476b401905c0d2785502d35f95ddadf90b21aa32257fdc24fe8a90c3bc1ca15ed9d0584655266a3aa2df09fd63e3b15d50c7',
    role: 'user',
    is_locked: false,
    trusted_name: 'Chị Lan (Con gái)',
    trusted_phone: '0912345678',
    game_score: 225,
    game_badge: 'Thám Tử Số Tiềm Năng',
  },
  {
    id: 'adm-demo-01',
    username: 'doantn',
    full_name: 'Quản trị Đội TNTN Đồng Nai',
    password_hash:
      'lacd_seed_admin:29cf765ef27fe01c5fd3134b3288aef8a879f3754407f893a324e70db167324aff9fe28264c8b63b35154023c0f4397ee5f3eff697ef3404a52938371fc6a20e',
    role: 'admin',
    is_locked: false,
    trusted_name: 'Tổng đài Thành đoàn',
    trusted_phone: '0343551251',
    game_score: 500,
    game_badge: 'Siêu Lá Chắn Đồng Nai',
  },
];

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'lacd-dong-nai-fallback-secret-2026'
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const computed = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (computed.length !== original.length) return false;
  return crypto.timingSafeEqual(computed, original);
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function mapUserRow(row: Omit<DbUserRow, 'password_hash'>): AppUserProfile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    isLocked: row.is_locked,
    trustedName: row.trusted_name,
    trustedPhone: row.trusted_phone,
    gameScore: row.game_score,
    gameBadge: row.game_badge,
  };
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function getCurrentUserProfile(): Promise<AppUserProfile | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from('app_users')
      .select('id, username, full_name, password_hash, role, is_locked, trusted_name, trusted_phone, game_score, game_badge')
      .eq('id', session.id)
      .maybeSingle();

    if (data) {
      const user = mapUserRow(data as DbUserRow);
      return user.isLocked ? null : user;
    }
  }

  const fallback = FALLBACK_USERS.find((u) => u.id === session.id);
  return fallback && !fallback.is_locked ? mapUserRow(fallback) : null;
}

export function cookieOptionsForSession() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
