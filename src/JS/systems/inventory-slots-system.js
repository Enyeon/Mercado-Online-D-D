








export class InventorySlotsSystem {
    constructor(store) {
        this.store = store;
    }

    getCapacity(backpackOverride = null) {
        const state = this.store.getState();
        const equippedBackpack = backpackOverride ?? state.player.equipment.backpack;

        return {
            objectCapacity: 4 + (equippedBackpack?.objectSlots ?? 0),
            lateralLightSlots: 2,
            backSlot: equippedBackpack ? 0 : 1,
            extraWeaponSlots: equippedBackpack?.weaponSlots ?? 0,
        };
    }

    static calculateItemUsage(item, quantity) {
        const size = item.slotSize ?? 1;
        if (item.stackable) return quantity > 0 ? size : 0;
        return quantity * size;
    }

    getUsage(itemsById) {
        const state = this.store.getState();
        const inventory = state.player.inventory;

        let objectUsage = 0;
        let lightWeapons = 0;
        let heavyWeapons = 0;

        for (const [itemId, quantity] of Object.entries(inventory)) {
            if (quantity <= 0) continue;

            const item = itemsById.get(itemId);
            if (!item) continue;

            if (item.type === 'weapon') {
                if (item.weaponType === 'light') {
                    lightWeapons += quantity;
                } else if (item.weaponType === 'heavy') {
                    heavyWeapons += quantity;
                }
                continue;
            }

            const slotSize = item.slotSize ?? 1;

            objectUsage += slotSize;
        }

        return { objectUsage, lightWeapons, heavyWeapons };
    }

    canStore(item, quantity, itemsById) {
        const state = this.store.getState();
        const nextInventory = { ...state.player.inventory };
        nextInventory[item.id] = (nextInventory[item.id] ?? 0) + quantity;

        const capacity = this.getCapacity();
        const usage = this.getUsage(itemsById, nextInventory);

        if (item.type !== 'armas') {
            return {
                ok: usage.objectUsage <= capacity.objectCapacity,
                reason: `Espacio ocupado ${usage.objectUsage}/${capacity.objectCapacity}`,
            };
        }

        const canFitLateralLight = Math.min(usage.lightWeapons, capacity.lateralLightSlots);
        const remainingLight = Math.max(0, usage.lightWeapons - canFitLateralLight);
        const backUsage = Math.min(capacity.backSlot, usage.heavyWeapons + remainingLight);
        const overflowToExtra = (usage.heavyWeapons + remainingLight) - backUsage;

        return {
            ok: overflowToExtra <= capacity.extraWeaponSlots,
            reason: `Armas exceden ranuras disponibles.`,
        };
    }

    getBackpackSwapRisk(newBackpack, itemsById) {
        const currentCapacity = this.getCapacity();
        const nextCapacity = this.getCapacity(newBackpack);
        const usage = this.getUsage(itemsById);

        const objectOverflow = Math.max(0, usage.objectUsage - nextCapacity.objectCapacity);
        const currentWeaponCap = currentCapacity.lateralLightSlots + currentCapacity.backSlot + currentCapacity.extraWeaponSlots;
        const nextWeaponCap = nextCapacity.lateralLightSlots + nextCapacity.backSlot + nextCapacity.extraWeaponSlots;
        const currentWeaponUsage = usage.lightWeapons + usage.heavyWeapons;
        const weaponOverflow = Math.max(0, currentWeaponUsage - nextWeaponCap);

        return {
            hasRisk: objectOverflow > 0 || weaponOverflow > 0 || nextWeaponCap < currentWeaponCap || nextCapacity.objectCapacity < currentCapacity.objectCapacity,
            objectOverflow,
            weaponOverflow,
            nextCapacity,
        };
    }
}
