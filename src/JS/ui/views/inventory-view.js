








import { createItemCard } from '../components/item-card.js';
import { createSectionedItemList } from '../../utils/sectioned-item-list.js';
import { setListContainerLayout } from '../../utils/list-container.js';



export function renderInventoryView({ container, inventoryEntries, onSelect }) {
    console.log('--- RENDER INVENTORY ---');

    setListContainerLayout(container, 'inventory-sections');
    container.innerHTML = '';

    const { backpack, visibleItems, overflowItems } = inventoryEntries;
    console.log('VISIBLE ITEMS RAW:', visibleItems);

    if (!backpack && !visibleItems.length && !overflowItems.length) {
        container.innerHTML = '<p class="empty-state">Inventario vacío.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    if (backpack) {
        const { section, list } = createSectionedItemList({ title: 'Mochila equipada' });

        list.appendChild(
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
        const { section, list } = createSectionedItemList({ title: 'Objetos activos' });

        visibleItems.forEach(({ item, quantity }) => {
            list.appendChild(
                createItemCard({ item, quantity, mode: 'inventory', onSelect })
            );
        });

        fragment.appendChild(section);
    }

    if (overflowItems.length) {
        const { section, list } = createSectionedItemList({ title: 'Overflow / inactivos' });

        overflowItems.forEach(({ item, quantity }) => {
            list.appendChild(
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

    console.group('[inventory] DOM result');
    console.log('sections', container.querySelectorAll('.inventory-section').length);
    console.log('titles', container.querySelectorAll('.inventory-section-title').length);
    console.log('cards', container.querySelectorAll('.item-card').length);
    console.log('all direct children', [...container.children].map((node) => node.className || node.tagName));
    console.groupEnd();
}
