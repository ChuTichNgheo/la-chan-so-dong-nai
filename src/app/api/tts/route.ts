import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      supported: false,
      message: 'Sử dụng Web Speech API hoặc fallback MP3 trong public/audio/.',
    },
    { status: 501 }
  );
}
