import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { SUIT_INFO } from "./gameLogic";
import { markOnboarded } from "./onboarding";
import "./style.css";

const Card = ({ suit, rank, mini }) => (
    <span className={`fish-card ${mini ? "is-mini" : ""} fish-suit-${SUIT_INFO[suit].color}`}>
        <span>{rank}</span>
        <span className="fish-card-suit">{SUIT_INFO[suit].symbol}</span>
    </span>
);

const CardButton = ({ suit, rank, selected, onClick }) => (
    <button
        type="button"
        className={`fish-card fish-card-button fish-suit-${SUIT_INFO[suit].color} ${
            selected ? "is-selected" : ""
        }`}
        onClick={onClick}
    >
        <span>{rank}</span>
        <span className="fish-card-suit">{SUIT_INFO[suit].symbol}</span>
    </button>
);

const Avatar = ({ icon, name, team, selected, onClick }) => (
    <button
        type="button"
        className={`fish-avatar-option ${team === 0 ? "is-red" : "is-blue"} ${
            selected ? "is-selected" : ""
        }`}
        onClick={onClick}
    >
        <span className="fish-avatar-option-circle">{icon}</span>
        <span>{name}</span>
    </button>
);

const SetChip = ({ suit, label, points, tone = "open", selected, onClick }) => {
    const Tag = onClick ? "button" : "span";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            className={`fish-set-chip ${
                tone === "red" ? "is-red" : tone === "blue" ? "is-blue" : "is-open"
            } ${selected ? "fish-set-chip-selected" : ""}`}
            onClick={onClick}
            style={onClick ? { cursor: "pointer" } : undefined}
        >
            <span className={tone === "open" ? `fish-suit-${SUIT_INFO[suit].color}` : ""}>
                {SUIT_INFO[suit].symbol}
            </span>
            <span>{label}</span>
            {points ? <span style={{ fontSize: "0.6rem", opacity: 0.75 }}>{points}pt</span> : null}
        </Tag>
    );
};

// ---- interactive: asking for a card ----------------------------------

const AskDemo = ({ onSolved }) => {
    const [pickedSet, setPickedSet] = useState(false);
    const [rank, setRank] = useState(null);
    const [target, setTarget] = useState(null);

    const done = pickedSet && rank && target;

    useEffect(() => {
        if (done) onSolved();
    }, [done, onSolved]);

    return (
        <div className="fish-tut-demo">
            <p className="label">Your hand</p>
            <div className="fish-tut-demo-row">
                {["7", "9"].map((r) => (
                    <CardButton
                        key={r}
                        suit="H"
                        rank={r}
                        selected={pickedSet}
                        onClick={() => {
                            setPickedSet(true);
                            setRank(null);
                            setTarget(null);
                        }}
                    />
                ))}
            </div>
            <p className="fish-tut-note">
                1. Tap a card from a set you want to finish. You hold two Low Hearts, so
                you can ask for the others.
            </p>

            {pickedSet && (
                <>
                    <p className="label">Which card are you missing?</p>
                    <div className="fish-tut-demo-row">
                        {["8", "10"].map((r) => (
                            <CardButton
                                key={r}
                                suit="H"
                                rank={r}
                                selected={rank === r}
                                onClick={() => {
                                    setRank(r);
                                    setTarget(null);
                                }}
                            />
                        ))}
                    </div>
                    <p className="fish-tut-note">
                        2. Name the exact card — one you don't already hold.
                    </p>
                </>
            )}

            {rank && (
                <>
                    <p className="label">Ask which opponent?</p>
                    <div className="fish-tut-demo-row">
                        <Avatar
                            icon="🐱"
                            name="Whiskers"
                            team={1}
                            selected={target === "w"}
                            onClick={() => setTarget("w")}
                        />
                        <Avatar
                            icon="🐶"
                            name="Rex"
                            team={1}
                            selected={target === "r"}
                            onClick={() => setTarget("r")}
                        />
                    </div>
                    <p className="fish-tut-note">
                        3. You can only ask an opponent — never a teammate.
                    </p>
                </>
            )}

            {done && (
                <p className="fish-tut-feedback is-good">
                    ✅ "{target === "w" ? "Whiskers" : "Rex"}, do you have the {rank}
                    {SUIT_INFO.H.symbol}?" — Yes! You take the card and{" "}
                    <strong>go again</strong>. Guess wrong instead and your turn passes to
                    that player.
                </p>
            )}
        </div>
    );
};

