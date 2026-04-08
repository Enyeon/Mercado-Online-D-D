








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

export class MarketEngine {
    constructor({ tickIntervalMs = DEFAULT_TICK_INTERVAL_MS } = {}) {
        this.tickIntervalMs = tickIntervalMs;
    }

    ensureItemState(item) {
        const maxStock = Number.isFinite(item.maxStock) ? item.maxStock : Math.max(1, Number(item.stock ?? 1));
        const stock = clamp(Number(item.stock ?? 0), 0, maxStock);
        const marketBasePrice = Math.max(1, Number(item.marketBasePrice ?? item.basePrice ?? 1));
        return {
            ...item,
            stock,
            maxStock,
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
        const rarityWeight = {
            common: 1.15,
            uncommon: 1,
            rare: 0.9,
            veryRare: 0.75,
            epic: 0.65,
            legendary: 0.55,
            unique: 0.5,
        };
        const amplitude = rarityWeight[item.rarity] ?? 1;
        const stockRatio = item.maxStock > 0 ? clamp(item.stock / item.maxStock, 0, 1) : 0;
        const demandSwing = Math.max(1, Math.round(item.maxStock * 0.12 * amplitude));
        const supplySwing = Math.max(1, Math.round(item.maxStock * 0.15 * amplitude));

        let change = 0;
        if (stockRatio < 0.3) {
            change = randomBetween(0, supplySwing);
        } else if (stockRatio > 0.7) {
            change = randomBetween(-demandSwing, 0);
        } else {
            change = randomBetween(-demandSwing, supplySwing);
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
