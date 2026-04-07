








import { ITEM_TYPES } from '../../data/items.js';
import { RARITY_OPTIONS } from '../../data/item-rarities.js';

export function bindCreateItemModal({ modal, openButton, onConfirm, onClose }) {
    const form = modal.querySelector('form');
    const raritySelect = modal.querySelector('#modal-rarity');
    const typeSelect = modal.querySelector('#modal-type');

    raritySelect.innerHTML = RARITY_OPTIONS.map((rarity) => `<option value="${rarity.id}">${rarity.label}</option>`).join('');
    typeSelect.innerHTML = ITEM_TYPES.map((type) => `<option value="${type}">${type}</option>`).join('');

    function close() {
        modal.classList.add('hidden');
        form.reset();
        onClose?.();
    }

    openButton.addEventListener('click', () => modal.classList.remove('hidden'));
    modal.querySelector('[data-close-modal]').addEventListener('click', close);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        onConfirm({
            itemMode: String(data.get('itemMode') ?? 'new').trim(),
            existingQuery: String(data.get('existingQuery') ?? '').trim(),
            name: String(data.get('name-objet') ?? '').trim(),
            description: String(data.get('description') ?? '').trim(),
            type: String(data.get('type') ?? '').trim(),
            rarity: String(data.get('rarity') ?? '').trim(),
            quantity: Number.parseInt(String(data.get('quantity') ?? '1'), 10),
            basePrice: Number.parseFloat(String(data.get('basePrice') ?? '1')),
            priceModifierPercent: Number.parseFloat(String(data.get('priceModifierPercent') ?? '0')),
            stackable: data.get('stackable') === 'on',
            slotSize: Number.parseInt(String(data.get('slotSize') ?? '1'), 10),
        }, close);
    });
}
