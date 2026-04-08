








import { EventBus } from './core/event-bus.js';
import { StateManager } from './core/state-manager.js';
import { INITIAL_ITEMS } from './data/items.js';
import { EconomySystem } from './systems/economy-system.js';
import { InventorySystem } from './systems/inventory-system.js';
import { InventorySlotsSystem } from './systems/inventory-slots-system.js';
import { MarketSystem } from './systems/market-system.js';
import { SellSystem } from './systems/sell-system.js';
import { TransportSystem } from './systems/transport-system.js';
import { currencySystem } from './systems/currency-system.js';
import { marketEngine } from './systems/marketEngine.js';
import { tradeEngine } from './systems/tradeEngine.js';
import { itemEngine } from './systems/itemEngine.js';
import { SupabaseGameAPI } from './game-api.js';
import { TradeService } from './trade.js';
import { setTradeFeedback } from './ui.js';
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

const gameApi = new SupabaseGameAPI();

const bootstrapCount = (globalThis.__MARKET_BOOTSTRAP_COUNT__ ?? 0) + 1;
globalThis.__MARKET_BOOTSTRAP_COUNT__ = bootstrapCount;
console.log('[BOOTSTRAP]', { bootstrapCount });

const initialInventorySeed = {
    'potion-healer': { quantity: 2, hidden: false },
    'dagger': { quantity: 1, hidden: false },
};

const initialState = {
    player: {
        money: 10000,
        inventory: initialInventorySeed,
        inventoryOrder: ['potion-healer', 'dagger'],
        overflowItemIds: [],
        equipment: { backpack: null },
        transport: { backpacks: [], mounts: [], vehicles: [] },
    },
    ui: {
        mode: 'buy',
        marketSection: 'all',
        selectedItemId: null,
        marketFilters: structuredClone(DEFAULT_MARKET_FILTERS),
        currencySystemId: 'dnd',
    },
    market: {
        currentTick: 0,
        items: structuredClone(INITIAL_ITEMS).map((item) => ({ ...item, maxStock: Number.isFinite(item.maxStock) ? item.maxStock : Math.max(1, Number(item.stock ?? 1)) })),
        listings: [],
    },
};

initialState.player.wallet = currencySystem.ensurePlayerWallet(initialState.player, initialState.ui.currencySystemId);
initialState.player.money = initialState.player.wallet.legacyGold;

const bus = new EventBus();
const store = new StateManager(initialState);
const economySystem = new EconomySystem();
const slotsSystem = new InventorySlotsSystem(store);
const inventorySystem = new InventorySystem(store, bus, slotsSystem);
const transportSystem = new TransportSystem(store, bus, slotsSystem);
const marketSystem = new MarketSystem(store, bus, inventorySystem, economySystem, transportSystem, slotsSystem, currencySystem);
const sellSystem = new SellSystem(store, bus, inventorySystem, economySystem, currencySystem, tradeEngine);
const tradeService = new TradeService(inventorySystem, getItemsById);

const els = {
    topbar: document.querySelector('.topbar'),
    layout: document.querySelector('.layout'),
    money: document.querySelector('#player-money'),
    currencyToggle: document.querySelector('#currency-system-toggle'),
    currencyMenu: document.querySelector('#currency-system-menu'),
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
    toggleTrade: document.querySelector('#toggle-trade'),
    tradePanel: document.querySelector('#trade-panel'),
    tradeCopy: document.querySelector('[data-copy]'),
    closeTradeBtn: document.querySelector('[data-close-trade]'),
    openTradeBtn: document.querySelector('#toggle-trade'),
    tradePayload: document.querySelector('[data-trade-payload]'),
    tradeFeedback: document.querySelector('[data-trade-feedback]'),
    tradeExportAll: document.querySelector('[data-export-all]'),
    tradeExportSelected: document.querySelector('[data-export-selected]'),
    tradeImport: document.querySelector('[data-import-items]'),
};

const askWarning = bindWarningModal(els.warningModal);


function bindTradeToggle() {
    els.toggleTrade.addEventListener('click', () => {
        els.tradePanel.classList.toggle('collapsed');
    });
}

