"use client";

import { useState } from "react";
import {
  JargoClientAudio,
  JargoClientProvider,
} from "@gojargo/jargo-client-react/react";
import { createClient } from "../lib/client";
import { VoiceBot } from "./VoiceBot";

export function VoiceBotApp() {
  // One client instance for the page lifetime.
  const [client] = useState(createClient);
  return (
    <JargoClientProvider client={client}>
      <VoiceBot />
      <JargoClientAudio />
    </JargoClientProvider>
  );
}
