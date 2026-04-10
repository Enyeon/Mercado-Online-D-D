








import { RARITY_OPTIONS } from '../../data/item-rarities.js';

function buildOptions(items) {
    return items.map((item) => `<option value="${item.value}">${item.label}</option>`).join('');
}

function startCase(value) {
    return String(value)
        .replace(/([A-Z])/g, ' $1')
        .replace(/[-_]/g, ' ')
        .replace(/^./, (char) => char.toUpperCase())
        .trim();
}

export function renderFilters(container, { options, filters }) {
    container.innerHTML = `
        <select id="type-filter" class="form-select">
            ${buildOptions([{ value: 'all', label: 'Todos los tipos' }, ...options.types.map((type) => ({ value: type, label: startCase(type) }))])}
        </select>
        <select id="entity-kind-filter" class="form-select">
            ${buildOptions([{ value: 'all', label: 'Todas las clases' }, ...options.entityKinds.map((kind) => ({ value: kind, label: startCase(kind) }))])}
        </select>
        <select id="rarity-filter" class="form-select">
            ${buildOptions([{ value: 'all', label: 'Todas las rarezas' }, ...RARITY_OPTIONS.map((rarity) => ({ value: rarity.id, label: rarity.label }))])}
        </select>
        <input id="search-input" class="form-select" placeholder="Buscar reliquias, monturas o artefactos..." type="text" value="${filters.search ?? ''}" />
    `;

    container.querySelector('#type-filter').value = filters.type ?? 'all';
    container.querySelector('#rarity-filter').value = filters.rarity ?? 'all';
    container.querySelector('#entity-kind-filter').value = filters.entityKind ?? 'all';
}
