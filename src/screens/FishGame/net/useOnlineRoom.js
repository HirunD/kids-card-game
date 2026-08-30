import { useCallback, useEffect, useRef, useState } from "react";
import {
    ref,
    set,
    get,
    push,
    remove,
    update,
    onValue,
    runTransaction,
} from "firebase/database";
import { db, firebaseReady } from "../../../firebase";
import { getClientId } from "./clientId";

// Ambiguous characters (I/O/0/1) left out so a code is easy to read aloud.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
    let c = "";
    for (let i = 0; i < 4; i++) {
        c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return c;
}

// Full state stays at rooms/{code}/state (host-only, used for host recovery
// on refresh). Each human seat also gets a redacted copy at
// rooms/{code}/views/{seatId} with every other hand blanked to [] but the
// counts kept — that's what guests actually read, so a guest never receives
// another player's cards over the wire.
function redactFor(state, seatId) {
    const hands = {};
    const handCounts = {};
    for (const [pid, hand] of Object.entries(state.hands || {})) {
        handCounts[pid] = hand.length;
        hands[pid] = pid === seatId ? hand : [];
    }
    return { ...state, hands, handCounts };
}

const SESSION_KEY = "fish.online";

function readSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

export function useOnlineRoom() {
    const clientId = getClientId();
    const [session] = useState(readSession); // sessionStorage snapshot, once

    const [role, setRole] = useState(session?.role || null); // "host" | "guest"
    const [code, setCode] = useState(session?.code || null);
    const [mySeatId, setMySeatId] = useState(session?.mySeatId || null);
    const [meta, setMeta] = useState(null);
    const [seats, setSeats] = useState({});
    const [remoteState, setRemoteState] = useState(null);
    const [error, setError] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [roomMissing, setRoomMissing] = useState(false);

    const processedActions = useRef(new Set());

    // Keep the session pointer fresh so a refresh drops back into the room.
    useEffect(() => {
        try {
            if (code && role) {
                sessionStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify({ code, role, mySeatId })
                );
            } else {
                sessionStorage.removeItem(SESSION_KEY);
            }
        } catch {
            /* ignore */
        }
    }, [code, role, mySeatId]);

    // Live subscriptions for the current room.
    useEffect(() => {
        if (!code || !db) return undefined;
        let sawMeta = false;
        const unsubs = [
            onValue(ref(db, `rooms/${code}/meta`), (snap) => {
                const val = snap.val();
                setMeta(val);
                if (val) {
                    sawMeta = true;
                    setRoomMissing(false);
                } else if (sawMeta) {
                    setRoomMissing(true);
                }
            }),
            onValue(ref(db, `rooms/${code}/seats`), (snap) => {
                setSeats(snap.val() || {});
            }),
        ];
        return () => unsubs.forEach((u) => u());
    }, [code]);

    // Guests read their redacted view; before a seat is claimed (or for the
    // host) fall back to the full state node.
    useEffect(() => {
        if (!code || !db) return undefined;
        const path =
            role === "guest" && mySeatId
                ? `rooms/${code}/views/${mySeatId}`
                : `rooms/${code}/state`;
        const unsub = onValue(ref(db, path), (snap) => setRemoteState(snap.val()));
        return () => unsub();
    }, [code, role, mySeatId]);

    const createRoom = useCallback(
        async ({ numPlayers, isAI, showHistory, hostName }) => {
            if (!firebaseReady) {
                setError("Online play isn't set up on this site yet.");
                return;
            }
            setConnecting(true);
            setError(null);
            try {
                let chosen = null;
                for (let i = 0; i < 6; i++) {
                    const candidate = makeCode();
                    // eslint-disable-next-line no-await-in-loop
                    const snap = await get(ref(db, `rooms/${candidate}/meta`));
                    if (!snap.exists()) {
                        chosen = candidate;
                        break;
                    }
                }
                if (!chosen) {
                    setError("Couldn't create a room — try again.");
                    return;
                }

                const firstHumanSeat = isAI.findIndex((v) => !v);
                const seatId = firstHumanSeat >= 0 ? `p${firstHumanSeat}` : null;
                const name = (hostName || "").trim() || "Host";

                await set(ref(db, `rooms/${chosen}`), {
                    meta: {
                        hostId: clientId,
                        numPlayers,
                        isAI,
                        showHistory: showHistory !== false,
                        status: "lobby",
                        createdAt: Date.now(),
                    },
                    seats: seatId ? { [seatId]: { clientId, name } } : {},
                });

                processedActions.current = new Set();
                setRole("host");
                setMySeatId(seatId);
                setCode(chosen);
            } catch {
                setError("Couldn't reach the server. Check your connection.");
            } finally {
                setConnecting(false);
            }
        },
        [clientId]
    );

    const joinRoom = useCallback(async (rawCode) => {
        if (!firebaseReady) {
            setError("Online play isn't set up on this site yet.");
            return;
        }
        const c = String(rawCode || "").trim().toUpperCase();
        if (c.length !== 4) {
            setError("Enter the 4-character room code.");
            return;
        }
        setConnecting(true);
        setError(null);
        try {
            const snap = await get(ref(db, `rooms/${c}/meta`));
            if (!snap.exists()) {
                setError("No room with that code.");
                return;
            }
            if (snap.val().status !== "lobby") {
                setError("That game has already started.");
                return;
            }
            processedActions.current = new Set();
            setRole("guest");
            setMySeatId(null);
            setCode(c);
        } catch {
            setError("Couldn't reach the server. Check your connection.");
        } finally {
            setConnecting(false);
        }
    }, []);

    const claimSeat = useCallback(
        async (seatId, name) => {
            if (!code) return;
            setError(null);
            const cleanName = (name || "").trim() || "Player";
            const seatRef = ref(db, `rooms/${code}/seats/${seatId}`);
            try {
                const res = await runTransaction(seatRef, (cur) => {
                    if (cur && cur.clientId !== clientId) return undefined; // taken
                    return { clientId, name: cleanName };
                });
                if (!res.committed) {
                    setError("Someone just took that seat.");
                    return;
                }
                // Drop any earlier seat I was sitting in.
                const allSnap = await get(ref(db, `rooms/${code}/seats`));
                const all = allSnap.val() || {};
                const updates = {};
                for (const [sid, occupant] of Object.entries(all)) {
                    if (sid !== seatId && occupant && occupant.clientId === clientId) {
                        updates[`rooms/${code}/seats/${sid}`] = null;
                    }
                }
                if (Object.keys(updates).length) await update(ref(db), updates);
                setMySeatId(seatId);
            } catch {
                setError("Couldn't claim that seat. Try again.");
            }
        },
        [code, clientId]
    );

    // Host: mirror the authoritative state out, plus a redacted view per seat.
    const pushState = useCallback(
        (gameState, humanSeatIds = []) => {
            if (!code || !db) return;
            const updates = { [`rooms/${code}/state`]: gameState };
            for (const sid of humanSeatIds) {
                updates[`rooms/${code}/views/${sid}`] = redactFor(gameState, sid);
            }
            update(ref(db), updates);
        },
        [code]
    );

    const setStatusPlaying = useCallback(() => {
        if (!code || !db) return;
        update(ref(db, `rooms/${code}/meta`), { status: "playing" });
    }, [code]);

    const resetToLobby = useCallback(() => {
        if (!code || !db) return;
        processedActions.current = new Set();
        update(ref(db), {
            [`rooms/${code}/meta/status`]: "lobby",
            [`rooms/${code}/state`]: null,
            [`rooms/${code}/views`]: null,
            [`rooms/${code}/actions`]: null,
        });
    }, [code]);

    // Guest: queue a move for the host to apply.
    const sendAction = useCallback(
        (action) => {
            if (!code || !db) return;
            push(ref(db, `rooms/${code}/actions`), {
                ...action,
                by: clientId,
                at: Date.now(),
            });
        },
        [code, clientId]
    );

    // Host: drain queued guest moves in order, once each.
    const onRemoteActions = useCallback(
        (handler) => {
            if (!code || !db) return () => {};
            const seen = processedActions.current;
            const unsub = onValue(ref(db, `rooms/${code}/actions`), (snap) => {
                const val = snap.val();
                if (!val) return;
                for (const key of Object.keys(val).sort()) {
                    if (seen.has(key)) continue;
                    seen.add(key);
                    handler(val[key]);
                    remove(ref(db, `rooms/${code}/actions/${key}`));
                }
            });
            return unsub;
        },
        [code]
    );

    const leaveRoom = useCallback(() => {
        if (code && role === "host" && db) {
            remove(ref(db, `rooms/${code}`));
        }
        processedActions.current = new Set();
        setRole(null);
        setCode(null);
        setMySeatId(null);
        setMeta(null);
        setSeats({});
        setRemoteState(null);
        setError(null);
        setRoomMissing(false);
    }, [code, role]);

    const clearError = useCallback(() => setError(null), []);

    return {
        firebaseReady,
        clientId,
        role,
        code,
        mySeatId,
        meta,
        seats,
        remoteState,
        error,
        connecting,
        roomMissing,
        createRoom,
        joinRoom,
        claimSeat,
        pushState,
        setStatusPlaying,
        resetToLobby,
        sendAction,
        onRemoteActions,
        leaveRoom,
        clearError,
    };
}
