import React, { useState } from "react";
import { SUIT_INFO } from "./gameLogic";

const DeclareModal = ({ state, currentPlayer, onSubmit, onClose }) => {
    const openSets = Object.values(state.sets).filter((s) => s.status === "open");
    const [setId, setSetId] = useState(null);
    const set = setId ? state.sets[setId] : null;
    const teamName = state.teamNames[currentPlayer.teamId];

    const handleSubmit = () => {
        onSubmit({ declarerId: currentPlayer.id, setId });
    };

    return (
        <>
            <div className="fish-side-panel-body">
                <p className="fish-modal-hint">
                    Which set do you and your team hold, all four cards, between you?
                </p>
                <div className="fish-choice-grid">
                    {openSets.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            className={`button fish-pill-button ${setId === s.id ? "is-link" : ""}`}
                            onClick={() => setSetId(s.id)}
                        >
                            <span className={`fish-suit-${SUIT_INFO[s.suit].color}`}>
                                {SUIT_INFO[s.suit].symbol}
                            </span>
                            &nbsp;{s.level === "low" ? "Low" : "High"} ({s.points}pt)
                        </button>
                    ))}
                </div>

                {set && (
                    <div className="fish-call-confirm">
                        <p>
                            Call <strong>{set.level === "low" ? "Low" : "High"}{" "}
                            <span className={`fish-suit-${SUIT_INFO[set.suit].color}`}>
                                {SUIT_INFO[set.suit].name}
                            </span></strong>{" "}
                            for <strong>{teamName}</strong>?
                        </p>
                        <p className="fish-modal-warning">
                            If any one of the four cards is actually somewhere else on the
                            table, the other team gets the set instead — so only call it
                            when you're sure between all of you.
                        </p>
                    </div>
                )}
            </div>
            <div className="fish-side-panel-foot">
                <button
                    className="button is-danger fish-pill-button"
                    disabled={!set}
                    onClick={handleSubmit}
                >
                    Call it!
                </button>
                <button className="button" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </>
    );
};

export default DeclareModal;
