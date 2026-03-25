








import { ensureInventoryOrder, normalizeInventoryMap } from './inventory.js';

const STORAGE_KEY = 'mercado-online-player-state';

export class StorageService {
    constructor(storage = window.localStorage, storageKey = STORAGE_KEY) {
        this.storage = storage;
        this.storageKey = storageKey;
    }

    load() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return null;
            console.log('[storage] raw persisted state', JSON.parse(raw));
            const normalized = this.normalizePersistedState(JSON.parse(raw));
            console.log('[storage] normalized persisted state', normalized);
            return normalized;
        } catch (error) {
            console.warn('[STORAGE] No se pudo cargar el estado persistido.', error);
            return null;
        }
    }

    save(state) {
        try {
            const serialized = this.serializeState(state);
            console.log('[storage] saving state snapshot', serialized);
            this.storage.setItem(this.storageKey, JSON.stringify(serialized));
        } catch (error) {
            console.warn('[STORAGE] No se pudo guardar el estado persistido.', error);
        }
    }

    serializeState(state) {
        return {
            gold: state.player.money,
            player: {
                ...state.player,
                inventory: normalizeInventoryMap(state.player.inventory),
                inventoryOrder: ensureInventoryOrder(state.player.inventoryOrder, normalizeInventoryMap(state.player.inventory)),
            },
            market: {
                items: state.market.items,
            },
        };
    }

    normalizePersistedState(savedState) {
        const player = savedState?.player ?? {};
        const inventory = normalizeInventoryMap(savedState?.inventory ?? player.inventory ?? {});
        return {
            gold: Number(savedState?.gold ?? player.money ?? 0),
            player: {
                ...player,
                money: Number(savedState?.gold ?? player.money ?? 0),
                inventory,
                inventoryOrder: ensureInventoryOrder(player.inventoryOrder ?? [], inventory),
                overflowItemIds: Array.isArray(player.overflowItemIds) ? player.overflowItemIds.filter((itemId) => inventory[itemId]) : [],
                equipment: {
                    backpack: player.equipment?.backpack ?? null,
                },
                transport: {
                    backpacks: player.transport?.backpacks ?? [],
                    mounts: player.transport?.mounts ?? [],
                    vehicles: player.transport?.vehicles ?? [],
                },
            },
            market: {
                items: Array.isArray(savedState?.market?.items) ? savedState.market.items : null,
            },
        };
    }
}
