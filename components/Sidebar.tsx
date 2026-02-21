'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { Users, Calendar, LogOut } from 'lucide-react';

export default function Sidebar() {
    const path = usePathname();
    const router = useRouter();

    function handleLogout() {
        logout();
        router.push('/');
    }

    return (
        <aside className="glass sidebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40, padding: '0 8px' }}>
                <div className="logo-mark">✦</div>
                <div className="logo-text">TajVip</div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/clients" className={`nav-item${path.startsWith('/clients') ? ' active' : ''}`}>
                    <Users size={20} strokeWidth={2.5} />
                    <span>Clients</span>
                </Link>

                <Link href="/calendar" className={`nav-item${path.startsWith('/calendar') ? ' active' : ''}`}>
                    <Calendar size={20} strokeWidth={2.5} />
                    <span>Calendrier</span>
                </Link>
            </nav>

            <div style={{ flex: 1 }} />

            <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} strokeWidth={2.5} />
                <span>Déconnexion</span>
            </button>
        </aside>
    );
}