function bindTradePanel() {
    els.openTradeBtn.addEventListener('click', () => {
        els.tradePanel.classList.remove('hidden');
    });

    els.closeTradeBtn.addEventListener('click', () => {
        els.tradePanel.classList.add('hidden');
    });

    // cerrar clickeando fondo
    els.tradePanel.addEventListener('click', (e) => {
        if (e.target === els.tradePanel) {
            els.tradePanel.classList.add('hidden');
        }
    });
}

function getItemsById() {
    const map = new Map();
    store.getState().market.items.forEach((item) => map.set(item.id, item));
    return map;
}

function getSelectedItem() {
    const { selectedItemId } = store.getState().ui;
    return store.getState().market.items.find((item) => item.id === selectedItemId)
        ?? store.getState().player.transport.backpacks.find((item) => item.id === selectedItemId)
        ?? null;
}

function showMessage(text, kind = 'info') {
    const styles = {
        info: 'color: #8aa1ff',
        success: 'color: #6ee7a2',
        warning: 'color: #facc15',
        error: 'color: #ff6b6b; font-weight: bold',
    };

    console.log(`%c[MARKET] ${text}`, styles[kind] || styles.info);
}

function normalizeMarketStockValue(stock) {
    if (stock === Infinity || stock === '∞') return Infinity;
    const numericStock = Number(stock);
    if (Number.isNaN(numericStock)) return 0;
    return numericStock;
}

function isValidRewardCandidate(item, sourceItemId) {
    if (!item || typeof item.id !== 'string') return false;
    if (item.id === sourceItemId) return false;
    if (item.canAppearInRewardPool === false) return false;
    if (item.isDebug === true || item.debugOnly === true) return false;
    if (!['item', 'mountPack', 'pet'].includes(item.entityKind)) return false;
    return true;
}

function getRandomRewardFromPool(sourceItem) {
    const allItems = store.getState().market.items;
    const rewardPool = allItems.filter((candidate) => isValidRewardCandidate(candidate, sourceItem.id));
    if (!rewardPool.length) return null;
    const randomIndex = Math.floor(Math.random() * rewardPool.length);
    return rewardPool[randomIndex];
}

let persistQueued = false;
let persistInFlight = false;
let lastPersistedSnapshot = null;

function buildPersistedSnapshot(state) {
    return JSON.stringify({
        gold: state.player.wallet?.legacyGold ?? state.player.money,
        walletBaseUnits: state.player.wallet?.baseUnits ?? 0,
        currencySystemId: state.ui.currencySystemId,
        inventory: state.player.inventory,
        market: state.market.items.map((item) => ({ id: item.id, basePrice: item.basePrice, stock: item.stock })),
    });
}

async function persistState() {
    if (!gameApi.isEnabled()) return;

    const state = store.getState();
    const nextSnapshot = buildPersistedSnapshot(state);

    if (nextSnapshot === lastPersistedSnapshot) {
        return;
    }

    try {
        await gameApi.saveState(state);
        lastPersistedSnapshot = nextSnapshot;
    } catch (error) {
        console.error('[API] saveState failed', error);
    }
}

function queueBackendSync(reason = 'state:update') {
    if (persistQueued || persistInFlight) return;

    persistQueued = true;
    queueMicrotask(async () => {
        persistQueued = false;
        persistInFlight = true;
        console.log('[MARKET] sync queued', reason);
        await persistState();
        persistInFlight = false;
    });
}

async function hydrateFromBackend() {
    if (!gameApi.isEnabled()) return;

    try {
        const persistedState = await gameApi.loadPlayer();
        if (!persistedState) return;

        console.log('[bootstrap] hydrated from Supabase', persistedState);

        store.update((draft) => {
            const wallet = currencySystem.ensurePlayerWallet({ legacyGold: persistedState.gold, wallet: persistedState.wallet }, draft.ui.currencySystemId);
            draft.player.wallet = wallet;
            draft.player.money = wallet.legacyGold;
            draft.player.inventory = persistedState.inventory;
            draft.player.inventoryOrder = Object.keys(persistedState.inventory);

            if (persistedState.marketById?.size) {
                draft.market.items = draft.market.items.map((item) => {
                    const remote = persistedState.marketById.get(item.id);
                    if (!remote) return item;
                    return {
                        ...item,
                        basePrice: Number(remote.price ?? item.basePrice),
                        stock: normalizeMarketStockValue(remote.stock ?? item.stock),
                    };
                });
            }
            return draft;
        });

        slotsSystem.refreshOverflow(getItemsById());
        lastPersistedSnapshot = buildPersistedSnapshot(store.getState());
        renderApp();
    } catch (error) {
        console.error('[API] hydrateFromBackend failed', error);
    }
}


