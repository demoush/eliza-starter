import { elizaLogger, IAgentRuntime, Provider, State, Memory } from "@elizaos/core";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

import type { Chain, WalletClient, Signature, Balance } from "@goat-sdk/core";
import bs58 from "bs58"

interface ExtendedBalance extends Balance {
    formatted: string;
  }
  
interface ExtendedWalletClient extends WalletClient {
    connection: Connection;
    signMessage(message: string): Promise<Signature>;
    getFormattedPortfolio: (runtime: IAgentRuntime) => Promise<string>;
    balanceOf: (tokenAddress: string) => Promise<ExtendedBalance>;
    getMaxBuyAmount: (tokenAddress: string) => Promise<number>;
    executeTrade: (params: {
      tokenIn: string;
      tokenOut: string;
      amountIn: number;
      slippage: number;
    }) => Promise<any>;
  }

  /**
 * Gets wallet keypair from runtime settings
 * @param runtime Agent runtime environment
 * @returns Solana keypair for transactions
 * @throws Error if private key is missing or invalid
 */
export function getWalletKeypair(runtime?: IAgentRuntime): Keypair {
    // Check chain type from token address or configuration
  
    const privateKeyString = runtime?.getSetting("WALLET_PRIVATE_KEY");
    if (!privateKeyString) {
      throw new Error("No wallet private key configured. Ensure WALLET_PRIVATE_KEY is filled in your .env");
    }
  
    try {
      const privateKeyBytes = bs58.decode(privateKeyString);
      return Keypair.fromSecretKey(privateKeyBytes);

    } catch (error) {
      elizaLogger.error("Failed to create wallet keypair:", error);
      throw error;
    }
  }

async function getChainBalance(
    connection: Connection,
    walletAddress: PublicKey,
    tokenAddress: string,
  ): Promise<number> {
    // Use existing Solana balance fetching logic
    return await getTokenBalance(
      connection,
      walletAddress,
      new PublicKey(tokenAddress),
    );
  }

async function getTokenBalance(
    connection: Connection,
    walletPublicKey: PublicKey,
    tokenMintAddress: PublicKey
): Promise<number> {
    const tokenAccountAddress = await getAssociatedTokenAddress(
        tokenMintAddress,
        walletPublicKey
    );

    try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        const tokenAmount = tokenAccount.amount as unknown as number;
        return tokenAmount;
    } catch (error) {
        console.error(
            `Error retrieving balance for token: ${tokenMintAddress.toBase58()}`,
            error
        );
        return 0;
    }
}

export class WalletProvider implements ExtendedWalletClient {    
    private runtime: IAgentRuntime;
    private keypair: Keypair;
    connection: Connection;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.connection = new Connection(
            runtime?.getSetting("RPC_URL") || "https://api.mainnet-beta.solana.com","confirmed"
          );
        this.keypair = getWalletKeypair(this.runtime);
    }

    getChain(): Chain {
        return { type: "solana" };
    }
    getAddress() {
        return this.keypair.publicKey.toBase58();
    }
    async signMessage(message: string): Promise<Signature> {
      throw new Error("Message signing not implemented for Solana wallet");
    }
    async balanceOf(tokenAddress: string): Promise<ExtendedBalance> {
      try {
        if (tokenAddress.startsWith("0x")) {
          // Handle Base token balance
          const baseBalance = await getChainBalance(
            this.connection,
            this.keypair.publicKey,
            tokenAddress,
          );
          return {
            value: BigInt(baseBalance.toString()),
            decimals: 18, // Base uses 18 decimals
            formatted: (baseBalance / 1e18).toString(),
            symbol: "ETH",
            name: "Base",
          };
        } else {
          // Existing Solana logic
          const tokenPublicKey = new PublicKey(tokenAddress);
          const amount = await getTokenBalance(
            this.connection,
            this.keypair.publicKey,
            tokenPublicKey,
          );
          return {
            value: BigInt(amount.toString()),
            decimals: 9,
            formatted: (amount / 1e9).toString(),
            symbol: "SOL",
            name: "Solana",
          };
        }
      } catch (error) {
        return {
          value: BigInt(0),
          decimals: tokenAddress.startsWith("0x") ? 18 : 9,
          formatted: "0",
          symbol: tokenAddress.startsWith("0x") ? "ETH" : "SOL",
          name: tokenAddress.startsWith("0x") ? "Base" : "Solana",
        };
      }
    }
    async getMaxBuyAmount(tokenAddress: string): Promise<number> {
      try {
        elizaLogger.log(`Getting max buy amount for ${tokenAddress}`);

        if (tokenAddress.startsWith("0x")) {
          // Handle Base chain balance
          const baseBalance = await getChainBalance(
            this.connection,
            this.keypair.publicKey,
            tokenAddress,
          );
          return (baseBalance * 0.9) / 1e18; // Base uses 18 decimals
        } else {
          // Handle Solana balance
          const balance = await this.connection.getBalance(this.keypair.publicKey);
          return (balance * 0.9) / 1e9; // Solana uses 9 decimals
        }
      } catch (error) {
        elizaLogger.error(
          `Failed to get max buy amount for ${tokenAddress}:`,
          error,
        );
        return 0;
      }
    }
    async executeTrade(params: { tokenIn: string; tokenOut: string; amountIn: number; slippage: number }): Promise<any> {
      try {
        return { success: true };
      } catch (error) {
        throw error;
      }
    }
    async getFormattedPortfolio(runtime: IAgentRuntime): Promise<string> {
        return "";
    }
};

const walletProvider: Provider = {
    get: async (
      runtime: IAgentRuntime,
      _message: Memory,
      _state?: State
    ): Promise<string | null> => {
      try {
        const provider = new WalletProvider(runtime);
        return await provider.getFormattedPortfolio(runtime);
      } catch (error) {
        console.error("Error in wallet provider:", error);
        return null;
      }
    },
};

// Module exports
export { walletProvider };
