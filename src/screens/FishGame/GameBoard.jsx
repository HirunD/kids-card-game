import React, { useState, useRef, useEffect } from "react";
import { SUIT_INFO, SUITS, getAskableSets, rankSortValue, handCount } from "./gameLogic";
import AskModal from "./AskModal";
import DeclareModal from "./DeclareModal";
import HistoryModal from "./HistoryModal";
import AIActionDialog from "./AIActionDialog";

function seatPosition(i, total) {
    const step = 200 / (total + 1);
    const angleDeg = 170 + step * (i + 1);
    const rad = (angleDeg * Math.PI) / 180;
    const rx = 46;
    const ry = 42;
    const left = 50 + rx * Math.cos(rad);
    const top = 50 + ry * Math.sin(rad);
    return { left: `${left}%`, top: `${top}%` };
}

const PANEL_TITLES = {
    ask: "🗣️ Ask for a card",
    declare: "📣 Call a set",
    history: "📜 History",
};

const GameBoard = ({ state, dispatch, aiDialog, viewerId }) => {
    // The history panel is always on screen when it's enabled; `panelMode`
    // only tracks the extra ask / call panel stacked above it.
    const [panelMode, setPanelMode] = useState(null);

    // On phones/tablets the ask & call panel sits in the page flow below
    // the table (so history stays reachable), so bring it into view when
    // it opens. On desktop it's a fixed rail already on screen — leave the
    // scroll position alone there.
    const actionRef = useRef(null);
    useEffect(() => {
        if (
            panelMode &&
            actionRef.current &&
            window.matchMedia("(max-width: 900px)").matches
        ) {
            actionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [panelMode]);

    const currentPlayer = state.players.find((p) => p.id === state.turn);

    // `viewer` is the seat this screen belongs to. Offline (pass-and-play)
    // there's no viewerId, so it's whoever's turn it is. Online it's my
    // fixed seat, and it stays put while other people take their turns.
    const viewer = state.players.find((p) => p.id === viewerId) || currentPlayer;

    if (!currentPlayer || !viewer) return null;

    const isAITurn = currentPlayer.isAI;
    const showMyHand = !viewer.isAI;
    const myTurn = viewer.id === currentPlayer.id && !isAITurn;

    const hand = state.hands[viewer.id] || [];
    const someOpponentHasCards = state.players.some(
        (p) => p.teamId !== viewer.teamId && handCount(state, p.id) > 0
    );
    const askable =
        myTurn && getAskableSets(hand).length > 0 && someOpponentHasCards;
    const openSetsCount = Object.values(state.sets).filter((s) => s.status === "open").length;
    const teamClass = currentPlayer.teamId === 0 ? "is-red" : "is-blue";

    const others = state.players
        .filter((p) => p.id !== viewer.id)
        .sort((a, b) => {
            const n = state.players.length;
            const relA = (a.seat - viewer.seat + n) % n;
            const relB = (b.seat - viewer.seat + n) % n;
            return relA - relB;
        });

    const sortedHand = !showMyHand
        ? []
        : [...hand].sort((a, b) => {
              const bySuit = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
              return bySuit !== 0 ? bySuit : rankSortValue(a.rank) - rankSortValue(b.rank);
          });

    const closePanel = () => setPanelMode(null);

    const handleAskSubmit = (payload) => {
        dispatch({ type: "ASK", ...payload });
        closePanel();
    };

    const handleDeclareSubmit = (payload) => {
        dispatch({ type: "DECLARE", ...payload });
        closePanel();
    };

    return (
        <section className="hero is-fullheight fish-scene fish-game-scene">
            <div className="fish-topbar">
                <span className="fish-score-pill is-red">🔴 {state.teamNames[0]} {state.scores[0]}</span>
                <span className="fish-score-pill is-blue">🔵 {state.teamNames[1]} {state.scores[1]}</span>
            </div>

            <div className="fish-table-area">
                <div className="fish-table-oval">
                    <span className="fish-table-watermark">🐟</span>
                    {others.map((p, i) => (
                        <div
                            key={p.id}
                            className={`fish-seat-avatar ${p.teamId === 0 ? "is-red" : "is-blue"}`}
                            style={seatPosition(i, others.length)}
                        >
                            <div className="fish-seat-avatar-circle">
                                {p.icon}
                                <span className="fish-seat-avatar-count">{handCount(state, p.id)}</span>
                            </div>
                            <span className="fish-seat-avatar-name">{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fish-hand-dock">
                <div className="box fish-panel">
                    <span className={`fish-turn-chip ${teamClass}`}>
                        {currentPlayer.icon} {currentPlayer.name}'s turn
                        &nbsp;·&nbsp;{state.teamNames[currentPlayer.teamId]}
                    </span>

                    {!showMyHand ? (
                        <div className="fish-thinking">
                            <span className="fish-thinking-spinner" aria-hidden="true">{currentPlayer.icon}</span>
                            <p>{currentPlayer.name} is thinking...</p>
                        </div>
                    ) : (
                        <>
                            <div className="fish-hand-fan">
                                {sortedHand.map((c, i) => {
                                    const mid = (sortedHand.length - 1) / 2;
                                    const offset = i - mid;
                                    const rotate = offset * 6;
                                    const lift = Math.abs(offset) * 3;
                                    return (
                                        <span
                                            key={c.id}
                                            className={`fish-card fish-suit-${SUIT_INFO[c.suit].color}`}
                                            style={{
                                                transform: `rotate(${rotate}deg) translateY(${lift}px)`,
                                                zIndex: i,
                                            }}
                                        >
                                            <span>{c.rank}</span>
                                            <span className="fish-card-suit">
                                                {SUIT_INFO[c.suit].symbol}
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>

                            {myTurn ? (
                                <>
                                    <div className="fish-actions">
                                        <button
                                            className="button is-primary fish-pill-button"
                                            disabled={!askable}
                                            onClick={() => setPanelMode("ask")}
                                        >
                                            🗣️ Ask for a card
                                        </button>
                                        <button
                                            className="button is-danger fish-pill-button"
                                            disabled={openSetsCount === 0}
                                            onClick={() => setPanelMode("declare")}
                                        >
                                            📣 Call a set!
                                        </button>
                                    </div>
                                    {!askable && (
                                        <p className="help fish-help">
                                            {someOpponentHasCards
                                                ? "No askable sets — every set you hold a card in is already complete in your hand, or you hold none. You can still call a set."
                                                : "No opponents have cards left to ask. Call a set to keep the game moving."}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="help fish-help fish-waiting-note">
                                    {isAITurn
                                        ? `🤖 ${currentPlayer.name} is thinking…`
                                        : `⏳ Waiting for ${currentPlayer.name} to play…`}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="fish-bottom-strip">
                <div className="box fish-panel">
                    <p className="label">Sets</p>
                    <div className="fish-set-grid">
                        {Object.values(state.sets).map((s) => (
                            <span
                                key={s.id}
                                className={`fish-set-chip ${
                                    s.status === "open"
                                        ? "is-open"
                                        : s.owner === 0
                                        ? "is-red"
                                        : "is-blue"
                                }`}
                                title={`${s.level} ${SUIT_INFO[s.suit].name}`}
                            >
                                <span className={s.status === "open" ? "" : `fish-suit-${SUIT_INFO[s.suit].color}`}>
                                    {SUIT_INFO[s.suit].symbol}
                                </span>
                                <span>{s.level === "low" ? "Low" : "High"}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {(panelMode || state.showHistory) && (
                <div className="fish-side-panel">
                    {panelMode && (
                        <div
                            key={panelMode}
                            ref={actionRef}
                            className="fish-side-panel-section fish-side-panel-action"
                        >
                            <div className="fish-side-panel-head">
                                <p>{PANEL_TITLES[panelMode]}</p>
                                <button className="delete" aria-label="close" onClick={closePanel}></button>
                            </div>
                            {panelMode === "ask" && (
                                <AskModal
                                    state={state}
                                    currentPlayer={currentPlayer}
                                    onSubmit={handleAskSubmit}
                                    onClose={closePanel}
                                />
                            )}
                            {panelMode === "declare" && (
                                <DeclareModal
                                    state={state}
                                    currentPlayer={currentPlayer}
                                    onSubmit={handleDeclareSubmit}
                                    onClose={closePanel}
                                />
                            )}
                        </div>
                    )}
                    {state.showHistory && (
                        <div className="fish-side-panel-section fish-side-panel-history">
                            <div className="fish-side-panel-head">
                                <p>{PANEL_TITLES.history}</p>
                            </div>
                            <HistoryModal log={state.log} state={state} />
                        </div>
                    )}
                </div>
            )}

            <AIActionDialog aiDialog={aiDialog} state={state} />
        </section>
    );
};

export default GameBoard;
