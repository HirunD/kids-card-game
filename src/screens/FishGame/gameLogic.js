export const SUITS = ["S", "H", "D", "C"];

export const SUIT_INFO = {
    S: { symbol: "♠", name: "Spades", color: "black" },
    H: { symbol: "♥", name: "Hearts", color: "red" },
    D: { symbol: "♦", name: "Diamonds", color: "red" },
    C: { symbol: "♣", name: "Clubs", color: "black" },
};

export const BOT_PERSONAS = [
    { icon: "🤖", name: "Robo" },
    { icon: "🐱", name: "Whiskers" },
    { icon: "🐶", name: "Rex" },
    { icon: "🦊", name: "Foxy" },
    { icon: "🐼", name: "Panda" },
    { icon: "🦁", name: "Leo" },
    { icon: "🐸", name: "Kermit" },
    { icon: "🐧", name: "Pingu" },
];

export const LOW_RANKS = ["7", "8", "9", "10"];
export const HIGH_RANKS = ["J", "Q", "K", "A"];

const RANK_ORDER = [...LOW_RANKS, ...HIGH_RANKS];

export const RANK_NAME = {
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    J: "Jack",
    Q: "Queen",
    K: "King",
    A: "Ace",
};

export function cardId(suit, rank) {
    return `${rank}${suit}`;
}

export function cardLabel(card) {
    return `${card.rank}${SUIT_INFO[card.suit].symbol}`;
}

export function cardFullLabel(card) {
    return `${RANK_NAME[card.rank]} of ${SUIT_INFO[card.suit].name}`;
}

export function getSetId(suit, rank) {
    return `${suit}-${LOW_RANKS.includes(rank) ? "low" : "high"}`;
}

export function rankSortValue(rank) {
    return RANK_ORDER.indexOf(rank);
}

export function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of [...LOW_RANKS, ...HIGH_RANKS]) {
            deck.push({ id: cardId(suit, rank), suit, rank });
        }
    }
    return deck;
}

