








import { ensureInventoryOrder, normalizeInventoryMap } from './inventory.js';

const STORAGE_KEY = 'mercado-online-player-state';

export class StorageService {
    constructor(storage = window.localStorage, storageKey = STORAGE_KEY) {
        this.storage = storage;
        this.storageKey = storageKey;
        this.lastSavedSnapshot = null;
    }

    load() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return null;
            console.log('[storage] raw persisted state', JSON.parse(raw));
            const normalized = this.normalizePersistedState(JSON.parse(raw));
            console.log('[storage] normalized persisted state', normalized);
            console.log('[LOAD]', structuredClone(normalized?.player?.inventory ?? {}));
            this.lastSavedSnapshot = JSON.stringify(this.serializeState(normalized));
            return normalized;
        } catch (error) {
            console.warn('[STORAGE] No se pudo cargar el estado persistido.', error);
            return null;
        }
    }

    save(state) {
        try {
            const serialized = this.serializeState(state);
            const nextSnapshot = JSON.stringify(serialized);
            if (nextSnapshot === this.lastSavedSnapshot) {
                console.log('[storage] save skipped (unchanged snapshot)');
                return;
            }
            console.log('[storage] saving state snapshot', serialized);
            console.log('[SAVE]', structuredClone(state.player.inventory));
            this.storage.setItem(this.storageKey, nextSnapshot);
            this.lastSavedSnapshot = nextSnapshot;
        } catch (error) {
            console.warn('[STORAGE] No se pudo guardar el estado persistido.', error);
        }
    }

    getStorageKey() {
        return this.storageKey;
    }

    clearGameState({ reload = false } = {}) {
        this.storage.removeItem(this.storageKey);
        this.lastSavedSnapshot = null;
        console.info('[storage] cleared game state key', this.storageKey);
        if (reload) window.location.reload();
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
        const rawInventory = savedState?.inventory ?? player.inventory ?? {};
        const inventory = this.sanitizeInventory(rawInventory);
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

    sanitizeInventory(rawInventory) {
        if (Array.isArray(rawInventory)) {
            return normalizeInventoryMap(
                rawInventory.reduce((accumulator, entry) => {
                    const id = String(entry?.id ?? '').trim();
                    if (!id) return accumulator;
                    const current = accumulator[id]?.quantity ?? 0;
                    accumulator[id] = { quantity: current + (entry?.quantity ?? entry?.stack ?? 0) };
                    return accumulator;
                }, {}),
            );
        }

        return normalizeInventoryMap(rawInventory);
    }
}
