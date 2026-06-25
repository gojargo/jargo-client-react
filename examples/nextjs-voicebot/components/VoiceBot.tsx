"use client";

import { useEffect, useRef, useState } from "react";
import {
  useJargoConnection,
  useJargoEvent,
  useJargoMicToggle,
  VoiceVisualizer,
} from "@gojargo/jargo-client-react/react";

type Line = { who: "user" | "bot"; text: string };

function appendCoalesced(lines: Line[], who: Line["who"], text: string): Line[] {
  const last = lines[lines.length - 1];
  if (last && last.who === who) {
    return [...lines.slice(0, -1), { who, text: last.text + text }];
  }
  return [...lines, { who, text }];
}

export function VoiceBot() {
  const { state, connect, disconnect, isConnected, isReady, isConnecting, error } =
    useJargoConnection();
  const mic = useJargoMicToggle();
  const [lines, setLines] = useState<Line[]>([]);
  const [botSpeaking, setBotSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useJargoEvent("userTranscript", ({ text, final }) => {
    if (final && text.trim()) setLines((l) => [...l, { who: "user", text }]);
  });
  useJargoEvent("botLlmText", ({ text }) => {
    if (text) setLines((l) => appendCoalesced(l, "bot", text));
  });
  useJargoEvent("botStartedSpeaking", () => setBotSpeaking(true));
  useJargoEvent("botStoppedSpeaking", () => setBotSpeaking(false));
  useJargoEvent("userStartedSpeaking", () => setUserSpeaking(true));
  useJargoEvent("userStoppedSpeaking", () => setUserSpeaking(false));
  useJargoEvent("error", (e) =>
    setLines((l) => [...l, { who: "bot", text: `⚠ ${e.message}` }]),
  );
  useJargoEvent("disconnected", () => {
    setBotSpeaking(false);
    setUserSpeaking(false);
  });

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [lines]);

  const statusLabel: Record<string, string> = {
    disconnected: "Déconnecté",
    connecting: "Connexion…",
    connected: "Connecté",
    ready: "En ligne",
    error: "Erreur",
  };

  return (
    <main className="wrap">
      <header className="head">
        <h1>jargo voicebot</h1>
        <span className={`badge badge-${state}`}>{statusLabel[state] ?? state}</span>
      </header>

      <div className="visual">
        <VoiceVisualizer width={320} height={72} bars={28} barColor="#8b8bf6" />
        <div className="speaking">
          <span className={userSpeaking ? "dot on" : "dot"}>● vous</span>
          <span className={botSpeaking ? "dot on bot" : "dot"}>● Assistant</span>
        </div>
      </div>

      <div className="feed" ref={feedRef}>
        {lines.length === 0 && (
          <p className="hint">
            {isReady
              ? "Parlez — dites par exemple « Quel temps fait-il ? »"
              : "Cliquez sur Connecter, autorisez le micro, puis parlez."}
          </p>
        )}
        {lines.map((l, i) => (
          <div key={i} className={`line ${l.who}`}>
            <span className="who">{l.who === "user" ? "Vous" : "Assistant"}</span>
            <span className="text">{l.text}</span>
          </div>
        ))}
      </div>

      {error && <p className="err">Erreur : {error.message}</p>}

      <div className="controls">
        <button
          className={`btn ${isConnected ? "danger" : "primary"}`}
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
        >
          {isConnected ? "Raccrocher" : isConnecting ? "Connexion…" : "Connecter"}
        </button>
        <button
          className="btn ghost"
          onClick={mic.toggle}
          disabled={!isConnected}
        >
          {mic.enabled ? "Couper le micro" : "Activer le micro"}
        </button>
      </div>
    </main>
  );
}
