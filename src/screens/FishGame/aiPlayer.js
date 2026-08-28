import { cardId, playerTeam, getAskableSets, getMissingRanks } from "./gameLogic";

// The AI only ever uses information a human at the table could have:
// its own hand, plus what every successful/failed ask has publicly
// revealed, plus public card counts. It never reads other players'
// real hands.
function buildKnowledge(state, aiId) {
    const knownOwner = {};
    const notHolder = {};

    for (const card of state.hands[aiId]) {
        knownOwner[card.id] = aiId;
    }

    for (const entry of state.log) {
        if (entry.kind !== "ask") continue;
        const cid = entry.card.id;
        if (entry.success) {
            knownOwner[cid] = entry.askerId;
            delete notHolder[cid];
        } else {
            if (!notHolder[cid]) notHolder[cid] = new Set();
            notHolder[cid].add(entry.targetId);
        }
    }

    return { knownOwner, notHolder };
}

function candidatesFor(state, cid, knowledge, aiId) {
    if (knowledge.knownOwner[cid]) return [knowledge.knownOwner[cid]];
    const excluded = knowledge.notHolder[cid] || new Set();
    return state.players
        .filter(
            (p) =>
                p.id !== aiId &&
                state.hands[p.id].length > 0 &&
                !excluded.has(p.id)
        )
        .map((p) => p.id);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function decideAIMove(state, aiId) {
    const knowledge = buildKnowledge(state, aiId);
    const myTeam = playerTeam(state, aiId);
    const openSets = Object.values(state.sets).filter((s) => s.status === "open");

    // Call a set as soon as the AI is confident its own team holds every
    // card in it — it doesn't need to know exactly which teammate has which.
    const declarable = [...openSets].sort((a, b) => b.points - a.points);
    for (const set of declarable) {
        const allOwnTeam = set.ranks.every((rank) => {
            const cid = cardId(set.suit, rank);
            const owner = knowledge.knownOwner[cid];
            return owner && playerTeam(state, owner) === myTeam;
        });
        if (allOwnTeam) {
            return { type: "DECLARE", declarerId: aiId, setId: set.id };
        }
    }

    const hand = state.hands[aiId];
    const askableSetIds = getAskableSets(hand);
    if (askableSetIds.length === 0) return null;

    let definiteOption = null;
    const fuzzyOptions = [];

    for (const setId of askableSetIds) {
        const set = state.sets[setId];
        const missing = getMissingRanks(hand, set);
        for (const rank of missing) {
            const cid = cardId(set.suit, rank);
            const known = knowledge.knownOwner[cid];
            if (known && playerTeam(state, known) !== myTeam) {
                definiteOption = { suit: set.suit, rank, targetId: known };
                break;
            }
            const candidates = candidatesFor(state, cid, knowledge, aiId).filter(
                (pid) => playerTeam(state, pid) !== myTeam
            );
            if (candidates.length > 0) {
                fuzzyOptions.push({ suit: set.suit, rank, candidates });
            }
        }
        if (definiteOption) break;
    }

    let chosen = definiteOption;
    if (!chosen && fuzzyOptions.length > 0) {
        const opt = pickRandom(fuzzyOptions);
        chosen = { suit: opt.suit, rank: opt.rank, targetId: pickRandom(opt.candidates) };
    }
    if (!chosen) {
        const setId = pickRandom(askableSetIds);
        const set = state.sets[setId];
        const missing = getMissingRanks(hand, set);
        const rank = pickRandom(missing);
        const opponents = state.players.filter(
            (p) => p.teamId !== myTeam && state.hands[p.id].length > 0
        );
        if (opponents.length === 0) return null;
        chosen = { suit: set.suit, rank, targetId: pickRandom(opponents).id };
    }

    return {
        type: "ASK",
        askerId: aiId,
        targetId: chosen.targetId,
        card: { id: cardId(chosen.suit, chosen.rank), suit: chosen.suit, rank: chosen.rank },
    };
}
