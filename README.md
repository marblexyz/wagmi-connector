# Marble Wagmi Connector

This is a connector desgined to help integrate the [Marble Wallet SDK](https://www.npmjs.com/package/marble-sdk) with the [wagmi React Hook library](https://wagmi.sh/).

## What is Marble?

Marble Wallet is a self-custodial wallet that does not require extensions or seed phrases. Developers can use Marble Wallet to build seamless onboarding experiences for their users, similar to the ones provided by Coinbase or [Reddit's self-custodial wallet](https://www.coindesk.com/web3/2022/10/19/reddit-users-open-25-million-crypto-wallets-after-launch-of-nft-marketplace/).

Developers can offer wallet-onboarding, a fiat on-ramp, and pre-built UI components to their users, all in a single package. Marble Wallet can improve onboarding for users to your app by up to 90%.

Advantages of Marble Wallet:

- Email-based authentication. No seed phrases, extensions, or apps required. Marble runs in the browser.
- Embedded fiat on-ramp.
- Pre-built and highly customizable UI components.
- Out-of-the-box support for WalletConnect.
- ... and more!

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

Then, import the `MarbleWalletConnector` class and instantiate it with your Marble Client Key:

```typescript
import MarbleWalletConnector from "@marblexyz/wagmi-connector";

const marbleConnector = new MarbleWalletConnector({
  options: {
    clientKey: "YOUR_CLIENT_KEY",
  },
});

const { connect: connectMarble } = useConnect({
  connector: marbleConnector,
});
```

Finally, use the `connectMarble` function to connect to Marble:

```typescript
const { connect: connectMarble } = useConnect({
  connector: marbleConnector,
});

const connect = async () => {
  try {
    await connectMarble();
  } catch (error) {
    console.error(error);
  }
};
```
