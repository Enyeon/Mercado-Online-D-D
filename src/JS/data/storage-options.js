








export const BACKPACKS = [
/*    {
        id: 'id-ejemplo', // ID único para evitar confusiones con otros packs de almacenamiento.
        name: 'Pack de Ejemplo', // Nombre del pack de almacenamiento.
        rarity: 'common', // Rareza del pack de almacenamiento.
        marketBasePrice: 140, // Precio base en oro del pack de almacenamiento.
        objectSlots: 18, // Número de ranuras para objetos.
        weaponSlots: 2, // Número de ranuras para armas.
    }, */



    /* =============    COMUNES    ============= */
    { id: 'storage-small',
        name: 'Mochila Pequeña',
        rarity: 'common',
        marketBasePrice: 140,
        objectSlots: 18,
        weaponSlots: 2,
    },
    { id: 'storage-medium',
        name: 'Mochila Mediana',
        rarity: 'common',
        marketBasePrice: 300,
        objectSlots: 27,
        weaponSlots: 2,
    },
    { id: 'storage-large',
        name: 'Mochila Grande',
        rarity: 'common',
        marketBasePrice: 550,
        objectSlots: 36,
        weaponSlots: 4,
    },
    { id: 'storage-leather-pouch',
        name: 'Bolsa de Cuero Reforzada',
        rarity: 'common',
        marketBasePrice: 90,
        objectSlots: 10,
        weaponSlots: 1,
    },
    { id: 'storage-traveler-chest',
        name: 'Cofre de Viajero',
        rarity: 'common',
        marketBasePrice: 180,
        objectSlots: 22,
        weaponSlots: 2,
    },


    /* =============    POCO COMUNES    ============= */
    { id: 'storage-herbal-satchel',
        name: 'Zurrón de Herborista',
        rarity: 'uncommon',
        marketBasePrice: 260,
        objectSlots: 24,
        weaponSlots: 1,
    },
    { id: 'storage-smuggler-case',
        name: 'Estuche de Contrabandista',
        rarity: 'uncommon',
        marketBasePrice: 340,
        objectSlots: 20,
        weaponSlots: 3,
    },


    /* =============    RAROS    ============= */
    { id: 'storage-runic-chest',
        name: 'Cofre Rúnico',
        rarity: 'rare',
        marketBasePrice: 900,
        objectSlots: 40,
        weaponSlots: 4,
    },
    { id: 'storage-glacial-vault',
        name: 'Arcón Glacial',
        rarity: 'rare',
        marketBasePrice: 1100,
        objectSlots: 38,
        weaponSlots: 3,
    },
    { id: 'storage-dimensional-bag-minior',
        name: 'Bolsa Dimensional Menor',
        rarity: 'rare',
        marketBasePrice: 1800,
        objectSlots: 60,
        weaponSlots: 5,
    },


    /* =============    MUY RAROS    ============= */
    { id: 'storage-void-container',
        name: 'Contenedor del Vacío',
        rarity: 'veryRare',
        marketBasePrice: 2100,
        objectSlots: 75,
        weaponSlots: 4,
    },
    { id: 'storage-void-container',
        name: 'Contenedor del Vacío',
        rarity: 'veryRare',
        marketBasePrice: 2100,
        objectSlots: 75,
        weaponSlots: 4,
    },
    { id: 'storage-dimensional-bag-major',
        name: 'Bolsa Dimensional Mayor',
        rarity: 'veryRare',
        marketBasePrice: 3000,
        objectSlots: 100,
        weaponSlots: 9,
    },


    /* =============    LEGENDARIOS    ============= */
    { id: 'storage-infinite-satchel',
        name: 'Zurrón Inagotable',
        rarity: 'legendary',
        marketBasePrice: 5000,
        objectSlots: 120,
        weaponSlots: 6,
    },
    { id: 'storage-astral-vault',
        name: 'Bóveda Astral [Pista]',
        rarity: 'legendary',
        marketBasePrice: 6500,
        objectSlots: 200,
        weaponSlots: 10,
    },
    { id: 'storage-espacial-reliquary',
        name: 'Relicario Espacial [Pista]',
        rarity: 'legendary',
        marketBasePrice: 7500,
        objectSlots: 280,
        weaponSlots: 14,
    },


    /* =============    MÍTICOS    ============= */
    { id: 'storage-fractured-space',
        name: 'Fragmento de Espacio [Pista]',
        rarity: 'mythic',
        marketBasePrice: 9000,
        objectSlots: 300,
        weaponSlots: 12,
    },
];

