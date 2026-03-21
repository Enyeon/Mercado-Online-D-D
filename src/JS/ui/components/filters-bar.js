








import { ITEM_TYPES } from '../../data/items.js';
import { RARITY_OPTIONS } from '../../data/item-rarities.js';

function buildOptions(items) {
    return items.map((item) => `<option value="${item.value}">${item.label}</option>`).join('');
}

export function renderFilters(container) {
    container.innerHTML = `
        <input id="search-input" class="form-select" placeholder="Buscar reliquias, armas o artefactos..." type="text" />
        <select id="type-filter" class="form-select">
            ${buildOptions([{ value: 'all', label: 'Todos los tipos' }, ...ITEM_TYPES.map((type) => ({ value: type, label: type }))])}
        </select>
        <select id="rarity-filter" class="form-select">
            ${buildOptions([{ value: 'all', label: 'Todas las rarezas' }, ...RARITY_OPTIONS.map((rarity) => ({ value: rarity.id, label: rarity.label }))])}
        </select>
    `;
}
