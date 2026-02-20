'use client';
import { useEffect, useState } from 'react';

interface ToastProps { message: string; show: boolean; }

export default function Toast({ message, show }: ToastProps) {
    return (
        <div className={`toast${show ? ' show' : ''}`}>{message}</div>
    );
}

// Hook for easy toast usage
export function useToast() {
    const [toast, setToast] = useState({ message: '', show: false });

    function showToast(message: string) {
        setToast({ message, show: true });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
    }

    return { toast, showToast };
}
