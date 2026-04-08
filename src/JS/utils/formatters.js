








import { ITEM_RARITIES } from '../data/item-rarities.js';
import { currencySystem } from '../systems/currency-system.js';

export function formatCurrency(valueInBaseUnits, options = {}) {
    return currencySystem.formatCurrency(valueInBaseUnits, options);
}

export function convertCurrency(value, from, to, systemId) {
    return currencySystem.convertCurrency(value, from, to, systemId);
}

export function getRarityLabel(rarityId) {
    return ITEM_RARITIES[rarityId]?.label ?? rarityId;
}

export function formatStock(stock) {
    return stock === Infinity ? '∞' : stock;
}
