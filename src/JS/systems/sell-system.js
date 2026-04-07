








import { asPositiveNumber } from '../utils/validators.js';

export class SellSystem {
    constructor(store, bus, inventorySystem, economySystem, currencySystem) {
        this.store = store;
        this.bus = bus;
        this.inventorySystem = inventorySystem;
        this.economySystem = economySystem;
        this.currencySystem = currencySystem;
    }

    estimateValue(item) {
        const vendorType = this.economySystem.resolveVendorType(item);
        const { sellPrice } = this.economySystem.calculateItemPrices(item, vendorType, 0, { stock: item.stock });
        return sellPrice;
    }

    sellItem(itemId, quantity, customPriceBaseUnits) {
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
        const unitPriceBaseUnits = Math.min(fairPriceBaseUnits, clampedBaseUnits);
        const totalIncomeBaseUnits = Math.round(unitPriceBaseUnits * quantity);

        console.log('[CURRENCY] sellItem conversion', {
            itemId,
            quantity,
            fairPriceBaseUnits,
            fairPriceFormatted: this.currencySystem.formatCurrency(fairPriceBaseUnits, { systemId: state.ui.currencySystemId }),
            requestedBaseUnits,
            clampedBaseUnits,
            unitPriceBaseUnits,
            unitPriceFormatted: this.currencySystem.formatCurrency(unitPriceBaseUnits, { systemId: state.ui.currencySystemId }),
            totalIncomeBaseUnits,
            totalIncomeFormatted: this.currencySystem.formatCurrency(totalIncomeBaseUnits, { systemId: state.ui.currencySystemId }),
        });

        const removed = this.inventorySystem.removeItem(itemId, quantity, new Map(state.market.items.map((entry) => [entry.id, entry])));
        if (!removed) return { ok: false, reason: 'No se pudo vender el ítem.' };

        this.store.update((draft) => {
            const draftItem = draft.market.items.find((entry) => entry.id === itemId);
            draft.player.wallet.baseUnits += totalIncomeBaseUnits;
            draft.player.wallet = this.currencySystem.serializeWallet(draft.player.wallet);
            draft.player.money = draft.player.wallet.legacyGold;
            if (draftItem) {
                draftItem.stock = (draftItem.stock ?? 0) + quantity;
                draftItem.economy = this.economySystem.applyTransaction(draftItem, 'sell', quantity);
            }
            return draft;
        });

        this.bus.emit('market:sold', { itemId, quantity, totalIncomeBaseUnits, unitPriceBaseUnits });
        return { ok: true, totalIncomeBaseUnits, unitPriceBaseUnits };
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
