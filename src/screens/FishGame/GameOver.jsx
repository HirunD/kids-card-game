import React from "react";
import { SUIT_INFO } from "./gameLogic";

const CONFETTI = ["🎉", "🎊", "♠", "♥", "♦", "♣"];

const GameOver = ({ state, onPlayAgain }) => {
    const { scores, teamNames, winner, sets } = state;

    return (
        <section className="hero is-fullheight fish-scene">
            {winner !== null && (
                <div className="fish-confetti" aria-hidden="true">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <span
                            key={i}
                            style={{
                                left: `${(i * 37) % 100}%`,
                                animationDuration: `${3 + (i % 5)}s`,
                                animationDelay: `${(i % 7) * 0.4}s`,
                            }}
                        >
                            {CONFETTI[i % CONFETTI.length]}
                        </span>
                    ))}
                </div>
            )}
            <div className="hero-body is-flex-direction-column is-justify-content-center has-text-centered">
                <p className="fish-gameover-trophy">{winner === null ? "🤝" : "🏆"}</p>
                <div className="box fish-panel" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
                    <p className="title is-2">
                        {winner === null ? "It's a draw!" : `${teamNames[winner]} wins!`}
                    </p>
                    <div className="fish-score-row fish-final-score">
                        <div className="fish-score-chip is-red">
                            <p className="fish-score-name">{teamNames[0]}</p>
                            <p className="fish-score-value">{scores[0]}</p>
                        </div>
                        <div className="fish-score-chip is-blue">
                            <p className="fish-score-name">{teamNames[1]}</p>
                            <p className="fish-score-value">{scores[1]}</p>
                        </div>
                    </div>

                    <div className="fish-final-sets">
                        <p className="label">Set by set</p>
                        <div className="fish-set-grid is-justify-content-center">
                            {Object.values(sets).map((s) => (
                                <span
                                    key={s.id}
                                    className={`fish-set-chip ${s.owner === 0 ? "is-red" : "is-blue"}`}
                                >
                                    <span className={`fish-suit-${SUIT_INFO[s.suit].color}`}>
                                        {SUIT_INFO[s.suit].symbol}
                                    </span>
                                    <span>{s.level === "low" ? "Low" : "High"}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        className="button is-primary is-medium fish-pill-button mt-5"
                        onClick={onPlayAgain}
                    >
                        🔁 Play again
                    </button>
                </div>
            </div>
        </section>
    );
};

export default GameOver;
