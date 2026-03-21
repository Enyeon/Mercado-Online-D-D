








import { asPositiveNumber } from '../utils/validators.js';

export class SellSystem {
    constructor(store, bus, inventorySystem, economySystem) {
        this.store = store;
        this.bus = bus;
        this.inventorySystem = inventorySystem;
        this.economySystem = economySystem;
    }

    estimateValue(item) {
        return this.economySystem.estimateMarketValue(item);
    }

    sellItem(itemId, quantity, customPrice) {
        const state = this.store.getState();
        const item = state.market.items.find((entry) => entry.id === itemId);
        const hasInventory = (state.player.inventory[itemId] ?? 0) >= quantity;
        if (!item) return { ok: false, reason: 'Ítem no encontrado.' };
        if (!hasInventory) return { ok: false, reason: 'No tienes suficientes unidades.' };

        const requestedPrice = asPositiveNumber(customPrice, this.estimateValue(item));
        const unitPrice = this.economySystem.clampPrice(item, requestedPrice, { log: true, reason: 'venta manual fuera de rango' });
        const totalIncome = Math.round(unitPrice * quantity);
        const removed = this.inventorySystem.removeItem(itemId, quantity);
        if (!removed) return { ok: false, reason: 'No se pudo vender el ítem.' };

        this.store.update((draft) => {
            const draftItem = draft.market.items.find((entry) => entry.id === itemId);
            draft.player.money += totalIncome;
            if (draftItem) {
                draftItem.stock = (draftItem.stock ?? 0) + quantity;
                draftItem.economy = this.economySystem.applyTransaction(draftItem, 'sell', quantity);
            }
            return draft;
        });

        this.bus.emit('market:sold', { itemId, quantity, totalIncome, unitPrice });
        return { ok: true, totalIncome, unitPrice };
    }

    createManualItem(payload, itemsById) {
        const nextId = `custom-${crypto.randomUUID().slice(0, 8)}`;
        const basePrice = this.economySystem.clampPrice(
            { marketBasePrice: payload.basePrice, basePrice: payload.basePrice, rarity: payload.rarity },
            payload.basePrice,
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
