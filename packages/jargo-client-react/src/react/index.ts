"use client";

export { JargoClientProvider } from "./JargoClientProvider";
export type { JargoClientProviderProps } from "./JargoClientProvider";
export { JargoClientAudio } from "./JargoClientAudio";
export type { JargoClientAudioProps } from "./JargoClientAudio";
export { VoiceVisualizer } from "./VoiceVisualizer";
export type { VoiceVisualizerProps } from "./VoiceVisualizer";
export {
  useJargoClient,
  useJargoEvent,
  useJargoTransportState,
  useJargoConnection,
  useJargoMicToggle,
} from "./hooks";

// Re-export the client class + types so apps can import everything from
// "@gojargo/jargo-client-react/react" if they prefer a single entry.
export { JargoClient } from "../core/JargoClient";
export type {
  JargoClientOptions,
  JargoClientEvents,
  TransportState,
  UserTranscript,
  TextPayload,
  JargoErrorPayload,
} from "../core/types";
