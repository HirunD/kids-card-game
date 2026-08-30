import React, { useEffect, useRef } from "react";
import "./style.css";

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT; // "ca-pub-XXXXXXXXXXXXXXXX"
const SLOT = import.meta.env.VITE_ADSENSE_SLOT; //   "1234567890"

const scriptSrc = (client) =>
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;

function loadAdSense(client) {
    // index.html already ships this tag for site verification; only inject as a
    // fallback if it's somehow missing.
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    const s = document.createElement("script");
    s.src = scriptSrc(client);
    s.async = true;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
}

/**
 * A slim, unobtrusive sticky ad bar pinned to the bottom of the viewport.
 *
 * - Renders nothing unless VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT are set.
 * - In dev with no config it shows a grey placeholder so you can see the layout.
 * - Adds `has-ad-bar` to <body> so full-height screens leave room for it.
 */
const AdBar = ({ position = "bottom" }) => {
    const pushed = useRef(false);
    const configured = Boolean(CLIENT && SLOT);
    const placeholder = !configured && import.meta.env.DEV;

    useEffect(() => {
        if (!configured && !placeholder) return undefined;
        document.body.classList.add("has-ad-bar");
        return () => document.body.classList.remove("has-ad-bar");
    }, [configured, placeholder]);

    useEffect(() => {
        if (!configured || pushed.current) return;
        pushed.current = true;
        loadAdSense(CLIENT);
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // adsbygoogle isn't ready yet or the unit is already filled — harmless.
        }
    }, [configured]);

    if (!configured && !placeholder) return null;

    return (
        <aside className={`ad-bar ad-bar--${position}`} aria-label="Advertisement">
            {placeholder ? (
                <div className="ad-bar__placeholder">Ad</div>
            ) : (
                <ins
                    className="adsbygoogle ad-bar__unit"
                    style={{ display: "block", width: "100%", height: "100%" }}
                    data-ad-client={CLIENT}
                    data-ad-slot={SLOT}
                    data-ad-format="horizontal"
                    data-full-width-responsive="true"
                />
            )}
        </aside>
    );
};

export default AdBar;
