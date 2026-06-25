"use client";

import React, { useEffect, useRef } from "react";
import { useJargoClient, useJargoEvent } from "./hooks";

export interface VoiceVisualizerProps {
  width?: number;
  height?: number;
  /** Bar color (CSS). */
  barColor?: string;
  /** Number of bars. */
  bars?: number;
  className?: string;
}

/**
 * A simple frequency-bar visualizer of the bot's audio, driven by a Web Audio
 * AnalyserNode on the remote stream.
 */
export function VoiceVisualizer({
  width = 240,
  height = 64,
  barColor = "#6366f1",
  bars = 24,
  className,
}: VoiceVisualizerProps) {
  const client = useJargoClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    analyserRef.current?.disconnect();
    analyserRef.current = null;
  };

  const setup = (stream: MediaStream | null) => {
    stop();
    if (!stream) {
      clearCanvas();
      return;
    }
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = audioCtxRef.current ?? new Ctx();
    audioCtxRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const canvas = canvasRef.current;
      const g = canvas?.getContext("2d");
      if (!canvas || !g) return;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.fillStyle = barColor;
      const step = Math.floor(data.length / bars) || 1;
      const bw = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(2, v * canvas.height);
        g.fillRect(i * bw + 1, canvas.height - bh, bw - 2, bh);
      }
    };
    draw();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (canvas && g) g.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    setup(client.remoteStream);
    return () => {
      stop();
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useJargoEvent("remoteTrack", setup);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}
