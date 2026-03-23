








export const BASE_OBJECT_CAPACITY = 4;
export const NON_CAPACITY_TYPES = new Set(['mascota', 'montura']);
export const BACKPACK_TYPE = 'mochila';

export function normalizeItemDefinition(item) {
    return {
        stackable: false,
        slotSize: 1,
        ...item,
    };
}

export function createInventoryRecord(quantity = 0) {
    return {
        quantity: Math.max(0, Number(quantity) || 0),
        hidden: false,
    };
}

export function normalizeInventoryMap(inventory = {}) {
    return Object.fromEntries(
        Object.entries(inventory)
            .map(([itemId, value]) => {
                if (typeof value === 'number') return [itemId, createInventoryRecord(value)];
                return [itemId, createInventoryRecord(value?.quantity ?? 0)];
            })
            .filter(([, record]) => record.quantity > 0),
    );
}

export function getItemQuantity(inventory, itemId) {
    return inventory?.[itemId]?.quantity ?? 0;
}

export function setItemQuantity(inventory, itemId, quantity) {
    const nextQuantity = Math.max(0, Number(quantity) || 0);
    if (nextQuantity <= 0) {
        delete inventory[itemId];
        return inventory;
    }

    inventory[itemId] = {
        ...(inventory[itemId] ?? createInventoryRecord()),
        quantity: nextQuantity,
    };
    return inventory;
}

export function ensureInventoryOrder(order = [], inventory = {}) {
    const unique = [];
    const seen = new Set();

    order.forEach((itemId) => {
        if (inventory[itemId] && !seen.has(itemId)) {
            seen.add(itemId);
            unique.push(itemId);
        }
    });

    Object.keys(inventory).forEach((itemId) => {
        if (!seen.has(itemId)) unique.push(itemId);
    });

    return unique;
}

export function mergeInventoryItem({ inventory, order, item, quantity }) {
    const previous = getItemQuantity(inventory, item.id);
    setItemQuantity(inventory, item.id, previous + quantity);
    if (!order.includes(item.id)) order.push(item.id);
}

export function countUsageByType(inventory, itemsById) {
    let weapons = 0;
    let pets = 0;
    let objectUsage = 0;

    for (const [itemId, record] of Object.entries(inventory)) {
        const item = itemsById.get(itemId);
        if (!item || record.quantity <= 0) continue;

        if (item.type === 'arma') weapons += record.quantity;
        if (item.type === 'mascota') pets += record.quantity;
        if (NON_CAPACITY_TYPES.has(item.type)) continue;

        objectUsage += item.stackable ? (item.slotSize ?? 1) : record.quantity * (item.slotSize ?? 1);
    }

    return { weapons, pets, objectUsage };
}

export function partitionInventory({ inventory, order, itemsById, capacity }) {
    const visibleEntries = [];
    const overflowEntries = [];
    let usedCapacity = 0;

    const orderedIds = ensureInventoryOrder(order, inventory);

    orderedIds.forEach((itemId) => {
        const record = inventory[itemId];
        const item = itemsById.get(itemId);
        if (!record || !item || record.quantity <= 0) return;

        const slotCost = NON_CAPACITY_TYPES.has(item.type)
            ? 0
            : (item.stackable ? (item.slotSize ?? 1) : record.quantity * (item.slotSize ?? 1));

        const entry = { item, quantity: record.quantity, hidden: false };
        if (usedCapacity + slotCost <= capacity || slotCost === 0) {
            usedCapacity += slotCost;
            visibleEntries.push(entry);
            return;
        }

        overflowEntries.push({ ...entry, hidden: true });
    });

    return { visibleEntries, overflowEntries, usedCapacity, totalEntries: visibleEntries.length + overflowEntries.length };
}

export function serializeInventoryForTrade(entries) {
    return entries.map(({ item, quantity }) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        stack: quantity,
    }));
}
