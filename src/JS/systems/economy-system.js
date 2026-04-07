








import { ITEM_RARITIES } from '../data/item-rarities.js';
import { currencySystem } from './currency-system.js';

const MIN_PRICE_FACTOR = 0.5;
const MAX_PRICE_FACTOR = 3;
const MIN_INFLATION_FACTOR = 0.5;
const MAX_INFLATION_FACTOR = 2.5;
const INFLATION_STEP = 0.05;

const VENDOR_PROFILES = {
    breeder: { markup: 1.08, buyRate: 0.6, stressSensitivity: 1.1 },
    arcane: { markup: 1.2, buyRate: 0.55, stressSensitivity: 1 },
    smuggler: { markup: 1.15, buyRate: 0.5, stressSensitivity: 0.85 },
};

const RARITY_PRICE_SCALING = {
    common: 1,
    uncommon: 1.05,
    rare: 1.12,
    veryRare: 1.2,
    epic: 1.3,
    legendary: 1.45,
    unique: 1.65,
};

function normalizeStockValue(rawStock) {
    if (rawStock === '∞') return Number.POSITIVE_INFINITY;
    const numericStock = Number(rawStock);
    return Number.isFinite(numericStock) ? Math.max(0, numericStock) : Number.POSITIVE_INFINITY;
}

export function calculateItemPrices(item, vendorType, reputation, marketState) {
    const system = new EconomySystem();
    return system.calculateItemPrices(item, vendorType, reputation, marketState);
}

export class EconomySystem {
    resolveVendorType(item) {
        if (['montura', 'mascota'].includes(item.type) || ['mount', 'pet'].includes(item.entityKind)) return 'breeder';
        if (['artefacto', 'consumible'].includes(item.type)) return 'arcane';
        return 'smuggler';
    }

    getVendorProfile(vendorType = 'smuggler') {
        return VENDOR_PROFILES[vendorType] ?? VENDOR_PROFILES.smuggler;
    }

    ensureEconomyState(item) {
        return {
            demand: item.economy?.demand ?? 0,
            supply: item.economy?.supply ?? 0,
            inflationFactor: item.economy?.inflationFactor ?? 1,
        };
    }

    getBasePrice(item) {
        return currencySystem.getItemPriceInBaseUnits(item.marketBasePrice ?? item.basePrice ?? 0);
    }

    getRarityConfig(item) {
        return ITEM_RARITIES[item.rarity] ?? ITEM_RARITIES.common;
    }

    calculateItemPrices(item, vendorType = 'smuggler', reputation = 0, marketState = {}) {
        const basePrice = this.getBasePrice(item);
        const rarityFactor = RARITY_PRICE_SCALING[item.rarity] ?? 1;
        const economy = this.ensureEconomyState(item);
        const demandPressure = Number(marketState.demand ?? economy.demand ?? 0);
        const supplyPressure = Number(marketState.supply ?? economy.supply ?? 0);
        const stock = normalizeStockValue(marketState.stock ?? item.stock);
        const stockFactor = stock <= 0 ? 1.2 : Math.min(1.2, Math.max(0.85, 1 + (6 - stock) * 0.025));
        const demandFactor = Math.min(1.25, Math.max(0.8, 1 + (demandPressure - supplyPressure) * 0.03));
        const reputationFactor = Math.min(0.15, Math.max(-0.1, reputation * 0.01));
        const vendor = this.getVendorProfile(vendorType);
        const effectiveBase = Math.max(1, basePrice * rarityFactor * stockFactor * demandFactor);

        const vendorMarkup = vendor.markup * (1 - reputationFactor);
        const vendorBuyRate = vendor.buyRate * (1 + reputationFactor * 0.5);
        let buyPrice = Math.round(effectiveBase * vendorMarkup);
        let sellPrice = Math.round(effectiveBase * vendorBuyRate);

        if (sellPrice >= buyPrice) sellPrice = Math.floor(buyPrice * 0.8);
        sellPrice = Math.min(sellPrice, Math.floor(buyPrice * 0.8));
        sellPrice = Math.max(1, sellPrice);
        buyPrice = Math.max(sellPrice + 1, buyPrice);

        return { buyPrice, sellPrice };
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
        const vendorType = this.resolveVendorType(item);
        return this.calculateItemPrices(item, vendorType, 0, { stock: item.stock }).buyPrice;
    }

    canAfford(playerBaseUnits, totalPriceBaseUnits) {
        return playerBaseUnits >= totalPriceBaseUnits;
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