// ---- interactive: calling a set ------------------------------------

const CallDemo = ({ onSolved }) => {
    const [feedback, setFeedback] = useState(null);

    return (
        <div className="fish-tut-demo">
            <p className="fish-tut-note">
                Your team has all four <strong>Low Spades</strong> between you. Tap the set
                that's safe to call.
            </p>
            <div className="fish-tut-demo-row">
                <SetChip
                    suit="S"
                    label="Low"
                    points={1}
                    selected={feedback === "good"}
                    onClick={() => {
                        setFeedback("good");
                        onSolved();
                    }}
                />
                <SetChip
                    suit="H"
                    label="High"
                    points={2}
                    onClick={() => setFeedback("bad")}
                />
                <SetChip
                    suit="C"
                    label="Low"
                    points={1}
                    onClick={() => setFeedback("bad")}
                />
            </div>
            {feedback === "good" && (
                <p className="fish-tut-feedback is-good">
                    ✅ Correct! Low Spades goes to your team. +1 point.
                </p>
            )}
            {feedback === "bad" && (
                <p className="fish-tut-feedback is-bad">
                    ❌ You're not sure your team holds every card in that set. Call it
                    wrong and the other team scores it. Try Low Spades.
                </p>
            )}
        </div>
    );
};

// ---- the steps -----------------------------------------------------

