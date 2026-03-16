








/* =========================
    DATOS DEL SISTEMA
========================= */

export const MarketData = {
    items: [
        {
            id: 1,
            name: "Espada larga",
            description: "Una espada clásica usada por caballeros. (1d8 de daño cortante)",
            rarity: "common",
            piso: 1,
            category: "armas",
            marketValue: 15,
            vendors: [
                {name: "[Armero] Taron", price: 16, stock: 5 },
                {name: "[Mercader] Rolf", price: 14, stock: 2 },
            ]
        },

        {
            id: 60,
            name: "Poción de curación",
            description: "Restaura (1d4+2) puntos de vida.",
            rarity: "common",
            piso: 1,
            category: "pociones",
            marketValue: 50,
            vendors: [
                {name: "[Alquimista] Madame Lira", price: 52, stock: 100}
            ]
        },



        /* Piso 1: MATERIALES BÁSICOS DE LOBOS */
        {
            id: 101,
            name: "Piel de Lobo",
            description: "Piel gruesa usada para armaduras ligeras.",
            rarity: "common",
            piso: 1,
            category: "material",
            baseValue: 8,
            vendors: [
                { name: "Peletero Bram", price: 10, stock: 20 },
            ],
            dropSource: [
                "Lobo de las Planicies",
                "Lobo del Bosque Denso",
                "Lobo del Desfiladero"
            ]
        },

        {
            id: 102,
            name: "Colmillo de Lobo",
            description: "Un colmillo afilado usado en talismanes.",
            rarity: "common",
            piso: 1,
            category: "material",
            baseValue: 5,
            vendors: [
                { name: "Mercader Rolf", price: 7, stock: 15 },
            ],
            dropSource: [
                "Lobo de las Planicies",
                "Lobo del Bosque Denso",
                "Lobo del Desfiladero"
            ]
        },

        {
            id: 103,
            name: "Carne de Lobo",
            description: "Carne cruda utilizada para cocinar.",
            rarity: "common",
            piso: 1,
            category: "material",
            baseValue: 3,
            vendors: [
                { name: "Carnicero Durn", price: 4, stock: 25 },
            ],
            dropSource: [
                "Lobo de las Planicies",
                "Lobo del Bosque Denso",
                "Lobo del Desfiladero"
            ]
        },

        // Piso 1: MATERIALES DE LOBOS ÉLITE
        {
            id: 104,
            name: "Piel de Lobo Superior",
            description: "Una piel de gran calidad proveniente de un lobo élite.",
            rarity: "uncommon",
            piso: 1,
            category: "material",
            baseValue: 20,
            vendors: [
                { name: "Peletero Bram", price: 25, stock: 8 },
            ],
            dropSource: [
                "Lobo Élite de las Planicies",
                "Lobo Élite del Bosque Denso",
                "Lobo Élite del Desfiladero"
            ]
        },

        {
            id: 105,
            name: "Garra Afilada",
            description: "Garra endurecida usada en armas.",
            rarity: "uncommon",
            piso: 1,
            category: "material",
            baseValue: 18,
            vendors: [
                { name: "Herrero Kael", price: 22, stock: 6 },
            ],
            dropSource: [
                "Lobo Élite de las Planicies",
                "Lobo Élite del Bosque Denso",
                "Lobo Élite del Desfiladero"
            ]
        },

        {
            id: 106,
            name: "Colmillo Grande",
            description: "Un enorme colmillo de depredador alfa.",
            rarity: "uncommon",
            piso: 1,
            category: "material",
            baseValue: 15,
            vendors: [
                { name: "Mercader Rolf", price: 19, stock: 10 },
            ],
            dropSource: [
                "Lobo Élite de las Planicies",
                "Lobo Élite del Bosque Denso",
                "Lobo Élite del Desfiladero"
            ]
        },

        // Piso 1: MATERIALES DE HOMBRE LOBO
        {
            id: 107,
            name: "Sangre Maldita",
            description: "Sangre oscura impregnada de licantropía.",
            rarity: "rare",
            piso: 1,
            category: "material",
            baseValue: 60,
            vendors: [
                { name: "El Loco Vor", price: 65, stock: 2 }
            ],
            dropSource: [
                "Hombre Lobo"
            ]
        },

        {
            id: 108,
            name: "Colmillo de Licántropo",
            description: "Colmillo cargado de energía bestial.",
            rarity: "rare",
            piso: 1,
            category: "material",
            baseValue: 55,
            vendors: [
                
            ],
            dropSource: [
                "Hombre Lobo"
            ]
        },

        {
            id: 109,
            name: "Piel Maldita",
            description: "Una piel que aún vibra con energía oscura.",
            rarity: "rare",
            piso: 1,
            category: "material",
            baseValue: 75,
            vendors: [
                
            ],
            dropSource: [
                "Hombre Lobo"
            ]
        },

        // Piso 1: MATERIALES DE FENRIR
        {
            id: 110,
            name: "Colmillo de Fenrir Oscuro",
            description: "Colmillo gigantesco del Fenrir Negro.",
            rarity: "epic",
            piso: 1,
            category: "material",
            baseValue: 200,
            vendors: [
                
            ],
            dropSource: [ "Fenrir Negro" ]
        },

        {
            id: 111,
            name: "Fragmento de Sombra Primordial",
            description: "Un fragmento de oscuridad ancestral soltado por Fenrir Negro.",
            rarity: "epic",
            piso: 1,
            category: "material",
            baseValue: 250,
            vendors: [
                
            ],
            dropSource: [ "Fenrir Negro" ]
        },

        {
            id: 112,
            name: "Colmillo de Fenrir Radiante",
            description: "Colmillo resplandeciente del Fenrir Blanco.",
            rarity: "epic",
            piso: 1,
            category: "material",
            baseValue: 200,
            vendors: [
                
            ],
            dropSource: [ "Fenrir Blanco" ]
        },

        {
            id: 113,
            name: "Fragmento de Luz Primordial",
            description: "Fragmento de energía luminosa antigua.",
            rarity: "epic",
            piso: 1,
            category: "material",
            baseValue: 250,
            vendors: [
                
            ],
            dropSource: [ "Fenrir Blanco" ]
        },
    ]
};
