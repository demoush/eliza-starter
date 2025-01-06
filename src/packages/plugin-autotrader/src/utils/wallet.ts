import { elizaLogger, IAgentRuntime } from "@elizaos/core";
import {
  Connection,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

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
    throw new Error("No wallet private key configured");
  }

  try {
    const privateKeyBytes = bs58.decode(privateKeyString);
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    elizaLogger.error("Failed to create wallet keypair:", error);
    throw error;
  }
}

/**
 * Gets current SOL balance for wallet
 * @param runtime Agent runtime environment
 * @returns Balance in SOL
 */
export async function getWalletBalance(
  runtime: IAgentRuntime,
): Promise<number> {
  try {

    // Existing Solana balance logic
    const walletKeypair = getWalletKeypair(runtime);
    const walletPubKey = walletKeypair.publicKey;
    const connection = new Connection(
      runtime.getSetting("RPC_URL") || "https://api.mainnet-beta.solana.com",
    );

    const balance = await connection.getBalance(walletPubKey);
    const solBalance = balance / 1e9;

    elizaLogger.log("Fetched Solana wallet balance:", {
      address: walletPubKey.toBase58(),
      lamports: balance,
      sol: solBalance,
    });

    return solBalance;
  } catch (error) {
    elizaLogger.error("Failed to get wallet balance:", error);
    return 0;
  }
}

// Add helper function to get connection
export async function getConnection(runtime: IAgentRuntime): Promise<Connection> {
  return new Connection(
    runtime.getSetting("RPC_URL") || "https://api.mainnet-beta.solana.com",
  );
}

