








import { createItemCard } from '../components/item-card.js';

export function renderInventoryView({ container, inventoryEntries, onSelect }) {
    container.innerHTML = '';

    if (!inventoryEntries.length) {
        container.innerHTML = '<p class="empty-state">Inventario vacío.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    inventoryEntries.forEach(({ item, quantity }) => {
        fragment.appendChild(createItemCard({ item, quantity, mode: 'inventory', onSelect }));
    });

    container.appendChild(fragment);
}
