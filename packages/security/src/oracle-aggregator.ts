/**
 * Multi-Source Oracle Aggregator
 * 
 * Fetches prices from multiple sources and aggregates them
 * with outlier detection and circuit breaker functionality.
 */

interface PriceSource {
    name: string;
    weight: number;
    getPrice: (symbol: string) => Promise<number | null>;
}

interface AggregatedPrice {
    price: number;
    confidence: number;
    sources: { name: string; price: number; weight: number }[];
    timestamp: number;
}

// Circuit breaker state
interface CircuitBreaker {
    lastPrice: number | null;
    lastUpdate: number;
    consecutiveFailures: number;
    isOpen: boolean;
}

const circuitBreakers: Map<string, CircuitBreaker> = new Map();

// Configuration
const MAX_PRICE_DEVIATION = 0.15; // 15% max change between updates
const MAX_SOURCE_DEVIATION = 0.10; // 10% max deviation from median
const MIN_SOURCES = 2; // Minimum sources required for aggregation
const CIRCUIT_BREAKER_THRESHOLD = 3; // Failures before opening circuit

/**
 * Fetch price from CoinGecko
 */
async function fetchCoinGeckoPrice(symbol: string): Promise<number | null> {
    const symbolToId: Record<string, string> = {
        'ETH': 'ethereum',
        'SOL': 'solana',
        'BNB': 'binancecoin',
        'HYPE': 'hyperliquid',
        'USDT': 'tether',
        'USDC': 'usd-coin',
    };

    const coinId = symbolToId[symbol.toUpperCase()];
    if (!coinId) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        return data[coinId]?.usd || null;
    } catch (error) {
        console.error(`CoinGecko fetch failed for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch price from Binance API
 */
async function fetchBinancePrice(symbol: string): Promise<number | null> {
    const symbolToPair: Record<string, string> = {
        'ETH': 'ETHUSDT',
        'SOL': 'SOLUSDT',
        'BNB': 'BNBUSDT',
    };

    const pair = symbolToPair[symbol.toUpperCase()];
    if (!pair) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error(`Binance fetch failed for ${symbol}:`, error);
        return null;
    }
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Check if price deviation is within acceptable bounds
 */
function isDeviationAcceptable(
    newPrice: number,
    lastPrice: number | null,
    maxDeviation: number
): boolean {
    if (!lastPrice) return true;
    const deviation = Math.abs(newPrice - lastPrice) / lastPrice;
    return deviation <= maxDeviation;
}

/**
 * Aggregate prices from multiple sources with outlier detection
 */
export async function getAggregatedPrice(
    symbol: string,
    useCircuitBreaker: boolean = true
): Promise<AggregatedPrice | null> {
    const sources: PriceSource[] = [
        { name: 'coingecko', weight: 0.6, getPrice: fetchCoinGeckoPrice },
        { name: 'binance', weight: 0.4, getPrice: fetchBinancePrice },
    ];

    // Check circuit breaker
    const cb = circuitBreakers.get(symbol) || {
        lastPrice: null,
        lastUpdate: 0,
        consecutiveFailures: 0,
        isOpen: false,
    };

    if (useCircuitBreaker && cb.isOpen) {
        console.warn(`Circuit breaker OPEN for ${symbol}, returning last known price`);
        return cb.lastPrice ? {
            price: cb.lastPrice,
            confidence: 0,
            sources: [],
            timestamp: cb.lastUpdate,
        } : null;
    }

    // Fetch from all sources
    const sourcePrices: { name: string; price: number; weight: number }[] = [];
    
    for (const source of sources) {
        try {
            const price = await source.getPrice(symbol);
            if (price !== null && price > 0) {
                sourcePrices.push({ name: source.name, price, weight: source.weight });
            }
        } catch (error) {
            console.warn(`Source ${source.name} failed for ${symbol}:`, error);
        }
    }

    // Need minimum sources
    if (sourcePrices.length < MIN_SOURCES) {
        cb.consecutiveFailures++;
        if (cb.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
            cb.isOpen = true;
            console.error(`Circuit breaker OPENED for ${symbol} due to insufficient sources`);
        }
        circuitBreakers.set(symbol, cb);
        return null;
    }

    // Calculate median for outlier detection
    const prices = sourcePrices.map(s => s.price);
    const med = median(prices);

    // Filter outliers (>10% from median)
    const validSources = sourcePrices.filter(s => 
        Math.abs(s.price - med) / med <= MAX_SOURCE_DEVIATION
    );

    if (validSources.length < MIN_SOURCES) {
        console.warn(`Too many outliers for ${symbol}, using median`);
        validSources.length = 0;
        validSources.push(...sourcePrices);
    }

    // Calculate weighted average
    const totalWeight = validSources.reduce((sum, s) => sum + s.weight, 0);
    const weightedPrice = validSources.reduce(
        (sum, s) => sum + (s.price * s.weight / totalWeight), 
        0
    );

    // Check circuit breaker for extreme price movement
    if (useCircuitBreaker && !isDeviationAcceptable(weightedPrice, cb.lastPrice, MAX_PRICE_DEVIATION)) {
        console.error(`Price movement exceeds threshold for ${symbol}:`, {
            old: cb.lastPrice,
            new: weightedPrice,
        });
        
        cb.consecutiveFailures++;
        if (cb.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
            cb.isOpen = true;
        }
        circuitBreakers.set(symbol, cb);
        
        // Return stale price rather than potentially manipulated price
        return cb.lastPrice ? {
            price: cb.lastPrice,
            confidence: 0.1,
            sources: validSources,
            timestamp: Date.now(),
        } : null;
    }

    // Success - update circuit breaker
    cb.lastPrice = weightedPrice;
    cb.lastUpdate = Date.now();
    cb.consecutiveFailures = 0;
    cb.isOpen = false;
    circuitBreakers.set(symbol, cb);

    // Calculate confidence based on source spread
    const priceSpread = Math.max(...prices) - Math.min(...prices);
    const confidence = Math.max(0, 1 - (priceSpread / med));

    return {
        price: weightedPrice,
        confidence,
        sources: validSources,
        timestamp: Date.now(),
    };
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(symbol: string): CircuitBreaker | null {
    return circuitBreakers.get(symbol) || null;
}

/**
 * Reset circuit breaker (manual override)
 */
export function resetCircuitBreaker(symbol: string): void {
    circuitBreakers.delete(symbol);
}

/**
 * Get all circuit breaker statuses
 */
export function getAllCircuitBreakerStatuses(): Map<string, CircuitBreaker> {
    return new Map(circuitBreakers);
}
