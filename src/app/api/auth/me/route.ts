import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUserProfile();
  return NextResponse.json({ user });
}
