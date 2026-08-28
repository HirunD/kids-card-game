import React, { useEffect } from "react";
import { Link } from "react-router";
import { markOnboarded } from "./onboarding";
import "./style.css";

const RulesPage = () => {
    // Reading the rules counts as knowing how to play.
    useEffect(() => {
        markOnboarded();
    }, []);

    return (
        <div className="fish-scene fish-doc-page">
            <p className="fish-title-deco has-text-centered has-text-white">♠ ♥ ♦ ♣</p>

            <div className="box fish-panel fish-doc">
                <p className="title is-3 has-text-centered">📖 How to play Fish</p>
                <p className="subtitle is-6 has-text-centered">
                    Also called Literature or 7-up — a 32-card team game
                </p>

                <h2>The goal</h2>
                <p className="fish-doc-lead">
                    Two teams race to <strong>collect sets of cards</strong>. Each set is
                    worth points. When all eight sets have been won, the team with the
                    most points wins.
                </p>

                <h2>What you need</h2>
                <ul>
                    <li>
                        A <strong>32-card deck</strong>: the 7, 8, 9, 10, Jack, Queen,
                        King and Ace of every suit. (No 2–6.)
                    </li>
                    <li>
                        <strong>4 players</strong> (2 v 2) or <strong>8 players</strong>{" "}
                        (4 v 4). Seats alternate teams, so a teammate is never sitting
                        right next to you.
                    </li>
                    <li>
                        The deck is shared out evenly — 8 cards each with 4 players, 4
                        cards each with 8 players.
                    </li>
                </ul>
                <p>
                    You can only see <strong>your own hand</strong>. Everyone else's cards
                    are hidden, so you have to listen carefully to what people ask for.
                </p>

                <h2>The eight sets</h2>
                <p>Every suit is split into two sets:</p>
                <ul>
                    <li>
                        <strong>Low set</strong> — 7, 8, 9, 10 of that suit. Worth{" "}
                        <strong>1 point</strong>.
                    </li>
                    <li>
                        <strong>High set</strong> — Jack, Queen, King, Ace of that suit.
                        Worth <strong>2 points</strong>.
                    </li>
                </ul>
                <p>
                    Four suits × two sets = <strong>8 sets</strong>, and 12 points on the
                    table in total.
                </p>

                <h2>On your turn you do one of two things</h2>
                <p>
                    <strong>1. Ask an opponent for a card</strong>, or{" "}
                    <strong>2. Call a set</strong> that you think your team already holds.
                </p>

                <h2>Asking for a card</h2>
                <ul>
                    <li>
                        You may only ask for a card from a set{" "}
                        <strong>you already hold at least one card in</strong> — and you
                        can't already hold the whole set.
                    </li>
                    <li>
                        You must name the <strong>exact card</strong> (for example "the
                        Queen of Hearts"), and it has to be a card you don't have yet.
                    </li>
                    <li>
                        You can only ask <strong>an opponent</strong>, never a teammate,
                        and only someone who still has cards.
                    </li>
                    <li>
                        <strong>If they have it</strong>, they hand it over and you go
                        again — keep asking as long as you keep guessing right.
                    </li>
                    <li>
                        <strong>If they don't</strong>, your turn ends and it passes to
                        that player.
                    </li>
                </ul>
                <p>
                    Everybody hears every question and answer, so each ask is a clue about
                    who holds what.
                </p>

                <h2>Calling a set</h2>
                <ul>
                    <li>
                        Call a set when you're sure that{" "}
                        <strong>your team holds all four cards</strong> of it, split
                        between you in any way.
                    </li>
                    <li>
                        You don't need to say who has which card — just that your team has
                        the set.
                    </li>
                    <li>
                        <strong>Right:</strong> your team wins the set and its points.
                    </li>
                    <li>
                        <strong>Wrong</strong> (even one card is in another hand):{" "}
                        <strong>the other team</strong> gets that set and its points
                        instead.
                    </li>
                    <li>
                        Either way the four cards leave the game and that set is closed.
                    </li>
                </ul>
                <p>
                    Calling is how points are actually scored — but a careless call is a
                    gift to the other team.
                </p>

                <h2>Running out of cards</h2>
                <p>
                    If you use up your last card, you're <strong>out for the rest of the
                    round</strong> — you can't ask or call, you just watch. If the turn
                    would have come to you, it goes to a random player who still has
                    cards.
                </p>

                <h2>Winning</h2>
                <p>
                    The round ends when <strong>all eight sets have been called</strong>.
                    Add up each team's points. Most points wins; equal points is a draw.
                </p>

                <h2>Quick tips</h2>
                <ul>
                    <li>Remember failed asks — that card is somewhere else now.</li>
                    <li>
                        A successful ask tells the whole table exactly where a card went.
                    </li>
                    <li>
                        Ask for cards your team is close to completing, so you can call
                        the set soon.
                    </li>
                    <li>
                        Only call when you're certain. "Pretty sure" often means the other
                        team scores.
                    </li>
                </ul>

                <div className="fish-doc-foot">
                    <Link to="/how-to-play" className="button is-link fish-pill-button">
                        ▶ Try the tutorial
                    </Link>
                    <Link to="/" className="button is-primary fish-pill-button">
                        🃏 Back to the game
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RulesPage;
