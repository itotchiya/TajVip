'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

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
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span>Clients</span>
                </Link>

                <Link href="/calendar" className={`nav-item${path.startsWith('/calendar') ? ' active' : ''}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="3" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span>Calendrier</span>
                </Link>
            </nav>

            <div style={{ flex: 1 }} />

            <button className="logout-btn" onClick={handleLogout}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span>Déconnexion</span>
            </button>
        </aside>
    );
}
