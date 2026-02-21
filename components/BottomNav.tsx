'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav({ onAddClient }: { onAddClient: () => void }) {
    const path = usePathname();
    return (
        <nav className="bottom-nav">
            <Link href="/clients" className={`bn-item${path.startsWith('/clients') ? ' active' : ''}`}>
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                <span>Clients</span>
            </Link>
            <button className="bn-add" onClick={onAddClient}>+</button>
            <Link href="/calendar" className={`bn-item${path.startsWith('/calendar') ? ' active' : ''}`}>
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="3" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>Calendrier</span>
            </Link>
        </nav>
    );
}
