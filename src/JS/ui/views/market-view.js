








import { createItemCard } from '../components/item-card.js';
import { filterAndSortMarketItems } from '../../utils/market-filters.js';

export function renderMarketView({ container, items, filters, onSelect }) {
    container.innerHTML = '';
    const filtered = filterAndSortMarketItems(items, filters);

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No hay entradas disponibles con esos filtros.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => fragment.appendChild(createItemCard({ item, mode: 'buy', onSelect })));
    container.appendChild(fragment);
}
