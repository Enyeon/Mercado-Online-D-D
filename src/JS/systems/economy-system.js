








import { ITEM_RARITIES } from '../data/item-rarities.js';

const MIN_PRICE_FACTOR = 0.5;
const MAX_PRICE_FACTOR = 3;
const MIN_INFLATION_FACTOR = 0.5;
const MAX_INFLATION_FACTOR = 2.5;
const INFLATION_STEP = 0.05;

export class EconomySystem {
    ensureEconomyState(item) {
        return {
            demand: item.economy?.demand ?? 0,
            supply: item.economy?.supply ?? 0,
            inflationFactor: item.economy?.inflationFactor ?? 1,
        };
    }

    getBasePrice(item) {
        return Number(item.marketBasePrice ?? item.basePrice ?? 0);
    }

    getRarityConfig(item) {
        return ITEM_RARITIES[item.rarity] ?? ITEM_RARITIES.common;
    }

    getPriceRange(item) {
        const basePrice = this.getBasePrice(item);
        const rarityMultiplier = this.getRarityConfig(item).multiplier;
        return {
            min: Math.round(basePrice * MIN_PRICE_FACTOR),
            max: Math.round(basePrice * rarityMultiplier * MAX_PRICE_FACTOR),
        };
    }

    clampPrice(item, price, { log = false, reason = 'fuera de rango' } = {}) {
        const { min, max } = this.getPriceRange(item);
        const numericPrice = Number.isFinite(price) ? price : this.getBasePrice(item);
        const clamped = Math.round(Math.min(Math.max(numericPrice, min), max));

        if (log && clamped !== Math.round(numericPrice)) {
            console.warn(`[ECONOMY] Precio ajustado: ${Math.round(numericPrice)} → ${clamped} (${reason})`);
        }

        return clamped;
    }

    getInflationFactor(item) {
        const economy = this.ensureEconomyState(item);
        const rawFactor = 1 + (economy.demand - economy.supply) * INFLATION_STEP;
        return Number(Math.min(Math.max(rawFactor, MIN_INFLATION_FACTOR), MAX_INFLATION_FACTOR).toFixed(2));
    }

    getDynamicPrice(item, { log = false } = {}) {
        const basePrice = this.getBasePrice(item);
        const rarityMultiplier = this.getRarityConfig(item).multiplier;
        const inflationFactor = this.getInflationFactor(item);
        const rawPrice = Math.round(basePrice * rarityMultiplier * inflationFactor);
        const clampedPrice = this.clampPrice(item, rawPrice, {
            log,
            reason: inflationFactor > 1 ? 'alta demanda' : inflationFactor < 1 ? 'alto supply' : 'equilibrio económico',
        });

        if (log && clampedPrice !== rawPrice) {
            console.info(`[ECONOMY] Precio dinámico limitado: ${rawPrice} → ${clampedPrice}`);
        }

        return clampedPrice;
    }

    estimateMarketValue(item) {
        return this.getDynamicPrice(item);
    }

    canAfford(playerMoney, totalPrice) {
        return playerMoney >= totalPrice;
    }

    applyTransaction(item, transactionType, quantity = 1) {
        const economy = this.ensureEconomyState(item);
        if (transactionType === 'buy') economy.demand += quantity;
        if (transactionType === 'sell') economy.supply += quantity;
        economy.inflationFactor = this.getInflationFactor({ ...item, economy });
        return economy;
    }

    resetEconomy(items) {
        return items.map((item) => ({
            ...item,
            economy: {
                demand: 0,
                supply: 0,
                inflationFactor: 1,
            },
        }));
    }
}