function renderMoney() {
    const state = store.getState();
    const systemId = state.ui.currencySystemId;
    const wallet = currencySystem.ensurePlayerWallet(state.player, systemId);
    els.money.textContent = `${formatCurrency(wallet.baseUnits, { systemId })}`;
    if (els.currencyToggle) {
        const system = currencySystem.getSystem(systemId);
        els.currencyToggle.textContent = system.icon;
        els.currencyToggle.title = `Sistema monetario: ${system.label}`;
    }
    if (els.currencyMenu) {
        els.currencyMenu.value = systemId;
    }
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
    const metrics = slotsSystem.getInventoryMetrics(getItemsById());
    const layout = slotsSystem.getInventoryLayout(getItemsById());
    const backpack = state.player.equipment.backpack?.name ?? '---';
    const mounts = state.player.transport.mounts.length;
    const vehicles = state.player.transport.vehicles.length;
    const vehicleRestriction = mounts > 0 && vehicles > 0
        ? '<p class="system-message error">Restricción activa: monturas no pueden usar almacenamiento de vehículo.</p>'
        : '';

    console.group('[inventory] renderTransportAndCapacity');
    console.log('inventory raw', state.player.inventory);
    console.log('capacity', cap);
    console.log('usage', usage);
    console.log('inventory metrics', metrics);
    console.log('layout visible/overflow counts', { visible: layout.visibleEntries.length, overflow: layout.overflowEntries.length });
    console.groupEnd();

    els.detailPanel.insertAdjacentHTML('beforeend', `
        <hr class="detail-divider">

        <ul class="detail-list">
            <li class="detail-line">
                <span class="label">Mochila equipada</span>
                <span class="value">${backpack}</span>
            </li>
            <li class="detail-line highlight">
                <span class="label">Capacidad</span>
                <span class="value">${usage.objectUsage} / ${cap.objectCapacity}</span>
            </li>
            <li class="detail-line">
                <span><span class="label">Armas</span> <span class="value">${usage.weapons}</span></span>
                <span><span class="label">Mascotas</span> <span class="value">${usage.pets}</span></span>
            </li>
            <li class="detail-line">
                <span><span class="label">Activos</span> <span class="value">${layout.visibleEntries.length}</span></span>
                <span><span class="label">Overflow</span> <span class="value">${layout.overflowEntries.length}</span></span>
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
        const equipResult = transportSystem.equipBackpack(item.id, getItemsById());
        if (!equipResult.ok) showMessage(equipResult.reason, 'error');
    }

    showMessage(`Compra realizada por ${formatCurrency(result.totalCostBaseUnits, { systemId: store.getState().ui.currencySystemId })}.`, 'success');
    renderApp();
}

function handleBuyDetail(item) {
    const resolveUnitPrice = () => {
        const vendorType = economySystem.resolveVendorType(item);
        const { buyPrice } = economySystem.calculateItemPrices(item, vendorType, 0, { stock: item.stock });
        return buyPrice;
    };

    const getCanAffordQuantity = (quantityRaw) => {
        const state = store.getState();
        const quantity = asPositiveInt(quantityRaw, 1);
        const totalCost = quantity * resolveUnitPrice();
        return economySystem.canAfford(state.player.wallet.baseUnits, totalCost);
    };

    const getMaxAffordableQuantity = () => {
        const state = store.getState();
        const unitPrice = Math.max(1, resolveUnitPrice());
        const walletQty = Math.floor(state.player.wallet.baseUnits / unitPrice);
        const stockLimit = Number.isFinite(item.stock) ? item.stock : Number.POSITIVE_INFINITY;
        return Math.max(0, Math.min(walletQty, stockLimit));
    };

    renderBuyDetail({
        container: els.detailPanel,
        item,
        estimatedPrice: economySystem.estimateMarketValue(item),
        systemId: store.getState().ui.currencySystemId,
        canAffordQuantity: getCanAffordQuantity,
        maxAffordableQuantity: getMaxAffordableQuantity,
        onCannotAfford: (button) => {
            button.classList.add('error-shake', 'error-red');
            setTimeout(() => button.classList.remove('error-shake', 'error-red'), 500);
            showMessage('No tienes suficiente dinero para esa cantidad.', 'error');
        },
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
    const inventoryQty = store.getState().player.inventory[item.id]?.quantity ?? 0;
    renderSellDetail({
        container: els.detailPanel,
        item,
        inventoryQty,
        estimatedPrice: sellSystem.estimateValue(item),
        systemId: store.getState().ui.currencySystemId,
        unitInputValue: currencySystem.convertFromBaseUnits(sellSystem.estimateValue(item), { systemId: store.getState().ui.currencySystemId, currencyCode: currencySystem.getSystem(store.getState().ui.currencySystemId).baseCurrency }),
        unitInputLabel: currencySystem.getSystem(store.getState().ui.currencySystemId).baseCurrency,
        onSell: (quantityRaw, customPriceRaw) => {
            const quantity = asPositiveInt(quantityRaw, 1);
            const systemId = store.getState().ui.currencySystemId;
            const baseCurrencyCode = currencySystem.getSystem(systemId).baseCurrency;
            const customPrice = asPositiveNumber(customPriceRaw, currencySystem.convertFromBaseUnits(sellSystem.estimateValue(item), { systemId, currencyCode: baseCurrencyCode }));
            const customPriceBaseUnits = currencySystem.convertToBaseUnits(customPrice, { systemId, currencyCode: baseCurrencyCode });
            const result = sellSystem.publishListing(item.id, quantity, customPriceBaseUnits);
            if (!result.ok) return showMessage(result.reason, 'error');
            showMessage(`Publicación creada. Probabilidad de venta: ${Math.round(result.listing.probability * 100)}%.`, 'success');
            renderApp();
        },
    });
    renderTransportAndCapacity();
}

function tryExecuteInventoryItemAction(selectedItem) {
    if (selectedItem.inventoryAction !== 'open-random-item') return false;

    const actionHtml = `
        <div class="detail-actions">
            <button id="open-special-item" class="btn btn-terciary top-btn">Abrir</button>
        </div>
    `;
    els.detailPanel.insertAdjacentHTML('beforeend', actionHtml);

    els.detailPanel.querySelector('#open-special-item')?.addEventListener('click', () => {
        const itemsById = getItemsById();
        const playerQty = store.getState().player.inventory[selectedItem.id]?.quantity ?? 0;
        if (playerQty <= 0) return showMessage('No tienes unidades disponibles para abrir.', 'error');

        const rewardItem = getRandomRewardFromPool(selectedItem);
        if (!rewardItem) return showMessage('No hay recompensas válidas disponibles en este momento.', 'error');

        const capacityCheck = slotsSystem.canStore(rewardItem, 1, itemsById);
        if (!capacityCheck.ok) return showMessage(`No puedes abrir esta caja: ${capacityCheck.reason}.`, 'error');

        const consumed = inventorySystem.removeItem(selectedItem.id, 1, itemsById);
        if (!consumed) return showMessage('No se pudo consumir la caja sorpresa.', 'error');

        const addResult = inventorySystem.addItem(rewardItem.id, 1, itemsById);
        if (!addResult.ok) {
            inventorySystem.addItem(selectedItem.id, 1, itemsById);
            return showMessage(`No se pudo otorgar la recompensa: ${addResult.reason}`, 'error');
        }

        showMessage(`✨ ¡Abriste la caja y recibiste: ${rewardItem.name}!`, 'success');
        renderApp();
    });

    return true;
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

    const backpackAction = selectedItem.entityKind === 'backpack'
        ? `<div class="detail-actions"><button id="sell-equipped-backpack" class="btn btn-terciary top-btn">Vender mochila equipada</button></div>`
        : '';

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
                        ${formatCurrency(economySystem.estimateMarketValue(selectedItem), { systemId: state.ui.currencySystemId })}
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
            ${backpackAction}
        </div>
    `;

    if (selectedItem.entityKind === 'backpack') {
        els.detailPanel.querySelector('#sell-equipped-backpack')?.addEventListener('click', () => {
            const sale = transportSystem.sellEquippedBackpack(selectedItem.id, getItemsById());
            if (!sale.ok) return showMessage(sale.reason, 'error');

            const totalIncome = sellSystem.estimateValue(selectedItem);
            store.update((draft) => {
                draft.player.wallet.baseUnits += totalIncome;
                draft.player.wallet = currencySystem.serializeWallet(draft.player.wallet);
                draft.player.money = draft.player.wallet.legacyGold;
                const draftItem = draft.market.items.find((entry) => entry.id === selectedItem.id);
                if (draftItem) {
                    draftItem.stock = (draftItem.stock ?? 0) + 1;
                    draftItem.economy = economySystem.applyTransaction(draftItem, 'sell', 1);
                }
                return draft;
            });
            showMessage(`Mochila vendida por ${formatCurrency(totalIncome, { systemId: store.getState().ui.currencySystemId })}.`, 'success');
            renderApp();
        });
    }

    tryExecuteInventoryItemAction(selectedItem);

    renderTransportAndCapacity();
}

function renderList() {
    const state = store.getState();
    console.group('[inventory] renderList');
    console.log('inventory state before render', state.player.inventory);
    const itemsById = getItemsById();
    const inventoryEntries = inventorySystem.getGroupedInventory(itemsById);
    const selectItem = ({ itemId }) => {
        store.patch({ ui: { ...store.getState().ui, selectedItemId: itemId } });
        renderCurrentDetail();
    };

    if (state.ui.mode === 'buy') {
        renderMarketView({
            container: els.itemList,
            items: state.market.items,
            filters: state.ui.marketFilters,
            onSelect: selectItem,
        });
    }

    if (state.ui.mode === 'inventory') {
        console.log('before renderInventoryView', {
            visibleItems: inventoryEntries.visibleItems.map(({ item, quantity }) => ({ id: item.id, quantity })),
            overflowItems: inventoryEntries.overflowItems.map(({ item, quantity }) => ({ id: item.id, quantity })),
        });
        renderInventoryView({ container: els.itemList, inventoryEntries, onSelect: selectItem });
        console.log('after renderInventoryView', {
            domCards: els.itemList.querySelectorAll('.item-card').length,
            domTitles: els.itemList.querySelectorAll('.inventory-section-title').length,
        });
    }

    if (state.ui.mode === 'sell') {
        renderSellView({ container: els.itemList, inventoryEntries, filters: state.ui.marketFilters, onSelect: selectItem });
    }

    if (state.ui.mode === 'inventory') {
        console.group('[inventory] renderList');
        console.log('mode', state.ui.mode);
        console.log('inventory raw', store.getState().player.inventory);
        console.log('inventory order', store.getState().player.inventoryOrder);
        console.log('equipped backpack', store.getState().player.equipment.backpack?.id ?? null);
        console.log('grouped visible', inventoryEntries.visibleItems.map(({ item, quantity }) => ({ id: item.id, quantity })));
        console.log('grouped overflow', inventoryEntries.overflowItems.map(({ item, quantity }) => ({ id: item.id, quantity })));
        const renderedUniqueDataCount = new Set([
            ...(inventoryEntries.backpack ? [inventoryEntries.backpack.id] : []),
            ...inventoryEntries.visibleItems.map(({ item }) => item.id),
            ...inventoryEntries.overflowItems.map(({ item }) => item.id),
        ]).size;
        console.log('dom .item-card count', els.itemList.querySelectorAll('.item-card').length);
        console.log('unique data count', renderedUniqueDataCount);
        console.log('titles ignored by data count', els.itemList.querySelectorAll('.inventory-section-title').length);
        console.groupEnd();
    }

    console.groupEnd();
}

function renderModeUI() {
    const mode = store.getState().ui.mode;

    els.modeBuy.classList.toggle('active', mode === 'buy');
    els.modeSell.classList.toggle('active', mode === 'sell');
    els.modeInventory.classList.toggle('active', mode === 'inventory');
    els.filters.classList.toggle('hidden', mode === 'inventory');
    els.createItemBtn.classList.toggle('hidden', mode !== 'inventory');
    if (mode !== 'inventory') { els.tradePanel.classList.add('hidden'); }
    els.toggleTrade.classList.toggle('hidden', mode !== 'inventory');
    els.openTradeBtn.classList.toggle('hidden', mode !== 'inventory');
    els.marketSection.classList.add('hidden');
}

function renderFilterUI() {
    renderFilters(els.filters, {
        options: getMarketFilterOptions(store.getState().market.items),
        filters: store.getState().ui.marketFilters,
    });
}

function renderApp() {
    console.count('[inventory] renderApp calls');
    renderMoney();
    renderModeUI();
    renderFilterUI();
    renderList();
    renderCurrentDetail();
}

function bindTradeEvents() {
    els.tradeExportAll.addEventListener('click', () => {
        const payload = tradeService.exportInventory(inventorySystem.getGroupedInventory(getItemsById()).visibleItems);
        els.tradePayload.value = payload;
        els.tradePayload.select();
        setTradeFeedback(els.tradeFeedback, 'Inventario activo exportado.', 'success');
    });

    els.tradeExportSelected.addEventListener('click', () => {
        const selectedItem = getSelectedItem();
        if (!selectedItem) {
            setTradeFeedback(els.tradeFeedback, 'Selecciona un ítem del inventario para exportarlo.', 'warning');
            return;
        }
        const quantity = store.getState().player.inventory[selectedItem.id]?.quantity ?? 0;
        if (!quantity) {
            setTradeFeedback(els.tradeFeedback, 'Ese ítem no está disponible para exportación.', 'warning');
            return;
        }

        const payload = tradeService.exportItems([{ id: selectedItem.id, name: selectedItem.name, type: selectedItem.type, stack: quantity }]);
        els.tradePayload.value = payload;
        els.tradePayload.select();
        setTradeFeedback(els.tradeFeedback, 'Ítem seleccionado exportado.', 'success');
    });

    els.tradeImport.addEventListener('click', () => {
        const result = tradeService.importItems(els.tradePayload.value);
        if (!result.ok) {
            setTradeFeedback(els.tradeFeedback, result.reason, 'error');
            return;
        }

        setTradeFeedback(els.tradeFeedback, `Se importaron ${result.imported.length} entradas al inventario.`, 'success');
        renderApp();
    });

    els.tradeCopy.addEventListener('click', async () => {
        const value = els.tradePayload.value.trim();

        if (!value) {
            setTradeFeedback(els.tradeFeedback, 'No hay nada para copiar.', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(value);

            // UX: selecciona el texto igual (feedback visual)
            els.tradePayload.select();

            setTradeFeedback(els.tradeFeedback, 'Código copiado al portapapeles.', 'success');
        } catch (err) {
            // fallback viejo pero confiable
            els.tradePayload.select();
            document.execCommand('copy');

            setTradeFeedback(els.tradeFeedback, 'Copiado (modo compatible).', 'success');
        }
    });
}

function bindCurrencyControls() {
    if (!els.currencyMenu || !els.currencyToggle) return;

    const systems = currencySystem.getAvailableSystems();
    els.currencyMenu.innerHTML = systems
        .map((system) => `<option value="${system.id}">${system.icon} ${system.label}</option>`)
        .join('');

    const toggleMenu = () => {
        els.currencyMenu.classList.toggle('hidden');
    };

    els.currencyToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    els.currencyMenu.addEventListener('change', (event) => {
        const nextSystemId = event.target.value;
        console.info('[CURRENCY] Cambio de sistema activo', { from: store.getState().ui.currencySystemId, to: nextSystemId });
        store.update((draft) => {
            draft.ui.currencySystemId = nextSystemId;
            draft.player.wallet.activeSystemId = nextSystemId;
            draft.player.wallet = currencySystem.serializeWallet(draft.player.wallet);
            draft.player.money = draft.player.wallet.legacyGold;
            return draft;
        });
        els.currencyMenu.classList.add('hidden');
        renderApp();
    });

    document.addEventListener('click', (event) => {
        const isClickInside =
            els.currencyMenu.contains(event.target) ||
            els.currencyToggle.contains(event.target);

        if (!isClickInside) {
            els.currencyMenu.classList.add('hidden');
        }
    });
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
            if (payload.quantity <= 0 || payload.slotSize <= 0) {
                return showMessage('El ritual de creación falló: revisa los datos del objeto.', 'error');
            }

            const existingMatches = itemEngine.findByName(store.getState().market.items, payload.existingQuery);
            const sourceItem = payload.itemMode === 'existing' ? existingMatches[0] : null;
            const derivedName = sourceItem?.name ?? payload.name;
            const derivedDescription = sourceItem?.description ?? payload.description;
            const derivedType = sourceItem?.type ?? payload.type;
            const derivedRarity = sourceItem?.rarity ?? payload.rarity;
            const derivedPrice = sourceItem
                ? itemEngine.computePriceFromRarity(sourceItem.rarity, payload.priceModifierPercent)
                : itemEngine.computePriceFromRarity(derivedRarity, payload.priceModifierPercent);

            if (!derivedName || !derivedDescription) {
                return showMessage('Debes definir nombre y descripción para el ítem.', 'error');
            }

            const result = sellSystem.createManualItem({
                ...payload,
                name: derivedName,
                description: derivedDescription,
                type: derivedType,
                rarity: derivedRarity,
                basePrice: payload.basePrice > 0 ? payload.basePrice : derivedPrice,
            }, getItemsById());
            if (!result.ok) return showMessage(result.reason, 'error');

            closeModal();
            showMessage(`Se forjó ${result.item.name} x${payload.quantity}.`, 'success');
            renderApp();
        }
    });

    bindTradeEvents();

    store.subscribe(() => queueBackendSync('store:subscribe'));
    bus.on('inventory:changed', () => renderMoney());
}

