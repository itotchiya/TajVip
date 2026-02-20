'use client';
import { useState } from 'react';
import Modal from './Modal';
import { Client } from '@/lib/types';
import { updateClient } from '@/lib/store';

const DAY_QUOTA = 3;

interface Props {
    open: boolean;
    onClose: () => void;
    date: string | null;
    clients: Client[];
    onToast: (msg: string) => void;
    onAddClient: () => void;
}

function getBookingsForDay(clients: Client[], ds: string) {
    return clients.filter(c => c.reservations?.some(r => ds >= r.start && ds <= r.end));
}

export default function DayModal({ open, onClose, date, clients, onToast, onAddClient }: Props) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (!date) return null;

    const booked = getBookingsForDay(clients, date);
    const count = booked.length;
    const isFull = count >= DAY_QUOTA;

    const available = clients.filter(c =>
        !booked.find(b => b.id === c.id) &&
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    const selectedClient = clients.find(c => c.id === selectedId);

    async function handleSave() {
        if (!selectedId) { onToast('Sélectionnez un client'); return; }
        if (isFull) { onToast('Quota atteint pour ce jour'); return; }
        const client = clients.find(c => c.id === selectedId);
        if (!client) return;
        const newRes = { id: Date.now().toString(), start: date!, end: date!, status: 'confirmed' as const, notes: '' };
        const updated = [...(client.reservations || []), newRes];
        await updateClient(selectedId!, { reservations: updated });
        onToast(`${client.firstName} ${client.lastName} assigné(e) ✦`);
        setSelectedId(null); setSearch('');
        onClose();
    }

    function formatDate(ds: string) {
        const d = new Date(ds + 'T00:00:00');
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    return (
        <Modal open={open} onClose={() => { setSelectedId(null); setSearch(''); onClose(); }}>
            <div className="day-modal-date">📅 {formatDate(date)}</div>
            <div className="day-modal-quota" style={isFull ? { color: '#f87171' } : {}}>
                {isFull ? `COMPLET — ${count}/${DAY_QUOTA}` : `${count}/${DAY_QUOTA} réservations`}
            </div>

            {/* Already booked */}
            {booked.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--sub)', textTransform: 'uppercase', marginBottom: 8 }}>Déjà réservés</div>
                    <div className="day-clients-list">
                        {booked.map(c => {
                            const res = c.reservations.find(r => date >= r.start && date <= r.end);
                            return (
                                <div key={c.id} className="day-client-item">
                                    <span>{c.firstName} {c.lastName}</span>
                                    <span className={`tag tag-${res?.status}`}>{res?.status === 'confirmed' ? '✓' : res?.status === 'pending' ? '⏳' : '✗'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Assign new client */}
            {!isFull && (
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--sub)', textTransform: 'uppercase', marginBottom: 8 }}>Assigner un client</div>
                    {selectedClient ? (
                        <div style={{ marginBottom: 10 }}>
                            <div className="selected-badge">
                                {selectedClient.firstName} {selectedClient.lastName}
                                <button onClick={() => setSelectedId(null)}>✕</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <input
                                className="day-search-input"
                                placeholder="Rechercher un client..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <div className="day-results">
                                    {available.length === 0
                                        ? <div className="day-result-item" style={{ color: 'var(--sub)' }}>Aucun client trouvé</div>
                                        : available.map(c => (
                                            <div key={c.id} className="day-result-item" onClick={() => { setSelectedId(c.id); setSearch(''); }}>
                                                {c.firstName} {c.lastName}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            <button className="btn-new-client" onClick={() => { onClose(); onAddClient(); }}>+ Nouveau client</button>
                        </>
                    )}
                    <button className="btn-primary" onClick={handleSave} disabled={!selectedId}>ASSIGNER</button>
                </div>
            )}
        </Modal>
    );
}
