








import { ensureInventoryOrder, getItemQuantity, mergeInventoryItem, normalizeInventoryMap, setItemQuantity } from '../inventory.js';

export class InventorySystem {
    constructor(store, bus, slotsSystem) {
        this.store = store;
        this.bus = bus;
        this.slotsSystem = slotsSystem;
    }

    emitInventoryChanged(itemsById) {
        if (itemsById) this.slotsSystem.refreshOverflow(itemsById);
        this.bus.emit('inventory:changed', this.store.getState().player.inventory);
    }

    addItem(itemId, quantity, itemsById) {
        const item = itemsById.get(itemId);
        if (!item) return { ok: false, reason: 'Ítem no encontrado.' };

        const canStore = this.slotsSystem.canStore(item, quantity, itemsById);
        if (!canStore.ok) {
            return { ok: false, reason: `Inventario lleno. ${canStore.reason}` };
        }

        this.store.update((state) => {
            state.player.inventory = normalizeInventoryMap(state.player.inventory);
            state.player.inventoryOrder = ensureInventoryOrder(state.player.inventoryOrder ?? [], state.player.inventory);
            mergeInventoryItem({ inventory: state.player.inventory, order: state.player.inventoryOrder, item, quantity });
            return state;
        });

        this.emitInventoryChanged(itemsById);
        return { ok: true };
    }

    removeItem(itemId, quantity, itemsById) {
        let removed = false;

        this.store.update((state) => {
            state.player.inventory = normalizeInventoryMap(state.player.inventory);
            const previous = getItemQuantity(state.player.inventory, itemId);
            if (previous < quantity) return state;
            setItemQuantity(state.player.inventory, itemId, previous - quantity);
            state.player.inventoryOrder = ensureInventoryOrder((state.player.inventoryOrder ?? []).filter((entryId) => entryId !== itemId || state.player.inventory[itemId]), state.player.inventory);
            removed = true;
            return state;
        });

        if (removed) this.emitInventoryChanged(itemsById);
        return removed;
    }

    getGroupedInventory(itemsById) {
        const layout = this.slotsSystem.getInventoryLayout(itemsById);
        const equippedBackpack = this.store.getState().player.equipment.backpack;
        return {
            backpack: equippedBackpack,
            visibleItems: layout.visibleEntries,
            overflowItems: layout.overflowEntries,
        };
    }
}
