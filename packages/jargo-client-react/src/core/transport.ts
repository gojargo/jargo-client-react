// JargoTransport drives the browser side of jargo's WebRTC signaling and the
// RTVI data channel. Signaling is a single non-trickle SDP offer/answer over
// HTTP POST /offer (it gathers all ICE candidates locally before sending),
// matching jargo's transport/pionrtc.

import {
  RTVI_DATA_CHANNEL,
  RTVI_LABEL,
  RTVIMessageType,
  RTVI_PROTOCOL_VERSION,
  type RTVIMessage,
} from "./rtvi";
import type { JargoClientOptions, TransportState } from "./types";

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

// A modest jitter-buffer cushion smooths server-side send jitter / bursty TTS
// without much added latency. Set jitterBufferMs to 0 to disable.
const DEFAULT_JITTER_BUFFER_MS = 150;

export interface TransportHandlers {
  onStateChange(state: TransportState): void;
  /** A parsed data-channel message (RTVI or otherwise). */
  onMessage(message: unknown): void;
  onRemoteTrack(stream: MediaStream | null): void;
}

export class JargoTransport {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private micEnabled = true;
  private state: TransportState = "disconnected";

  constructor(
    private readonly opts: JargoClientOptions,
    private readonly handlers: TransportHandlers,
  ) {}

  getState(): TransportState {
    return this.state;
  }

  getMicEnabled(): boolean {
    return this.micEnabled;
  }

  setMicEnabled(enabled: boolean): void {
    this.micEnabled = enabled;
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  /** Send a JSON message over the RTVI data channel (no-op if not open). */
  send(message: RTVIMessage): boolean {
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  async connect(): Promise<void> {
    if (this.pc) throw new Error("jargo: already connected");
    this.setState("connecting");
    try {
      this.localStream = await this.captureMic();

      const pc = new RTCPeerConnection({
        iceServers: this.opts.iceServers ?? DEFAULT_ICE,
      });
      this.pc = pc;

      pc.ontrack = (e) => {
        this.tuneJitterBuffer(e.receiver);
        const stream = e.streams[0] ?? new MediaStream([e.track]);
        this.handlers.onRemoteTrack(stream);
      };
      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case "connected":
            this.setState("connected");
            break;
          case "failed":
            this.setState("error");
            break;
          case "disconnected":
          case "closed":
            this.setState("disconnected");
            break;
        }
      };

      this.localStream
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, this.localStream!));

      // The client owns the data channel (jargo's server waits for it).
      const dc = pc.createDataChannel(RTVI_DATA_CHANNEL);
      this.dc = dc;
      dc.onopen = () => this.sendClientReady();
      dc.onmessage = (e) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(e.data);
        } catch {
          return; // ignore non-JSON frames
        }
        this.handlers.onMessage(parsed);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await this.waitForIceGathering(pc);

      const resp = await fetch(this.offerUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pc.localDescription),
      });
      if (!resp.ok) {
        throw new Error(`jargo: signaling failed (${resp.status})`);
      }
      const answer = (await resp.json()) as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);
    } catch (err) {
      this.setState("error");
      await this.disconnect();
      throw err;
    }
  }

  // tuneJitterBuffer deepens the receiver's audio jitter buffer. The server
  // paces audio at real time, but small gaps (Go scheduling, or a TTS that
  // streams in bursts) can otherwise drain a shallow buffer mid-utterance and
  // produce a catch-up burst — heard as clicks / "machine-gun". A larger target
  // trades a little latency for a cushion that plays through those gaps.
  private tuneJitterBuffer(receiver: RTCRtpReceiver | undefined): void {
    const ms = this.opts.jitterBufferMs ?? DEFAULT_JITTER_BUFFER_MS;
    if (!receiver || ms <= 0) return;
    const r = receiver as unknown as {
      jitterBufferTarget?: number | null;
      playoutDelayHint?: number | null;
    };
    try {
      if ("jitterBufferTarget" in receiver) {
        r.jitterBufferTarget = ms; // ms, standardized
      } else {
        r.playoutDelayHint = ms / 1000; // seconds, legacy Chrome
      }
    } catch {
      // best-effort; unsupported in some browsers
    }
  }

  async disconnect(): Promise<void> {
    this.dc?.close();
    this.dc = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    if (this.pc) {
      this.pc.onconnectionstatechange = null;
      this.pc.ontrack = null;
      this.pc.close();
      this.pc = null;
    }
    this.handlers.onRemoteTrack(null);
    if (this.state !== "disconnected") this.setState("disconnected");
  }

  private async captureMic(): Promise<MediaStream | null> {
    const audio = this.opts.audio ?? true;
    if (audio === false) return null;
    const constraints: MediaStreamConstraints = {
      audio:
        typeof audio === "object"
          ? audio
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
      video: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getAudioTracks().forEach((t) => {
      t.enabled = this.micEnabled;
    });
    return stream;
  }

  private sendClientReady(): void {
    this.send({
      label: RTVI_LABEL,
      type: RTVIMessageType.ClientReady,
      id: randomId(),
      data: {
        version: RTVI_PROTOCOL_VERSION,
        about: { library: this.opts.clientLabel ?? "jargo-client-react" },
      },
    });
  }

  private offerUrl(): string {
    const base = this.opts.baseUrl.replace(/\/+$/, "");
    const path = this.opts.offerPath ?? "/offer";
    const url = new URL(base + path);
    if (this.opts.deviceId) url.searchParams.set("deviceId", this.opts.deviceId);
    return url.toString();
  }

  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(finish, this.opts.iceGatherTimeoutMs ?? 3000);
      function check() {
        if (pc.iceGatheringState === "complete") finish();
      }
      function finish() {
        clearTimeout(timeout);
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
      pc.addEventListener("icegatheringstatechange", check);
    });
  }

  private setState(state: TransportState): void {
    if (state === this.state) return;
    this.state = state;
    this.handlers.onStateChange(state);
  }
}

function randomId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return "c-" + Math.random().toString(36).slice(2, 10);
}
