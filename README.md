# XRAY Mini App SDK Monorepo

Framework-agnostic tooling that lets XRAY Mini Apps (iframes) talk to host shells over `window.postMessage`, including an optional CIP-30 wallet-style surface.

## Structure

```
├── packages/
│   ├── protocol/        # shared message types, zod schemas, constants
│   ├── client/          # SDK running inside the mini app
│   ├── host/            # SDK for the container app
│   └── testing/         # createMockHost() / createMockClient()
├── playground/
│   ├── host-app/        # Vite app embedding mini apps (port 5173)
│   └── demo-mini-app/   # Vite app built on the client SDK (port 5174)
└── e2e/                 # Playwright tests
```

## Packages

- [`xray-mini-app-protocol`](packages/protocol/README.md) – message types, zod schemas, and constants shared by both sides. The CIP-30 message surface lives here too.
- [`xray-mini-app-client`](packages/client/README.md) – helpers for the mini app (iframe side), including the CIP-30 connector.
- [`xray-mini-app-host`](packages/host/README.md) – helpers for the container app (parent window side), including CIP-30 responders.
- [`xray-mini-app-testing`](packages/testing/README.md) – `createMockHost()` / `createMockClient()` for unit-testing either side without an iframe.

## Key scripts

- `yarn install` – install dependencies for all workspaces.
- `yarn build` – builds the publishable packages in dependency order.
- `yarn clean` – removes `dist` folders.
- `yarn dev:host` / `yarn dev:mini-app` – start the playground apps (run both, then open http://localhost:5173).
- `yarn test:e2e` – run the Playwright suite (starts both playground apps automatically).
- `yarn publish:protocol` / `publish:client` / `publish:host` / `publish:testing` – publish a package to npm.

## Playground

The playground is a working reference integration: `playground/host-app` embeds `playground/demo-mini-app` in an iframe, serves demo wallet state (tip, account state, network, theme), auto-approves signing requests with fake hashes, and shows a live message log.

```bash
yarn dev:host      # http://localhost:5173
yarn dev:mini-app  # http://localhost:5174 (embedded by the host app)
```

## Publishing Checklist

1. Update versions in the relevant package(s) — keep the inter-package dependency versions in sync.
2. Run `yarn install` if dependencies changed to refresh the lockfile.
3. Run `yarn build` to verify the emitted bundles.
4. Publish with the corresponding `yarn publish:*` script.

All packages ship TypeScript declarations alongside ESM builds, so they work out of the box in modern bundlers.
