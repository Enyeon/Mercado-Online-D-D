








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

        const unitPrice = asPositiveNumber(customPrice, this.estimateValue(item));
        const totalIncome = Math.round(unitPrice * quantity);
        const removed = this.inventorySystem.removeItem(itemId, quantity);
        if (!removed) return { ok: false, reason: 'No se pudo vender el ítem.' };

        this.store.update((draft) => {
            draft.player.money += totalIncome;
            return draft;
        });

        this.bus.emit('market:sold', { itemId, quantity, totalIncome, unitPrice });
        return { ok: true, totalIncome, unitPrice };
    }

    createManualItem(payload, itemsById) {
        const nextId = `custom-${crypto.randomUUID().slice(0, 8)}`;
        const newItem = {
            id: nextId,
            name: payload.name,
            description: payload.description,
            rarity: payload.rarity,
            type: payload.type,
            marketBasePrice: payload.basePrice,
            stackable: payload.stackable,
            slotSize: payload.slotSize,
            stock: 0,
            entityKind: 'item',
            marketSection: 'items',
            isCustom: true,
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
}
