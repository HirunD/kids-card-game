// Tracks whether this device has been through the "how to play" flow, so
// first-time players get offered the tutorial and returning players don't.
const KEY = "fish:onboarded";

export function hasOnboarded() {
    try {
        return window.localStorage.getItem(KEY) === "1";
    } catch {
        // Storage blocked (private mode, etc). Treat as "not onboarded" so a
        // genuine first-timer still sees the help — worst case a private-mode
        // user sees a dismissible banner each visit.
        return false;
    }
}

export function markOnboarded() {
    try {
        window.localStorage.setItem(KEY, "1");
    } catch {
        // Nothing we can do; the banner just won't be remembered.
    }
}
