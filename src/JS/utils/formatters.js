








import { ITEM_RARITIES } from '../data/item-rarities.js';

export function formatCurrency(value) {
    return `${value.toLocaleString('es-ES')} oro`;
}

export function getRarityLabel(rarityId) {
    return ITEM_RARITIES[rarityId]?.label ?? rarityId;
}
