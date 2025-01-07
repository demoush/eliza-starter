import { Plugin } from "@elizaos/core";
import { analyzeTradeAction } from "../actions/analyzeTrade";
import { walletProvider } from "../providers/walletProvider";

import {
    solanaPlugin,
    trustEvaluator,
  } from "@elizaos/plugin-solana";

export const autotraderPlugin: Plugin = {
    name: "[AutoTrader] Onchain Actions with Solana Integration",
    description: "Autonomous trading integration with AI analysis",
    evaluators: [trustEvaluator, ...(solanaPlugin.evaluators || [])],
    providers: [
      walletProvider,
      ...(solanaPlugin.providers || []),
    ],
    actions: [analyzeTradeAction, ...(solanaPlugin.actions || [])],
    services: [],
};
