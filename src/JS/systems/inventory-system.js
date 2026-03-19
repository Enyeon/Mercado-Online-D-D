








export class InventorySystem {
    constructor(store, bus, slotsSystem) {
        this.store = store;
        this.bus = bus;
        this.slotsSystem = slotsSystem;
    }

    addItem(itemId, quantity, itemsById) {
        const item = itemsById.get(itemId);
        if (!item) return { ok: false, reason: 'Ítem no encontrado.' };

        const canStore = this.slotsSystem.canStore(item, quantity, itemsById);
        if (!canStore.ok) {
            return { ok: false, reason: `Inventario lleno. ${canStore.reason}` };
        }

        this.store.update((state) => {
            const previous = state.player.inventory[itemId] ?? 0;
            state.player.inventory[itemId] = previous + quantity;
            return state;
        });

        this.bus.emit('inventory:changed', this.store.getState().player.inventory);
        return { ok: true };
    }

    removeItem(itemId, quantity) {
        let removed = false;

        this.store.update((state) => {
            const previous = state.player.inventory[itemId] ?? 0;
            if (previous < quantity) return state;
            const remaining = previous - quantity;
            if (remaining <= 0) delete state.player.inventory[itemId];
            else state.player.inventory[itemId] = remaining;
            removed = true;
            return state;
        });

        if (removed) this.bus.emit('inventory:changed', this.store.getState().player.inventory);
        return removed;
    }

    getGroupedInventory(itemsById) {
        const { inventory } = this.store.getState().player;
        return Object.entries(inventory)
        .map(([itemId, quantity]) => ({ item: itemsById.get(itemId), quantity }))
        .filter((entry) => Boolean(entry.item));
    }
}
