








export class MarketSystem {
    constructor(store, bus, inventorySystem, economySystem, transportSystem, slotsSystem) {
        this.store = store;
        this.bus = bus;
        this.inventorySystem = inventorySystem;
        this.economySystem = economySystem;
        this.transportSystem = transportSystem;
        this.slotsSystem = slotsSystem;
    }

    getPurchaseWarning(itemId, itemsById) {
        const state = this.store.getState();
        const item = state.market.items.find((entry) => entry.id === itemId);
        if (!item) return null;

        if (item.entityKind === 'backpack') {
            const risk = this.slotsSystem.getBackpackSwapRisk(item, itemsById);
            if (!risk.hasRisk) return null;
            return {
                title: 'Juramento del Mercader',
                message: `Si tomas esta mochila, tus alforjas cambiarán a ${risk.nextCapacity.objectCapacity} espacios de objetos y ${risk.nextCapacity.extraWeaponSlots + risk.nextCapacity.backSlot + risk.nextCapacity.lateralLightSlots} de armas. Podrías perder botín valioso en la transición.`,
            };
        }

        if (item.entityKind === 'mountPack' || item.entityKind === 'vehicle') {
            return {
                title: 'Advertencia del Maestro de Carga',
                message: 'Este cambio de equipo de carga puede reducir el espacio activo de transporte. Si lo haces sin reorganizar tu botín, parte del cargamento podría perderse.',
            };
        }

        return null;
    }

    buyItem(itemId, quantity, itemsById) {
        const state = this.store.getState();
        const item = state.market.items.find((entry) => entry.id === itemId);
        if (!item) return { ok: false, reason: 'Entrada no encontrada.' };
        if ((item.stock ?? 1) < quantity) return { ok: false, reason: 'No hay stock suficiente.' };

        const totalCost = quantity * this.economySystem.estimateMarketValue(item);
        if (!this.economySystem.canAfford(state.player.money, totalCost)) return { ok: false, reason: 'No tienes suficiente dinero.' };

        if (item.entityKind === 'item' || item.entityKind === 'mountPack') {
            const addResult = this.inventorySystem.addItem(itemId, quantity, itemsById);
            if (!addResult.ok) return addResult;
        }

        this.store.update((draft) => {
            const draftItem = draft.market.items.find((entry) => entry.id === itemId);
            if (typeof draftItem.stock === 'number') draftItem.stock -= quantity;
            draft.player.money -= totalCost;
            return draft;
        });

        if (item.entityKind === 'backpack') this.transportSystem.purchaseBackpack(item);
        if (item.entityKind === 'mount') this.transportSystem.purchaseMount(item);
        if (item.entityKind === 'vehicle') this.transportSystem.purchaseVehicle(item);

        this.bus.emit('market:bought', { itemId, quantity, totalCost });
        return { ok: true, totalCost };
    }
}
