








import { createItemCard } from '../components/item-card.js';

export function renderSellView({ container, inventoryEntries, filters, onSelect }) {
    const filtered = inventoryEntries.filter(({ item }) => {
        const byName = item.name.toLowerCase().includes(filters.search.toLowerCase());
        const byType = filters.type === 'all' || item.type === filters.type;
        const byRarity = filters.rarity === 'all' || item.rarity === filters.rarity;
        return byName && byType && byRarity;
    });

    container.innerHTML = '';

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No hay ítems vendibles con esos filtros.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(({ item, quantity }) => {
        fragment.appendChild(createItemCard({ item, quantity, mode: 'sell', onSelect }));
    });

    container.appendChild(fragment);
}
