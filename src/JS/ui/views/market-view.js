








import { createItemCard } from '../components/item-card.js';
import { filterAndSortMarketItems } from '../../utils/market-filters.js';
import { setListContainerLayout } from '../../utils/list-container.js';

export function renderMarketView({ container, items, filters, onSelect }) {
    setListContainerLayout(container, 'item-list');
    container.innerHTML = '';
    const filtered = filterAndSortMarketItems(items, filters);

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No hay entradas disponibles con esos filtros.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => fragment.appendChild(createItemCard({ item, mode: 'buy', onSelect })));
    container.appendChild(fragment);

    console.log([...container.children].map(el => el.className));
    console.log('[MARKET] cards', container.querySelectorAll('.item-card').length);
}
