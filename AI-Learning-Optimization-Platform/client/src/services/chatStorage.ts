// chatStorage.ts — localStorage-backed chat session manager

export interface ChatSession {
    id: string;
    title: string;            // first user message, truncated
    messages: StoredMessage[];
    createdAt: number;        // timestamp ms
    updatedAt: number;
}

export interface StoredMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;        // ms instead of Date (serialisable)
}

const STORAGE_KEY = 'cognify_tutor_sessions';
const MAX_SESSIONS = 5;
const MAX_MESSAGES_PER_SESSION = 50;

function load(): ChatSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function save(sessions: ChatSession[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/** Return all sessions sorted newest-first */
export function getSessions(): ChatSession[] {
    return load().sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Create a brand-new empty session and return its id */
export function createSession(): ChatSession {
    const session: ChatSession = {
        id: Date.now().toString(),
        title: 'New conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    const sessions = load();
    // Enforce max sessions — drop the oldest when limit exceeded
    const trimmed = [session, ...sessions].slice(0, MAX_SESSIONS);
    save(trimmed);
    return session;
}

/** Save messages into a session (and derive the title from first user msg) */
export function updateSession(id: string, messages: StoredMessage[]) {
    const sessions = load();
    const idx = sessions.findIndex(s => s.id === id);

    // Derive title from the first user message (truncate to 45 chars)
    const firstUser = messages.find(m => m.role === 'user');
    const title = firstUser
        ? firstUser.content.slice(0, 45) + (firstUser.content.length > 45 ? '…' : '')
        : 'New conversation';

    // Enforce per-session message cap — keep the LAST N messages
    const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_SESSION);

    if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], title, messages: trimmedMessages, updatedAt: Date.now() };
    } else {
        // Session not found — create it (shouldn't normally happen)
        sessions.unshift({
            id,
            title,
            messages: trimmedMessages,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    }

    save(sessions.slice(0, MAX_SESSIONS));
}

/** Load a specific session by id */
export function getSession(id: string): ChatSession | null {
    return load().find(s => s.id === id) ?? null;
}

/** Delete a session */
export function deleteSession(id: string) {
    save(load().filter(s => s.id !== id));
}

/** Return the id of the most recently used session (or null if none) */
export function getLastSessionId(): string | null {
    const sessions = getSessions();
    return sessions.length ? sessions[0].id : null;
}
