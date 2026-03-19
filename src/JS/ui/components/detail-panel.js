








import {
    formatCurrency,
    getRarityLabel,
} from '../../utils/formatters.js';
import { createRarityDots } from './rarity-dots.js';

export function renderDetailPlaceholder(container, text = 'Selecciona un objeto para ver sus detalles.') {
    container.innerHTML = `<div class="detail-placeholder">${text}</div>`;
}

export function renderBuyDetail({ container, item, estimatedPrice, onBuy }) {
    const extra = [];
    if (item.entityKind === 'backpack') extra.push(`Capacidad +${item.objectSlots} objetos / +${item.weaponSlots} armas`);
    if (item.entityKind === 'mount') extra.push(`Stats: Vel ${item.stats.speed}, Res ${item.stats.resistance}, Ctrl ${item.stats.control}`);
    if (item.entityKind === 'vehicle') extra.push(`Almacenamiento: ${item.storage.objectSlots} obj / ${item.storage.weaponSlots} armas`);

    container.innerHTML = `
        <div class="detail-header rarity-${item.rarity}">
            <h2 class="item-title">${item.name}</h2>
            <div class="detail-rarity"></div>
            <span class="badge rarity-badge">${getRarityLabel(item.rarity)}</span>
        </div>

        <p class="item-description">${item.description ?? 'Sin descripción.'}</p>

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Rareza</span>
                <strong class="value">${getRarityLabel(item.rarity)}</strong>
            </li>

            <li class="detail-line highlight">
                <span class="label">Precio</span>
                <strong class="value gold">${formatCurrency(estimatedPrice)}</strong>
            </li>

            <li class="detail-line">
                <span class="label">Stock</span>
                <strong class="value">${item.stock ?? '∞'}</strong>
            </li>

            ${extra.map((line) => `<li class="detail-extra">${line}</li>`).join('')}
        </ul>

        <div class="detail-actions">
            <label for="buy-quantity" class="input-label">Cantidad</label>
            <input id="buy-quantity" class="input-quantity" type="number" min="1" max="${Math.max(item.stock ?? 1, 1)}" value="1">

            <button id="buy-confirm" class="btn-primary btn-buy">Comprar</button>
        </div>
    `;

    container.querySelector('.detail-rarity').appendChild(createRarityDots(item.rarity));
    container.querySelector('#buy-confirm').addEventListener('click', () => {
        const quantity = Number.parseInt(container.querySelector('#buy-quantity').value, 10) || 1;
        onBuy(quantity);
    });
}

export function renderSellDetail({ container, item, inventoryQty, estimatedPrice, onSell }) {
    container.innerHTML = `
        <div class="detail-header rarity-${item.rarity}">
            <h2 class="item-title">${item.name}</h2>
            <div class="detail-rarity"></div>
            <span class="badge rarity-badge">${getRarityLabel(item.rarity)}</span>
        </div>

        <p class="item-description">${item.description}</p>

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Rareza</span>
                <strong class="value">${getRarityLabel(item.rarity)}</strong>
            </li>

            <li class="detail-line highlight">
                <span class="label">Valor estimado</span>
                <strong class="value gold">${formatCurrency(estimatedPrice)}</strong>
            </li>

            <li class="detail-line">
                <span class="label">En inventario</span>
                <strong class="value">${inventoryQty}</strong>
            </li>
        </ul>

        <div class="detail-actions">
            <label for="sell-quantity" class="input-label">Cantidad</label>
            <input id="sell-quantity" class="input-quantity" type="number" min="1" max="${inventoryQty}" value="1">

            <label for="sell-price" class="input-label">Precio unitario</label>
            <input id="sell-price" class="input-price" type="number" min="1" value="${estimatedPrice}">

            <button id="sell-confirm" class="btn-primary btn-sell">Publicar venta</button>
        </div>
    `;

    container.querySelector('.detail-rarity').appendChild(createRarityDots(item.rarity));
    container.querySelector('#sell-confirm')?.addEventListener('click', () => {
        const quantity = Number.parseInt(container.querySelector('#sell-quantity').value, 10) || 1;
        const price = Number.parseFloat(container.querySelector('#sell-price').value) || estimatedPrice;
        onSell(quantity, price);
    });
}
