import React from "react";
import { SUIT_INFO } from "./gameLogic";

const Avatar = ({ player }) => (
    <div className={`fish-ai-dialog-avatar ${player.teamId === 0 ? "is-red" : "is-blue"}`}>
        <span className="fish-ai-dialog-avatar-circle">{player.icon}</span>
        <span>{player.name}</span>
    </div>
);

const AIActionDialog = ({ aiDialog, state }) => {
    if (!aiDialog) return null;

    if (aiDialog.kind === "ask") {
        const asker = state.players.find((p) => p.id === aiDialog.askerId);
        const target = state.players.find((p) => p.id === aiDialog.targetId);
        const { card } = aiDialog;

        return (
            <div className="fish-ai-dialog-overlay">
                <div className="box fish-panel fish-ai-dialog">
                    <div className="fish-ai-dialog-avatars">
                        <Avatar player={asker} />
                        <span className="fish-ai-dialog-arrow">🗣️</span>
                        <Avatar player={target} />
                    </div>
                    <div className={`fish-card fish-ai-dialog-card fish-suit-${SUIT_INFO[card.suit].color}`}>
                        <span>{card.rank}</span>
                        <span className="fish-card-suit">{SUIT_INFO[card.suit].symbol}</span>
                    </div>
                    {aiDialog.phase === "asking" ? (
                        <p className="fish-ai-dialog-text">
                            "Do you have the {card.rank}{SUIT_INFO[card.suit].symbol}?"
                        </p>
                    ) : aiDialog.success ? (
                        <p className="fish-ai-dialog-text is-success">✅ Yes! Card handed over.</p>
                    ) : (
                        <p className="fish-ai-dialog-text is-fail">❌ No — turn passes to {target.name}.</p>
                    )}
                </div>
            </div>
        );
    }

    if (aiDialog.kind === "declare") {
        const declarer = state.players.find((p) => p.id === aiDialog.declarerId);
        const set = state.sets[aiDialog.setId];
        const teamName = state.teamNames[declarer.teamId];
        const otherTeamName = state.teamNames[declarer.teamId === 0 ? 1 : 0];
        const setLabel = `${set.level === "low" ? "Low" : "High"} ${SUIT_INFO[set.suit].name}`;

        return (
            <div className="fish-ai-dialog-overlay">
                <div className="box fish-panel fish-ai-dialog">
                    <div className="fish-ai-dialog-avatars">
                        <Avatar player={declarer} />
                        <span className="fish-ai-dialog-arrow">📣</span>
                    </div>
                    {aiDialog.phase === "asking" ? (
                        <p className="fish-ai-dialog-text">
                            "I call <strong>{setLabel}</strong> for {teamName}!"
                        </p>
                    ) : aiDialog.success ? (
                        <p className="fish-ai-dialog-text is-success">
                            ✅ Correct! {teamName} scores {set.points} point{set.points > 1 ? "s" : ""}.
                        </p>
                    ) : (
                        <p className="fish-ai-dialog-text is-fail">
                            ❌ Wrong! {otherTeamName} takes the set instead.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default AIActionDialog;
