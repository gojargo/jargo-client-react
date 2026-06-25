"use client";

import React, { useEffect, useRef } from "react";
import { useJargoClient, useJargoEvent } from "./hooks";

export interface JargoClientAudioProps {
  /** Output volume 0..1. Defaults to 1. */
  volume?: number;
}

/**
 * Renders the bot's audio. Drop one of these anywhere inside the provider; it
 * wires the remote MediaStream to a hidden <audio> element and plays it.
 */
export function JargoClientAudio({ volume = 1 }: JargoClientAudioProps) {
  const client = useJargoClient();
  const ref = useRef<HTMLAudioElement>(null);

  const attach = (stream: MediaStream | null) => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => {});
  };

  useEffect(() => {
    attach(client.remoteStream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);

  useJargoEvent("remoteTrack", attach);

  return <audio ref={ref} autoPlay playsInline style={{ display: "none" }} />;
}