const Tutorial = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [askSolved, setAskSolved] = useState(false);
    const [callSolved, setCallSolved] = useState(false);

    const finish = () => {
        markOnboarded();
        navigate("/");
    };

    const steps = [
        {
            title: "Welcome to Fish! 🐟",
            body: (
                <>
                    <p>
                        Fish is a team game about <strong>collecting sets of cards</strong>{" "}
                        by asking other players for them.
                    </p>
                    <p>
                        This quick walk-through takes about a minute. You can leave any
                        time.
                    </p>
                </>
            ),
        },
        {
            title: "Two teams 🔴 🔵",
            body: (
                <>
                    <p>
                        Everyone is on the <strong>Red</strong> team or the{" "}
                        <strong>Blue</strong> team. Seats alternate, so you never sit next
                        to a teammate.
                    </p>
                    <div className="fish-tut-demo-row">
                        <Avatar icon="🧑" name="You" team={0} />
                        <Avatar icon="🐱" name="Whiskers" team={1} />
                        <Avatar icon="🐼" name="Panda" team={0} />
                        <Avatar icon="🐶" name="Rex" team={1} />
                    </div>
                    <p>Your team wins together. Their points are your points.</p>
                </>
            ),
        },
        {
            title: "The eight sets",
            body: (
                <>
                    <p>
                        Each suit splits into a <strong>Low</strong> set (7·8·9·10, worth 1
                        point) and a <strong>High</strong> set (J·Q·K·A, worth 2 points).
                    </p>
                    <div className="fish-tut-demo-row">
                        {["S", "H", "D", "C"].map((s) => (
                            <SetChip key={`${s}l`} suit={s} label="Low" points={1} />
                        ))}
                        {["S", "H", "D", "C"].map((s) => (
                            <SetChip key={`${s}h`} suit={s} label="High" points={2} />
                        ))}
                    </div>
                    <p>Win more set points than the other team and you win the round.</p>
                </>
            ),
        },
        {
            title: "Your hand is secret 🤫",
            body: (
                <>
                    <p>
                        You only ever see <strong>your own cards</strong>. Everyone else's
                        hand is hidden.
                    </p>
                    <div className="fish-tut-demo-row">
                        <Card suit="H" rank="7" />
                        <Card suit="H" rank="9" />
                        <Card suit="S" rank="J" />
                        <Card suit="S" rank="Q" />
                        <Card suit="D" rank="10" />
                    </div>
                    <p>
                        So you have to <strong>listen</strong> — every question and answer
                        at the table is a clue.
                    </p>
                </>
            ),
        },
        {
            title: "Asking for a card",
            body: <AskDemo onSolved={() => setAskSolved(true)} />,
            gate: askSolved,
            gateHint: "Finish all three taps to continue.",
        },
        {
            title: "Right keeps going, wrong passes on",
            body: (
                <>
                    <p>
                        <strong>Guessed right?</strong> You take the card and ask again —
                        you can string together a long turn.
                    </p>
                    <p>
                        <strong>Guessed wrong?</strong> Your turn ends and passes to the
                        player you asked.
                    </p>
                    <p>
                        You can only ask for a card from a set you already hold a card in,
                        and never for one you already have.
                    </p>
                </>
            ),
        },
        {
            title: "Calling a set 📣",
            body: <CallDemo onSolved={() => setCallSolved(true)} />,
            gate: callSolved,
            gateHint: "Pick the set that's safe to call.",
        },
        {
            title: "Calling is how you score",
            body: (
                <>
                    <p>
                        When your team holds <strong>all four</strong> cards of a set
                        between you, call it and win the points.
                    </p>
                    <p>
                        Call wrong — even one card is in another hand — and{" "}
                        <strong>the other team</strong> gets that set instead. Only call
                        when you're sure.
                    </p>
                </>
            ),
        },
        {
            title: "Out of cards? You watch 👀",
            body: (
                <>
                    <p>
                        Play your last card and you're <strong>done for the round</strong>{" "}
                        — no asking, no calling, just watching.
                    </p>
                    <p>
                        If the turn would have landed on you, it hops to a random player
                        who still has cards.
                    </p>
                </>
            ),
        },
        {
            title: "That's it — have fun! 🎉",
            body: (
                <>
                    <p>
                        The round ends when all eight sets are called. Most points wins.
                    </p>
                    <p>
                        Full written rules are on the{" "}
                        <Link to="/rules">Rules page</Link> any time you need them.
                    </p>
                </>
            ),
        },
    ];

    const current = steps[step];
    const isLast = step === steps.length - 1;
    const blocked = current.gate === false;

    return (
        <div className="fish-scene fish-doc-page">
            <p className="fish-title-deco has-text-centered has-text-white">♠ ♥ ♦ ♣</p>

            <div className="box fish-panel fish-tut">
                <div className="fish-tut-top">
                    <span className="fish-tut-count">
                        Step {step + 1} of {steps.length}
                    </span>
                    <button className="button is-small fish-pill-button" onClick={finish}>
                        Skip
                    </button>
                </div>

                <div className="fish-tut-progress" aria-hidden="true">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`fish-tut-dot ${i === step ? "is-active" : ""} ${
                                i < step ? "is-done" : ""
                            }`}
                        />
                    ))}
                </div>

                <p className="title is-4 has-text-centered">{current.title}</p>
                <div className="fish-tut-stage">{current.body}</div>

                {blocked && current.gateHint && (
                    <p className="help fish-help has-text-centered">{current.gateHint}</p>
                )}

                <div className="fish-tut-nav">
                    <button
                        className="button fish-pill-button"
                        disabled={step === 0}
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                    >
                        ‹ Back
                    </button>
                    {isLast ? (
                        <button
                            className="button is-primary fish-pill-button"
                            onClick={finish}
                        >
                            🃏 Start playing
                        </button>
                    ) : (
                        <button
                            className="button is-primary fish-pill-button"
                            disabled={blocked}
                            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                        >
                            Next ›
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tutorial;
