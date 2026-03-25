








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
    const parsed = Number(quantity);
    const sanitizedQuantity = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
    return {
        quantity: sanitizedQuantity,
        hidden: false,
    };
}

export function normalizeInventoryMap(inventory = {}) {
    const accumulator = {};

    Object.entries(inventory ?? {}).forEach(([itemIdRaw, value]) => {
        const itemId = String(itemIdRaw ?? '').trim();
        if (!itemId) return;

        const record = typeof value === 'number'
            ? createInventoryRecord(value)
            : createInventoryRecord(value?.quantity ?? 0);

        if (record.quantity <= 0) return;

        const previous = accumulator[itemId]?.quantity ?? 0;
        accumulator[itemId] = createInventoryRecord(previous + record.quantity);
    });

    return accumulator;
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

export function addItemSafe(inventory, id, quantity, options = {}) {
    const logger = options.logger ?? console;
    const normalizedId = String(id ?? '').trim();
    const parsedQuantity = Number(quantity);
    const nextQuantity = Number.isFinite(parsedQuantity) ? Math.trunc(parsedQuantity) : NaN;

    if (!normalizedId) {
        logger.warn('[ADD ITEM SAFE] invalid id', { id, quantity });
        return { ok: false, reason: 'invalid-id' };
    }

    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        logger.warn('[ADD ITEM SAFE] invalid quantity', { id: normalizedId, quantity });
        return { ok: false, reason: 'invalid-quantity' };
    }

    const previous = getItemQuantity(inventory, normalizedId);
    const updated = previous + nextQuantity;
    setItemQuantity(inventory, normalizedId, updated);

    logger.trace('[ADD ITEM]', normalizedId, nextQuantity, { previous, updated });
    return { ok: true, previous, updated };
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
