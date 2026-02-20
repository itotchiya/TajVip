import { Client } from './types';

const POLL_INTERVAL = 3000; // ms

export async function getClients(): Promise<Client[]> {
    const res = await fetch('/api/clients', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
}

export async function saveClient(client: Client): Promise<void> {
    await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
    });
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
    await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
    });
}

export async function deleteClient(id: string): Promise<void> {
    await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
}

/**
 * Subscribe to client updates via polling.
 * Returns an unsubscribe function (mirrors Firebase onSnapshot API).
 */
export function subscribeToClients(callback: (clients: Client[]) => void): () => void {
    let active = true;

    async function poll() {
        if (!active) return;
        try {
            const clients = await getClients();
            if (active) callback(clients);
        } catch {
            // ignore network errors during poll
        }
        if (active) setTimeout(poll, POLL_INTERVAL);
    }

    // Immediate first load
    poll();

    return () => { active = false; };
}
