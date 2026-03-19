









export class TransportSystem {
    constructor(store, bus) {
        this.store = store;
        this.bus = bus;
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

    purchaseBackpack(backpack) {
        this.addOwnedEntry('backpacks', backpack);
        this.bus.emit('transport:changed', this.store.getState().player.transport);
    }

    equipBackpack(backpackId) {
        const state = this.store.getState();
        const backpack = state.player.transport.backpacks.find((entry) => entry.id === backpackId);
        if (!backpack) return { ok: false, reason: 'No tienes esa mochila.' };

        this.store.update((draft) => {
            draft.player.equipment.backpack = backpack;
            return draft;
        });

        this.bus.emit('transport:changed', this.store.getState().player.transport);
        return {
            ok: true,
        };
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
