const KEY = "fish.clientId";

// A stable-ish id for this browser so we can tell who owns which seat.
// Persisted in localStorage; falls back to a per-session id when storage
// is blocked (private windows).
export function getClientId() {
    try {
        let id = localStorage.getItem(KEY);
        if (!id) {
            id = `c_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
            localStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        if (!window.__fishClientId) {
            window.__fishClientId = `c_${Math.random().toString(36).slice(2, 10)}`;
        }
        return window.__fishClientId;
    }
}

const NAME_KEY = "fish.name";

export function getSavedName() {
    try {
        return localStorage.getItem(NAME_KEY) || "";
    } catch {
        return "";
    }
}

export function saveName(name) {
    try {
        localStorage.setItem(NAME_KEY, name);
    } catch {
        /* ignore */
    }
}
