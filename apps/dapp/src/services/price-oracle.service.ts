/**
 * Price Oracle Service
 * 
 * Fetches real-time USD prices for supported assets.
 * Uses CoinGecko API (free tier) as the default oracle source.
 */

import { config } from '@/lib/config';

// Supported assets
export type Asset = 'ETH' | 'SOL' | 'BNB' | 'BLT' | 'HYPE' | 'USDT' | 'USDC';

// CoinGecko IDs for assets
const COINGECKO_IDS: Record<Asset, string> = {
    ETH: 'ethereum',
    SOL: 'solana',
    BNB: 'binancecoin',
    BLT: 'believe-trust', // Not listed on CoinGecko yet, uses fallback
    HYPE: 'hyperliquid',
    USDT: 'tether',
    USDC: 'usd-coin',
};

// Asset decimals
const ASSET_DECIMALS: Record<Asset, number> = {
    ETH: 18,
    SOL: 9,
    BNB: 18,
    BLT: 18,
    HYPE: 18,
    USDT: 6,
    USDC: 6,
};

// Cache for prices (TTL: 60 seconds)
interface PriceCache {
    prices: Record<Asset, number>;
    timestamp: number;
}

let priceCache: PriceCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Fetch prices from CoinGecko API
 */
async function fetchPricesFromCoinGecko(): Promise<Record<Asset, number>> {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();

        const prices: Record<Asset, number> = {
            ETH: data[COINGECKO_IDS.ETH]?.usd || 0,
            SOL: data[COINGECKO_IDS.SOL]?.usd || 0,
            BNB: data[COINGECKO_IDS.BNB]?.usd || 0,
            BLT: 0.005, // Target price for BLT
            HYPE: data[COINGECKO_IDS.HYPE]?.usd || 25.0, // Default fallback
            USDT: 1.0, // Stablecoin
            USDC: 1.0, // Stablecoin
        };

        console.log('Price oracle updated:', prices);
        return prices;
    } catch (error) {
        console.error('Failed to fetch prices from CoinGecko:', error);
        throw error;
    }
}

/**
 * Get current prices with caching
 */
export async function getPrices(): Promise<Record<Asset, number>> {
    const now = Date.now();

    // Return cached prices if still valid
    if (priceCache && (now - priceCache.timestamp) < CACHE_TTL_MS) {
        return priceCache.prices;
    }

    // Fetch fresh prices
    try {
        const prices = await fetchPricesFromCoinGecko();
        priceCache = { prices, timestamp: now };
        return prices;
    } catch (error) {
        // Return cached prices if available, even if stale
        if (priceCache) {
            console.warn('Using stale prices due to oracle error');
            return priceCache.prices;
        }

        // Return fallback prices if no cache
        console.warn('Using fallback prices');
        return {
            ETH: 2500,
            SOL: 150,
            BNB: 600,
            BLT: 0.005,
            HYPE: 25.0,
            USDT: 1.0,
            USDC: 1.0,
        };
    }
}

/**
 * Get USD value for a specific amount of an asset
 */
export async function getUsdValue(asset: Asset, amount: bigint): Promise<number> {
    // Stablecoins: direct conversion
    if (asset === 'USDT' || asset === 'USDC') {
        const decimals = ASSET_DECIMALS[asset];
        return Number(amount) / Math.pow(10, decimals);
    }

    // Get current price
    const prices = await getPrices();
    const price = prices[asset];

    if (!price) {
        console.warn(`No price available for ${asset}`);
        return 0;
    }

    const decimals = ASSET_DECIMALS[asset];
    const normalizedAmount = Number(amount) / Math.pow(10, decimals);

    return normalizedAmount * price;
}

/**
 * Get price for a specific asset
 */
export async function getAssetPrice(asset: Asset): Promise<number> {
    const prices = await getPrices();
    return prices[asset] || 0;
}

/**
 * Convert USD amount to asset amount
 */
export async function usdToAsset(usdAmount: number, asset: Asset): Promise<bigint> {
    const price = await getAssetPrice(asset);
    if (!price) throw new Error(`No price available for ${asset}`);

    const assetAmount = usdAmount / price;
    const decimals = ASSET_DECIMALS[asset];

    return BigInt(Math.floor(assetAmount * Math.pow(10, decimals)));
}

/**
 * Get asset decimals
 */
export function getAssetDecimals(asset: Asset): number {
    return ASSET_DECIMALS[asset];
}

/**
 * Format asset amount for display
 */
export function formatAssetAmount(amount: bigint, asset: Asset): string {
    const decimals = ASSET_DECIMALS[asset];
    const value = Number(amount) / Math.pow(10, decimals);

    // Format with appropriate precision
    if (value >= 1000) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (value >= 1) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } else {
        return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
    }
}
