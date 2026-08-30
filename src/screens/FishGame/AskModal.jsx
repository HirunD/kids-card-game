import React, { useState } from "react";
import {
    SUIT_INFO,
    SUITS,
    getSetId,
    getAskableSets,
    getMissingRanks,
    rankSortValue,
    cardId,
    handCount,
} from "./gameLogic";

const AskModal = ({ state, currentPlayer, onSubmit, onClose }) => {
    const hand = state.hands[currentPlayer.id];
    const askableSetIds = getAskableSets(hand);
    const [setId, setSetId] = useState(null);
    const [rank, setRank] = useState(null);
    const [targetId, setTargetId] = useState(null);

    const askableHand = [...hand]
        .filter((c) => askableSetIds.includes(getSetId(c.suit, c.rank)))
        .sort((a, b) => {
            const bySuit = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
            return bySuit !== 0 ? bySuit : rankSortValue(a.rank) - rankSortValue(b.rank);
        });

    const set = setId ? state.sets[setId] : null;
    const missingRanks = set ? getMissingRanks(hand, set) : [];

    const opponents = state.players.filter(
        (p) => p.teamId !== currentPlayer.teamId && handCount(state, p.id) > 0
    );

    const selectSet = (id) => {
        setSetId(id);
        setRank(null);
        setTargetId(null);
    };

    const canSubmit = setId && rank && targetId;

    const handleSubmit = () => {
        onSubmit({
            askerId: currentPlayer.id,
            targetId,
            card: { id: cardId(set.suit, rank), suit: set.suit, rank },
        });
    };

    return (
        <>
            <div className="fish-side-panel-body">
                {askableHand.length === 0 ? (
                    <p>You don't hold a card in any incomplete set right now.</p>
                ) : (
                    <>
                        <p className="label">1. Tap a card from your hand</p>
                        <div className="fish-card-grid mb-4">
                            {askableHand.map((c) => {
                                const cSetId = getSetId(c.suit, c.rank);
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`fish-card fish-card-button fish-suit-${SUIT_INFO[c.suit].color} ${
                                            setId === cSetId ? "is-selected" : ""
                                        }`}
                                        onClick={() => selectSet(cSetId)}
                                    >
                                        <span>{c.rank}</span>
                                        <span className="fish-card-suit">{SUIT_INFO[c.suit].symbol}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {set && (
                            <>
                                <p className="label">2. Which card are you missing?</p>
                                <div className="fish-card-grid mb-4">
                                    {missingRanks.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            className={`fish-card fish-card-button fish-suit-${SUIT_INFO[set.suit].color} ${
                                                rank === r ? "is-selected" : ""
                                            }`}
                                            onClick={() => setRank(r)}
                                        >
                                            <span>{r}</span>
                                            <span className="fish-card-suit">{SUIT_INFO[set.suit].symbol}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {rank && (
                            <>
                                <p className="label">3. Ask who?</p>
                                <div className="fish-avatar-picker">
                                    {opponents.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`fish-avatar-option ${p.teamId === 0 ? "is-red" : "is-blue"} ${
                                                targetId === p.id ? "is-selected" : ""
                                            }`}
                                            onClick={() => setTargetId(p.id)}
                                        >
                                            <span className="fish-avatar-option-circle">
                                                {p.icon}
                                                <span className="fish-seat-avatar-count">
                                                    {handCount(state, p.id)}
                                                </span>
                                            </span>
                                            <span>{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            <div className="fish-side-panel-foot">
                <button
                    className="button is-primary fish-pill-button"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    Ask{rank ? ` for the ${rank}${SUIT_INFO[set.suit].symbol}` : ""}
                </button>
                <button className="button" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </>
    );
};

export default AskModal;
