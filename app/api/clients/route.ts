import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { Client, Reservation } from '@/lib/types';

/**
 * Initializes the database tables if they do not exist.
 */
async function initDb() {
    await sql`
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            country TEXT,
            notes TEXT,
            has_attachment BOOLEAN DEFAULT FALSE,
            attachment_url TEXT,
            attachment_name TEXT,
            attachment_pathname TEXT,
            created_at BIGINT
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT,
            notes TEXT
        );
    `;
}

export async function GET() {
    try {
        await initDb();
        
        const { rows: clientRows } = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
        const { rows: resRows } = await sql`SELECT * FROM reservations`;

        const clients: Client[] = clientRows.map(c => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            country: c.country,
            notes: c.notes,
            hasAttachment: c.has_attachment,
            attachmentURL: c.attachment_url,
            attachmentName: c.attachment_name,
            attachmentPathname: c.attachment_pathname,
            createdAt: Number(c.created_at),
            reservations: resRows
                .filter(r => r.client_id === c.id)
                .map(r => ({
                    id: r.id,
                    start: r.start_date,
                    end: r.end_date,
                    status: r.status,
                    notes: r.notes
                }))
        }));

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const client: Client = await req.json();
        
        await sql`
            INSERT INTO clients (
                id, first_name, last_name, phone, country, notes, 
                has_attachment, attachment_url, attachment_name, attachment_pathname, created_at
            ) VALUES (
                ${client.id}, ${client.firstName}, ${client.lastName}, ${client.phone}, ${client.country}, 
                ${client.notes}, ${client.hasAttachment}, ${client.attachmentURL}, 
                ${client.attachmentName}, ${client.attachmentPathname}, ${client.createdAt}
            )
        `;

        if (client.reservations && client.reservations.length > 0) {
            for (const res of client.reservations) {
                await sql`
                    INSERT INTO reservations (id, client_id, start_date, end_date, status, notes)
                    VALUES (${res.id}, ${client.id}, ${res.start}, ${res.end}, ${res.status}, ${res.notes})
                `;
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, updates }: { id: string; updates: Partial<Client> } = await req.json();

        // Update basic client fields
        if (updates.firstName !== undefined || updates.lastName !== undefined || updates.phone !== undefined || 
            updates.country !== undefined || updates.notes !== undefined || updates.hasAttachment !== undefined ||
            updates.attachmentURL !== undefined || updates.attachmentName !== undefined || updates.attachmentPathname !== undefined) {
            
            await sql`
                UPDATE clients SET
                    first_name = COALESCE(${updates.firstName}, first_name),
                    last_name = COALESCE(${updates.lastName}, last_name),
                    phone = COALESCE(${updates.phone}, phone),
                    country = COALESCE(${updates.country}, country),
                    notes = COALESCE(${updates.notes}, notes),
                    has_attachment = COALESCE(${updates.hasAttachment}, has_attachment),
                    attachment_url = COALESCE(${updates.attachmentURL}, attachment_url),
                    attachment_name = COALESCE(${updates.attachmentName}, attachment_name),
                    attachment_pathname = COALESCE(${updates.attachmentPathname}, attachment_pathname)
                WHERE id = ${id}
            `;
        }

        // Handle reservations update (full sync)
        if (updates.reservations !== undefined) {
            await sql`DELETE FROM reservations WHERE client_id = ${id}`;
            for (const res of updates.reservations) {
                await sql`
                    INSERT INTO reservations (id, client_id, start_date, end_date, status, notes)
                    VALUES (${res.id}, ${id}, ${res.start}, ${res.end}, ${res.status}, ${res.notes})
                `;
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        await sql`DELETE FROM clients WHERE id = ${id}`; // CASCADE handles reservations
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
