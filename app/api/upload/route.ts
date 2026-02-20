import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// Client-side upload: browser uploads directly to Vercel Blob.
// This POST handler generates the upload token (no file body passes through here).
export async function POST(request: NextRequest) {
    const body = (await request.json()) as HandleUploadBody;
    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: [
                    'application/pdf',
                    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
                ],
                maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
            }),
            onUploadCompleted: async () => {
                // No-op — client receives the blob URL directly from upload()
            },
        });
        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}

// DELETE — remove a blob by URL
export async function DELETE(req: NextRequest) {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'No url' }, { status: 400 });
    await del(url);
    return NextResponse.json({ ok: true });
}
