import React from "react";
import { SUIT_INFO } from "./gameLogic";

const MiniAvatar = ({ player }) => (
    <span className={`fish-mini-avatar ${player.teamId === 0 ? "is-red" : "is-blue"}`}>
        {player.icon}
    </span>
);

const HistoryEntryRow = ({ entry, state }) => {
    if (entry.kind === "ask") {
        const asker = state.players.find((p) => p.id === entry.askerId);
        const target = state.players.find((p) => p.id === entry.targetId);
        if (!asker || !target) return <p className="fish-history-row">{entry.text}</p>;
        return (
            <div className="fish-history-row">
                <MiniAvatar player={asker} />
                <span className="fish-history-arrow">🗣️</span>
                <MiniAvatar player={target} />
                <span className={`fish-card is-mini fish-suit-${SUIT_INFO[entry.card.suit].color}`}>
                    <span>{entry.card.rank}</span>
                    <span className="fish-card-suit">{SUIT_INFO[entry.card.suit].symbol}</span>
                </span>
                <span className="fish-history-result">{entry.success ? "✅" : "❌"}</span>
            </div>
        );
    }

    if (entry.kind === "declare") {
        const declarer = state.players.find((p) => p.id === entry.declarerId);
        const set = state.sets[entry.setId];
        if (!declarer || !set) return <p className="fish-history-row">{entry.text}</p>;
        return (
            <div className="fish-history-row">
                <MiniAvatar player={declarer} />
                <span className="fish-history-arrow">📣</span>
                <span className={`fish-history-set-label fish-suit-${SUIT_INFO[set.suit].color}`}>
                    {set.level === "low" ? "Low" : "High"} {SUIT_INFO[set.suit].symbol}
                </span>
                <span className="fish-history-result">{entry.result === "correct" ? "✅" : "❌"}</span>
            </div>
        );
    }

    return <p className="fish-history-row fish-history-info">🎴 {entry.text}</p>;
};

const HistoryModal = ({ log, state }) => (
    <div className="fish-side-panel-body">
        <div className="fish-log">
            {[...log].reverse().map((entry) => (
                <HistoryEntryRow key={entry.id} entry={entry} state={state} />
            ))}
        </div>
    </div>
);

export default HistoryModal;
