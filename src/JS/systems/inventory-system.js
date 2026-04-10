








import { addItemSafe, ensureInventoryOrder, getItemQuantity, normalizeInventoryMap, setItemQuantity } from '../inventory.js';

export class InventorySystem {
    constructor(store, bus, slotsSystem) {
        this.store = store;
        this.bus = bus;
        this.slotsSystem = slotsSystem;
        this.operationWindowMs = 120;
        this.recentOperations = new Map();
    }

    isDuplicateOperation(type, itemId, quantity) {
        const now = Date.now();
        const signature = `${type}:${itemId}:${quantity}`;
        const previous = this.recentOperations.get(signature);
        this.recentOperations.set(signature, now);

        for (const [key, timestamp] of this.recentOperations.entries()) {
            if (now - timestamp > this.operationWindowMs) this.recentOperations.delete(key);
        }

        return Number.isFinite(previous) && (now - previous) <= this.operationWindowMs;
    }

    emitInventoryChanged(itemsById) {
        const beforeRefresh = this.store.getState().player.inventory;
        console.log('[inventory] emitInventoryChanged: before refreshOverflow', beforeRefresh);
        if (itemsById) this.slotsSystem.refreshOverflow(itemsById);
        if (itemsById) console.log('[inventory] capacity after mutation', this.slotsSystem.recalculateCapacity(itemsById));
        console.log('[inventory] emitInventoryChanged: after refreshOverflow', this.store.getState().player.inventory);
        this.bus.emit('inventory:changed', this.store.getState().player.inventory);
    }

    addItem(itemId, quantity, itemsById) {
        console.group('[inventory] addItem');
        console.log('before mutation', this.store.getState().player.inventory);
        console.log('request', { itemId, quantity });
        console.log('[BEFORE MUTATION]', itemId, quantity, structuredClone(this.store.getState().player.inventory[itemId] ?? null));
        console.trace('[ADD ITEM]', itemId, quantity);
        if (this.isDuplicateOperation('add', itemId, quantity)) {
            console.warn('[inventory] duplicated addItem operation blocked', { itemId, quantity });
            console.groupEnd();
            return { ok: false, reason: 'Operación duplicada bloqueada.' };
        }
        const item = itemsById.get(itemId);
        if (!item) {
            console.groupEnd();
            return { ok: false, reason: 'Ítem no encontrado.' };
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            console.groupEnd();
            return { ok: false, reason: 'Cantidad inválida.' };
        }

        const canStore = this.slotsSystem.canStore(item, quantity, itemsById);
        if (!canStore.ok) {
            console.groupEnd();
            return { ok: false, reason: `Inventario lleno. ${canStore.reason}` };
        }

        this.store.update((state) => {
            state.player.inventory = normalizeInventoryMap(state.player.inventory);
            state.player.inventoryOrder = ensureInventoryOrder(state.player.inventoryOrder ?? [], state.player.inventory);
            const mutation = addItemSafe(state.player.inventory, item.id, quantity);
            if (!mutation.ok) return state;
            if (mutation.capped) console.warn('[inventory] max stack reached', { itemId: item.id, updated: mutation.updated });
            if (!state.player.inventoryOrder.includes(item.id)) state.player.inventoryOrder.push(item.id);
            return state;
        });

        console.log('after mutation', this.store.getState().player.inventory);
        console.log('[AFTER MUTATION]', itemId, structuredClone(this.store.getState().player.inventory[itemId] ?? null));
        this.emitInventoryChanged(itemsById);
        console.groupEnd();
        return { ok: true };
    }

    removeItem(itemId, quantity, itemsById) {
        console.group('[inventory] removeItem');
        console.log('before mutation', this.store.getState().player.inventory);
        console.log('request', { itemId, quantity });
        console.log('[BEFORE MUTATION]', itemId, quantity, structuredClone(this.store.getState().player.inventory[itemId] ?? null));
        console.trace('[REMOVE ITEM]', itemId, quantity);
        if (this.isDuplicateOperation('remove', itemId, quantity)) {
            console.warn('[inventory] duplicated removeItem operation blocked', { itemId, quantity });
            console.groupEnd();
            return false;
        }
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
        console.log('[AFTER MUTATION]', itemId, structuredClone(this.store.getState().player.inventory[itemId] ?? null));
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
