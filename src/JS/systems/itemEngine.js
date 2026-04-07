const RARITY_BASE_PRICE = {
    common: 100,
    uncommon: 250,
    rare: 800,
    veryRare: 2200,
    epic: 7500,
    legendary: 20000,
    unique: 50000,
};

function clampPercent(percent) {
    return Math.max(-80, Math.min(400, Number(percent ?? 0)));
}

export class ItemEngine {
    findByName(items, query) {
        const normalized = String(query ?? '').trim().toLowerCase();
        if (!normalized) return [];
        return items.filter((item) => item.name.toLowerCase().includes(normalized));
    }

    computePriceFromRarity(rarity, modifierPercent = 0) {
        const baseRarePrice = RARITY_BASE_PRICE[rarity] ?? RARITY_BASE_PRICE.common;
        const modifier = 1 + (clampPercent(modifierPercent) / 100);
        return Math.max(1, Math.round(baseRarePrice * modifier));
    }
}

export const itemEngine = new ItemEngine();
