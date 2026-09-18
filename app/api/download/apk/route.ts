import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'heeyaku-calltracker.apk');
    if (!fs.existsSync(filePath)) {
      return new NextResponse('APK file not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="heeyaku-calltracker.apk"',
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving APK:', error);
    return new NextResponse('Failed to download APK', { status: 500 });
  }
}