function runMarketCycle() {
    const before = store.getState();
    const nextTick = (before.market.currentTick ?? 0) + 1;

    store.update((draft) => {
        draft.market.currentTick = nextTick;
        draft.market.items = draft.market.items.map((rawItem) => {
            if (Number.isNaN(rawItem.stock)) {
                console.warn('Stock inválido detectado', rawItem);
            }
            if (rawItem.isPriceStatic) {
                return {
                    ...rawItem,
                    basePrice: economySystem.getBasePrice(rawItem),
                    marketBasePrice: economySystem.getBasePrice(rawItem),
                    economy: {
                        ...(rawItem.economy ?? {}),
                        inflationFactor: 1,
                    },
                };
            }
            const item = marketEngine.ensureItemState(rawItem);
            const nextStock = marketEngine.simulateExternalDemand(item);
            const nextItem = { ...item, stock: nextStock };
            const nextPrice = marketEngine.recalculateDynamicPrice(nextItem, economySystem);
            nextItem.basePrice = nextPrice;
            return nextItem;
        });
        return draft;
    });

    const resolved = sellSystem.settleListings(nextTick);
    resolved.forEach((entry) => {
        if (entry.status === 'sold') {
            const total = Math.round(entry.unitPriceBaseUnits * entry.quantity);
            showMessage(`Venta completada (${entry.itemId}) por ${formatCurrency(total, { systemId: store.getState().ui.currencySystemId })}.`, 'success');
        } else {
            showMessage(`Publicación sin venta (${entry.itemId}). El ítem regresó a tu inventario.`, 'warning');
        }
    });

    renderApp();
}


window.addEventListener('error', (event) => {
    console.error('[MARKET] 💥 ERROR GLOBAL:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[MARKET] 💥 PROMISE NO MANEJADA:', event.reason);
});

slotsSystem.refreshOverflow(getItemsById());
bindTradePanel();
bindTradeToggle();
bindCurrencyControls();
bindEvents();

setInterval(runMarketCycle, marketEngine.tickIntervalMs);

window.mercadoDebug = {
    supabaseEnabled: gameApi.isEnabled(),
    reloadFromBackend: () => hydrateFromBackend(),
    runMarketCycle,
};

renderApp();
hydrateFromBackend();
