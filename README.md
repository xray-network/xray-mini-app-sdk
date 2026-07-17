# XRAY Mini App SDK Monorepo

Framework-agnostic tooling that lets XRAY Mini Apps (iframes) talk to host shells over `window.postMessage`, including an optional CIP-30 wallet-style surface.

## Structure

```
├── packages/
│   └── sdk/             # @xray-network/mini-app-sdk (single publishable package)
│       └── src/
│           ├── protocol/    # shared message types, zod schemas, constants
│           ├── client/      # SDK running inside the mini app
│           ├── host/        # SDK for the container app
│           └── testing/     # createMockHost() / createMockClient()
└── playground/
    ├── host-app/        # Vite app embedding mini apps (port 5173)
    └── demo-mini-app/   # Vite app built on the client SDK (port 5174)
```

## The package

Everything ships as one package, [`@xray-network/mini-app-sdk`](packages/sdk/README.md), with subpath exports so each side only imports its own surface:

- `@xray-network/mini-app-sdk` (or `/protocol`) – message types, zod schemas, and constants shared by both sides. The CIP-30 message surface lives here too.
- `@xray-network/mini-app-sdk/client` – helpers for the mini app (iframe side), including the CIP-30 connector.
- `@xray-network/mini-app-sdk/host` – helpers for the container app (parent window side), including CIP-30 responders.
- `@xray-network/mini-app-sdk/testing` – `createMockHost()` / `createMockClient()` for unit-testing either side without an iframe.
- `@xray-network/mini-app-sdk/react` – React hooks for the client side (`useMiniApp`, `useTheme`, `useTip`, `useSignTx`, …) with an optional `<MiniAppProvider>`; `react` is an optional peer dependency.

A protocol change is always published to client and host atomically — one version, no drift.

## Key scripts

- `yarn install` – install dependencies for all workspaces.
- `yarn build` – builds the SDK package.
- `yarn clean` – removes `dist` folders.
- `yarn dev:host` / `yarn dev:mini-app` – start the playground apps (run both, then open http://localhost:5173).
- `yarn publish:sdk` – publish the package to npm.

## Playground

The playground is a working reference integration: `playground/host-app` embeds `playground/demo-mini-app` in an iframe, serves demo wallet state (tip, account state, network, theme), auto-approves signing requests with fake hashes, and shows a live message log.

```bash
yarn dev:host      # http://localhost:5173
yarn dev:mini-app  # http://localhost:5174 (embedded by the host app)
```

## Publishing Checklist

1. Bump the version in `packages/sdk/package.json`.
2. Run `yarn install` if dependencies changed to refresh the lockfile.
3. Run `yarn build` to verify the emitted bundle.
4. Publish with `yarn publish:sdk`.

The package ships TypeScript declarations alongside ESM builds, so it works out of the box in modern bundlers.
