









export class TransportSystem {
    constructor(store, bus, slotsSystem = null) {
        this.store = store;
        this.bus = bus;
        this.slotsSystem = slotsSystem;
    }

    addOwnedEntry(key, entity) {
        this.store.update((state) => {
            state.player.transport[key].push(entity);
            return state;
        });
    }

    purchaseMount(mount) {
        this.addOwnedEntry('mounts', { ...mount, equippedPack: null, cargo: {} });
        this.bus.emit('transport:changed', this.store.getState().player.transport);
    }

    purchaseVehicle(vehicle) {
        this.addOwnedEntry('vehicles', { ...vehicle, cargo: {} });
        this.bus.emit('transport:changed', this.store.getState().player.transport);
    }

    purchaseBackpack(backpack, itemsById) {
        this.addOwnedEntry('backpacks', backpack);
        this.bus.emit('transport:changed', this.store.getState().player.transport);
        if (!this.store.getState().player.equipment.backpack) this.equipBackpack(backpack.id, itemsById);
    }

    equipBackpack(backpackId, itemsById) {
        const state = this.store.getState();
        const backpack = state.player.transport.backpacks.find((entry) => entry.id === backpackId);
        if (!backpack) return { ok: false, reason: 'No tienes esa mochila.' };

        this.store.update((draft) => {
            draft.player.equipment.backpack = backpack;
            return draft;
        });

        if (this.slotsSystem && itemsById) this.slotsSystem.refreshOverflow(itemsById);
        this.bus.emit('transport:changed', this.store.getState().player.transport);
        return {
            ok: true,
        };
    }

    sellEquippedBackpack(backpackId, itemsById) {
        let soldBackpack = null;

        this.store.update((draft) => {
            const backpacks = draft.player.transport.backpacks;
            const index = backpacks.findIndex((entry) => entry.id === backpackId);
            if (index === -1) return draft;

            [soldBackpack] = backpacks.splice(index, 1);
            if (draft.player.equipment.backpack?.id === backpackId) {
                draft.player.equipment.backpack = backpacks.at(-1) ?? null;
            }
            return draft;
        });

        if (!soldBackpack) return { ok: false, reason: 'No tienes esa mochila.' };
        if (this.slotsSystem && itemsById) this.slotsSystem.refreshOverflow(itemsById);
        this.bus.emit('transport:changed', this.store.getState().player.transport);
        return { ok: true, backpack: soldBackpack };
    }

    attachPackToMount(mountId, pack) {
        const state = this.store.getState();
        const hasVehicle = state.player.transport.vehicles.length > 0;
        if (hasVehicle) {
            return { ok: false, reason: 'No puedes enlazar equipaje de montura cuando ya tienes vehículo de carga activo.' };
        }

        let updated = false;
        this.store.update((draft) => {
            const mount = draft.player.transport.mounts.find((entry) => entry.id === mountId);
            if (!mount) return draft;
            if (!mount.compatiblePackIds.includes(pack.id)) return draft;
            mount.equippedPack = pack;
            updated = true;
            return draft;
        });

        if (!updated) return { ok: false, reason: 'Montura o equipaje no compatibles.' };
        this.bus.emit('transport:changed', this.store.getState().player.transport);
        return { ok: true };
    }
}
