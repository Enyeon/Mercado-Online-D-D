








import { createItemCard } from '../components/item-card.js';

function createSection(title) {
    const section = document.createElement('div');
    section.className = 'inventory-section';

    const heading = document.createElement('h3');
    heading.className = 'inventory-section-title';
    heading.textContent = title;

    section.appendChild(heading);

    return { section, content: section };
}

export function renderInventoryView({ container, inventoryEntries, onSelect }) {
    container.innerHTML = '';

    const { backpack, visibleItems, overflowItems } = inventoryEntries;

    if (!backpack && !visibleItems.length && !overflowItems.length) {
        container.innerHTML = '<p class="empty-state">Inventario vacío.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    if (backpack) {
        const { section, content } = createSection('Mochila equipada');

        content.appendChild(
            createItemCard({
                item: backpack,
                quantity: 1,
                mode: 'inventory',
                onSelect,
                badge: 'Activa'
            })
        );

        fragment.appendChild(section);
    }

    if (visibleItems.length) {
        const { section, content } = createSection('Objetos activos');

        visibleItems.forEach(({ item, quantity }) => {
            content.appendChild(
                createItemCard({ item, quantity, mode: 'inventory', onSelect })
            );
        });

        fragment.appendChild(section);
    }

    if (overflowItems.length) {
        const { section, content } = createSection('Overflow / inactivos');

        overflowItems.forEach(({ item, quantity }) => {
            content.appendChild(
                createItemCard({
                    item,
                    quantity,
                    mode: 'inventory',
                    onSelect,
                    inactive: true,
                    badge: 'Inactivo'
                })
            );
        });

        fragment.appendChild(section);
    }

    container.appendChild(fragment);
}
