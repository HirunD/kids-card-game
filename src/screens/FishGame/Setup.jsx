import React, { useState } from "react";
import { Link } from "react-router";
import { BOT_PERSONAS } from "./gameLogic";
import { hasOnboarded, markOnboarded } from "./onboarding";

const defaultIsAI = (n) => Array.from({ length: n }, (_, i) => i !== 0);

const defaultNames = (n, aiArr) => {
    let aiCount = 0;
    return Array.from({ length: n }, (_, i) => {
        if (aiArr[i]) {
            const name = BOT_PERSONAS[aiCount % BOT_PERSONAS.length].name;
            aiCount += 1;
            return name;
        }
        return `Player ${i + 1}`;
    });
};

const Setup = ({ onStart, initialNumPlayers, initialNames, initialIsAI, initialShowHistory }) => {
    const [numPlayers, setNumPlayers] = useState(initialNumPlayers || 4);
    const [isAI, setIsAI] = useState(
        initialIsAI && initialIsAI.length === (initialNumPlayers || 4)
            ? initialIsAI
            : defaultIsAI(4)
    );
    const [names, setNames] = useState(
        initialNames && initialNames.length === (initialNumPlayers || 4)
            ? initialNames
            : defaultNames(4, isAI)
    );
    const [showHistory, setShowHistory] = useState(
        initialShowHistory !== undefined ? initialShowHistory : true
    );
    // First time on this device? Offer the tutorial / rules up front.
    const [showOnboard, setShowOnboard] = useState(() => !hasOnboarded());

    const dismissOnboard = () => {
        markOnboarded();
        setShowOnboard(false);
    };

    const handleNumPlayers = (n) => {
        const newIsAI = Array.from({ length: n }, (_, i) =>
            isAI[i] !== undefined ? isAI[i] : i !== 0
        );
        const freshNames = defaultNames(n, newIsAI);
        const newNames = Array.from({ length: n }, (_, i) => names[i] || freshNames[i]);
        setIsAI(newIsAI);
        setNames(newNames);
        setNumPlayers(n);
    };

    const handleNameChange = (i, value) => {
        setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
    };

    const toggleAI = (i) => {
        const turningOn = !isAI[i];
        setIsAI(isAI.map((v, idx) => (idx === i ? !v : v)));

        const isDefaultName = names[i] === `Player ${i + 1}` || names[i].trim() === "";
        if (turningOn && isDefaultName) {
            const aiIndex = isAI.slice(0, i).filter(Boolean).length;
            const persona = BOT_PERSONAS[aiIndex % BOT_PERSONAS.length].name;
            setNames(names.map((n, idx) => (idx === i ? persona : n)));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        markOnboarded();
        onStart({ names, numPlayers, isAI, showHistory });
    };

    const humanCount = isAI.filter((v) => !v).length;

    const renderSeat = (i) => (
        <div className="field fish-seat-row" key={i}>
            <div className="control fish-seat-input">
                <input
                    className="input"
                    value={names[i]}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                />
            </div>
            <button
                type="button"
                className={`button fish-seat-toggle ${isAI[i] ? "is-dark" : "is-success"}`}
                onClick={() => toggleAI(i)}
            >
                {isAI[i] ? "🤖 Computer" : "🧑 You"}
            </button>
        </div>
    );

    return (
        <section className="hero is-fullheight fish-scene">
            <div className="hero-body is-flex-direction-column">
                <p className="fish-title-deco has-text-centered has-text-white">
                    ♠ ♥ ♦ ♣
                </p>

                {showOnboard && (
                    <div className="box fish-panel fish-onboard">
                        <p className="title is-5">👋 New to Fish?</p>
                        <p>Take a one-minute tutorial, or read the full rules first.</p>
                        <div className="fish-onboard-actions">
                            <Link
                                to="/how-to-play"
                                className="button is-link fish-pill-button"
                                onClick={markOnboarded}
                            >
                                ▶ Play the tutorial
                            </Link>
                            <Link
                                to="/rules"
                                className="button fish-pill-button"
                                onClick={markOnboarded}
                            >
                                📖 Read the rules
                            </Link>
                            <button
                                type="button"
                                className="button is-ghost fish-pill-button"
                                onClick={dismissOnboard}
                            >
                                Skip — I know how
                            </button>
                        </div>
                    </div>
                )}

                <div className="box fish-panel fish-setup-box">
                    <p className="title is-3 has-text-centered">🎴 Fish</p>
                    <p className="subtitle is-6 has-text-centered">
                        Literature / 7-up — 32 card, team card game
                    </p>
                    <p className="has-text-centered mb-4">
                        <Link to="/rules" className="fish-text-link">
                            📖 How to play
                        </Link>
                        <span className="mx-2">·</span>
                        <Link to="/how-to-play" className="fish-text-link">
                            ▶ Tutorial
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label className="label">How many players?</label>
                            <div className="buttons has-addons is-centered">
                                <button
                                    type="button"
                                    className={`button fish-pill-button ${numPlayers === 4 ? "is-primary" : ""}`}
                                    onClick={() => handleNumPlayers(4)}
                                >
                                    4 players (2v2)
                                </button>
                                <button
                                    type="button"
                                    className={`button fish-pill-button ${numPlayers === 8 ? "is-primary" : ""}`}
                                    onClick={() => handleNumPlayers(8)}
                                >
                                    8 players (4v4)
                                </button>
                            </div>
                        </div>

                        <div className="columns is-mobile">
                            <div className="column">
                                <label className="label has-text-danger">Red Team (seats 1,3,5...)</label>
                                {names.map((_, i) => (i % 2 === 0 ? renderSeat(i) : null))}
                            </div>
                            <div className="column">
                                <label className="label has-text-info">Blue Team (seats 2,4,6...)</label>
                                {names.map((_, i) => (i % 2 === 1 ? renderSeat(i) : null))}
                            </div>
                        </div>

                        <p className="help mb-2">
                            Seats alternate teams so nobody sits next to a teammate — that's
                            built in automatically. Tap a seat to switch it between you and the
                            computer; pass the device around for any seat marked "You".
                        </p>
                        {humanCount === 0 && (
                            <p className="help is-warning mb-4">
                                At least one seat should be a human, or the computer will just
                                play itself.
                            </p>
                        )}

                        <div className="field fish-history-toggle-row">
                            <span>📜 Show move history during the game</span>
                            <button
                                type="button"
                                className={`button fish-seat-toggle ${showHistory ? "is-success" : "is-dark"}`}
                                onClick={() => setShowHistory((v) => !v)}
                            >
                                {showHistory ? "On" : "Off"}
                            </button>
                        </div>

                        <div className="field has-text-centered">
                            <button className="button is-primary is-medium fish-pill-button" type="submit">
                                🃏 Deal the cards
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Setup;
