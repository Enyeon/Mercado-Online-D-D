








import { createItemCard } from '../components/item-card.js';
import { filterAndSortMarketItems } from '../../utils/market-filters.js';

export function renderSellView({ container, inventoryEntries, filters, onSelect }) {
    const activeEntries = inventoryEntries.visibleItems;
    const filteredEntries = filterAndSortMarketItems(
        activeEntries.map(({ item }) => item),
        filters,
    );
    const quantityById = new Map(activeEntries.map(({ item, quantity }) => [item.id, quantity]));

    container.innerHTML = '';

    if (!filteredEntries.length) {
        container.innerHTML = '<p class="empty-state">No hay ítems vendibles con esos filtros.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredEntries.forEach((item) => {
        fragment.appendChild(createItemCard({ item, quantity: quantityById.get(item.id) ?? 0, mode: 'sell', onSelect }));
    });

    container.appendChild(fragment);
}
