








import { EventBus } from './core/event-bus.js';
import { StateManager } from './core/state-manager.js';
import { INITIAL_ITEMS } from './data/items.js';
import { EconomySystem } from './systems/economy-system.js';
import { InventorySystem } from './systems/inventory-system.js';
import { InventorySlotsSystem } from './systems/inventory-slots-system.js';
import { MarketSystem } from './systems/market-system.js';
import { SellSystem } from './systems/sell-system.js';
import { TransportSystem } from './systems/transport-system.js';
import { createNegotiationState, handlePlayerAction } from './systems/negotiation-system.js';
import { currencySystem } from './systems/currency-system.js';
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
import { renderNegotiationView } from './ui/views/negotiation-view.js';
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
        money: 10,
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
        negotiation: null,
        currencySystemId: 'dnd',
    },
    market: {
        items: structuredClone(INITIAL_ITEMS)
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
const sellSystem = new SellSystem(store, bus, inventorySystem, economySystem, currencySystem);
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

const negotiationRoot = document.createElement('section');
negotiationRoot.id = 'negotiation-view';
negotiationRoot.className = 'negotiation-view hidden';
document.body.appendChild(negotiationRoot);

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
            const wallet = currencySystem.ensurePlayerWallet({ money: persistedState.gold, wallet: persistedState.wallet }, draft.ui.currencySystemId);
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
                        stock: Number(remote.stock ?? item.stock),
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
        state.ui.negotiation = null;
        return state;
    });
}

function openNegotiation(item) {
    const vendorType = economySystem.resolveVendorType(item);
    const negotiationState = createNegotiationState({
        item,
        vendorType,
        reputation: 0,
        performPurchase: (unitPriceLegacyGold) => marketSystem.buyItem(item.id, 1, getItemsById(), unitPriceLegacyGold),
        currencySystem,
        systemId: store.getState().ui.currencySystemId,
    });
    store.patch({ ui: { ...store.getState().ui, negotiation: negotiationState, selectedItemId: item.id } });
    renderApp();
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
    renderBuyDetail({
        container: els.detailPanel,
        item,
        estimatedPrice: currencySystem.getItemPriceInBaseUnits(economySystem.estimateMarketValue(item)),
        systemId: store.getState().ui.currencySystemId,
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
            const result = sellSystem.sellItem(item.id, quantity, customPriceBaseUnits);
            if (!result.ok) return showMessage(result.reason, 'error');
            showMessage(`Venta realizada por ${formatCurrency(result.totalIncomeBaseUnits, { systemId: store.getState().ui.currencySystemId })}.`, 'success');
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
                        ${formatCurrency(currencySystem.getItemPriceInBaseUnits(economySystem.estimateMarketValue(selectedItem)), { systemId: state.ui.currencySystemId })}
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
            onTalk: openNegotiation,
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
    const negotiation = store.getState().ui.negotiation;
    const mode = store.getState().ui.mode;
    const hasNegotiation = Boolean(negotiation);
    els.topbar.classList.toggle('hidden', hasNegotiation);
    els.layout.classList.toggle('hidden', hasNegotiation);
    negotiationRoot.classList.toggle('hidden', !hasNegotiation);

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

function renderNegotiationScreen() {
    const state = store.getState().ui.negotiation;
    if (!state) {
        negotiationRoot.innerHTML = '';
        return;
    }

    renderNegotiationView(state.item, state.vendorType, {
        container: negotiationRoot,
        state,
        onAction: (action) => {
            const updated = handlePlayerAction(action, store.getState().ui.negotiation, {
                currencySystem,
                systemId: store.getState().ui.currencySystemId,
            });
            store.patch({ ui: { ...store.getState().ui, negotiation: updated } });
            if (updated.closed || action === 'leave') {
                store.patch({ ui: { ...store.getState().ui, negotiation: null } });
            }
            renderApp();
        }
    });
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
    renderNegotiationScreen();
    if (!store.getState().ui.negotiation) {
        renderList();
        renderCurrentDetail();
    }
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
            if (!payload.name || !payload.description || payload.quantity <= 0 || payload.basePrice <= 0 || payload.slotSize <= 0) {
                return showMessage('El ritual de creación falló: revisa los datos del objeto.', 'error');
            }

            const result = sellSystem.createManualItem(payload, getItemsById());
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

window.mercadoDebug = {
    supabaseEnabled: gameApi.isEnabled(),
    reloadFromBackend: () => hydrateFromBackend(),
};

renderApp();
hydrateFromBackend();
