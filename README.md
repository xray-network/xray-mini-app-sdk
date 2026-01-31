# XRAY Mini App SDK Monorepo

Framework-agnostic tooling that lets XRAY Mini Apps talk to host shells, plus optional CIP-30 helpers.

## Packages

- [`xray-mini-app-sdk`](packages/xray-mini-app-sdk/README.md) – core messaging utilities, types, and constants for secure iframe communication.
- [`xray-mini-app-sdk-cip30`](packages/xray-mini-app-sdk-cip30/README.md) – CIP-30 compatibility surface for XRAY mini apps that want a wallet-style API.

## Key scripts

- `yarn install` – install dependencies.
- `yarn build` – runs `tsc` in every workspace.
- `yarn clean` – removes `dist` folders for each package (if the package defines the script).
- `yarn publish:sdk` / `yarn publish:sdk-cip30` – publishes the respective package to npm (`--access public` is pre-configured).

## Publishing Checklist

1. Update versions in the relevant package(s).
2. Run `yarn install` if dependencies changed to refresh the lockfile.
3. Run `yarn build` to verify the emitted bundles.
4. Publish with `yarn publish:sdk` or `yarn publish:sdk-cip30`.

Both packages ship TypeScript declarations alongside ESM builds, so they work out of the box in modern bundlers.
