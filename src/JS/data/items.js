








import { BACKPACKS, MOUNTS, MOUNT_PACKS, VEHICLES } from './storage-options.js';

export const ITEM_TYPES = ['material', 'arma', 'armadura', 'consumible', 'artefacto', 'equipaje-montura', 'mochila', 'montura', 'mascota', 'vehiculo', 'otros'];

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

export const BASE_ITEMS = [
/*  { id: 'id-ejemplo', // ID único para identificar el objeto.
        name: 'Nombre de ejemplo', // Nombre del objeto a vender.
        description: 'Ejemplo de descripción del objeto.', // Descripción breve del objeto, pero sin detalles de qué hace.
        rarity: 'common', // Rareza del objeto: common, uncommon, rare, veryRare, epic, legendary, mythic.
        type: 'materiales', // Para items sin tipo definido, se asigna 'materiales' por defecto.
        floor: 1, // Piso donde se puede encontrar por primera vez, para ayudar a organizar el mercado.
        marketBasePrice: 15, // Precio base antes de multiplicador por rareza.
        stock: 50, // Stack inicial para pruebas.
    }, */


    { name: 'Piel de Lobo',
        id: 'wolf-pelt',
        description: 'Material curtido para fabricar equipo ligero.',
        rarity: 'common',
        type: 'materiales',
        floor: 1,
        marketBasePrice: 15,
        stock: 50,
        stackable: true,
    },
    { name: 'Elixir de Maná',
        id: 'mana-elixir',
        description: 'Recupera energía arcana en combate.',
        rarity: 'uncommon',
        type: 'consumibles',
        floor: 1,
        marketBasePrice: 38,
        stock: 25,
        stackable: true,
    },
    { name: 'Espada Colmillo',
        id: 'fang-sword',
        description: 'Hoja forjada con colmillos de depredador alfa.',
        rarity: 'rare',
        type: 'armas',
        floor: 2,
        marketBasePrice: 120,
        stock: 8,
        stackable: false,
    },
    { name: 'Daga',
        id: 'dagger',
        description: 'Hoja forjada con metal liviano.',
        rarity: 'common',
        type: 'armas',
        floor: 1,
        marketBasePrice: 10,
        stock: 10,
        stackable: false,
    },
    { name: 'Coraza del Guardián',
        id: 'warden-plate',
        description: 'Armadura pesada con runas de protección.',
        rarity: 'veryRare',
        type: 'armaduras',
        floor: 3,
        marketBasePrice: 250,
        stock: 5,
        stackable: true,
    },
    { name: 'Orbe de Ecos Eternos',
        id: 'orb-of-echoes',
        description: 'Artefacto que almacena fragmentos de memoria ancestral.',
        rarity: 'legendary',
        type: 'artefactos',
        floor: 5,
        marketBasePrice: 640,
        stock: 1,
        stackable: false,
    },
    { name: 'Corona de Cenizas Gemelas',
        id: 'crown-ashes',
        description: 'Reliquia mítica nacida de dos dragones primordiales.',
        rarity: 'mythic',
        type: 'artefactos',
        floor: 10,
        marketBasePrice: 1200,
        stock: 1,
        stackable: false,
    },
    { name: 'Anillo del Juramento Carmesí',
        id: 'blood-oath-ring',
        description: 'Objeto único vinculado a un único portador, también usado en bodas.',
        rarity: 'mythic',
        type: 'artefactos',
        floor: 20,
        marketBasePrice: 2500,
        stock: 1,
        stackable: false,
    },
    { name: 'Poción de Curación',
        id: 'potion-healer',
        description: 'Restaura salud en combate.',
        rarity: 'common',
        type: 'consumibles',
        floor: 1,
        marketBasePrice: 10,
        stock: 20,
        stackable: true,
    },
];

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
];
