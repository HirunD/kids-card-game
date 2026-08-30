import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BOT_PERSONAS } from "./gameLogic";
import { getSavedName, saveName } from "./net/clientId";

// Default an online room to two human seats (host + friend); the rest are bots.
const defaultIsAI = (n) => Array.from({ length: n }, (_, i) => i >= 2);

// AI seat display names, assigned in seat order like the offline setup.
function aiSeatName(isAI, seatIndex) {
    let aiCount = 0;
    for (let i = 0; i < seatIndex; i++) if (isAI[i]) aiCount += 1;
    return BOT_PERSONAS[aiCount % BOT_PERSONAS.length].name;
}

const CreatePanel = ({ onCreate, connecting }) => {
    const [numPlayers, setNumPlayers] = useState(4);
    const [isAI, setIsAI] = useState(defaultIsAI(4));
    const [showHistory, setShowHistory] = useState(true);
    const [name, setName] = useState(getSavedName());

    const setCount = (n) => {
        setNumPlayers(n);
        setIsAI((prev) => Array.from({ length: n }, (_, i) => (prev[i] !== undefined ? prev[i] : i >= 2)));
    };

    const toggleSeat = (i) => setIsAI((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    const humanSeats = isAI.filter((v) => !v).length;

    const submit = (e) => {
        e.preventDefault();
        saveName(name);
        onCreate({ numPlayers, isAI, showHistory, hostName: name });
    };

    return (
        <form className="box fish-panel fish-setup-box" onSubmit={submit}>
            <p className="title is-4 has-text-centered">🌐 Create a room</p>

            <div className="field">
                <label className="label">Your name</label>
                <input
                    className="input"
                    value={name}
                    maxLength={20}
                    placeholder="e.g. Sam"
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="field">
                <label className="label">How many players?</label>
                <div className="buttons has-addons is-centered">
                    <button
                        type="button"
                        className={`button fish-pill-button ${numPlayers === 4 ? "is-primary" : ""}`}
                        onClick={() => setCount(4)}
                    >
                        4 players (2v2)
                    </button>
                    <button
                        type="button"
                        className={`button fish-pill-button ${numPlayers === 8 ? "is-primary" : ""}`}
                        onClick={() => setCount(8)}
                    >
                        8 players (4v4)
                    </button>
                </div>
            </div>

            <div className="field">
                <label className="label">Seats</label>
                <p className="help mb-2">
                    Mark which seats are computer players. Every human seat — including
                    yours — is claimed from the lobby once people join with the code.
                </p>
                <div className="fish-online-seat-grid">
                    {isAI.map((ai, i) => (
                        <button
                            type="button"
                            key={i}
                            className={`button fish-seat-toggle ${ai ? "is-dark" : "is-success"}`}
                            onClick={() => toggleSeat(i)}
                        >
                            Seat {i + 1} · {ai ? `🤖 ${aiSeatName(isAI, i)}` : "🧑 Human"}
                        </button>
                    ))}
                </div>
                {humanSeats === 0 && (
                    <p className="help is-warning mt-2">Keep at least one human seat.</p>
                )}
            </div>

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
                <button
                    className="button is-primary is-medium fish-pill-button"
                    type="submit"
                    disabled={connecting || humanSeats === 0 || !name.trim()}
                >
                    {connecting ? "Creating…" : "🎫 Create room"}
                </button>
            </div>
        </form>
    );
};

const JoinPanel = ({ onJoin, connecting }) => {
    const [code, setCode] = useState("");
    return (
        <form
            className="box fish-panel fish-setup-box"
            onSubmit={(e) => {
                e.preventDefault();
                onJoin(code);
            }}
        >
            <p className="title is-4 has-text-centered">🔑 Join a room</p>
            <div className="field">
                <label className="label">Room code</label>
                <input
                    className="input fish-code-input"
                    value={code}
                    maxLength={4}
                    autoCapitalize="characters"
                    placeholder="ABCD"
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
            </div>
            <div className="field has-text-centered">
                <button
                    className="button is-link is-medium fish-pill-button"
                    type="submit"
                    disabled={connecting || code.trim().length !== 4}
                >
                    {connecting ? "Joining…" : "→ Join"}
                </button>
            </div>
        </form>
    );
};

const Lobby = ({ online, onDeal }) => {
    const { meta, seats, role, mySeatId, clientId, claimSeat } = online;
    const [name, setName] = useState(getSavedName());
    const [copied, setCopied] = useState(false);

    const seatList = useMemo(
        () => Array.from({ length: meta.numPlayers }, (_, i) => i),
        [meta.numPlayers]
    );

    const humanSeatsAll = seatList.filter((i) => !meta.isAI[i]).map((i) => `p${i}`);
    const allClaimed = humanSeatsAll.every((sid) => seats[sid]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(online.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked — the code is on screen anyway */
        }
    };

    const claim = (sid) => {
        saveName(name);
        claimSeat(sid, name);
    };

    const renderSeat = (i) => {
        const sid = `p${i}`;
        const ai = meta.isAI[i];
        const occupant = seats[sid];
        const mine = occupant && occupant.clientId === clientId;
        const teamClass = i % 2 === 0 ? "is-red" : "is-blue";
        return (
            <div className={`fish-lobby-seat ${teamClass} ${mine ? "is-mine" : ""}`} key={i}>
                <span className="fish-lobby-seat-label">Seat {i + 1}</span>
                {ai ? (
                    <span className="fish-lobby-seat-name">🤖 {aiSeatName(meta.isAI, i)}</span>
                ) : occupant ? (
                    <span className="fish-lobby-seat-name">
                        🧑 {occupant.name}
                        {mine && <span className="fish-lobby-you"> (you)</span>}
                    </span>
                ) : !mySeatId ? (
                    <button
                        type="button"
                        className="button is-small is-success fish-pill-button"
                        disabled={!name.trim()}
                        onClick={() => claim(sid)}
                    >
                        Sit here
                    </button>
                ) : (
                    <button
                        type="button"
                        className="button is-small fish-pill-button"
                        onClick={() => claim(sid)}
                    >
                        Move here
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="box fish-panel fish-setup-box">
            <p className="title is-4 has-text-centered">Lobby</p>

            <div className="fish-code-display">
                <span className="fish-code-value">{online.code}</span>
                <button type="button" className="button is-small fish-pill-button" onClick={copyCode}>
                    {copied ? "Copied!" : "Copy code"}
                </button>
            </div>
            <p className="help has-text-centered mb-4">
                Share this code with your friend — they open the same site, choose
                “Join a room”, and enter it.
            </p>

            <div className="field">
                <label className="label">Your name</label>
                <input
                    className="input"
                    value={name}
                    maxLength={20}
                    placeholder="e.g. Alex"
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="columns is-mobile">
                <div className="column">
                    <label className="label has-text-danger">Red Team</label>
                    {seatList.map((i) => (i % 2 === 0 ? renderSeat(i) : null))}
                </div>
                <div className="column">
                    <label className="label has-text-info">Blue Team</label>
                    {seatList.map((i) => (i % 2 === 1 ? renderSeat(i) : null))}
                </div>
            </div>

            {role === "host" ? (
                <div className="field has-text-centered">
                    <button
                        className="button is-primary is-medium fish-pill-button"
                        disabled={!allClaimed}
                        onClick={onDeal}
                    >
                        🃏 Deal the cards
                    </button>
                    {!allClaimed && (
                        <p className="help">Waiting for every human seat to be filled…</p>
                    )}
                </div>
            ) : (
                <p className="has-text-centered has-text-grey">
                    {mySeatId ? "Waiting for the host to deal…" : "Pick a seat to join the game."}
                </p>
            )}
        </div>
    );
};

const OnlineSetup = ({ online, onExit, onDeal }) => {
    const { role, code, meta, roomMissing, error, connecting, clearError } = online;
    const inRoom = Boolean(code && role);
    const inLobby = inRoom && meta && meta.status === "lobby";

    useEffect(() => {
        // Clear a stale error when switching panels.
        return () => clearError();
    }, [clearError]);

    return (
        <section className="hero is-fullheight fish-scene">
            <div className="hero-body is-flex-direction-column">
                <p className="fish-title-deco has-text-centered has-text-white">♠ ♥ ♦ ♣</p>

                <div className="has-text-centered mb-3">
                    <button className="button is-ghost fish-text-link" onClick={onExit}>
                        ← Back to single device
                    </button>
                </div>

                {error && (
                    <div className="box fish-panel fish-online-error">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {roomMissing && inRoom && (
                    <div className="box fish-panel fish-setup-box has-text-centered">
                        <p className="title is-5">Room closed</p>
                        <p className="mb-4">The host ended this room.</p>
                        <button className="button is-primary fish-pill-button" onClick={onExit}>
                            Back to start
                        </button>
                    </div>
                )}

                {!roomMissing && inLobby && <Lobby online={online} onDeal={onDeal} />}

                {!roomMissing && inRoom && !inLobby && (
                    <div className="box fish-panel fish-setup-box has-text-centered">
                        <p className="fish-thinking-spinner" aria-hidden="true">🎴</p>
                        <p>Connecting to the room…</p>
                    </div>
                )}

                {!inRoom && (
                    <>
                        <CreatePanel onCreate={online.createRoom} connecting={connecting} />
                        <JoinPanel onJoin={online.joinRoom} connecting={connecting} />
                        <p className="has-text-centered mt-2">
                            <Link to="/rules" className="fish-text-link">📖 How to play</Link>
                        </p>
                    </>
                )}
            </div>
        </section>
    );
};

export default OnlineSetup;
