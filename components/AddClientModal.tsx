'use client';
import { useState, useRef } from 'react';
import Modal from './Modal';
import { Client, Reservation } from '@/lib/types';
import { saveClient, updateClient } from '@/lib/store';

const DAY_QUOTA = 3;
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Props {
    open: boolean;
    onClose: () => void;
    clients: Client[];
    onToast: (msg: string) => void;
    editClient?: Client | null;
    onSuccess?: (id: string) => void;
}

export default function AddClientModal({ open, onClose, clients, onToast, editClient, onSuccess }: Props) {
    const [firstName, setFirstName] = useState(editClient?.firstName || '');
    const [lastName, setLastName] = useState(editClient?.lastName || '');
    const [phone, setPhone] = useState(editClient?.phone || '');
    const [country, setCountry] = useState(editClient?.country || '');
    const [notes, setNotes] = useState(editClient?.notes || '');
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Date picker state
    const [miniYear, setMiniYear] = useState(new Date().getFullYear());
    const [miniMonth, setMiniMonth] = useState(new Date().getMonth());
    const [pickStart, setPickStart] = useState<string | null>(null);
    const [pickEnd, setPickEnd] = useState<string | null>(null);
    const [pickPhase, setPickPhase] = useState(0);
    const [status, setStatus] = useState<'confirmed' | 'pending' | 'cancelled'>('confirmed');
    const [resNotes, setResNotes] = useState('');

    function reset() {
        setFirstName(''); setLastName(''); setPhone(''); setCountry('');
        setNotes(''); setFile(null); setSaving(false);
        setPickStart(null); setPickEnd(null); setPickPhase(0); setResNotes('');
    }

    function getBookingsForDay(ds: string, excludeId?: string) {
        return clients.filter(c => c.id !== excludeId && c.reservations?.some(r => ds >= r.start && ds <= r.end));
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
            const isStart = ds === pickStart;
            const isEnd = ds === pickEnd;
            const inRange = pickStart && pickEnd && ds > pickStart && ds < pickEnd;
            cells.push(
                <div
                    key={ds}
                    className={`mini-day${isStart || isEnd ? ' selected' : inRange ? ' in-range' : ''}`}
                    onClick={() => pickDay(ds)}
                >{d}</div>
            );
        }
        return cells;
    }

    async function handleSave() {
        if (!firstName.trim() || !lastName.trim()) { onToast('Prénom et nom requis'); return; }
        setSaving(true);
        try {
            let attachmentURL = editClient?.attachmentURL || '';
            let attachmentName = editClient?.attachmentName || '';
            let attachmentPathname = editClient?.attachmentPathname || '';
            let hasAttachment = editClient?.hasAttachment || false;

            // Upload file via Vercel Blob if provided
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                attachmentURL = data.url;
                attachmentName = file.name;
                attachmentPathname = data.pathname;
                hasAttachment = true;
            }

            const reservations: Reservation[] = [];
            if (pickStart && pickEnd) {
                // Quota check
                const start = new Date(pickStart), end = new Date(pickEnd);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const ds = d.toISOString().slice(0, 10);
                    const count = getBookingsForDay(ds, editClient?.id).length;
                    if (count >= DAY_QUOTA) { onToast(`Le ${ds} est complet (${DAY_QUOTA}/${DAY_QUOTA})`); setSaving(false); return; }
                }
                reservations.push({ id: Date.now().toString(), start: pickStart!, end: pickEnd!, status, notes: resNotes });
            }

            const id = editClient?.id || Date.now().toString();
            const clientData: Client = {
                id,
                firstName: firstName.trim(), lastName: lastName.trim(),
                phone, country, notes, hasAttachment, attachmentURL, attachmentName, attachmentPathname,
                reservations: editClient ? editClient.reservations : reservations,
                createdAt: editClient?.createdAt || Date.now(),
            };

            if (editClient) {
                await updateClient(id, clientData);
            } else {
                await saveClient(clientData);
            }

            onToast(editClient ? 'Client mis à jour' : 'Client ajouté ✦');
            reset();
            onClose();
            if (onSuccess) onSuccess(id);
        } catch (e) {
            console.error(e);
            onToast('Erreur lors de la sauvegarde');
        } finally { setSaving(false); }
    }

    return (
        <Modal open={open} onClose={() => { reset(); onClose(); }} title="✦ Nouveau Client">
            <div className="form-row">
                <div className="form-group">
                    <label>PRÉNOM</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sofia" />
                </div>
                <div className="form-group">
                    <label>NOM</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Laurent" />
                </div>
            </div>
            <div className="form-group">
                <label>TÉLÉPHONE</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
            </div>
            <div className="form-group">
                <label>PAYS</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="France" />
            </div>
            <div className="form-group">
                <label>NOTES</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Informations complémentaires..." style={{ resize: 'none' }} />
            </div>

            {/* File upload */}
            <div className="form-group">
                <label>PIÈCE JOINTE</label>
                <div
                    className={`file-drop${dragOver ? ' drag-over' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📎</div>
                    {file ? file.name : editClient?.attachmentName || 'Glisser un fichier ici · Cliquer pour choisir'}
                </div>
                <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files && setFile(e.target.files[0])} />
            </div>

            {/* Date picker */}
            {!editClient && (
                <div className="form-group">
                    <label>DATE DE RÉSERVATION (optionnel)</label>
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
                        {pickStart && <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 8 }}>
                            📅 {pickStart}{pickEnd && pickEnd !== pickStart ? ` → ${pickEnd}` : ''}
                        </div>}
                    </div>

                    {pickStart && <>
                        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--sub)', textTransform: 'uppercase' }}>STATUT</label>
                        <div className="status-tab-row">
                            {(['confirmed', 'pending', 'cancelled'] as const).map(s => (
                                <button key={s} className={`status-tab${status === s ? ` active-${s}` : ''}`} onClick={() => setStatus(s)}>
                                    {s === 'confirmed' ? '✓ Confirmée' : s === 'pending' ? '⏳ En attente' : '✗ Annulée'}
                                </button>
                            ))}
                        </div>
                        <div className="form-group" style={{ marginTop: 8 }}>
                            <label>NOTES RÉSERVATION</label>
                            <input value={resNotes} onChange={e => setResNotes(e.target.value)} placeholder="Vol, hôtel..." />
                        </div>
                    </>}
                </div>
            )}

            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
            </button>
        </Modal>
    );
}
