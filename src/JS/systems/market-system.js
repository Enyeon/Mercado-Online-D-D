








export class MarketSystem {
    constructor(store, bus, inventorySystem, economySystem, transportSystem, slotsSystem, currencySystem) {
        this.store = store;
        this.bus = bus;
        this.inventorySystem = inventorySystem;
        this.economySystem = economySystem;
        this.transportSystem = transportSystem;
        this.slotsSystem = slotsSystem;
        this.currencySystem = currencySystem;
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
                message: `Si tomas esta mochila, tus alforjas cambiarán a ${risk.nextCapacity.objectCapacity} espacios de objetos. ${risk.objectOverflow > 0 ? `Quedarán ${risk.objectOverflow} espacios en overflow hasta reorganizar.` : 'No perderás acceso a tus objetos activos.'}`,
            };
        }

        if (item.entityKind === 'mountPack' || item.entityKind === 'vehicle') {
            return {
                title: 'Advertencia del Maestro de Carga',
                message: 'Este cambio de equipo de carga puede reducir el espacio activo de transporte. Si lo haces sin reorganizar tu botín, parte del cargamento podría quedar inactivo.',
            };
        }

        return null;
    }

    buyItem(itemId, quantity, itemsById, forcedUnitPriceLegacyGold = null) {
        const state = this.store.getState();
        const item = state.market.items.find((entry) => entry.id === itemId);
        if (!item) return { ok: false, reason: 'Entrada no encontrada.' };
        if (Number.isFinite(item.stock) && item.stock < quantity) return { ok: false, reason: 'No hay stock suficiente.' };

        const vendorType = this.economySystem.resolveVendorType(item);
        const { buyPrice } = this.economySystem.calculateItemPrices(item, vendorType, 0, { stock: item.stock });
        const unitPriceLegacyGold = Number.isFinite(forcedUnitPriceLegacyGold)
            ? Math.max(1, Math.round(forcedUnitPriceLegacyGold))
            : buyPrice;

        const unitPriceBaseUnits = this.currencySystem.getItemPriceInBaseUnits(unitPriceLegacyGold);
        const totalCostBaseUnits = quantity * unitPriceBaseUnits;
        const wallet = this.currencySystem.parseWallet(state.player, state.ui.currencySystemId);

        console.log('[CURRENCY] buyItem conversion', {
            itemId,
            quantity,
            unitPriceLegacyGold,
            unitPriceBaseUnits,
            totalCostBaseUnits,
            playerBaseUnits: wallet.baseUnits,
        });

        if (!this.economySystem.canAfford(wallet.baseUnits, totalCostBaseUnits)) return { ok: false, reason: 'No tienes suficiente dinero.' };

        if (['item', 'mountPack', 'pet'].includes(item.entityKind)) {
            const addResult = this.inventorySystem.addItem(itemId, quantity, itemsById);
            if (!addResult.ok) return addResult;
        }

        this.store.update((draft) => {
            const draftItem = draft.market.items.find((entry) => entry.id === itemId);
            if (draftItem && typeof draftItem.stock === 'number') draftItem.stock -= quantity;
            if (draftItem) draftItem.economy = this.economySystem.applyTransaction(draftItem, 'buy', quantity);
            draft.player.wallet.baseUnits = Math.max(0, draft.player.wallet.baseUnits - totalCostBaseUnits);
            draft.player.wallet = this.currencySystem.serializeWallet(draft.player.wallet);
            draft.player.money = draft.player.wallet.legacyGold;
            return draft;
        });

        if (item.entityKind === 'backpack') this.transportSystem.purchaseBackpack(item, itemsById);
        if (item.entityKind === 'mount') this.transportSystem.purchaseMount(item);
        if (item.entityKind === 'vehicle') this.transportSystem.purchaseVehicle(item);

        this.bus.emit('market:bought', { itemId, quantity, totalCostBaseUnits, unitPriceBaseUnits });
        return { ok: true, totalCostBaseUnits, unitPriceBaseUnits };
    }
}
