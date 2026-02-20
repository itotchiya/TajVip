import { list, put, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@/lib/types";

const BLOB_FILENAME = "data/clients.json";

async function readClients(): Promise<Client[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function writeClients(clients: Client[]): Promise<void> {
  // Delete old blob first to avoid accumulation
  const { blobs } = await list({ prefix: BLOB_FILENAME });
  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url));
  }
  await put(BLOB_FILENAME, JSON.stringify(clients), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

// GET — return all clients
export async function GET() {
  const clients = await readClients();
  return NextResponse.json(clients);
}

// POST — add a new client
export async function POST(req: NextRequest) {
  const client: Client = await req.json();
  const clients = await readClients();
  clients.push(client);
  await writeClients(clients);
  return NextResponse.json({ ok: true });
}

// PATCH — update a client by id
export async function PATCH(req: NextRequest) {
  const { id, data } = await req.json();
  const clients = await readClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  clients[idx] = { ...clients[idx], ...data };
  await writeClients(clients);
  return NextResponse.json({ ok: true });
}

// DELETE — remove a client by id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  let clients = await readClients();
  clients = clients.filter((c) => c.id !== id);
  await writeClients(clients);
  return NextResponse.json({ ok: true });
}
