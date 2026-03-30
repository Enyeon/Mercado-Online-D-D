








import {
    formatCurrency,
    getRarityLabel,
} from '../../utils/formatters.js';
import { createRarityDots } from './rarity-dots.js';

export function renderDetailPlaceholder(container, text = 'Selecciona un objeto para ver sus detalles.') {
    container.innerHTML = `<div class="detail-placeholder">${text}</div>`;
}

function renderBackpackStats(item) {
    return `
        <hr class="detail-divider">
        <label class="item-description">Capacidad</label>
        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Objetos</span>
                <strong class="value">+${item.objectSlots}</strong>
            </li>
            <li class="detail-line">
                <span class="label">Armas</span>
                <strong class="value">+${item.weaponSlots}</strong>
            </li>
        </ul>
    `;
}

function renderMountStats(item) {
    return `
        <hr class="detail-divider">
        <label class="item-description">Stats de Montura</label>
        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Velocidad</span>
                <strong class="value">${item.stats.speed}</strong>
            </li>
            <li class="detail-line">
                <span class="label">Resistencia</span>
                <strong class="value">${item.stats.resistance}</strong>
            </li>
            <li class="detail-line">
                <span class="label">
                    <span class="tooltip-icon">
                        ⓘ
                        <span class="tooltip-text">
                            Control (1–10): 1 = Agresivo, 10 = Manso
                        </span>
                    </span>
                    Control
                </span>
                <strong class="value">${item.stats.control}</strong>
            </li>
        </ul>
    `;
}

function renderVehicleStats(item) {
    return `
        <hr class="detail-divider">
        <label class="item-description">Almacenamiento</label>
        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Objetos</span>
                <strong class="value">${item.storage.objectSlots}</strong>
            </li>
            <li class="detail-line">
                <span class="label">Armas</span>
                <strong class="value">${item.storage.weaponSlots}</strong>
            </li>
        </ul>
    `;
}

function renderExtraSection(item) {
    switch (item.entityKind) {
        case 'backpack':
            return renderBackpackStats(item);
        case 'mount':
            return renderMountStats(item);
        case 'vehicle':
            return renderVehicleStats(item);
        default:
            return '';
    }
}

export function renderBuyDetail({ container, item, estimatedPrice, onBuy, systemId }) {
    const maxStock = Number.isFinite(item.stock) ? item.stock : null;
    container.innerHTML = `
        <header class="mite-header rarity-${item.rarity}">
            <h2 class="item-title">${item.name}</h2>
            <div class="detail-rarity"></div>
        </header>

        <p class="item-description">${item.description ?? 'Sin descripción.'}</p>

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Rareza</span>
                <strong class="badge rarity-badge rarity-${item.rarity}">${getRarityLabel(item.rarity)}</strong>
            </li>

            <li class="detail-line highlight">
                <span class="label">Precio</span>
                <strong class="value gold">${formatCurrency(estimatedPrice, { systemId })}</strong>
            </li>

            <li class="detail-line">
                <span class="label">Stock</span>
                <strong class="value">${item.stock ?? '∞'}</strong>
            </li>
        </ul>

        ${renderExtraSection(item)}

        <div class="detail-actions">
            <label for="buy-quantity" class="input-label">Cantidad</label>
            <input
                id="buy-quantity"
                class="form-input"
                type="number"
                min="1"
                ${maxStock ? `max="${maxStock}"` : ''}
                value="1"
            >

            <button id="buy-confirm" class="btn btn-terciary top-btn">Comprar</button>
        </div>
    `;

    container.querySelector('.detail-rarity').appendChild(createRarityDots(item.rarity));
    container.querySelector('#buy-confirm').addEventListener('click', () => {
        const quantity = Number.parseInt(container.querySelector('#buy-quantity').value, 10) || 1;
        onBuy(quantity);
    });
}

export function renderSellDetail({ container, item, inventoryQty, estimatedPrice, onSell, systemId, unitInputValue, unitInputLabel }) {
    container.innerHTML = `
        <div class="detail-header rarity-${item.rarity}">
            <h2 class="item-title">${item.name}</h2>
            <div class="detail-rarity"></div>
        </div>

        <p class="item-description">${item.description}</p>

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Rareza</span>
                <span class="badge rarity-badge rarity-${item.rarity}">${getRarityLabel(item.rarity)}</span>
            </li>

            <li class="detail-line highlight">
                <span class="label">Valor estimado</span>
                <strong class="value gold">${formatCurrency(estimatedPrice, { systemId })}</strong>
            </li>

            <li class="detail-line">
                <span class="label">En inventario</span>
                <strong class="value">${inventoryQty}</strong>
            </li>
        </ul>

        <div class="detail-actions">
            <label for="sell-quantity" class="input-label">Cantidad</label>
            <input id="sell-quantity" class="form-input" type="number" min="1" max="${inventoryQty}" value="1">

            <label for="sell-price" class="input-label">Precio unitario (${unitInputLabel})</label>
            <input id="sell-price" class="form-input" type="number" min="1" value="${unitInputValue}">

            <button id="sell-confirm" class="btn btn-terciary top-btn">Publicar venta</button>
        </div>
    `;

    container.querySelector('.detail-rarity').appendChild(createRarityDots(item.rarity));
    container.querySelector('#sell-confirm')?.addEventListener('click', () => {
        const quantity = Number.parseInt(container.querySelector('#sell-quantity').value, 10) || 1;
        const price = Number.parseFloat(container.querySelector('#sell-price').value) || unitInputValue;
        onSell(quantity, price);
    });
}
