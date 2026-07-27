/* eslint-disable prettier/prettier */
/* eslint-disable import/prefer-default-export */
export function convertZarToClaudeTokens(amountInRands: number): number {
  const zarToUsd = 1 / 19; // Adjust to real-time rate if needed
  const usd = amountInRands * zarToUsd;

  const costPerThousandTokensWithProfit = 0.022; // includes 100% profit
  const tokens = (usd / costPerThousandTokensWithProfit) * 1000;

  return Math.floor(tokens); // round down
}
