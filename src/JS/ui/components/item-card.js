








import { getRarityLabel } from '../../utils/formatters.js';
import { createRarityDots } from './rarity-dots.js';

export function createItemCard({ item, quantity, mode, onSelect }) {
    const card = document.createElement('article');
    card.className = `item-card rarity-${item.rarity}`;
    card.innerHTML = `
        <header class="item-header">
            <h3 class="item-name">${item.name}</h3>
            <div class="rarity-anchor"></div>
            <span class="badge rarity-badge">${getRarityLabel(item.rarity)}</span>
        </header>

        <div class="item-meta">
            <p class="item-type">${item.type}</p>
            <p class="item-kind">${item.entityKind}</p>
        </div>

        <div class="item-footer">
            ${
                mode === 'buy'
                ? `<p class="item-stock">Stock: <strong>${item.stock}</strong></p>`
                : `<p class="item-quantity">Cantidad: <strong>${quantity ?? 0}</strong></p>`
            }
        </div>
    `;

    card.querySelector('.rarity-anchor').appendChild(createRarityDots(item.rarity));
    card.addEventListener('click', () => onSelect(item));
    return card;
}
