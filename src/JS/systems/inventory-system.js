








import { ensureInventoryOrder, getItemQuantity, mergeInventoryItem, normalizeInventoryMap, setItemQuantity } from '../inventory.js';

export class InventorySystem {
    constructor(store, bus, slotsSystem) {
        this.store = store;
        this.bus = bus;
        this.slotsSystem = slotsSystem;
    }

    emitInventoryChanged(itemsById) {
        const beforeRefresh = this.store.getState().player.inventory;
        console.log('[inventory] emitInventoryChanged: before refreshOverflow', beforeRefresh);
        if (itemsById) this.slotsSystem.refreshOverflow(itemsById);
        console.log('[inventory] emitInventoryChanged: after refreshOverflow', this.store.getState().player.inventory);
        this.bus.emit('inventory:changed', this.store.getState().player.inventory);
    }

    addItem(itemId, quantity, itemsById) {
        console.group('[inventory] addItem');
        console.log('before mutation', this.store.getState().player.inventory);
        console.log('request', { itemId, quantity });
        const item = itemsById.get(itemId);
        if (!item) {
            console.groupEnd();
            return { ok: false, reason: 'Ítem no encontrado.' };
        }

        const canStore = this.slotsSystem.canStore(item, quantity, itemsById);
        if (!canStore.ok) {
            console.groupEnd();
            return { ok: false, reason: `Inventario lleno. ${canStore.reason}` };
        }

        this.store.update((state) => {
            state.player.inventory = normalizeInventoryMap(state.player.inventory);
            state.player.inventoryOrder = ensureInventoryOrder(state.player.inventoryOrder ?? [], state.player.inventory);
            mergeInventoryItem({ inventory: state.player.inventory, order: state.player.inventoryOrder, item, quantity });
            return state;
        });

        console.log('after mutation', this.store.getState().player.inventory);
        this.emitInventoryChanged(itemsById);
        console.groupEnd();
        return { ok: true };
    }

    removeItem(itemId, quantity, itemsById) {
        console.group('[inventory] removeItem');
        console.log('before mutation', this.store.getState().player.inventory);
        console.log('request', { itemId, quantity });
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

        console.log('after mutation', this.store.getState().player.inventory);
        if (removed) this.emitInventoryChanged(itemsById);
        console.groupEnd();
        return removed;
    }

    getGroupedInventory(itemsById) {
        console.group('[inventory] getGroupedInventory');
        console.log('raw inventory', this.store.getState().player.inventory);
        const layout = this.slotsSystem.getInventoryLayout(itemsById);
        const equippedBackpack = this.store.getState().player.equipment.backpack;
        const grouped = {
            backpack: equippedBackpack,
            visibleItems: layout.visibleEntries,
            overflowItems: layout.overflowEntries,
        };

        console.log('grouped inventory result', {
            backpack: grouped.backpack?.id ?? null,
            visibleItems: grouped.visibleItems.map(({ item, quantity }) => ({ id: item.id, quantity })),
            overflowItems: grouped.overflowItems.map(({ item, quantity }) => ({ id: item.id, quantity })),
        });
        console.groupEnd();

        return grouped;
    }
}
