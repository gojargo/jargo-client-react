// JargoClient is the public, framework-agnostic client. It owns a
// JargoTransport and translates raw RTVI data-channel messages into typed
// events. Use it directly, or via the React bindings in "@gojargo/jargo-client-react/react".

import { TypedEmitter } from "./events";
import { RTVI_LABEL, RTVIMessageType, type RTVIMessage } from "./rtvi";
import { JargoTransport } from "./transport";
import type {
  JargoClientEvents,
  JargoClientOptions,
  TransportState,
} from "./types";

export class JargoClient extends TypedEmitter<JargoClientEvents> {
  private readonly transport: JargoTransport;
  private _state: TransportState = "disconnected";

  /** The remote audio stream, available once the bot's track arrives. */
  remoteStream: MediaStream | null = null;

  constructor(public readonly options: JargoClientOptions) {
    super();
    this.transport = new JargoTransport(options, {
      onStateChange: (s) => this.handleState(s),
      onMessage: (m) => this.handleMessage(m),
      onRemoteTrack: (stream) => {
        this.remoteStream = stream;
        this.emit("remoteTrack", stream);
      },
    });
  }

  /** Current connection state. */
  get state(): TransportState {
    return this._state;
  }

  /** Whether the microphone track is currently enabled. */
  get micEnabled(): boolean {
    return this.transport.getMicEnabled();
  }

  /** Capture the mic, open the peer connection, and run the signaling handshake. */
  connect(): Promise<void> {
    return this.transport.connect();
  }

  /** Tear down the connection and stop the microphone. */
  disconnect(): Promise<void> {
    return this.transport.disconnect();
  }

  setMicEnabled(enabled: boolean): void {
    this.transport.setMicEnabled(enabled);
  }

  /** Toggle the mic; returns the new state. */
  toggleMic(): boolean {
    const next = !this.micEnabled;
    this.transport.setMicEnabled(next);
    return next;
  }

  /** Send a custom RTVI message to the server. */
  sendMessage(type: string, data?: unknown, id?: string): boolean {
    const msg: RTVIMessage = { label: RTVI_LABEL, type, id, data };
    return this.transport.send(msg);
  }

  private handleState(state: TransportState): void {
    this._state = state;
    this.emit("transportStateChanged", state);
    if (state === "connected") this.emit("connected", undefined);
    if (state === "disconnected") this.emit("disconnected", undefined);
  }

  private handleMessage(message: unknown): void {
    // Surface every raw message first — jargo also sends non-RTVI control
    // messages (e.g. { type: "set_volume", ... }) over the same channel.
    this.emit("serverMessage", message);

    const m = message as RTVIMessage<Record<string, unknown>>;
    if (!m || typeof m !== "object" || m.label !== RTVI_LABEL) return;
    const data = (m.data ?? {}) as Record<string, unknown>;

    switch (m.type) {
      case RTVIMessageType.BotReady:
        this._state = "ready";
        this.emit("transportStateChanged", "ready");
        this.emit("botReady", {
          version: String(data.version ?? ""),
        });
        break;
      case RTVIMessageType.UserTranscription:
        this.emit("userTranscript", {
          text: String(data.text ?? ""),
          final: Boolean(data.final),
          userId: data.user_id as string | undefined,
          timestamp: data.timestamp as string | undefined,
        });
        break;
      case RTVIMessageType.BotTranscription:
        this.emit("botTranscript", { text: String(data.text ?? "") });
        break;
      case RTVIMessageType.BotLLMText:
        this.emit("botLlmText", { text: String(data.text ?? "") });
        break;
      case RTVIMessageType.BotTTSText:
        this.emit("botTtsText", { text: String(data.text ?? "") });
        break;
      case RTVIMessageType.UserStartedSpeaking:
        this.emit("userStartedSpeaking", undefined);
        break;
      case RTVIMessageType.UserStoppedSpeaking:
        this.emit("userStoppedSpeaking", undefined);
        break;
      case RTVIMessageType.BotStartedSpeaking:
        this.emit("botStartedSpeaking", undefined);
        break;
      case RTVIMessageType.BotStoppedSpeaking:
        this.emit("botStoppedSpeaking", undefined);
        break;
      case RTVIMessageType.Error:
        this.emit("error", {
          message: String(data.error ?? "unknown error"),
          fatal: Boolean(data.fatal),
        });
        break;
    }
  }
}
