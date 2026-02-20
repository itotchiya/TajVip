'use client';
import { useEffect, useState } from 'react';
import { subscribeToClients } from '@/lib/store';
import { Client } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import AddClientModal from '@/components/AddClientModal';
import ClientDetail from '@/components/ClientDetail';
import Toast, { useToast } from '@/components/Toast';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [detailClient, setDetailClient] = useState<Client | null>(null);
    const { toast, showToast } = useToast();

    useEffect(() => {
        const unsub = subscribeToClients(setClients);
        return unsub;
    }, []);

    const countries = [...new Set(clients.map(c => c.country).filter(Boolean))].sort();

    const filtered = clients.filter(c => {
        const m = `${c.firstName} ${c.lastName} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase());
        return m && (!filterCountry || c.country === filterCountry);
    });

    // Keep detail in sync when clients list updates
    useEffect(() => {
        if (detailClient) {
            const updated = clients.find(c => c.id === detailClient.id);
            setDetailClient(updated ?? null);
        }
    }, [clients]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
            <Sidebar />

            <div className="main-panel" id="main">
                {/* Header */}
                <div className="header">
                    <div style={{ flex: 1 }}>
                        <h1>Clients <span className="header-sub">— {clients.length} client{clients.length !== 1 ? 's' : ''}</span></h1>
                    </div>
                    <div className="search-wrap">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="filter-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                        <option value="">Tous les pays</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Grid */}
                <div className="content">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">👤</div>
                            <p>{clients.length === 0 ? 'Ajoutez votre premier client' : 'Aucun client trouvé'}</p>
                        </div>
                    ) : (
                        <div className="clients-grid">
                            {filtered.map(c => (
                                <div key={c.id} className="glass client-card" onClick={() => setDetailClient(c)}>
                                    <div className="card-name">{c.firstName} {c.lastName}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FAB */}
                <button className="fab" onClick={() => setAddOpen(true)} title="Ajouter un client">+</button>
            </div>

            {/* Mobile bottom nav */}
            <BottomNav onAddClient={() => setAddOpen(true)} />

            <AddClientModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                clients={clients}
                onToast={showToast}
            />
            <ClientDetail
                open={!!detailClient}
                onClose={() => setDetailClient(null)}
                client={detailClient}
                clients={clients}
                onToast={showToast}
            />
            <Toast message={toast.message} show={toast.show} />
        </div>
    );
}
