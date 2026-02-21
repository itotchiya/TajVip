'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { subscribeToClients } from '@/lib/store';
import { Client } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import AddClientModal from '@/components/AddClientModal';
import ClientDetail from '@/components/ClientDetail';
import Toast, { useToast } from '@/components/Toast';
import { Search, Users, Plus } from 'lucide-react';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [detailClient, setDetailClient] = useState<Client | null>(null);
    const { toast, showToast } = useToast();

    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn()) { router.replace('/'); return; }
        const unsub = subscribeToClients(setClients);
        return unsub;
    }, [router]);

    const countries = [...new Set(clients.map(c => c.country).filter(Boolean))].sort();

    const filtered = clients.filter(c => {
        const m = `${c.firstName} ${c.lastName} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase());
        return m && (!filterCountry || c.country === filterCountry);
    });

    // Use the latest data from the clients array for the detail view
    const currentDetailClient = detailClient ? clients.find(c => c.id === detailClient.id) : null;

    return (
        <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
            <Sidebar />

            <div className="main-panel" id="main">
                {/* Header */}
                <div className="header">
                    <div style={{ flex: 1 }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Clients 
                            <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.5, letterSpacing: 0 }}>— {clients.length}</span>
                        </h1>
                    </div>
                    <div className="search-wrap">
                        <Search size={16} strokeWidth={2.5} className="sub-icon" />
                        <input placeholder="Chercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
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
                            <div className="icon"><Users size={48} strokeWidth={1} /></div>
                            <p style={{ fontWeight: 600 }}>{clients.length === 0 ? 'Aucun client enregistré' : 'Recherche infructueuse'}</p>
                            <p style={{ fontSize: 13, opacity: 0.6 }}>{clients.length === 0 ? 'Commencez par ajouter un dossier' : 'Essayez d\'autres mots clés'}</p>
                        </div>
                    ) : (
                        <div className="clients-grid">
                            {filtered.map(c => (
                                <div key={c.id} className="glass client-card" onClick={() => setDetailClient(c)}>
                                    <div className="detail-avatar" style={{ width: 44, height: 44, fontSize: 16, marginBottom: 8, borderRadius: 12 }}>
                                        {c.firstName[0]}{c.lastName[0]}
                                    </div>
                                    <div className="card-name">{c.firstName} {c.lastName}</div>
                                    <div style={{ fontSize: 11, opacity: 0.5 }}>{c.country || 'Inconnu'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FAB */}
                <button className="fab" onClick={() => setAddOpen(true)} title="Ajouter un client">
                    <Plus size={32} strokeWidth={3} />
                </button>
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
                client={currentDetailClient || detailClient}
                clients={clients}
                onToast={showToast}
            />
            <Toast message={toast.message} show={toast.show} />
        </div>
    );
}
