








import { asPositiveNumber } from '../utils/validators.js';

export class SellSystem {
    constructor(store, bus, inventorySystem, economySystem, currencySystem, tradeEngine) {
        this.store = store;
        this.bus = bus;
        this.inventorySystem = inventorySystem;
        this.economySystem = economySystem;
        this.currencySystem = currencySystem;
        this.tradeEngine = tradeEngine;
    }

    estimateValue(item) {
        const vendorType = this.economySystem.resolveVendorType(item);
        const { sellPrice } = this.economySystem.calculateItemPrices(item, vendorType, 0, { stock: item.stock });
        return sellPrice;
    }

    publishListing(itemId, quantity, customPriceBaseUnits) {
        const state = this.store.getState();
        const item = state.market.items.find((entry) => entry.id === itemId);
        const hasInventory = (state.player.inventory[itemId]?.quantity ?? 0) >= quantity;
        if (!item) return { ok: false, reason: 'Ítem no encontrado.' };
        if (!hasInventory) return { ok: false, reason: 'No tienes suficientes unidades.' };

        const vendorType = this.economySystem.resolveVendorType(item);
        const fairPrices = this.economySystem.calculateItemPrices(item, vendorType, 0, { stock: item.stock });
        const fairPriceBaseUnits = fairPrices.sellPrice;

        const requestedBaseUnits = asPositiveNumber(customPriceBaseUnits, fairPriceBaseUnits);
        const clampedBaseUnits = this.economySystem.clampPrice(item, requestedBaseUnits, { log: true, reason: 'venta manual fuera de rango' });
        const unitPriceBaseUnits = Math.max(1, clampedBaseUnits);

        console.log('[CURRENCY] sellItem conversion', {
            itemId,
            quantity,
            fairPriceBaseUnits,
            fairPriceFormatted: this.currencySystem.formatCurrency(fairPriceBaseUnits, { systemId: state.ui.currencySystemId }),
            requestedBaseUnits,
            clampedBaseUnits,
            unitPriceBaseUnits,
            unitPriceFormatted: this.currencySystem.formatCurrency(unitPriceBaseUnits, { systemId: state.ui.currencySystemId }),
            totalAtListBaseUnits: Math.round(unitPriceBaseUnits * quantity),
            totalAtListFormatted: this.currencySystem.formatCurrency(Math.round(unitPriceBaseUnits * quantity), { systemId: state.ui.currencySystemId }),
        });

        const removed = this.inventorySystem.removeItem(itemId, quantity, new Map(state.market.items.map((entry) => [entry.id, entry])));
        if (!removed) return { ok: false, reason: 'No se pudo publicar el ítem.' };

        const listing = this.tradeEngine.createListing({
            itemId,
            quantity,
            unitPriceBaseUnits,
            marketPriceBaseUnits: fairPriceBaseUnits,
            rarity: item.rarity,
            currentTick: state.market.currentTick ?? 0,
        });

        this.store.update((draft) => {
            draft.market.listings = draft.market.listings ?? [];
            draft.market.listings.push(listing);
            return draft;
        });

        this.bus.emit('market:listing:published', { itemId, quantity, unitPriceBaseUnits, listingId: listing.id });
        return { ok: true, listing, unitPriceBaseUnits };
    }

    settleListings(currentTick) {
        const state = this.store.getState();
        const listings = state.market.listings ?? [];
        const { nextListings, resolved } = this.tradeEngine.evaluateListings(listings, currentTick);
        if (!resolved.length) return [];
        const itemsById = new Map(state.market.items.map((entry) => [entry.id, entry]));

        resolved.forEach((entry) => {
            if (entry.status === 'returned') {
                this.inventorySystem.addItem(entry.itemId, entry.quantity, itemsById);
            }
        });

        this.store.update((draft) => {
            draft.market.listings = nextListings;
            resolved.forEach((entry) => {
                const marketItem = draft.market.items.find((item) => item.id === entry.itemId);
                if (!marketItem) return;
                if (entry.status === 'sold') {
                    const totalIncomeBaseUnits = Math.round(entry.unitPriceBaseUnits * entry.quantity);
                    draft.player.wallet.baseUnits += totalIncomeBaseUnits;
                    draft.player.wallet = this.currencySystem.serializeWallet(draft.player.wallet);
                    draft.player.money = draft.player.wallet.legacyGold;
                    marketItem.economy = this.economySystem.applyTransaction(marketItem, 'sell', entry.quantity);
                }
            });
            return draft;
        });

        resolved.forEach((entry) => {
            this.bus.emit('market:listing:resolved', entry);
        });
        return resolved;
    }

    createManualItem(payload, itemsById) {
        const nextId = `custom-${crypto.randomUUID().slice(0, 8)}`;
        const normalizedBasePrice = this.currencySystem.getItemPriceInBaseUnits(payload.basePrice);
        const basePrice = this.economySystem.clampPrice(
            { marketBasePrice: normalizedBasePrice, basePrice: normalizedBasePrice, rarity: payload.rarity },
            normalizedBasePrice,
        );
        const newItem = {
            id: nextId,
            name: payload.name,
            description: payload.description,
            rarity: payload.rarity,
            type: payload.type,
            basePrice,
            marketBasePrice: basePrice,
            stackable: payload.stackable,
            slotSize: payload.slotSize,
            stock: 0,
            maxStock: Math.max(10, payload.quantity * 4),
            entityKind: payload.entityKind ?? 'item',
            isCustom: true,
            economy: {
                demand: 0,
                supply: 0,
                inflationFactor: 1,
            },
        };

        this.store.update((draft) => {
            draft.market.items.push(newItem);
            return draft;
        });

        itemsById.set(nextId, newItem);
        const result = this.inventorySystem.addItem(nextId, payload.quantity, itemsById);
        if (!result.ok) return result;

        this.bus.emit('market:manual-item-created', newItem);
        return { ok: true, item: newItem };
    }

    resetEconomy() {
        this.store.update((draft) => {
            draft.market.items = this.economySystem.resetEconomy(draft.market.items);
            return draft;
        });
        this.bus.emit('economy:reset');
    }
}
