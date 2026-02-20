'use client';
import Modal from './Modal';
import { Client, Reservation } from '@/lib/types';
import { updateClient, deleteClient } from '@/lib/store';
import { useState } from 'react';

const DAY_QUOTA = 3;
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Props {
    open: boolean;
    onClose: () => void;
    client: Client | null;
    clients: Client[];
    onToast: (msg: string) => void;
}

export default function ClientDetail({ open, onClose, client, clients, onToast }: Props) {
    const [miniYear, setMiniYear] = useState(new Date().getFullYear());
    const [miniMonth, setMiniMonth] = useState(new Date().getMonth());
    const [pickStart, setPickStart] = useState<string | null>(null);
    const [pickEnd, setPickEnd] = useState<string | null>(null);
    const [pickPhase, setPickPhase] = useState(0);
    const [status, setStatus] = useState<'confirmed' | 'pending' | 'cancelled'>('confirmed');
    const [resNotes, setResNotes] = useState('');
    const [showRes, setShowRes] = useState(false);

    if (!client) return null;
    const initials = ((client.firstName || '?')[0] + (client.lastName || '?')[0]).toUpperCase();

    function getBookingsForDay(ds: string) {
        return clients.filter(c => c.id !== client!.id && c.reservations?.some(r => ds >= r.start && ds <= r.end));
    }

    function pickDay(ds: string) {
        if (pickPhase === 0) { setPickStart(ds); setPickEnd(ds); setPickPhase(1); }
        else if (pickPhase === 1) {
            if (ds < pickStart!) { setPickStart(ds); setPickEnd(ds); }
            else { setPickEnd(ds); setPickPhase(2); }
        } else { setPickStart(ds); setPickEnd(ds); setPickPhase(1); }
    }

    function renderMiniCal() {
        const firstDay = new Date(miniYear, miniMonth, 1).getDay();
        const offset = (firstDay + 6) % 7;
        const daysInMonth = new Date(miniYear, miniMonth + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="mini-day empty" />);
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isStart = ds === pickStart, isEnd = ds === pickEnd;
            const inRange = pickStart && pickEnd && ds > pickStart && ds < pickEnd;
            cells.push(
                <div key={ds} className={`mini-day${isStart || isEnd ? ' selected' : inRange ? ' in-range' : ''}`} onClick={() => pickDay(ds)}>{d}</div>
            );
        }
        return cells;
    }

    async function saveReservation() {
        if (!pickStart || !pickEnd) { onToast('Sélectionnez une date'); return; }
        const start = new Date(pickStart), end = new Date(pickEnd);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const ds = d.toISOString().slice(0, 10);
            const count = getBookingsForDay(ds).length;
            if (count >= DAY_QUOTA) { onToast(`Le ${ds} est complet (${DAY_QUOTA}/${DAY_QUOTA})`); return; }
        }
        const newRes: Reservation = { id: Date.now().toString(), start: pickStart!, end: pickEnd!, status, notes: resNotes };
        const updated = [...(client!.reservations || []), newRes];
        await updateClient(client!.id, { reservations: updated });
        onToast('Réservation ajoutée ✦');
        setPickStart(null); setPickEnd(null); setPickPhase(0); setResNotes(''); setShowRes(false);
    }

    async function deleteReservation(resId: string) {
        const updated = (client!.reservations || []).filter(r => r.id !== resId);
        await updateClient(client!.id, { reservations: updated });
        onToast('Réservation supprimée');
    }

    async function handleDeleteClient() {
        await deleteClient(client!.id);
        onToast('Client supprimé');
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose}>
            <div className="detail-header">
                <div className="detail-avatar">{initials}</div>
                <div>
                    <div className="detail-name">{client.firstName} {client.lastName}</div>
                    <div className="detail-sub">{client.country}</div>
                </div>
            </div>

            <div className="detail-section">
                <div className="detail-section-title">Informations</div>
                {client.phone && <div className="detail-row"><span className="detail-row-icon">📞</span><span className="detail-row-val">{client.phone}</span></div>}
                {client.country && <div className="detail-row"><span className="detail-row-icon">🌍</span><span className="detail-row-val">{client.country}</span></div>}
                {client.notes && <div className="detail-row"><span className="detail-row-icon">📝</span><span className="detail-row-val">{client.notes}</span></div>}
                {client.hasAttachment && (
                    <div className="detail-row">
                        <span className="detail-row-icon">📎</span>
                        {client.attachmentURL
                            ? <a href={client.attachmentURL} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-light)', textDecoration: 'none' }}>{client.attachmentName || 'Voir fichier'}</a>
                            : <span className="detail-row-val">{client.attachmentName}</span>}
                    </div>
                )}
            </div>

            <div className="detail-section">
                <div className="detail-section-title">Réservations</div>
                {(client.reservations || []).length === 0
                    ? <div style={{ color: 'var(--sub)', fontSize: 13 }}>Aucune réservation</div>
                    : (client.reservations || []).map(r => (
                        <div key={r.id} className="res-item">
                            <div className="res-item-top">
                                <span className={`tag tag-${r.status}`}>{r.status === 'confirmed' ? '✓ Confirmée' : r.status === 'cancelled' ? '✗ Annulée' : '⏳ En attente'}</span>
                                <span className="res-item-dates">📅 {r.start}{r.end && r.end !== r.start ? ` → ${r.end}` : ''}</span>
                                <button className="res-delete-btn" onClick={() => deleteReservation(r.id)}>✕</button>
                            </div>
                            {r.notes && <div className="res-item-notes">{r.notes}</div>}
                        </div>
                    ))}
            </div>

            {showRes ? (
                <div style={{ marginTop: 8 }}>
                    <div className="mini-cal">
                        <div className="mini-cal-nav">
                            <button className="mini-nav-btn" onClick={() => { if (miniMonth === 0) { setMiniMonth(11); setMiniYear(y => y - 1); } else setMiniMonth(m => m - 1); }}>‹</button>
                            <span className="mini-cal-title">{MONTHS_FR[miniMonth]} {miniYear}</span>
                            <button className="mini-nav-btn" onClick={() => { if (miniMonth === 11) { setMiniMonth(0); setMiniYear(y => y + 1); } else setMiniMonth(m => m + 1); }}>›</button>
                        </div>
                        <div className="mini-grid">
                            {DAYS_FR.map(d => <div key={d} className="mini-day-header">{d}</div>)}
                            {renderMiniCal()}
                        </div>
                        {pickStart && <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 8 }}>📅 {pickStart}{pickEnd && pickEnd !== pickStart ? ` → ${pickEnd}` : ''}</div>}
                    </div>
                    {pickStart && <>
                        <div className="status-tab-row">
                            {(['confirmed', 'pending', 'cancelled'] as const).map(s => (
                                <button key={s} className={`status-tab${status === s ? ` active-${s}` : ''}`} onClick={() => setStatus(s)}>
                                    {s === 'confirmed' ? '✓ Confirmée' : s === 'pending' ? '⏳ En attente' : '✗ Annulée'}
                                </button>
                            ))}
                        </div>
                        <div className="form-group">
                            <input value={resNotes} onChange={e => setResNotes(e.target.value)} placeholder="Notes..." style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', width: '100%' }} />
                        </div>
                    </>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn-secondary" onClick={() => setShowRes(false)}>Annuler</button>
                        <button className="btn-primary" style={{ marginTop: 0 }} onClick={saveReservation}>Ajouter</button>
                    </div>
                </div>
            ) : null}

            <div className="detail-actions">
                {!showRes && <button className="btn-secondary" onClick={() => setShowRes(true)}>📅 Ajouter une date</button>}
                <button className="btn-danger" onClick={handleDeleteClient}>🗑 Supprimer</button>
            </div>
        </Modal>
    );
}
