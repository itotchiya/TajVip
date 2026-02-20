'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { subscribeToClients } from '@/lib/store';
import { Client } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DayModal from '@/components/DayModal';
import AddClientModal from '@/components/AddClientModal';
import Toast, { useToast } from '@/components/Toast';

const DAY_QUOTA = 3;
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getBookingsForDay(clients: Client[], ds: string) {
    return clients.filter(c => c.reservations?.some(r => ds >= r.start && ds <= r.end));
}

export default function CalendarPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [dayOpen, setDayOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const { toast, showToast } = useToast();

    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn()) { router.replace('/'); return; }
        const unsub = subscribeToClients(setClients);
        return unsub;
    }, [router]);

    function calPrev() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
    function calNext() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

    function openDay(ds: string) { setSelectedDay(ds); setDayOpen(true); }

    function renderCalendar() {
        const today = new Date().toISOString().slice(0, 10);
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const offset = (firstDay + 6) % 7;
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const cells = [];

        // headers
        DAYS_FR.forEach(d => cells.push(<div key={`h${d}`} className="cal-day-header">{d}</div>));

        // empty cells
        for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />);

        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayClients = getBookingsForDay(clients, ds);
            const count = dayClients.length;
            const isFull = count >= DAY_QUOTA;

            const chips = dayClients.map(c => {
                const res = c.reservations.find(r => ds >= r.start && ds <= r.end);
                return <div key={c.id} className={`cal-client-chip ${res?.status || ''}`}>{c.firstName} {c.lastName[0]}.</div>;
            });

            const dots = Array.from({ length: DAY_QUOTA }, (_, i) => (
                <div key={i} className={`quota-dot${i < count ? ` used${isFull ? ' full-q' : ''}` : ''}`} />
            ));

            cells.push(
                <div
                    key={ds}
                    className={`cal-day${ds === today ? ' today' : ''}${isFull ? ' full' : ''}`}
                    onClick={() => openDay(ds)}
                >
                    <div className="cal-day-num">{d}</div>
                    {chips}
                    <div className={`cal-quota-label${isFull ? ' full-q' : ''}`}>{isFull ? 'COMPLET' : `${count}/${DAY_QUOTA}`}</div>
                    <div className="quota-bar">{dots}</div>
                </div>
            );
        }
        return cells;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
            <Sidebar />

            <div className="main-panel" id="main">
                <div className="cal-nav">
                    <button className="cal-btn" onClick={calPrev}>‹ Précédent</button>
                    <div className="cal-title">{MONTHS_FR[calMonth]} {calYear}</div>
                    <button className="cal-btn" onClick={calNext}>Suivant ›</button>
                </div>
                <div className="content" style={{ padding: '0 0 16px' }}>
                    <div className="cal-grid">{renderCalendar()}</div>
                </div>
            </div>

            <BottomNav onAddClient={() => setAddOpen(true)} />

            <DayModal
                open={dayOpen}
                onClose={() => setDayOpen(false)}
                date={selectedDay}
                clients={clients}
                onToast={showToast}
                onAddClient={() => { setDayOpen(false); setAddOpen(true); }}
            />
            <AddClientModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                clients={clients}
                onToast={showToast}
            />
            <Toast message={toast.message} show={toast.show} />
        </div>
    );
}
