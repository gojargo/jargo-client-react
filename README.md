# jargo-client-react

Browser client (classic WebRTC) + React bindings for
[jargo](https://github.com/gojargo/jargo) voice servers, plus a runnable
Next.js example. npm workspaces monorepo.

- **[`packages/jargo-client-react`](./packages/jargo-client-react)** — the
  `@gojargo/jargo-client-react` library (core + React).
- **[`examples/nextjs-voicebot`](./examples/nextjs-voicebot)** — a Next.js
  voicebot using the library.

## Quick start

```bash
npm install          # install + link the workspace
npm run build        # build the library (packages/jargo-client-react -> dist/)
npm run example      # run the Next.js example on http://localhost:3000
```

Configure the example by copying
`examples/nextjs-voicebot/.env.local.example` to `.env.local` and setting
`NEXT_PUBLIC_JARGO_URL` (and the TURN vars when the server runs in Kubernetes).

See each package's README for details. License: BSD-2-Clause.
