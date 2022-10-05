# Marble Wagmi Connector

This is a connector desgined to help integrate the [Marble Wallet SDK](https://www.npmjs.com/package/marble-sdk) with the wagmi React Hook library.

## What is Marble?

Marble is a non-custodial wallet that lets developers onboard users into web3 quickly and securely, without the need of extensions or seed phrases.

Developers use the [Marble SDK](https://www.npmjs.com/package/marble-sdk) to integrate Marble into their dApp.

Learn more about Marble at [marblewallet.com](https://marblewallet.com/).

## What is Wagmi?

**wagmi** is a collection of React Hooks containing everything you need to start working with Ethereum. wagmi makes it easy to "Connect Wallet," display ENS and balance information, sign messages, interact with contracts, and much more — all with caching, request deduplication, and persistence.

Check out wagmi's [documentation](https://wagmi.sh//) for more information.

## Installation Instructions

Setting up the Marble Wagmi Connector is easy. First, install the package:

```bash
npm install --save @marblexyz/wagmi-connector
# or
yarn add @marblexyz/wagmi-connector
```

Then, import the `MarbleWagmiConnector` class and instantiate it with your Marble Client Key:

```typescript
import MarbleWagmiConnector from "@marblexyz/wagmi-connector";

const marbleConnector = new MarbleWalletConnector({
  chains: chains,
  options: {
    // Custom connector options
    clientKey: "YOUR_CLIENT_KEY",
    config: {
      endpoint: "http://localhost:4200",
    },
  },
});

const { connect: connectMarble } = useConnect({
  connector: marbleConnector,
});
```
