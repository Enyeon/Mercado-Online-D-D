








import { BACKPACKS, MOUNTS, MOUNT_PACKS, VEHICLES } from './storage-options.js';

export const ITEM_TYPES = [ 'Materiales', 'Armas', 'Armaduras', 'Consumibles', 'Artefactos', 'Equipamiento de Monturas', 'Mochilas', 'Vehículos', 'Otros' ];

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


    { id: 'wolf-pelt',
        name: 'Piel de Lobo',
        description: 'Material curtido para fabricar equipo ligero.',
        rarity: 'common',
        type: 'materiales',
        floor: 1,
        marketBasePrice: 15,
        stock: 50,
    },
    { id: 'mana-elixir',
        name: 'Elixir de Maná',
        description: 'Recupera energía arcana en combate.',
        rarity: 'uncommon',
        type: 'consumibles',
        floor: 1,
        marketBasePrice: 38,
        stock: 25,
    },
    { id: 'fang-sword',
        name: 'Espada Colmillo',
        description: 'Hoja forjada con colmillos de depredador alfa.',
        rarity: 'rare',
        type: 'armas',
        floor: 2,
        marketBasePrice: 120,
        stock: 8,
    },
    { id: 'warden-plate',
        name: 'Coraza del Guardián',
        description: 'Armadura pesada con runas de protección.',
        rarity: 'veryRare',
        type: 'armaduras',
        floor: 3,
        marketBasePrice: 250,
        stock: 5,
    },
    { id: 'orb-of-echoes',
        name: 'Orbe de Ecos Eternos',
        description: 'Artefacto que almacena fragmentos de memoria ancestral.',
        rarity: 'legendary',
        type: 'artefactos',
        floor: 5,
        marketBasePrice: 640,
        stock: 1,
    },
    { id: 'crown-ashes',
        name: 'Corona de Cenizas Gemelas',
        description: 'Reliquia mítica nacida de dos dragones primordiales.',
        rarity: 'mythic',
        type: 'artefactos',
        floor: 10,
        marketBasePrice: 1200,
        stock: 1,
    },
    { id: 'blood-oath-ring',
        name: 'Anillo del Juramento Carmesí',
        description: 'Objeto único vinculado a un único portador, también usado en bodas.',
        rarity: 'mythic',
        type: 'artefactos',
        floor: 20,
        marketBasePrice: 2500,
        stock: 1,
    },
    { id: 'potion-healer',
        name: 'Poción de Curación',
        description: 'Restaura salud en combate.',
        rarity: 'common',
        type: 'consumibles',
        floor: 1,
        marketBasePrice: 10,
        stock: 20,
    },
];

function mapAsMarketEntries(entries, marketSection, entityKind, typeFallback) {
    return entries.map((entry) => ({
        ...entry,
        marketSection,
        entityKind,
        stackable: entry.stackable ?? false,
        slotSize: entry.slotSize ?? 1,
        type: entry.type ?? typeFallback,
    }));
}

export const INITIAL_ITEMS = [
    ...mapAsMarketEntries(BASE_ITEMS, 'items', 'item', 'materiales'),
    ...mapAsMarketEntries(BACKPACKS, 'items', 'backpack', 'mochilas'),
    ...mapAsMarketEntries(MOUNT_PACKS, 'items', 'mountPack', 'equipaje-montura'),
    ...mapAsMarketEntries(MOUNTS, 'mounts', 'mount', 'monturas'),
    ...mapAsMarketEntries(VEHICLES, 'vehicles', 'vehicle', 'vehiculos'),
];
