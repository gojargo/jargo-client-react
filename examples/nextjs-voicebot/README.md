# jargo Next.js voicebot example

A minimal Next.js (App Router) app using `@gojargo/jargo-client-react` to talk
to a jargo voice server: connect/disconnect, live transcript, speaking
indicator, mic toggle, audio + visualizer.

## Run

From the **repo root** (so the workspace resolves the lib), build the lib once:

```bash
npm install
npm run build            # builds @gojargo/jargo-client-react -> dist/
```

Then configure and start the example:

```bash
cd examples/nextjs-voicebot
cp .env.local.example .env.local   # set NEXT_PUBLIC_JARGO_URL (+ TURN for k8s)
npm run dev
```

Open http://localhost:3000, click **Connecter**, allow the microphone, and
speak French.

## Pointing at a server

- **Local server** (`localhost:8080`): leave the TURN vars blank — host ICE
  candidates work on the loopback.
- **Kubernetes** (`https://jargo.example.com`): set
  `NEXT_PUBLIC_JARGO_URL` and the `NEXT_PUBLIC_JARGO_TURN_*` vars (the coturn
  public IP + credentials) — WebRTC media can't reach a pod directly, so it
  relays through coturn.
