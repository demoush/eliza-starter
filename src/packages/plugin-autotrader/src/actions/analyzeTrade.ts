import {
    Action,
    composeContext,
    elizaLogger,
    generateText,
    ModelClass,
    parseJSONObjectFromText,
  } from "@elizaos/core";

export const analyzeTradeAction: Action = {
  name: "ANALYZE_TRADE",
  description: "Analyze a token for trading opportunities",
  similes: [
    "ANALYZE",
    "ANALYZE_TOKEN",
    "TRADE",
    "ANALYZE_TRADE",
    "EVALUATE",
    "ASSESS",
  ],
  examples: [],
  validate: async () => true,
  handler: async (runtime, memory, state, params, callback) => { }
}
