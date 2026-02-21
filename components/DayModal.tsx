'use client';
import { useState } from 'react';
import Modal from './Modal';
import { Client } from '@/lib/types';
import { updateClient } from '@/lib/store';
import { Calendar as CalIcon, Users, UserPlus, X, Search, CheckCircle, Clock, XCircle } from 'lucide-react';

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
            <div className="day-header-group">
                <div className="day-date-row">
                    <CalIcon size={18} className="icon-gold" />
                    <span>{formatDate(date)}</span>
                </div>
                <div className={`day-quota-pill ${isFull ? 'full' : ''}`}>
                    {count}/{DAY_QUOTA} réservations
                </div>
            </div>

            {/* Already booked */}
            <div className="day-section">
                <div className="day-section-label">DÉJÀ RÉSERVÉS</div>
                {booked.length > 0 ? (
                    <div className="day-clients-list">
                        {booked.map(c => {
                            const res = c.reservations.find(r => date >= r.start && date <= r.end);
                            return (
                                <div key={c.id} className="day-client-item">
                                    <div className="client-info">
                                        <Users size={14} className="sub-icon" />
                                        <span>{c.firstName} {c.lastName}</span>
                                    </div>
                                    <div className="client-actions">
                                        {res?.status === 'confirmed' && <CheckCircle size={14} className="tag-icon confirmed" />}
                                        {res?.status === 'pending' && <Clock size={14} className="tag-icon pending" />}
                                        {res?.status === 'cancelled' && <XCircle size={14} className="tag-icon cancelled" />}
                                        <button className="icon-btn danger-hover" title="Supprimer">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-mini-state">Aucune réservation</div>
                )}
            </div>

            {/* Assign new client */}
            <div className="day-section">
                <div className="day-section-label">ASSIGNER UN CLIENT</div>
                {selectedClient ? (
                    <div className="selected-client-box">
                        <div className="client-info">
                            <Users size={16} className="icon-gold" />
                            <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                        </div>
                        <button className="clear-selection" onClick={() => setSelectedId(null)}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="assignment-tools">
                        <div className="search-box-mini">
                            <Search size={14} className="sub-icon" />
                            <input
                                placeholder="Rechercher un client..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        
                        {search && (
                            <div className="day-results">
                                {available.length === 0
                                    ? <div className="day-result-item disabled">Aucun client trouvé</div>
                                    : available.map(c => (
                                        <div key={c.id} className="day-result-item" onClick={() => { setSelectedId(c.id); setSearch(''); }}>
                                            {c.firstName} {c.lastName}
                                        </div>
                                    ))
                                }
                            </div>
                        )}

                        <button className="btn-secondary-light" onClick={() => { onClose(); onAddClient(); }}>
                            <UserPlus size={14} />
                            <span>Nouveau client</span>
                        </button>
                    </div>
                )}
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={!selectedId || isFull}>
                {isFull ? 'COMPLET' : 'ASSIGNER'}
            </button>
        </Modal>
    );
}
