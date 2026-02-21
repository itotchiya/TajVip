'use client';
import Modal from './Modal';
import { Client, Reservation } from '@/lib/types';
import { updateClient, deleteClient } from '@/lib/store';
import { useState } from 'react';
import { Phone, FileText, Calendar as CalIcon, ChevronLeft, ChevronRight, Check, Clock, X, Trash2, Sparkles, AlertCircle } from 'lucide-react';

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
                    <div className="detail-sub">{client.country || 'Pays non renseigné'}</div>
                </div>
            </div>

            <div className="detail-section">
                <div className="detail-section-title">Coordonnées</div>
                {client.phone && <div className="detail-row">
                    <Phone size={14} className="sub-icon" />
                    <span className="detail-row-val">{client.phone}</span>
                </div>}
                {client.notes && <div className="detail-row">
                    <FileText size={14} className="sub-icon" />
                    <span className="detail-row-val">{client.notes}</span>
                </div>}
                {client.hasAttachment && (
                    <div className="detail-row">
                        <FileText size={14} className="icon-gold" />
                        {client.attachmentURL
                            ? <a href={client.attachmentURL} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-light)', fontWeight: 600, textDecoration: 'none' }}>{client.attachmentName || 'Voir le document'}</a>
                            : <span className="detail-row-val">{client.attachmentName}</span>}
                    </div>
                )}
            </div>

            <div className="detail-section">
                <div className="detail-section-title">Historique des Séjours</div>
                {(client.reservations || []).length === 0
                    ? <div style={{ color: 'var(--sub)', fontSize: 13, padding: '12px', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center' }}>Aucun séjour enregistré</div>
                    : (client.reservations || []).map(r => (
                        <div key={r.id} className="res-item">
                            <div className="res-item-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {r.status === 'confirmed' && <Check size={14} className="tag-icon confirmed" />}
                                    {r.status === 'pending' && <Clock size={14} className="tag-icon pending" />}
                                    {r.status === 'cancelled' && <X size={14} className="tag-icon cancelled" />}
                                    <span className="res-item-dates">Du {r.start} {r.end && r.end !== r.start ? ` au ${r.end}` : ''}</span>
                                </div>
                                <button className="icon-btn danger-hover" onClick={() => deleteReservation(r.id)} title="Supprimer">
                                    <X size={14} />
                                </button>
                            </div>
                            {r.notes && <div className="res-item-notes">{r.notes}</div>}
                        </div>
                    ))}
            </div>

            {showRes && (
                <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', marginTop: 8 }}>
                    <div className="mini-cal">
                        <div className="mini-cal-nav">
                            <button className="mini-nav-btn" onClick={() => { if (miniMonth === 0) { setMiniMonth(11); setMiniYear(y => y - 1); } else setMiniMonth(m => m - 1); }}>
                                <ChevronLeft size={14} />
                            </button>
                            <span className="mini-cal-title">{MONTHS_FR[miniMonth]} {miniYear}</span>
                            <button className="mini-nav-btn" onClick={() => { if (miniMonth === 11) { setMiniMonth(0); setMiniYear(y => y + 1); } else setMiniMonth(m => m + 1); }}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="mini-grid">
                            {DAYS_FR.map(d => <div key={d} className="mini-day-header">{d}</div>)}
                            {renderMiniCal()}
                        </div>
                        {pickStart && <div className="date-selection-badge">
                            <CalIcon size={14} className="icon-gold" />
                            <span>Du {pickStart} {pickEnd && pickEnd !== pickStart ? ` au ${pickEnd}` : ''}</span>
                        </div>}
                    </div>

                    {pickStart && <>
                        <div className="status-tab-row" style={{ marginTop: 16 }}>
                            {(['confirmed', 'pending', 'cancelled'] as const).map(s => (
                                <button key={s} className={`status-tab${status === s ? ` active-${s}` : ''}`} onClick={() => setStatus(s)}>
                                    {s === 'confirmed' && <Check size={14} style={{ marginRight: 6 }} />}
                                    {s === 'pending' && <Clock size={14} style={{ marginRight: 6 }} />}
                                    {s === 'cancelled' && <X size={14} style={{ marginRight: 6 }} />}
                                    {s === 'confirmed' ? 'Confirmée' : s === 'pending' ? 'Attente' : 'Annulée'}
                                </button>
                            ))}
                        </div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <input value={resNotes} onChange={e => setResNotes(e.target.value)} placeholder="Détails du séjour..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text)', outline: 'none' }} />
                        </div>
                    </>}

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowRes(false)}>Annuler</button>
                        <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={saveReservation}>Ajouter</button>
                    </div>
                </div>
            )}

            <div className="detail-actions">
                {!showRes && (
                    <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setShowRes(true)}>
                        <Sparkles size={16} className="icon-gold" />
                        <span>Nouveau Séjour</span>
                    </button>
                )}
                <button className="btn-danger-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleDeleteClient}>
                    <Trash2 size={16} />
                    <span>Supprimer</span>
                </button>
            </div>
        </Modal>
    );
}
