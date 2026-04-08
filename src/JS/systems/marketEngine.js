








const DEFAULT_TICK_INTERVAL_MS = 12000;
const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 3;
const MAX_PRICE_MULTIPLIER = 10;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

function normalizeStock(item) {
    if (item.stock === Infinity || item.isInfiniteStock) return Infinity;
    if (item.stock === '∞') return Infinity;
    const numericStock = Number(item.stock ?? 0);
    return Number.isFinite(numericStock) ? numericStock : 0;
}

export class MarketEngine {
    constructor({ tickIntervalMs = DEFAULT_TICK_INTERVAL_MS } = {}) {
        this.tickIntervalMs = tickIntervalMs;
    }

    ensureItemState(item) {
        const hasInfiniteStock = item.isInfiniteStock || item.stock === Infinity || item.stock === '∞';
        const normalizedStock = normalizeStock(item);
        const fallbackStock = hasInfiniteStock ? Infinity : normalizedStock;
        const maxStock = hasInfiniteStock
            ? Infinity
            : (Number.isFinite(item.maxStock) ? item.maxStock : Math.max(1, Number(fallbackStock || 1)));
        const stock = hasInfiniteStock ? Infinity : clamp(fallbackStock, 0, maxStock);
        const marketBasePrice = Math.max(1, Number(item.marketBasePrice ?? item.basePrice ?? 1));
        return {
            ...item,
            stock,
            maxStock,
            isInfiniteStock: hasInfiniteStock || item.isInfiniteStock === true,
            marketBasePrice,
            basePrice: Math.max(1, Number(item.basePrice ?? marketBasePrice)),
        };
    }

    recalculateDynamicPrice(item, economySystem) {
        const basePrice = Math.max(1, economySystem.getBasePrice(item));
        const stockRatio = item.maxStock > 0 ? clamp(item.stock / item.maxStock, 0, 1) : 0;
        const stockMultiplier = 1 + (1 - stockRatio);
        const inflationFactor = Number(item.economy?.inflationFactor ?? 1);
        const multiplier = clamp(stockMultiplier * inflationFactor, MIN_MULTIPLIER, MAX_MULTIPLIER);
        const rawPrice = Math.round(basePrice * multiplier);
        const maxPrice = Math.max(1, Math.round(basePrice * MAX_PRICE_MULTIPLIER));
        const finalPrice = clamp(rawPrice, 1, maxPrice);

        console.log({
            itemId: item.id,
            basePrice,
            stock: item.stock,
            stockRatio,
            multiplier,
            finalPrice,
        });

        console.log('[MARKET_ENGINE] precio recalculado', {
            itemId: item.id,
            stock: item.stock,
            maxStock: item.maxStock,
            stockRatio,
            inflationFactor,
            multiplier,
            rawPrice,
            maxPrice,
            finalPrice,
        });
        return finalPrice;
    }

    simulateExternalDemand(item) {
        if (item.isInfiniteStock || item.stock === Infinity) return item.stock;

        const rarityWeight = {
            common: { min: -5, max: 5, chance: 1 },
            uncommon: { min: -3, max: 3, chance: 0.85 },
            rare: { min: -2, max: 2, chance: 0.7 },
            veryRare: { min: -1, max: 1, chance: 0.45 },
            epic: { min: -1, max: 1, chance: 0.3 },
            legendary: { min: -1, max: 1, chance: 0.2 },
            unique: { min: -1, max: 1, chance: 0.15 },
        };
        const rarityRule = rarityWeight[item.rarity] ?? { min: -2, max: 2, chance: 0.6 };
        const stockRatio = item.maxStock > 0 ? clamp(item.stock / item.maxStock, 0, 1) : 0;

        let change = 0;
        if (Math.random() < rarityRule.chance) {
            change = randomBetween(rarityRule.min, rarityRule.max);
            if (stockRatio < 0.2) change = Math.max(change, 0);
            if (stockRatio > 0.85) change = Math.min(change, 0);
        }

        const nextStock = clamp(item.stock + change, 0, item.maxStock);
        console.log('[MARKET_ENGINE] stock simulado', {
            itemId: item.id,
            prevStock: item.stock,
            maxStock: item.maxStock,
            stockRatio,
            change,
            nextStock,
        });
        return nextStock;
    }
}

export const marketEngine = new MarketEngine();
