// RTVI protocol constants and message envelope, mirroring jargo's
// rtvi/messages.go. Every message exchanged over the WebRTC data channel is a
// JSON object of shape { label, type, id?, data? } tagged with the "rtvi-ai"
// label.

export const RTVI_LABEL = "rtvi-ai";
export const RTVI_PROTOCOL_VERSION = "2.0.0";

/** Name of the WebRTC data channel jargo carries RTVI messages on. */
export const RTVI_DATA_CHANNEL = "rtvi";

/** RTVI message types jargo sends and receives. */
export const RTVIMessageType = {
  ClientReady: "client-ready",
  BotReady: "bot-ready",
  Error: "error",
  UserTranscription: "user-transcription",
  BotTranscription: "bot-transcription",
  BotTTSText: "bot-tts-text",
  BotLLMText: "bot-llm-text",
  UserStartedSpeaking: "user-started-speaking",
  UserStoppedSpeaking: "user-stopped-speaking",
  BotStartedSpeaking: "bot-started-speaking",
  BotStoppedSpeaking: "bot-stopped-speaking",
} as const;

export type RTVIMessageType =
  (typeof RTVIMessageType)[keyof typeof RTVIMessageType];

/** The RTVI message envelope. */
export interface RTVIMessage<T = unknown> {
  label: string;
  type: string;
  id?: string;
  data?: T;
}
