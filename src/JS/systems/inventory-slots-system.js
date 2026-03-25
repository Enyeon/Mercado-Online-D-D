








import {
    BASE_OBJECT_CAPACITY,
    countUsageByType,
    getInventoryDebugSummary,
    partitionInventory
} from '../inventory.js';

export class InventorySlotsSystem {
    constructor(store) {
        this.store = store;
    }

    getEquippedBackpackInventoryIds(state = this.store.getState()) {
        const backpackId = state.player.equipment.backpack?.id;
        if (!backpackId) return [];

        const quantity = state.player.inventory?.[backpackId]?.quantity ?? 0;
        if (quantity <= 0) return [];

        console.warn('[inventory] Equipped backpack found inside inventory map. Excluding it from slot usage/render.', { backpackId, quantity });
        return [backpackId];
    }

    getCapacity(backpackOverride = null) {
        const state = this.store.getState();
        const equippedBackpack = backpackOverride ?? state.player.equipment.backpack;

        return {
            objectCapacity: BASE_OBJECT_CAPACITY + (equippedBackpack?.objectSlots ?? 0),
        };
    }

    static calculateItemUsage(item, quantity) {
        const size = item.slotSize ?? 1;
        if (item.stackable) return quantity > 0 ? size : 0;
        return quantity * size;
    }

    getUsage(itemsById) {
        const state = this.store.getState();
        const excludedIds = this.getEquippedBackpackInventoryIds(state);

        console.group('[inventory] getUsage');
        console.log('inventory snapshot', state.player.inventory);
        console.log('inventory summary', getInventoryDebugSummary(state.player.inventory, itemsById, { excludedIds }));
        console.log('before calculating usage.objectUsage');
        const usage = countUsageByType(state.player.inventory, itemsById, { excludedIds });
        console.log('after calculating usage.objectUsage', usage);
        console.groupEnd();

        return usage;
    }

    canStore(item, quantity, itemsById) {
        console.group('[inventory] canStore');
        console.log('incoming item', { itemId: item.id, quantity, stackable: item.stackable, slotSize: item.slotSize ?? 1 });
        const state = this.store.getState();
        const nextInventory = structuredClone(state.player.inventory);
        const previous = nextInventory[item.id]?.quantity ?? 0;
        nextInventory[item.id] = {
            ...(nextInventory[item.id] ?? {}),
            quantity: previous + quantity,
        };

        const capacity = this.getCapacity();

        console.log('next inventory candidate', nextInventory);
        const excludedIds = [...new Set([
            ...this.getEquippedBackpackInventoryIds(state),
            ...(item.entityKind === 'backpack' ? [item.id] : []),
        ])];
        const usage = countUsageByType(nextInventory, itemsById, { excludedIds });
        console.log('capacity check', { usage, capacity, excludedIds });
        console.groupEnd();

        return {
            ok: usage.objectUsage <= capacity.objectCapacity,
            reason: `Espacio ocupado ${usage.objectUsage} / ${capacity.objectCapacity}`,
        };
    }

    getInventoryLayout(itemsById, backpackOverride = null) {
        const state = this.store.getState();
        const excludedIds = this.getEquippedBackpackInventoryIds(state);

        console.group('[inventory] getInventoryLayout');
        console.log('inventory snapshot', state.player.inventory);
        console.log('inventory order', state.player.inventoryOrder ?? []);
        console.log('inventory summary', getInventoryDebugSummary(state.player.inventory, itemsById, { excludedIds }));

        const layout = partitionInventory({
            inventory: state.player.inventory,
            order: state.player.inventoryOrder ?? [],
            itemsById,
            capacity: this.getCapacity(backpackOverride).objectCapacity,
            excludedIds,
        });

        console.log('layout summary', {
            visibleItems: layout.visibleEntries.map(({ item, quantity }) => ({ id: item.id, quantity })),
            overflowItems: layout.overflowEntries.map(({ item, quantity }) => ({ id: item.id, quantity })),
        });
        console.groupEnd();

        return layout;
    }

    refreshOverflow(itemsById) {
        const layout = this.getInventoryLayout(itemsById);
        this.store.update((draft) => {
            draft.player.overflowItemIds = layout.overflowEntries.map(({ item }) => item.id);
            for (const [itemId, record] of Object.entries(draft.player.inventory)) {
                record.hidden = draft.player.overflowItemIds.includes(itemId);
            }
            return draft;
        });
        return layout;
    }

    getBackpackSwapRisk(newBackpack, itemsById) {
        const currentCapacity = this.getCapacity();
        const nextCapacity = this.getCapacity(newBackpack);
        const usage = this.getUsage(itemsById);

        const objectOverflow = Math.max(0, usage.objectUsage - nextCapacity.objectCapacity);

        return {
            hasRisk: objectOverflow > 0 || nextCapacity.objectCapacity < currentCapacity.objectCapacity,
            objectOverflow,
            nextCapacity,
        };
    }
}
