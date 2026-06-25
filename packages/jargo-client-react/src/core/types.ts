// Public types for the jargo client.

/**
 * Connection lifecycle. `connected` means the peer connection + data channel
 * are up and `client-ready` was sent; `ready` means the server replied
 * `bot-ready` and the bot is live.
 */
export type TransportState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "ready"
  | "error";

export interface JargoClientOptions {
  /** Base URL of the jargo server, e.g. "https://jargo.dev.example.com". */
  baseUrl: string;
  /** Device/beneficiary id; sent as the `deviceId` query param on /offer. */
  deviceId?: string;
  /**
   * ICE servers for the RTCPeerConnection. For a server behind NAT (e.g. in
   * Kubernetes) pass the same TURN server the server relays through. Defaults
   * to a public STUN server (fine for localhost only).
   */
  iceServers?: RTCIceServer[];
  /** Library name advertised in the `client-ready` handshake. */
  clientLabel?: string;
  /**
   * Microphone capture: `true` (default) for sensible voice constraints,
   * `false` to send no audio, or explicit MediaTrackConstraints.
   */
  audio?: boolean | MediaTrackConstraints;
  /** Signaling path on the server. Defaults to "/offer". */
  offerPath?: string;
  /** Max time to wait for ICE gathering before POSTing the offer. Default 3000ms. */
  iceGatherTimeoutMs?: number;
  /**
   * Target audio jitter-buffer depth in ms (a cushion that absorbs server
   * send-jitter / bursty TTS so playback doesn't click). Default 150; set 0 to
   * leave the browser's adaptive default.
   */
  jitterBufferMs?: number;
}

export interface UserTranscript {
  text: string;
  final: boolean;
  userId?: string;
  timestamp?: string;
}

export interface TextPayload {
  text: string;
}

export interface JargoErrorPayload {
  message: string;
  fatal: boolean;
}

/** Typed event map emitted by {@link JargoClient}. */
export interface JargoClientEvents {
  /** Any transport state change, including the logical `ready`. */
  transportStateChanged: TransportState;
  /** Peer connection + data channel established. */
  connected: void;
  /** Connection closed (locally or remotely). */
  disconnected: void;
  /** Server acknowledged the handshake; the bot is live. */
  botReady: { version: string };
  /** Speech-to-text of the user (interim while `final` is false). */
  userTranscript: UserTranscript;
  /** Transcript of the bot's spoken reply. */
  botTranscript: TextPayload;
  /** Raw LLM output text (before TTS). */
  botLlmText: TextPayload;
  /** Text handed to TTS. */
  botTtsText: TextPayload;
  userStartedSpeaking: void;
  userStoppedSpeaking: void;
  botStartedSpeaking: void;
  botStoppedSpeaking: void;
  /** Server reported an error. */
  error: JargoErrorPayload;
  /**
   * Every raw data-channel message, including non-RTVI ones the server sends
   * directly (e.g. jargo's `{ type: "set_volume", ... }` tool output).
   */
  serverMessage: unknown;
  /** The remote audio MediaStream (or null when it goes away). */
  remoteTrack: MediaStream | null;
}
