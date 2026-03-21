








import { EventBus } from './core/event-bus.js';
import { StateManager } from './core/state-manager.js';
import { INITIAL_ITEMS } from './data/items.js';
import { EconomySystem } from './systems/economy-system.js';
import { InventorySystem } from './systems/inventory-system.js';
import { InventorySlotsSystem } from './systems/inventory-slots-system.js';
import { MarketSystem } from './systems/market-system.js';
import { SellSystem } from './systems/sell-system.js';
import { TransportSystem } from './systems/transport-system.js';
import { formatCurrency } from './utils/formatters.js';
import { asPositiveInt, asPositiveNumber } from './utils/validators.js';
import { bindCreateItemModal } from './ui/components/create-item-modal.js';
import { bindWarningModal } from './ui/components/warning-modal.js';
import { renderFilters } from './ui/components/filters-bar.js';
import { renderBuyDetail, renderDetailPlaceholder, renderSellDetail } from './ui/components/detail-panel.js';
import { renderInventoryView } from './ui/views/inventory-view.js';
import { renderMarketView } from './ui/views/market-view.js';
import { renderSellView } from './ui/views/sell-view.js';
import { DEFAULT_MARKET_FILTERS, getMarketFilterOptions } from './utils/market-filters.js';

const bus = new EventBus();
const store = new StateManager({
    player: {
        money: 0,
        inventory: {
            'potion-healer': 2,
            'dagger': 1,
        },
        equipment: { backpack: null },
        transport: { backpacks: [], mounts: [], vehicles: [] },
    },
    ui: {
        mode: 'buy',
        marketSection: 'all',
        selectedItemId: null,
        marketFilters: structuredClone(DEFAULT_MARKET_FILTERS),
    },
    market: { items: structuredClone(INITIAL_ITEMS) },
});

const economySystem = new EconomySystem();
const slotsSystem = new InventorySlotsSystem(store);
const inventorySystem = new InventorySystem(store, bus, slotsSystem);
const transportSystem = new TransportSystem(store, bus);
const marketSystem = new MarketSystem(store, bus, inventorySystem, economySystem, transportSystem, slotsSystem);
const sellSystem = new SellSystem(store, bus, inventorySystem, economySystem);

const els = {
    money: document.querySelector('#player-money'),
    itemList: document.querySelector('#item-list'),
    detailPanel: document.querySelector('#item-detail'),
    modeBuy: document.querySelector('#mode-buy'),
    modeSell: document.querySelector('#mode-sell'),
    modeInventory: document.querySelector('#mode-inventory'),
    marketSection: document.querySelector('#market-section'),
    filters: document.querySelector('#filters'),
    createItemBtn: document.querySelector('#create-item-btn'),
    createItemModal: document.querySelector('#create-item-modal'),
    warningModal: document.querySelector('#warning-modal'),
};

const askWarning = bindWarningModal(els.warningModal);


function getItemsById() {
    const map = new Map();
    store.getState().market.items.forEach((item) => map.set(item.id, item));
    return map;
}

function getSelectedItem() {
    const { selectedItemId } = store.getState().ui;
    return store.getState().market.items.find((item) => item.id === selectedItemId) ?? null;
}

function showMessage(text, kind = 'info') {
    const styles = {
        info: 'color: #8aa1ff',
        success: 'color: #6ee7a2',
        warning: 'color: #facc15',
        error: 'color: #ff6b6b; font-weight: bold'
    };

    console.log(`%c[MARKET] ${text}`, styles[kind] || styles.info);
}

function renderMoney() {
    els.money.textContent = `${formatCurrency(store.getState().player.money)}`;
}

function setMode(mode) {
    store.update((state) => {
        state.ui.mode = mode;
        state.ui.selectedItemId = null;
        return state;
    });
}

