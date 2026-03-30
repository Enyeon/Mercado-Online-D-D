








import { normalizeInventoryMap } from './inventory.js';
import { createSupabaseClient } from './supabase-client.js';

const RETRY_DELAYS_MS = [200, 500, 1200];

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries(label, task) {
    let lastError;

    for (let i = 0; i < RETRY_DELAYS_MS.length; i += 1) {
        try {
            return await task();
        } catch (error) {
            lastError = error;
            console.warn(`[API] ${label} retry ${i + 1}/${RETRY_DELAYS_MS.length}`, error);
            await wait(RETRY_DELAYS_MS[i]);
        }
    }

    throw lastError;
}

function toInventoryRows(playerId, inventory) {
    return Object.entries(normalizeInventoryMap(inventory)).map(([itemId, record]) => ({
        player_id: playerId,
        item_id: itemId,
        quantity: record.quantity,
    }));
}

function toMarketRows(items = []) {
    return items.map((item) => ({
        item_id: item.id,
        price: Math.max(0, Number(item.basePrice ?? 0)),
        stock: Math.max(0, Number(item.stock ?? 0)),
    }));
}

export class SupabaseGameAPI {
    constructor(client = createSupabaseClient()) {
        this.client = client;
        this.playerId = null;
    }

    isEnabled() {
        return Boolean(this.client);
    }

    async ensureAuth() {
        if (!this.client) throw new Error('Supabase client is not configured.');

        const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
        if (sessionError) throw sessionError;

        let user = sessionData.session?.user ?? null;

        if (!user) {
            const { data, error } = await this.client.auth.signInAnonymously();
            if (error) throw error;
            user = data.user;
        }

        if (!user) throw new Error('No authenticated user returned by Supabase auth.');
        this.playerId = user.id;
        return user;
    }

    async ensurePlayer() {
        await this.ensureAuth();
        const playerPayload = { id: this.playerId };

        const { error } = await this.client
            .from('players')
            .upsert(playerPayload, { onConflict: 'id', ignoreDuplicates: false });

        if (error) throw error;
    }

    async loadPlayer() {
        if (!this.client) {
            console.warn('[API] Supabase disabled, using in-memory state only.');
            return null;
        }

        return withRetries('loadPlayer', async () => {
            await this.ensurePlayer();

            const [{ data: playerRows, error: playerError }, { data: inventoryRows, error: inventoryError }, { data: marketRows, error: marketError }] = await Promise.all([
                this.client.from('players').select('id, gold').eq('id', this.playerId).limit(1),
                this.client.from('inventory').select('item_id, quantity').eq('player_id', this.playerId),
                this.client.from('market').select('item_id, price, stock'),
            ]);

            if (playerError) throw playerError;
            if (inventoryError) throw inventoryError;
            if (marketError) {
                console.warn('[API] market table unavailable or unreadable, continuing without market sync.', marketError);
            }

            const player = playerRows?.[0] ?? { id: this.playerId, gold: 0 };
            const inventory = normalizeInventoryMap(
                (inventoryRows ?? []).reduce((acc, row) => {
                    acc[row.item_id] = { quantity: row.quantity };
                    return acc;
                }, {}),
            );

            const marketById = new Map((marketRows ?? []).map((row) => [row.item_id, row]));

            return {
                playerId: player.id,
                gold: Number(player.gold ?? 0),
                inventory,
                marketById,
            };
        });
    }

    async saveInventory(inventory) {
        if (!this.client || !this.playerId) return;

        return withRetries('saveInventory', async () => {
            const rows = toInventoryRows(this.playerId, inventory);
            console.log('[API] saveInventory', { items: rows.length });
            const { error } = await this.client.rpc('replace_inventory', {
                p_player_id: this.playerId,
                p_items: rows,
            });

            if (error) throw error;
        });
    }

    async addItem(itemId, quantity) {
        if (!this.client || !this.playerId) return;
        console.log('[API] addItem', { itemId, quantity });

        return withRetries('addItem', async () => {
            const { error } = await this.client.rpc('add_inventory_item', {
                p_player_id: this.playerId,
                p_item_id: itemId,
                p_quantity: quantity,
            });

            if (error) throw error;
        });
    }

    async updateGold(amount) {
        if (!this.client || !this.playerId) return;
        console.log('[API] updateGold', { amount });

        return withRetries('updateGold', async () => {
            const { error } = await this.client.rpc('update_player_gold', {
                p_player_id: this.playerId,
                p_amount: amount,
            });

            if (error) throw error;
        });
    }

    async saveMarket(items) {
        if (!this.client) return;

        return withRetries('saveMarket', async () => {
            const payload = toMarketRows(items);
            const { error } = await this.client
                .from('market')
                .upsert(payload, { onConflict: 'item_id' });

            if (error) throw error;
        });
    }

    async saveState(state) {
        if (!this.client) return;

        await this.ensurePlayer();
        await this.updateGold(state.player.wallet?.legacyGold ?? state.player.money);
        await this.saveInventory(state.player.inventory);
        await this.saveMarket(state.market.items);
    }
}