function shuffle(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function buildInitialSets() {
    const sets = {};
    for (const suit of SUITS) {
        sets[`${suit}-low`] = {
            id: `${suit}-low`,
            suit,
            level: "low",
            ranks: LOW_RANKS,
            points: 1,
            status: "open",
            owner: null,
        };
        sets[`${suit}-high`] = {
            id: `${suit}-high`,
            suit,
            level: "high",
            ranks: HIGH_RANKS,
            points: 2,
            status: "open",
            owner: null,
        };
    }
    return sets;
}

export function createInitialState() {
    return {
        phase: "setup",
        players: [],
        hands: {},
        sets: buildInitialSets(),
        turn: null,
        phaseBeforePass: "play",
        pendingRevealFor: null,
        scores: { 0: 0, 1: 0 },
        teamNames: ["Red Team", "Blue Team"],
        log: [],
        winner: null,
        showHistory: true,
    };
}

function nameOf(state, playerId) {
    const p = state.players.find((pl) => pl.id === playerId);
    return p ? p.name : "?";
}

export function playerTeam(state, playerId) {
    const p = state.players.find((pl) => pl.id === playerId);
    return p ? p.teamId : null;
}

export function getAskableSets(hand) {
    const bySet = {};
    for (const card of hand) {
        const setId = getSetId(card.suit, card.rank);
        if (!bySet[setId]) bySet[setId] = [];
        bySet[setId].push(card.rank);
    }
    return Object.entries(bySet)
        .filter(([, ranks]) => ranks.length < 4)
        .map(([setId]) => setId);
}

export function getMissingRanks(hand, set) {
    const heldRanks = hand
        .filter((c) => c.suit === set.suit)
        .map((c) => c.rank);
    return set.ranks.filter((r) => !heldRanks.includes(r));
}

// Online guests get a redacted state where other hands are blanked to []
// but a `handCounts` map is kept. Everything that only needs "how many
// cards does seat X hold" should read this instead of hand.length.
export function handCount(state, playerId) {
    if (state.handCounts && state.handCounts[playerId] !== undefined) {
        return state.handCounts[playerId];
    }
    const hand = state.hands[playerId];
    return hand ? hand.length : 0;
}

export function findOwner(hands, suit, rank) {
    const id = cardId(suit, rank);
    for (const [playerId, hand] of Object.entries(hands)) {
        if (hand.some((c) => c.id === id)) return playerId;
    }
    return null;
}

function resolveActingPlayer(players, hands, landedPlayerId) {
    const landed = players.find((p) => p.id === landedPlayerId);
    if (!landed) return null;
    if (hands[landedPlayerId].length > 0) return landedPlayerId;

    // The turn landed on a player who has run out of cards. They're done
    // for the rest of the game — they can't ask, call, or do anything, they
    // just watch. Hand the turn to a random player who still holds cards.
    const stillPlaying = players.filter(
        (p) => p.id !== landedPlayerId && hands[p.id].length > 0
    );
    if (stillPlaying.length === 0) return null;
    return stillPlaying[Math.floor(Math.random() * stillPlaying.length)].id;
}

function isGameOver(sets) {
    return Object.values(sets).every((s) => s.status !== "open");
}

function computeWinner(scores) {
    if (scores[0] > scores[1]) return 0;
    if (scores[1] > scores[0]) return 1;
    return null;
}

export function gameReducer(state, action) {
    switch (action.type) {
        case "START_GAME": {
            const { names, numPlayers, isAI, showHistory } = action;
            const deck = shuffle(createDeck());
            const perPlayer = deck.length / numPlayers;

            let aiCount = 0;
            const players = names.slice(0, numPlayers).map((name, i) => {
                const playerIsAI = Boolean(isAI && isAI[i]);
                const icon = playerIsAI
                    ? BOT_PERSONAS[aiCount % BOT_PERSONAS.length].icon
                    : "🧑";
                if (playerIsAI) aiCount += 1;
                return {
                    id: `p${i}`,
                    name: name.trim() || `Player ${i + 1}`,
                    teamId: i % 2,
                    seat: i,
                    isAI: playerIsAI,
                    icon,
                };
            });

            const hands = {};
            players.forEach((p, i) => {
                hands[p.id] = deck.slice(i * perPlayer, (i + 1) * perPlayer);
            });

            const first = players[0].id;

            return {
                ...createInitialState(),
                phase: "pass",
                players,
                hands,
                turn: first,
                pendingRevealFor: first,
                log: [{ id: "start", type: "info", text: "The cards are dealt. Game on!" }],
                showHistory: showHistory !== false,
            };
        }

        case "REVEAL": {
            return { ...state, phase: "play" };
        }

        // Re-seed the reducer from an externally stored state (used when an
        // online host refreshes mid-game and rehydrates from the server).
        case "HYDRATE": {
            return action.state;
        }

        case "ASK": {
            const { askerId, targetId, card } = action;
            const targetHand = state.hands[targetId];
            const found = targetHand.find((c) => c.id === card.id);
            const newHands = { ...state.hands };
            let logEntry;
            let turn = state.turn;
            let phase = "play";
            let pendingRevealFor = state.pendingRevealFor;

            if (found) {
                newHands[targetId] = targetHand.filter((c) => c.id !== card.id);
                newHands[askerId] = [...state.hands[askerId], found];
                logEntry = {
                    id: `${Date.now()}-a`,
                    type: "success",
                    kind: "ask",
                    askerId,
                    targetId,
                    card,
                    success: true,
                    text: `${nameOf(state, askerId)} asked ${nameOf(state, targetId)} for ${cardLabel(card)} — got it! Goes again.`,
                };
                turn = askerId;
            } else {
                logEntry = {
                    id: `${Date.now()}-a`,
                    type: "fail",
                    kind: "ask",
                    askerId,
                    targetId,
                    card,
                    success: false,
                    text: `${nameOf(state, askerId)} asked ${nameOf(state, targetId)} for ${cardLabel(card)} — no. Turn passes to ${nameOf(state, targetId)}.`,
                };
                const acting = resolveActingPlayer(state.players, newHands, targetId);
                turn = acting;
                phase = "pass";
                pendingRevealFor = acting;
            }

            return { ...state, hands: newHands, turn, phase, pendingRevealFor, log: [...state.log, logEntry] };
        }

        case "DECLARE": {
            const { declarerId, setId } = action;
            const set = state.sets[setId];
            const declarerTeam = playerTeam(state, declarerId);

            const realOwners = {};
            for (const rank of set.ranks) {
                realOwners[rank] = findOwner(state.hands, set.suit, rank);
            }
            const allWithDeclarerTeam = set.ranks.every(
                (rank) => playerTeam(state, realOwners[rank]) === declarerTeam
            );

            const result = allWithDeclarerTeam ? "correct" : "incorrect";
            const scoringTeam = allWithDeclarerTeam
                ? declarerTeam
                : declarerTeam === 0
                ? 1
                : 0;

            const newHands = { ...state.hands };
            for (const [pid, hand] of Object.entries(newHands)) {
                newHands[pid] = hand.filter(
                    (c) => !(c.suit === set.suit && set.ranks.includes(c.rank))
                );
            }

            const newSets = { ...state.sets, [setId]: { ...set, status: "claimed", owner: scoringTeam } };
            const newScores = { ...state.scores };
            newScores[scoringTeam] += set.points;

            const setLabel = `${set.level === "low" ? "Low" : "High"} ${SUIT_INFO[set.suit].name}`;
            const text =
                result === "correct"
                    ? `${nameOf(state, declarerId)} called ${setLabel} for ${state.teamNames[declarerTeam]} — got it all! +${set.points} point${set.points > 1 ? "s" : ""}.`
                    : `${nameOf(state, declarerId)} called ${setLabel} for ${state.teamNames[declarerTeam]} — wrong, they didn't have it all. ${state.teamNames[scoringTeam]} takes the set instead.`;
            const logEntry = {
                id: `${Date.now()}-d`,
                type: result === "correct" ? "success" : "fail",
                kind: "declare",
                declarerId,
                setId,
                result,
                text,
            };

            if (isGameOver(newSets)) {
                return {
                    ...state,
                    hands: newHands,
                    sets: newSets,
                    scores: newScores,
                    phase: "gameover",
                    winner: computeWinner(newScores),
                    log: [...state.log, logEntry],
                };
            }

            let turn = state.turn;
            let phase = "play";
            let pendingRevealFor = state.pendingRevealFor;

            if (result !== "correct") {
                const players = state.players;
                // Turn goes to whoever actually held a card the declarer's team
                // was missing — same principle as a failed ask.
                const missingRank = set.ranks.find(
                    (rank) => playerTeam(state, realOwners[rank]) !== declarerTeam
                );
                const landedId = realOwners[missingRank];
                const acting = resolveActingPlayer(players, newHands, landedId);
                turn = acting;
                phase = "pass";
                pendingRevealFor = acting;
            } else if (newHands[declarerId].length === 0) {
                // A correct call that cleared the declarer's last cards — they
                // are out now, so the turn moves on to a random player who
                // still holds cards.
                const acting = resolveActingPlayer(state.players, newHands, declarerId);
                turn = acting;
                phase = "pass";
                pendingRevealFor = acting;
            }

            return {
                ...state,
                hands: newHands,
                sets: newSets,
                scores: newScores,
                turn,
                phase,
                pendingRevealFor,
                log: [...state.log, logEntry],
            };
        }

        case "RESTART": {
            return { ...createInitialState() };
        }

        default:
            return state;
    }
}
