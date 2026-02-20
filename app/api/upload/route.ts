import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// Client-side upload: browser uploads directly to Vercel Blob.
// This POST handler generates the upload token (no file body passes through here).
export async function POST(request: NextRequest) {
    const body = await request.json();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Ensure the token exists
                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    throw new Error('BLOB_READ_WRITE_TOKEN is not configured on Vercel');
                }
                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({ pathname }), // optional
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('blob upload completed', blob, tokenPayload);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}

// DELETE — remove a blob by URL
export async function DELETE(req: NextRequest) {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'No url' }, { status: 400 });
    await del(url);
    return NextResponse.json({ ok: true });
}
