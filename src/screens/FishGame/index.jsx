import React, { useReducer, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import {
    gameReducer,
    createInitialState,
    findOwner,
    playerTeam,
    BOT_PERSONAS,
} from "./gameLogic";
import { decideAIMove } from "./aiPlayer";
import Setup from "./Setup";
import OnlineSetup from "./OnlineSetup";
import PassDevice from "./PassDevice";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";
import { useOnlineRoom } from "./net/useOnlineRoom";
import "./style.css";

const VARIANT_BY_TYPE = {
    success: "success",
    fail: "warning",
    info: "info",
};

const THINK_DELAY = 900;
const ASK_REVEAL_DELAY = 1400;
const ASK_RESULT_HOLD = 1300;
const DECLARE_REVEAL_DELAY = 1700;
const DECLARE_RESULT_HOLD = 1600;

const Dealing = () => (
    <section className="hero is-fullheight fish-scene">
        <div className="hero-body is-flex-direction-column is-justify-content-center has-text-centered">
            <p className="fish-thinking-spinner" aria-hidden="true">🎴</p>
            <p className="has-text-white">Dealing…</p>
        </div>
    </section>
);

const FishGame = () => {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const { enqueueSnackbar } = useSnackbar();
    const lastLogLength = useRef(0);
    const [lastSetup, setLastSetup] = useState(null);
    const [aiDialog, setAiDialog] = useState(null);
    const lastHumanRef = useRef(null);
    const stateRef = useRef(state);

    const online = useOnlineRoom();
    // Pulled out so the host effects below can depend on stable identities
    // rather than the whole (re-created every render) `online` object.
    const { pushState: pushOnlineState, onRemoteActions, seats: onlineSeats } = online;
    const [onlineMode, setOnlineMode] = useState(false);
    const isOnline = onlineMode || Boolean(online.code);
    const isHost = isOnline && online.role === "host";
    const isGuest = isOnline && online.role === "guest";

    // What we actually render: host & offline read the local reducer; a
    // guest reads whatever the host has published for their seat.
    const gameState = isGuest ? online.remoteState : state;

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ---- toast the newest move-log entry (local or synced) ----
    useEffect(() => {
        const log = gameState?.log;
        if (!log) return;
        if (log.length > lastLogLength.current) {
            const entry = log[log.length - 1];
            if (entry.type !== "info" || lastLogLength.current > 0) {
                enqueueSnackbar(entry.text, {
                    variant: VARIANT_BY_TYPE[entry.type] || "default",
                });
            }
        }
        lastLogLength.current = log.length;
    }, [gameState?.log, enqueueSnackbar]);

    // ---- offline "pass the device" hand-off (local play only) ----
    useEffect(() => {
        if (isOnline) return;
        if (state.phase !== "pass") return;
        const player = state.players.find((p) => p.id === state.pendingRevealFor);
        if (!player) return;
        const sameHolder = !player.isAI && lastHumanRef.current === player.id;
        if (player.isAI || sameHolder) {
            dispatch({ type: "REVEAL" });
        }
    }, [isOnline, state.phase, state.pendingRevealFor, state.players]);

    // ---- online host: there's no device to pass, so reveal straight away.
    // Hidden hands are enforced by the per-seat redacted views instead. ----
    useEffect(() => {
        if (!isHost) return;
        if (state.phase === "pass") dispatch({ type: "REVEAL" });
    }, [isHost, state.phase]);

    // ---- AI seats: think, show the move, then act. Runs on the host (and
    // in local play); a guest never drives the AI. ----
    useEffect(() => {
        if (isGuest) return;
        if (state.phase !== "play") return;
        const player = state.players.find((p) => p.id === state.turn);
        if (!player || !player.isAI) return;

        const timers = [];
        const schedule = (fn, delay) => {
            timers.push(setTimeout(fn, delay));
        };

        schedule(() => {
            const move = decideAIMove(stateRef.current, player.id);
            if (!move) return;

            if (move.type === "ASK") {
                const willSucceed = stateRef.current.hands[move.targetId].some(
                    (c) => c.id === move.card.id
                );
                setAiDialog({
                    kind: "ask",
                    phase: "asking",
                    askerId: move.askerId,
                    targetId: move.targetId,
                    card: move.card,
                });
                schedule(() => {
                    dispatch(move);
                    setAiDialog((d) => (d ? { ...d, phase: "result", success: willSucceed } : d));
                }, ASK_REVEAL_DELAY);
            } else if (move.type === "DECLARE") {
                const set = stateRef.current.sets[move.setId];
                const declarerTeam = playerTeam(stateRef.current, move.declarerId);
                const success = set.ranks.every((rank) => {
                    const owner = findOwner(stateRef.current.hands, set.suit, rank);
                    return playerTeam(stateRef.current, owner) === declarerTeam;
                });
                setAiDialog({
                    kind: "declare",
                    phase: "asking",
                    declarerId: move.declarerId,
                    setId: move.setId,
                });
                schedule(() => {
                    dispatch(move);
                    setAiDialog((d) => (d ? { ...d, phase: "result", success } : d));
                }, DECLARE_REVEAL_DELAY);
            }
        }, THINK_DELAY);

        return () => timers.forEach(clearTimeout);
    }, [isGuest, state.phase, state.turn, state.log.length, state.players]);

    // Auto-close the result side of the AI dialog after a beat.
    useEffect(() => {
        if (!aiDialog || aiDialog.phase !== "result") return;
        const hold = aiDialog.kind === "declare" ? DECLARE_RESULT_HOLD : ASK_RESULT_HOLD;
        const id = setTimeout(() => setAiDialog(null), hold);
        return () => clearTimeout(id);
    }, [aiDialog]);

    // ---- online host: mirror authoritative state + a redacted view per seat ----
    useEffect(() => {
        if (!isHost || state.phase === "setup") return;
        pushOnlineState(state, Object.keys(onlineSeats || {}));
    }, [isHost, state, onlineSeats, pushOnlineState]);

    // ---- online host: apply moves queued by guests ----
    useEffect(() => {
        if (!isHost) return undefined;
        return onRemoteActions((action) => {
            const actorSeat = action.askerId || action.declarerId;
            if (actorSeat) {
                const seat = onlineSeats?.[actorSeat];
                // sender must own the acting seat, and it must be that seat's turn
                if (seat && action.by && seat.clientId !== action.by) return;
                if (stateRef.current.turn && actorSeat !== stateRef.current.turn) return;
            }
            dispatch(action);
        });
    }, [isHost, onRemoteActions, onlineSeats]);

    // ---- online host: recover from a mid-game refresh ----
    const hydratedRef = useRef(false);
    useEffect(() => {
        if (!isHost || hydratedRef.current) return;
        const rs = online.remoteState;
        if (state.phase === "setup" && rs && rs.phase && rs.phase !== "setup") {
            hydratedRef.current = true;
            lastLogLength.current = rs.log ? rs.log.length : 0;
            dispatch({ type: "HYDRATE", state: rs });
        }
    }, [isHost, online.remoteState, state.phase]);

    const handleStart = ({ names, numPlayers, isAI, showHistory }) => {
        setLastSetup({ names, numPlayers, isAI, showHistory });
        const firstHumanIdx = isAI.findIndex((v) => !v);
        lastHumanRef.current = firstHumanIdx >= 0 ? `p${firstHumanIdx}` : null;
        dispatch({ type: "START_GAME", names, numPlayers, isAI, showHistory });
    };

    const handleStartOnline = () => {
        const { numPlayers, isAI, showHistory } = online.meta;
        let aiCount = 0;
        const names = Array.from({ length: numPlayers }, (_, i) => {
            if (isAI[i]) {
                const persona = BOT_PERSONAS[aiCount % BOT_PERSONAS.length].name;
                aiCount += 1;
                return persona;
            }
            return online.seats?.[`p${i}`]?.name || `Player ${i + 1}`;
        });
        lastLogLength.current = 0;
        dispatch({ type: "START_GAME", names, numPlayers, isAI, showHistory });
        online.setStatusPlaying();
    };

    const handleRestart = () => {
        if (isOnline) {
            if (isHost) {
                hydratedRef.current = false;
                lastLogLength.current = 0;
                dispatch({ type: "RESTART" });
                online.resetToLobby();
            }
            return;
        }
        dispatch({ type: "RESTART" });
    };

    const exitOnline = () => {
        online.leaveRoom();
        setOnlineMode(false);
        hydratedRef.current = false;
        lastLogLength.current = 0;
        dispatch({ type: "RESTART" });
    };

    const activePlayer = (gameState?.players || []).find((p) => p.id === gameState?.turn);
    const effectiveAiDialog = !isGuest && activePlayer?.isAI ? aiDialog : null;

    // ------------------------- online -------------------------
    if (isOnline) {
        const showLobby = isHost
            ? state.phase === "setup"
            : !online.meta || online.meta.status === "lobby" || online.roomMissing;

        if (showLobby) {
            return (
                <OnlineSetup online={online} onExit={exitOnline} onDeal={handleStartOnline} />
            );
        }

        const gs = gameState;
        if (!gs || gs.phase === "setup" || gs.phase === "pass") {
            return <Dealing />;
        }
        if (gs.phase === "gameover") {
            return (
                <GameOver state={gs} onPlayAgain={isHost ? handleRestart : undefined} />
            );
        }
        return (
            <GameBoard
                state={gs}
                dispatch={isHost ? dispatch : online.sendAction}
                aiDialog={effectiveAiDialog}
                viewerId={online.mySeatId}
            />
        );
    }

    // ------------------------- local (pass-and-play) -------------------------
    if (state.phase === "setup") {
        return (
            <Setup
                onStart={handleStart}
                onGoOnline={() => setOnlineMode(true)}
                initialNumPlayers={lastSetup?.numPlayers}
                initialNames={lastSetup?.names}
                initialIsAI={lastSetup?.isAI}
                initialShowHistory={lastSetup?.showHistory}
            />
        );
    }

    if (state.phase === "pass") {
        const player = state.players.find((p) => p.id === state.pendingRevealFor);
        if (!player || player.isAI) return null;
        const lastEntry = state.log[state.log.length - 1];
        return (
            <PassDevice
                player={player}
                teamName={state.teamNames[player.teamId]}
                lastLogText={lastEntry ? lastEntry.text : null}
                onReveal={() => {
                    lastHumanRef.current = player.id;
                    dispatch({ type: "REVEAL" });
                }}
            />
        );
    }

    if (state.phase === "gameover") {
        return <GameOver state={state} onPlayAgain={handleRestart} />;
    }

    return <GameBoard state={state} dispatch={dispatch} aiDialog={effectiveAiDialog} />;
};

export default FishGame;
