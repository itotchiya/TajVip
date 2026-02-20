import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const blob = await put(`attachments/${Date.now()}_${file.name}`, file, {
        access: 'public',
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}

export async function DELETE(req: NextRequest) {
    const { pathname } = await req.json();
    if (!pathname) return NextResponse.json({ error: 'No pathname' }, { status: 400 });
    await del(pathname);
    return NextResponse.json({ ok: true });
}
