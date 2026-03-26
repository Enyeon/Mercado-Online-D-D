








import { createRarityDots } from './rarity-dots.js';

export function createItemCard({ item, quantity, mode, onSelect, onTalk, inactive = false, badge = '' }) {
    const card = document.createElement('article');
    card.className = `item-card rarity-${item.rarity}${inactive ? ' is-inactive' : ''}`;
    card.innerHTML = `
        <header class="item-header">
            <h3 class="item-name">${item.name}</h3>
            <div class="rarity-anchor"></div>
        </header>

        <div class="item-footer">
            ${
                mode === 'buy'
                ? `<p class="item-stock">Stock: <strong>${item.stock}</strong></p>`
                : `<p class="item-quantity">Cantidad: <strong>${quantity ?? 0}</strong></p>`
            }
            ${badge ? `<p class="item-state">${badge}</p>` : ''}
        </div>

        <div class="item-meta">
            <span class="item-type">${item.type}</span>
            <span class="item-kind">${item.entityKind}</span>
        </div>
        ${
            mode === 'buy'
            ? '<div class="item-actions"><button class="btn btn-secondary item-talk-btn" data-talk>Hablar con Mercader</button></div>'
            : ''
        }
    `;

    card.querySelector('.rarity-anchor').appendChild(createRarityDots(item.rarity));
    card.addEventListener('click', () => onSelect({ itemId: item.id, inactive }));
    card.querySelector('[data-talk]')?.addEventListener('click', (event) => {
        event.stopPropagation();
        onTalk?.(item);
    });
    return card;
}