function renderTransportAndCapacity() {
    const state = store.getState();
    const cap = slotsSystem.getCapacity();
    const usage = slotsSystem.getUsage(getItemsById());
    const backpack = state.player.equipment.backpack?.name ?? '---';
    const mounts = state.player.transport.mounts.length;
    const vehicles = state.player.transport.vehicles.length;

    const vehicleRestriction = mounts > 0 && vehicles > 0
        ? '<p class="system-message error">Restricción activa: monturas no pueden usar almacenamiento de vehículo.</p>'
        : '';

    els.detailPanel.insertAdjacentHTML('beforeend', `
        <hr class="detail-divider">

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Mochila equipada</span>
                <span class="value">${backpack}</span>
            </li>
            <li class="detail-line highlight">
                <span class="label">Capacidad</span>
                <span class="value">${usage.objectUsage}/${cap.objectCapacity}</span>
            </li>
            <li class="detail-line">
                <span><span class="label">Armas ligeras</span> <span class="value">${usage.lightWeapons}</span></span>
                <span><span class="label">Armas pesadas</span> <span class="value">${usage.heavyWeapons}</span></span>
            </li>
            <li class="detail-line">
                <span><span class="label">Monturas</span> <span class="value">${mounts}</span></span>
                <span><span class="label">Vehículos</span> <span class="value">${vehicles}</span></span>
            </li>
            <li class="detail-line">
                ${vehicleRestriction ? `<span class="detail-warning">${vehicleRestriction}</span>` : ''}
            </li>
        </ul>
    `);
}

function executeBuy(item, quantity) {
    const result = marketSystem.buyItem(item.id, quantity, getItemsById());
    if (!result.ok) return showMessage(result.reason, 'error');

    if (item.entityKind === 'backpack') {
        const equipResult = transportSystem.equipBackpack(item.id);
        if (equipResult.warning) showMessage(equipResult.warning, 'error');
    }

    showMessage(`Compra realizada por ${formatCurrency(result.totalCost)}.`, 'success');
    renderApp();
}

function handleBuyDetail(item) {
    renderBuyDetail({
        container: els.detailPanel,
        item,
        estimatedPrice: economySystem.estimateMarketValue(item),
        onBuy: async (quantityRaw) => {
            const quantity = asPositiveInt(quantityRaw, 1);
            const warning = marketSystem.getPurchaseWarning(item.id, getItemsById());

            if (warning) {
                const accepted = await askWarning(warning);
                if (!accepted) {
                    showMessage('Has conservado tu equipo actual. Decisión sabia, aventurero.', 'info');
                    return;
                }
            }

            executeBuy(item, quantity);
        },
    });
    renderTransportAndCapacity();
}

function handleSellDetail(item) {
    const inventoryQty = store.getState().player.inventory[item.id] ?? 0;
    renderSellDetail({
        container: els.detailPanel,
        item,
        inventoryQty,
        estimatedPrice: sellSystem.estimateValue(item),
        onSell: (quantityRaw, customPriceRaw) => {
            const quantity = asPositiveInt(quantityRaw, 1);
            const customPrice = asPositiveNumber(customPriceRaw, sellSystem.estimateValue(item));
            const result = sellSystem.sellItem(item.id, quantity, customPrice);
            if (!result.ok) return showMessage(result.reason, 'error');
            showMessage(`Venta realizada por ${formatCurrency(result.totalIncome)}.`, 'success');
            renderApp();
        },
    });
    renderTransportAndCapacity();
}

function renderCurrentDetail() {
    const state = store.getState();
    const selectedItem = getSelectedItem();
    if (!selectedItem) {
        renderDetailPlaceholder(els.detailPanel);
        renderTransportAndCapacity();
        return;
    }

    if (state.ui.mode === 'buy') return handleBuyDetail(selectedItem);
    if (state.ui.mode === 'sell') return handleSellDetail(selectedItem);

    els.detailPanel.innerHTML = `
        <hr class="detail-divider">

        <div class="detail-section detail-inventory">
            <header class="item-detail__header">
                <h2 class="item-detail__title">${selectedItem.name}</h2>
            </header>

            <p class="item-description">${selectedItem.description ?? 'Sin descripción.'}</p>

            <ul class="detail-list">
                <li class="detail-line">
                    <span class="label">Valor de mercado</span>
                    <span class="value">
                        ${formatCurrency(economySystem.estimateMarketValue(selectedItem))}
                    </span>
                </li>
                <li class="detail-line">
                    <span class="label">Inflación dinámica</span>
                    <span class="value">x${selectedItem.economy?.inflationFactor ?? 1}</span>
                </li>
                <li class="detail-line highlight">
                    <span class="label">Acumulable</span>
                    <span class="value">
                        ${selectedItem.stackable ? 'Sí' : 'No'}
                    </span>
                </li>
                <li class="detail-line">
                    <span class="label">Tamaño de slot</span>
                    <span class="value">
                        ${selectedItem.slotSize ?? 1}
                    </span>
                </li>
            </ul>
        </div>
    `;

    renderTransportAndCapacity();
}

