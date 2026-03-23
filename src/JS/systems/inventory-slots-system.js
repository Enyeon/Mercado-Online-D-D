








import { BASE_OBJECT_CAPACITY, countUsageByType, partitionInventory } from '../inventory.js';

export class InventorySlotsSystem {
    constructor(store) {
        this.store = store;
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
        return countUsageByType(this.store.getState().player.inventory, itemsById);
    }

    canStore(item, quantity, itemsById) {
        const state = this.store.getState();
        const nextInventory = structuredClone(state.player.inventory);
        const previous = nextInventory[item.id]?.quantity ?? 0;
        nextInventory[item.id] = {
            ...(nextInventory[item.id] ?? {}),
            quantity: previous + quantity,
        };

        const capacity = this.getCapacity();
        const usage = countUsageByType(nextInventory, itemsById);

        return {
            ok: usage.objectUsage <= capacity.objectCapacity,
            reason: `Espacio ocupado ${usage.objectUsage} / ${capacity.objectCapacity}`,
        };
    }

    getInventoryLayout(itemsById, backpackOverride = null) {
        const state = this.store.getState();
        return partitionInventory({
            inventory: state.player.inventory,
            order: state.player.inventoryOrder ?? [],
            itemsById,
            capacity: this.getCapacity(backpackOverride).objectCapacity,
        });
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
