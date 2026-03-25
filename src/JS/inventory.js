








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

export function getInventoryDebugSummary(inventory = {}, itemsById, options = {}) {
    const excludedIds = new Set(options.excludedIds ?? []);

    return Object.entries(inventory).map(([itemId, record]) => {
        const item = itemsById.get(itemId);
        const quantity = record?.quantity ?? 0;
        const slotSize = item?.slotSize ?? 1;
        const renderedSlots = item?.stackable ? (quantity > 0 ? slotSize : 0) : quantity * slotSize;

        return {
            id: itemId,
            name: item?.name ?? 'UNKNOWN_ITEM',
            quantity,
            stackable: item?.stackable ?? false,
            slotSize,
            renderedSlots,
            excluded: excludedIds.has(itemId),
            type: item?.type ?? 'unknown',
            entityKind: item?.entityKind ?? 'unknown',
        };
    });
}

export function countUsageByType(inventory, itemsById, options = {}) {
    let weapons = 0;
    let pets = 0;
    let objectUsage = 0;
    const excludedIds = new Set(options.excludedIds ?? []);

    console.group('[inventory] countUsageByType');
    console.log('raw inventory', inventory);
    console.log('excluded ids', [...excludedIds]);

    for (const [itemId, record] of Object.entries(inventory)) {
        const item = itemsById.get(itemId);
        if (!item || record.quantity <= 0) continue;

        if (excludedIds.has(itemId)) {
            console.log('skip excluded item', { itemId, quantity: record.quantity, entityKind: item.entityKind });
            continue;
        }

        if (item.type === 'arma') weapons += record.quantity;
        if (item.type === 'mascota') pets += record.quantity;
        if (NON_CAPACITY_TYPES.has(item.type)) {
            console.log('skip non-capacity item', { itemId, type: item.type, quantity: record.quantity });
            continue;
        }

        const slotUsage = item.stackable ? (item.slotSize ?? 1) : record.quantity * (item.slotSize ?? 1);
        objectUsage += slotUsage;

        console.log('counted item', {
            itemId,
            quantity: record.quantity,
            stackable: item.stackable,
            slotSize: item.slotSize ?? 1,
            slotUsage,
            runningObjectUsage: objectUsage,
        });
    }

    console.log('usage result', { weapons, pets, objectUsage });
    console.groupEnd();

    return { weapons, pets, objectUsage };
}

export function partitionInventory({ inventory, order, itemsById, capacity, excludedIds = [] }) {
    const visibleEntries = [];
    const overflowEntries = [];
    let usedCapacity = 0;
    const skippedIds = new Set(excludedIds);

    const orderedIds = ensureInventoryOrder(order, inventory);

    console.group('[inventory] partitionInventory');
    console.log('raw inventory', inventory);
    console.log('order', orderedIds);
    console.log('capacity', capacity);
    console.log('excluded ids', [...skippedIds]);

    orderedIds.forEach((itemId) => {
        const record = inventory[itemId];
        const item = itemsById.get(itemId);
        if (!record || !item || record.quantity <= 0) return;
        if (skippedIds.has(itemId)) {
            console.log('skip excluded item from layout', { itemId, quantity: record.quantity, entityKind: item.entityKind });
            return;
        }

        const slotCost = NON_CAPACITY_TYPES.has(item.type)
            ? 0
            : (item.stackable ? (item.slotSize ?? 1) : record.quantity * (item.slotSize ?? 1));

        const entry = { item, quantity: record.quantity, hidden: false };
        if (usedCapacity + slotCost <= capacity || slotCost === 0) {
            usedCapacity += slotCost;
            visibleEntries.push(entry);
            console.log('visible entry', { itemId, quantity: record.quantity, slotCost, usedCapacity });
            return;
        }

        overflowEntries.push({ ...entry, hidden: true });
        console.log('overflow entry', { itemId, quantity: record.quantity, slotCost, usedCapacity });
    });

    const result = { visibleEntries, overflowEntries, usedCapacity, totalEntries: visibleEntries.length + overflowEntries.length };
    console.log('layout result', {
        visibleIds: visibleEntries.map(({ item, quantity }) => ({ id: item.id, quantity })),
        overflowIds: overflowEntries.map(({ item, quantity }) => ({ id: item.id, quantity })),
        usedCapacity,
        totalEntries: result.totalEntries,
    });
    console.groupEnd();

    return result;
}

export function serializeInventoryForTrade(entries) {
    return entries.map(({ item, quantity }) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        stack: quantity,
    }));
}
