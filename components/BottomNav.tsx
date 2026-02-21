'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, Plus } from 'lucide-react';

export default function BottomNav({ onAddClient }: { onAddClient: () => void }) {
    const path = usePathname();
    return (
        <nav className="bottom-nav">
            <Link href="/clients" className={`bn-item${path.startsWith('/clients') ? ' active' : ''}`}>
                <Users size={22} strokeWidth={2.5} />
                <span>Clients</span>
            </Link>
            <button className="bn-add" onClick={onAddClient}>
                <Plus size={28} strokeWidth={3} />
            </button>
            <Link href="/calendar" className={`bn-item${path.startsWith('/calendar') ? ' active' : ''}`}>
                <Calendar size={22} strokeWidth={2.5} />
                <span>Calendrier</span>
            </Link>
        </nav>
    );
}
