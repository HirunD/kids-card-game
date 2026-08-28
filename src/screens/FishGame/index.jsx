import React, { useReducer, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { gameReducer, createInitialState, findOwner, playerTeam } from "./gameLogic";
import { decideAIMove } from "./aiPlayer";
import Setup from "./Setup";
import PassDevice from "./PassDevice";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";
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

const FishGame = () => {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const { enqueueSnackbar } = useSnackbar();
    const lastLogLength = useRef(0);
    const [lastSetup, setLastSetup] = useState(null);
    const [aiDialog, setAiDialog] = useState(null);
    const lastHumanRef = useRef(null);
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (state.log.length > lastLogLength.current) {
            const entry = state.log[state.log.length - 1];
            if (entry.type !== "info" || lastLogLength.current > 0) {
                enqueueSnackbar(entry.text, {
                    variant: VARIANT_BY_TYPE[entry.type] || "default",
                });
            }
        }
        lastLogLength.current = state.log.length;
    }, [state.log, enqueueSnackbar]);

    // A "pass the device" hand-off is only meaningful when the device is
    // actually changing hands between two different humans. A computer
    // seat has nothing to hide, and if the very same human already had the
    // device (it just sat through some AI turns), there's nobody to pass
    // to — skip straight to their turn in both cases.
    useEffect(() => {
        if (state.phase !== "pass") return;
        const player = state.players.find((p) => p.id === state.pendingRevealFor);
        if (!player) return;
        const sameHolder = !player.isAI && lastHumanRef.current === player.id;
        if (player.isAI || sameHolder) {
            dispatch({ type: "REVEAL" });
        }
    }, [state.phase, state.pendingRevealFor, state.players]);

    // When it's a computer seat's turn: think briefly, show a visual dialog
    // of the question/call it's making, then reveal the outcome in that
    // same dialog before acting on the game state. Re-fires whenever the
    // log grows (the AI got a card and goes again) or the turn moves to
    // another AI seat.
    useEffect(() => {
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

        // These timers only ever cover work this exact effect instance
        // scheduled (thinking + reveal); clearing already-fired ones is a
        // harmless no-op, so this can't clip a result that's already on
        // screen — that's handled by the separate auto-close effect below.
        return () => timers.forEach(clearTimeout);
    }, [state.phase, state.turn, state.log.length, state.players]);

    // Auto-close the result side of the AI dialog after a beat. Kept as
    // its own effect (keyed only on aiDialog, not on game state) so a
    // dispatch from the effect above can't race this timer away.
    useEffect(() => {
        if (!aiDialog || aiDialog.phase !== "result") return;
        const hold = aiDialog.kind === "declare" ? DECLARE_RESULT_HOLD : ASK_RESULT_HOLD;
        const id = setTimeout(() => setAiDialog(null), hold);
        return () => clearTimeout(id);
    }, [aiDialog]);

    const handleStart = ({ names, numPlayers, isAI, showHistory }) => {
        setLastSetup({ names, numPlayers, isAI, showHistory });
        // Whoever set up the game is already holding the device — assume
        // that's the first human seat, so their first turn never shows a
        // redundant pass screen.
        const firstHumanIdx = isAI.findIndex((v) => !v);
        lastHumanRef.current = firstHumanIdx >= 0 ? `p${firstHumanIdx}` : null;
        dispatch({ type: "START_GAME", names, numPlayers, isAI, showHistory });
    };

    const handleRestart = () => {
        dispatch({ type: "RESTART" });
    };

    if (state.phase === "setup") {
        return (
            <Setup
                onStart={handleStart}
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

    // Don't let a stale AI dialog sit on top of a human's turn — only show
    // it while the player currently acting is actually the computer.
    const activePlayer = state.players.find((p) => p.id === state.turn);
    const effectiveAiDialog = activePlayer?.isAI ? aiDialog : null;

    return <GameBoard state={state} dispatch={dispatch} aiDialog={effectiveAiDialog} />;
};

export default FishGame;
