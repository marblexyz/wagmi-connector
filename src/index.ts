import { Connector, Chain, ChainNotConfiguredError, Address } from "wagmi";
import {
  Marble,
  MarbleSDKAdditionalConfiguration,
  MarbleRPCProvider,
} from "marble-sdk";
// Adding the .js extension is required for the import to work.
// It's not clear why
import { getAddress, hexValue } from "ethers/lib/utils.js";
import { providers } from "ethers";
import { SwitchChainError, UserRejectedRequestError } from "./types/errors";
import { normalizeChainId } from "./utils/utils";
import {
  LoginResultState,
  LoginWithEmailPasswordResult,
  SupportedNetworkType,
} from "@marblexyz/common";

export type MarbleSDKOptions =
  | {
      clientKey?: string;
      config?: MarbleSDKAdditionalConfiguration;
    }
  | undefined;

export default class MarbleWalletConnector extends Connector<
  MarbleRPCProvider,
  MarbleSDKOptions,
  providers.JsonRpcSigner
> {
  readonly id = "marbleWallet";
  readonly name = "Marble Wallet";
  readonly ready = false;

  protected useDefaultLoginFlow = true;

  private marbleSDK?: Marble;
  private provider?: MarbleRPCProvider;
  private marbleOptions?: MarbleSDKOptions;

  constructor(config: { chains?: Chain[]; options: MarbleSDKOptions }) {
    super(config);
    this.marbleOptions = config?.options;
  }

  async connect({ chainId }: { chainId?: number } = {}) {
    const provider = await this.getProvider();

    if (provider.on) {
      provider.on("accountsChanged", this.onAccountsChanged);
      provider.on("chainChanged", this.onChainChanged);
      provider.on("disconnect", this.onDisconnect);
      this.emit("message", { type: "connecting" });
    }

    // Check if there is a user logged in
    const isAuthenticated = await this.isAuthorized();

    // if there is a user logged in, return the user
    if (!isAuthenticated) {
      throw new Error(
        "User not authenticated. Make sure to log the user in first in order to use the marble wallet."
      );
    }
    const signer = await this.getSigner();
    const address = await signer.getAddress();

    // TODO: Handle edge case where the user has not run DKG yet.
    if (address === "") {
      throw new Error("No account found. Please run DKG first.");
    }

    const account = getAddress(address);

    // Switch to chain if provided
    let id = await this.getChainId();
    let unsupported = this.isChainUnsupported(id);
    if (chainId && id !== chainId) {
      const chain = await this.switchChain(chainId);
      id = chain.id;
      unsupported = this.isChainUnsupported(id);
    }

    return {
      provider,
      chain: {
        id,
        unsupported,
      },
      account,
    };
  }

  getMarbleSDK(): Marble {
    if (this.marbleSDK === undefined) {
      this.marbleSDK = new Marble(this.marbleOptions?.clientKey, {
        ...this.marbleOptions?.config,
      });
      return this.marbleSDK;
    }
    return this.marbleSDK;
  }

  async getProvider(): Promise<MarbleRPCProvider> {
    if (this.provider) {
      return this.provider;
    }
    const magic = this.getMarbleSDK();
    this.provider = magic.rpcProvider;
    return this.provider;
  }

  async disconnect() {
    const marbleSDK = this.getMarbleSDK();
    const provider = await this.getProvider();
    provider.removeListener("accountsChanged", this.onAccountsChanged);
    provider.removeListener("chainChanged", this.onChainChanged);
    provider.removeListener("disconnect", this.onDisconnect);
    await marbleSDK.auth.logout();
  }

  async getSigner() {
    const [provider, account] = await Promise.all([
      this.getProvider(),
      this.getAccount(),
    ]);
    return new providers.Web3Provider(
      <providers.ExternalProvider>(<unknown>provider)
    ).getSigner(account);
  }

  async isAuthorized() {
    const marbleSDK = this.getMarbleSDK();
    return await marbleSDK.auth.isLoggedIn();
  }

  async getAccount() {
    const provider = await this.getProvider();
    const accounts = await provider.request<Address[]>({
      method: "eth_accounts",
    });
    return getAddress(<Address>accounts[0]);
  }

  async getChainId() {
    const provider = await this.getProvider();
    const chainId = await provider.request<number>({
      method: "eth_chainId",
    });
    return normalizeChainId(chainId);
  }

  async switchChain(chainId: number) {
    const provider = await this.getProvider();
    const id = hexValue(chainId);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: id }],
      });
      const chain = this.chains.find((x) => x.id === chainId) ?? {
        id: chainId,
        name: `Chain ${id}`,
        network: `${id}`,
        // TODO: Add support for nativeCurrency. Currently not supported by Marble Wallet.
        nativeCurrency: {
          name: "Ether",
          decimals: 18,
          symbol: "ETH",
        },
        rpcUrls: { default: { http: [""] } },
      };
      //   Important, or else the chain will not be updated in wagmi
      this.onChainChanged(id);
      return chain;
    } catch (error) {
      const chain = this.chains.find((x) => x.id === chainId);
      if (chain === undefined)
        throw new ChainNotConfiguredError({ chainId, connectorId: this.id });

      // TODO: Handle actually adding the chain to the provider. This is not currently supported.
      // In the interim, users can add the chain manually to the Marble Wallet via the Marble
      // MarbleSDKOptions config property.

      if (this.isUserRejectedError(error))
        throw new UserRejectedRequestError(error);
      throw new SwitchChainError(error);
    }
  }

  protected onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) this.emit("disconnect");
    else this.emit("change", { account: getAddress(<string>accounts[0]) });
  };

  protected onChainChanged = (chainId: number | string) => {
    const id = normalizeChainId(chainId);
    const unsupported = this.isChainUnsupported(id);
    this.emit("change", { chain: { id, unsupported } });
  };

  private isUserRejectedError(error: unknown) {
    return /(user rejected)/i.test((<Error>error).message);
  }

  protected onDisconnect = async () => {
    this.emit("disconnect");
  };

  public async loginWithEmailPassword(
    email?: string
  ): Promise<LoginWithEmailPasswordResult> {
    const marbleSDK = this.getMarbleSDK();
    return await marbleSDK.auth.loginWithEmailPassword({ email });
  }
}

export type { LoginWithEmailPasswordResult };
export { LoginResultState, SupportedNetworkType };