function renderList() {
    const state = store.getState();
    const itemsById = getItemsById();
    const inventoryEntries = inventorySystem.getGroupedInventory(itemsById);
    const selectItem = (item) => {
        store.patch({ ui: { ...store.getState().ui, selectedItemId: item.id } });
        renderCurrentDetail();
    };

    if (state.ui.mode === 'buy') {
        renderMarketView({ container: els.itemList, items: state.market.items, filters: state.ui.marketFilters, onSelect: selectItem });
    }

    if (state.ui.mode === 'inventory') {
        renderInventoryView({ container: els.itemList, inventoryEntries, onSelect: selectItem });
    }

    if (state.ui.mode === 'sell') {
        renderSellView({ container: els.itemList, inventoryEntries, filters: state.ui.marketFilters, onSelect: selectItem });
    }
}

function renderModeUI() {
    const mode = store.getState().ui.mode;
    els.modeBuy.classList.toggle('active', mode === 'buy');
    els.modeSell.classList.toggle('active', mode === 'sell');
    els.modeInventory.classList.toggle('active', mode === 'inventory');
    els.filters.classList.toggle('hidden', mode === 'inventory');
    els.createItemBtn.classList.toggle('hidden', mode !== 'sell');
    els.marketSection.classList.add('hidden');
}

function renderFilterUI() {
    renderFilters(els.filters, {
        options: getMarketFilterOptions(store.getState().market.items),
        filters: store.getState().ui.marketFilters,
    });
}

function renderApp() {
    renderMoney();
    renderModeUI();
    renderFilterUI();
    renderList();
    renderCurrentDetail();
}

function bindEvents() {
    els.modeBuy.addEventListener('click', () => { setMode('buy'); renderApp(); });
    els.modeSell.addEventListener('click', () => { setMode('sell'); renderApp(); });
    els.modeInventory.addEventListener('click', () => { setMode('inventory'); renderApp(); });

    els.filters.addEventListener('input', (event) => {
        const marketFilters = { ...store.getState().ui.marketFilters };
        if (event.target.id === 'search-input') marketFilters.search = event.target.value;
        if (event.target.id === 'type-filter') marketFilters.type = event.target.value;
        if (event.target.id === 'rarity-filter') marketFilters.rarity = event.target.value;
        if (event.target.id === 'entity-kind-filter') marketFilters.entityKind = event.target.value;
        store.patch({ ui: { ...store.getState().ui, marketFilters, selectedItemId: null } });
        renderList();
        renderCurrentDetail();
    });

    bindCreateItemModal({
        modal: els.createItemModal,
        openButton: els.createItemBtn,
        onConfirm: (payload, closeModal) => {
            if (!payload.name || !payload.description || payload.quantity <= 0 || payload.basePrice <= 0 || payload.slotSize <= 0) {
                return showMessage('El ritual de creación falló: revisa los datos del objeto.', 'error');
            }

            const result = sellSystem.createManualItem(payload, getItemsById());
            if (!result.ok) return showMessage(result.reason, 'error');

            closeModal();
            showMessage(`Se forjó ${result.item.name} x${payload.quantity}.`, 'success');
            renderApp();
        },
    });

    bus.on('inventory:changed', () => renderMoney());
}


window.addEventListener('error', (event) => {
    console.error('[MARKET] 💥 ERROR GLOBAL:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[MARKET] 💥 PROMISE NO MANEJADA:', event.reason);
});

bindEvents();
renderApp();
