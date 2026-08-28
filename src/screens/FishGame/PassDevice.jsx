import React from "react";

const PassDevice = ({ player, teamName, lastLogText, onReveal }) => {
    return (
        <section className="hero is-fullheight fish-scene">
            <div className="hero-body is-flex-direction-column is-justify-content-center has-text-centered">
                {lastLogText && <p className="fish-pass-context">{lastLogText}</p>}

                <div className="box fish-panel fish-pass-card">
                    <p className="fish-pass-icon">🎴</p>
                    <p className="title is-5">Pass the device to</p>
                    <p className="title is-1 fish-pass-name">{player.name}</p>
                    <p className="subtitle is-5 mb-5">{teamName}</p>
                    <p className="mb-4 has-text-grey-dark">Everyone else, look away 👀</p>

                    <button className="button is-primary is-large fish-pill-button" onClick={onReveal}>
                        🃏 Show my hand
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PassDevice;
