








import { serializeInventoryForTrade } from './inventory.js';

function isValidTradeItem(item) {
    return Boolean(item)
        && typeof item.id === 'string'
        && item.id.trim().length > 0
        && typeof item.name === 'string'
        && item.name.trim().length > 0
        && typeof item.type === 'string'
        && item.type.trim().length > 0
        && Number.isInteger(item.stack)
        && item.stack > 0;
}

export class TradeService {
    constructor(inventorySystem, itemsByIdGetter) {
        this.inventorySystem = inventorySystem;
        this.itemsByIdGetter = itemsByIdGetter;
    }

    exportItems(items) {
        return JSON.stringify({ version: 1, items }, null, 2);
    }

    exportInventory(entries) {
        return this.exportItems(serializeInventoryForTrade(entries));
    }

    importItems(serialized) {
        let payload;
        try {
            payload = JSON.parse(serialized);
        } catch {
            return { ok: false, reason: 'El código compartido no es un JSON válido.' };
        }

        if (!Array.isArray(payload?.items) || !payload.items.every(isValidTradeItem)) {
            return { ok: false, reason: 'El contenido importado no tiene el formato esperado.' };
        }

        const itemsById = this.itemsByIdGetter();
        const imported = [];

        for (const entry of payload.items) {
            const item = itemsById.get(entry.id);
            if (!item) return { ok: false, reason: `El ítem ${entry.id} no existe en este mercado.` };

            const result = this.inventorySystem.addItem(entry.id, entry.stack, itemsById, { allowOverflow: false });
            if (!result.ok) return result;
            imported.push({ id: entry.id, stack: entry.stack });
        }

        return { ok: true, imported };
    }
}
