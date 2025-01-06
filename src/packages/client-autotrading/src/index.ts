import { Client, IAgentRuntime, elizaLogger } from "@elizaos/core";
import { getWalletBalance } from "@elizaos/plugin-autotrader";

export class AutoTradingClient {  
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;
 
    constructor(runtime: IAgentRuntime) { 
        this.runtime = runtime;

        elizaLogger.log("Initialising auto trading system...");

        // start a loop that runs every x seconds
        this.interval = setInterval(
            async () => {
                await this.analyze();
            },
            10000
        ); // 1 hour in milliseconds
    }

    async analyze() {
        const balance = await getWalletBalance(this.runtime);
        elizaLogger.log(`Wallet balance: ${balance}`);
    }        
}

export const AutoTradingClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new AutoTradingClient(runtime);
        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        console.warn("Direct client does not support stopping yet");
    },
};

export default AutoTradingClientInterface;
