import { JargoClient, type JargoClientOptions } from "@gojargo/jargo-client-react/react";

/** Build a JargoClient from NEXT_PUBLIC_* env (inlined at build time). */
export function createClient(): JargoClient {
  const baseUrl = process.env.NEXT_PUBLIC_JARGO_URL ?? "http://localhost:8080";

  const iceServers: RTCIceServer[] = [];
  const turnUrl = process.env.NEXT_PUBLIC_JARGO_TURN_URL;
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_JARGO_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_JARGO_TURN_CREDENTIAL,
    });
    iceServers.push({ urls: "stun:stun.l.google.com:19302" });
  }

  const opts: JargoClientOptions = {
    baseUrl,
    deviceId: process.env.NEXT_PUBLIC_JARGO_DEVICE_ID || "web-demo",
    clientLabel: "jargo-nextjs-voicebot",
  };
  if (iceServers.length) opts.iceServers = iceServers;
  return new JargoClient(opts);
}