export const MOUNT_PACKS = [
    { id: 'mount-pack-small',
        name: 'Equipaje de Montura Pequeño',
        rarity: 'common',
        marketBasePrice: 180,
        objectSlots: 36,
        weaponSlots: 2,
        blockedWeaponClasses: ['spear', 'longHammer'],
    },
    { id: 'mount-pack-medium',
        name: 'Equipaje de Montura Mediano',
        rarity: 'common',
        marketBasePrice: 320,
        objectSlots: 54,
        weaponSlots: 4,
        blockedWeaponClasses: ['spear', 'longHammer'],
    },
    { id: 'mount-pack-large',
        name: 'Equipaje de Montura Grande',
        rarity: 'common',
        marketBasePrice: 510,
        objectSlots: 74,
        weaponSlots: 4,
        blockedWeaponClasses: [],
    },
];

export const MOUNTS = [
/*  {
        id: 'ejemplo-montura', // ID único para evitar confuciones con otras monturas.
        name: 'Montura de ejemplo', // Nombre base de la montura.
        rarity: 'uncommon', // Rareza de la montura: común, poco común, raro, muy raro, legendario, mítico y único.
        marketBasePrice: 10, // Precio base en oro de la montura.
        stats: { speed: 55, resistance: 14, control: 7 }, // Speed: Velocidad, Resistencia: CA de la montura, Control: Dificultad para controlar la montura (afecta a tiradas de control).
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id), // Compatible con todos los packs de almacenamiento.
    },*/



    /* =============    COMUNES    ============= */
    { id: 'mount-horse',
        name: 'Caballo',
        rarity: 'common',
        marketBasePrice: 400,
        stats: { speed: 40, resistance: 11, control: 5 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },
    { id: 'mount-mule',
        name: 'Mula de Carga',
        rarity: 'common',
        marketBasePrice: 250,
        stats: { speed: 25, resistance: 14, control: 8 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },
    { id: 'mount-desert-lizard',
        name: 'Lagarto del Desierto',
        rarity: 'common',
        marketBasePrice: 320,
        stats: { speed: 38, resistance: 10, control: 6 },
        compatiblePackIds: ['mount-pack-small', 'mount-pack-medium'],
    },


    /* =============    POCO COMUNES    ============= */
    { id: 'mount-war-horse',
        name: 'Caballo de Guerra',
        rarity: 'uncommon',
        marketBasePrice: 800,
        stats: { speed: 55, resistance: 14, control: 7 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },
    { id: 'mount-boar',
        name: 'Jabalí de Guerra',
        rarity: 'uncommon',
        marketBasePrice: 600,
        stats: { speed: 35, resistance: 16, control: 7 },
        compatiblePackIds: ['mount-pack-small'],
    },
    { id: 'mount-giant-goat',
        name: 'Cabra de Acantilado',
        rarity: 'uncommon',
        marketBasePrice: 700,
        stats: { speed: 45, resistance: 13, control: 6 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },


    /* =============    RAROS    ============= */
    { id: 'mount-elk',
        name: 'Alce Rúnico',
        rarity: 'rare',
        marketBasePrice: 1200,
        stats: { speed: 55, resistance: 13, control: 5 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },
    { id: 'mount-frost-wolf',
        name: 'Lobo de Escarcha',
        rarity: 'rare',
        marketBasePrice: 1400,
        stats: { speed: 60, resistance: 12, control: 5 },
        compatiblePackIds: ['mount-pack-small', 'mount-pack-medium'],
    },
    { id: 'mount-giant-scorpion',
        name: 'Escorpión Colosal',
        rarity: 'rare',
        marketBasePrice: 1600,
        stats: { speed: 42, resistance: 18, control: 8 },
        compatiblePackIds: ['mount-pack-small'],
    },
    { id: 'mount-swamp-strider',
        name: 'Zancudo de Pantano',
        rarity: 'rare',
        marketBasePrice: 1500,
        stats: { speed: 50, resistance: 14, control: 6 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },


    /* =============    MUY RAROS    ============= */
    { id: 'mount-terror-wolf',
        name: 'Lobo del Terror',
        rarity: 'veryRare',
        marketBasePrice: 1700,
        stats: { speed: 65, resistance: 10, control: 6 },
        compatiblePackIds: ['mount-pack-small', 'mount-pack-medium'], // Solo compatible con los packs pequeño y mediano.
    },
    { id: 'mount-shadow-panther',
        name: 'Pantera Sombría',
        rarity: 'veryRare',
        marketBasePrice: 2100,
        stats: { speed: 70, resistance: 11, control: 4 },
        compatiblePackIds: ['mount-pack-small'],
    },
    { id: 'mount-crystal-stag',
        name: 'Ciervo de Cristal',
        rarity: 'veryRare',
        marketBasePrice: 2300,
        stats: { speed: 65, resistance: 15, control: 6 },
        compatiblePackIds: MOUNT_PACKS.map((pack) => pack.id),
    },


    /* =============    LEGENDARIOS    ============= */
    { id: 'mount-phoenix',
        name: 'Fénix [Pista]',
        rarity: 'legendary',
        marketBasePrice: 5000,
        stats: { speed: 90, resistance: 12, control: 3 },
        compatiblePackIds: [],
    },
    { id: 'mount-thunder-roc',
        name: 'Roc del Trueno',
        rarity: 'legendary',
        marketBasePrice: 4800,
        stats: { speed: 85, resistance: 18, control: 7 },
        compatiblePackIds: [],
    },
    { id: 'mount-void-serpent',
        name: 'Serpiente del Vacío [Pista]',
        rarity: 'mythic',
        marketBasePrice: 6000,
        stats: { speed: 90, resistance: 10, control: 2 },
        compatiblePackIds: [],
    },


    /* =============    MÍTICOS    ============= */
    { id: 'mount-astral-ray',
        name: 'Mantarraya Astral [Pista]',
        rarity: 'mythic',
        marketBasePrice: 8200,
        stats: { speed: 100, resistance: 9, control: 3 },
        compatiblePackIds: [],
    },
];

export const VEHICLES = [
    /* =============    COMUNES    ============= */
    { id: 'vehicle-cart-common',
        name: 'Carreta Común',
        rarity: 'common',
        marketBasePrice: 1600,
        storage: { objectSlots: 170, weaponSlots: 30 },
    },
    { id: 'vehicle-handcart',
        name: 'Carretilla de Mercader',
        rarity: 'common',
        marketBasePrice: 900,
        storage: { objectSlots: 90, weaponSlots: 10 },
    },
    { id: 'vehicle-hay-wagon',
        name: 'Carro de Heno',
        rarity: 'common',
        marketBasePrice: 1300,
        storage: { objectSlots: 200, weaponSlots: 8 },
    },


    /* =============    POCO COMUNES    ============= */
    { id: 'vehicle-cart-reinforced',
        name: 'Carreta Reforzada',
        rarity: 'uncommon',
        marketBasePrice: 2600,
        storage: { objectSlots: 220, weaponSlots: 35 },
    },
    { id: 'vehicle-merchant-wagon',
        name: 'Carro de Mercader',
        rarity: 'uncommon',
        marketBasePrice: 3000,
        storage: { objectSlots: 260, weaponSlots: 25 },
    },
    { id: 'vehicle-hunting-wagon',
        name: 'Carro de Caza',
        rarity: 'uncommon',
        marketBasePrice: 2800,
        storage: { objectSlots: 180, weaponSlots: 45 },
    },


    /* =============    RAROS    ============= */
    { id: 'vehicle-carriage-noble',
        name: 'Carruaje Noble',
        rarity: 'rare',
        marketBasePrice: 4200,
        storage: { objectSlots: 150, weaponSlots: 20 },
    },
    { id: 'vehicle-armored-wagon',
        name: 'Carro Blindado',
        rarity: 'rare',
        marketBasePrice: 5200,
        storage: { objectSlots: 240, weaponSlots: 60 },
    },
    { id: 'vehicle-alchemy-wagon',
        name: 'Carro Alquímico',
        rarity: 'rare',
        marketBasePrice: 4800,
        storage: { objectSlots: 300, weaponSlots: 10 },
    },
    { id: 'vehicle-prison-wagon',
        name: 'Carro de Prisioneros',
        rarity: 'rare',
        marketBasePrice: 4500,
        storage: { objectSlots: 200, weaponSlots: 30 },
    },


    /* =============    MUY RAROS    ============= */
    { id: 'vehicle-steam-wagon',
        name: 'Carro de Vapor',
        rarity: 'veryRare',
        marketBasePrice: 7500,
        storage: { objectSlots: 320, weaponSlots: 50 },
    },
    { id: 'vehicle-runic-caravan',
        name: 'Caravana Rúnica',
        rarity: 'veryRare',
        marketBasePrice: 8200,
        storage: { objectSlots: 400, weaponSlots: 40 },
    },
    { id: 'vehicle-shadow-carriage',
        name: 'Carruaje Sombrío',
        rarity: 'veryRare',
        marketBasePrice: 7800,
        storage: { objectSlots: 180, weaponSlots: 25 },
    },
];
