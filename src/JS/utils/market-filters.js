








import { RARITY_ORDER } from '../data/item-rarities.js';

export const DEFAULT_MARKET_FILTERS = {
    search: '',
    rarity: 'all',
    type: 'all',
    entityKind: 'all',
};

export function matchesMarketFilters(item, filters = DEFAULT_MARKET_FILTERS) {
    const normalizedSearch = String(filters.search ?? '').trim().toLowerCase();
    const byName = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);
    const byRarity = filters.rarity === 'all' || item.rarity === filters.rarity;
    const byType = filters.type === 'all' || item.type === filters.type;
    const byEntityKind = filters.entityKind === 'all' || item.entityKind === filters.entityKind;
    return byName && byRarity && byType && byEntityKind;
}

export function sortItemsByRarity(items, rarityOrder = RARITY_ORDER) {
    const rarityIndex = new Map(rarityOrder.map((rarity, index) => [rarity, index]));
    return items
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
            const leftRank = rarityIndex.get(left.item.rarity) ?? Number.MAX_SAFE_INTEGER;
            const rightRank = rarityIndex.get(right.item.rarity) ?? Number.MAX_SAFE_INTEGER;
            if (leftRank !== rightRank) return leftRank - rightRank;
            return left.index - right.index;
        })
        .map(({ item }) => item);
}

export function filterAndSortMarketItems(items, filters, rarityOrder = RARITY_ORDER) {
    return sortItemsByRarity(items.filter((item) => matchesMarketFilters(item, filters)), rarityOrder);
}

export function getMarketFilterOptions(items) {
    const unique = (values) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, 'es'));

    return {
        types: unique(items.map((item) => item.type)),
        entityKinds: unique(items.map((item) => item.entityKind)),
    };
}
