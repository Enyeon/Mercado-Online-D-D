








import { createItemCard } from '../components/item-card.js';

export function renderMarketView({ container, items, section, onSelect }) {
    container.innerHTML = '';
    const filtered = items.filter((item) => item.marketSection === section);

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No hay entradas disponibles.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => fragment.appendChild(createItemCard({ item, mode: 'buy', onSelect })));
    container.appendChild(fragment);
}
