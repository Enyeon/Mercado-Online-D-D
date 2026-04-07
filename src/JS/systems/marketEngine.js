const DEFAULT_TICK_INTERVAL_MS = 12000;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export class MarketEngine {
    constructor({ tickIntervalMs = DEFAULT_TICK_INTERVAL_MS } = {}) {
        this.tickIntervalMs = tickIntervalMs;
    }

    ensureItemState(item) {
        const maxStock = Number.isFinite(item.maxStock) ? item.maxStock : Math.max(1, Number(item.stock ?? 1));
        const stock = clamp(Number(item.stock ?? 0), 0, maxStock);
        return { ...item, stock, maxStock };
    }

    recalculateDynamicPrice(item, economySystem) {
        const basePrice = economySystem.getBasePrice(item);
        const stockRatio = item.maxStock > 0 ? clamp(item.stock / item.maxStock, 0, 1) : 0;
        const stockMultiplier = 1 + (1 - stockRatio);
        const inflationFactor = Number(item.economy?.inflationFactor ?? 1);
        const nextPrice = Math.max(1, Math.round(basePrice * stockMultiplier * inflationFactor));
        console.log('[MARKET_ENGINE] precio recalculado', { itemId: item.id, stock: item.stock, maxStock: item.maxStock, stockRatio, inflationFactor, nextPrice });
        return nextPrice;
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
        const drift = Math.round((Math.random() * 4 - 2) * amplitude);
        const nextStock = clamp(item.stock + drift, 0, item.maxStock);
        console.log('[MARKET_ENGINE] stock simulado', { itemId: item.id, prevStock: item.stock, drift, nextStock });
        return nextStock;
    }
}

export const marketEngine = new MarketEngine();
