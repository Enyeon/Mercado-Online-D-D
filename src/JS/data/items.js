








import {
    BACKPACKS,
    MOUNTS,
    MOUNT_PACKS,
    VEHICLES,
    BASE_ITEMS,
    PETS,
} from './storage-options.js';

export const ITEM_TYPES = [
    'material',
    'arma',
    'armadura',
    'consumible',
    'artefacto',
    'equipaje-montura',
    'mochila',
    'montura',
    'mascota',
    'vehiculo',
    'otros',
];



function withEconomy(entry) {
    return {
        ...entry,
        basePrice: entry.basePrice ?? entry.marketBasePrice,
        economy: {
            demand: entry.economy?.demand ?? 0,
            supply: entry.economy?.supply ?? 0,
            inflationFactor: entry.economy?.inflationFactor ?? 1,
        },
    };
}

function mapAsMarketEntries(entries, entityKind, typeFallback) {
    return entries.map((entry) => withEconomy({
        ...entry,
        entityKind,
        stackable: entry.stackable ?? false,
        slotSize: entry.slotSize ?? 1,
        type: entry.type ?? typeFallback,
    }));
}

export const INITIAL_ITEMS = [
    ...mapAsMarketEntries(BASE_ITEMS, 'item', 'material'),
    ...mapAsMarketEntries(BACKPACKS, 'backpack', 'mochila'),
    ...mapAsMarketEntries(MOUNT_PACKS, 'mountPack', 'equipaje-montura'),
    ...mapAsMarketEntries(MOUNTS, 'mount', 'montura'),
    ...mapAsMarketEntries(VEHICLES, 'vehicle', 'vehiculo'),
    ...mapAsMarketEntries(PETS, 'pet', 'mascota'),
];
