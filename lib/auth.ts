const SESSION_KEY = 'tajvip_auth';
const APP_PASSWORD = 'lumiere2025';

export function isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function login(password: string): boolean {
    if (password === APP_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        return true;
    }
    return false;
}

export function logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
}
