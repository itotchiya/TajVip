'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    function handleLogin() {
        if (login(password)) {
            router.push('/clients');
        } else {
            setError('Mot de passe incorrect');
        }
    }

    return (
        <div className="login-screen">
            <div className="glass login-card">
                <div className="login-logo">✦</div>
                <div className="login-title">TajVip</div>
                <div className="login-sub">Luxury Client Scheduling</div>
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoComplete="current-password"
                />
                <button className="btn-primary" onClick={handleLogin}>ACCÉDER</button>
                <div className="login-error">{error}</div>
                <div className="demo-badge">🔑 Mot de passe : <strong>lumiere2025</strong></div>
            </div>
        </div>
    );
}
