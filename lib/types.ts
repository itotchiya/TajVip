export interface Reservation {
    id: string;
    start: string;
    end: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    notes?: string;
}

export interface Client {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    notes?: string;
    hasAttachment?: boolean;
    attachmentName?: string;
    attachmentURL?: string;
    attachmentPathname?: string; // Vercel Blob pathname for deletion
    reservations: Reservation[];
    createdAt?: number;
}
