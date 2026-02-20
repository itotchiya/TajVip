'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
    id?: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export default function Modal({ id, open, onClose, children, title }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            ref={overlayRef}
            className={`modal-overlay${open ? ' open' : ''}`}
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="modal">
                <button className="modal-close" onClick={onClose}>✕</button>
                {title && <h2>{title}</h2>}
                {children}
            </div>
        </div>
    );
}
