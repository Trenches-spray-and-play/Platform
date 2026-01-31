/**
 * Token Price Updater
 * 
 * Runs every 5 minutes to:
 * - Fetch current token prices from oracle
 * - Update featured project reserve USD values
 * - Recalculate trench total reserves
 * - Check for low reserve projects
 */

import { updateTokenPrices, type TokenPrice } from '@/services/insuranceService';
import { prisma } from '@/lib/db';

/**
 * Fetch token prices from oracle/API
 * This is a placeholder - implement with actual price oracle
 */
async function fetchTokenPrices(): Promise<TokenPrice[]> {
  // TODO: Implement actual price fetching from:
  // - Chainlink oracles
  // - CoinGecko API
  // - Custom price feeds
  
  // For now, return mock data for testing
  const featuredProjects = await prisma.featuredProject.findMany({
    where: { status: 'ACTIVE' },
    select: { tokenSymbol: true },
    distinct: ['tokenSymbol'],
  });
  
  const timestamp = new Date();
  
  // Mock prices - replace with actual API calls
  const mockPrices: Record<string, number> = {
    'HYPE': 15.50,
    'SOL': 185.20,
    'BLT': 0.005,
    'ETH': 3200.00,
    'BTC': 95000.00,
  };
  
  return featuredProjects.map(project => ({
    tokenSymbol: project.tokenSymbol,
    priceUsd: mockPrices[project.tokenSymbol] || 1.00,
    timestamp,
  }));
}

/**
 * Run price update
 */
export async function runPriceUpdate(): Promise<void> {
  console.log('[PriceUpdater] Starting price update...');
  const startTime = Date.now();
  
  try {
    const prices = await fetchTokenPrices();
    await updateTokenPrices(prices);
    console.log(`[PriceUpdater] Price update completed in ${Date.now() - startTime}ms (${prices.length} tokens)`);
  } catch (error) {
    console.error('[PriceUpdater] Price update failed:', error);
    throw error;
  }
}

/**
 * Start scheduled price updates
 */
export function startPriceUpdates(intervalMinutes: number = 5): void {
  console.log(`[PriceUpdater] Starting scheduled updates (every ${intervalMinutes} minutes)`);
  
  // Run immediately
  runPriceUpdate();
  
  // Schedule recurring runs
  setInterval(runPriceUpdate, intervalMinutes * 60 * 1000);
}

// For manual execution
if (require.main === module) {
  runPriceUpdate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
