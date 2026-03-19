








export const ITEM_RARITIES = {
    common: {
        label: 'Común',
        multiplier: 1,
        color: '#8f98a3',
        glow: 'none'
    },
    uncommon: {
        label: 'Poco común',
        multiplier: 1.25,
        color: '#4caf50',
        glow: '0 0 8px #4caf5073'
    },
    rare: {
        label: 'Raro',
        multiplier: 1.6,
        color: '#434fff',
        glow: '0 0 10px #434fff80'
    },
    veryRare: {
        label: 'Muy raro',
        multiplier: 2.1,
        color: '#1c00d2',
        glow: '0 0 12px #1c00d28c'
    },
    epic: {
        label: 'Épico',
        multiplier: 2.5,
        color: '#8500c7',
        glow: '0 0 12px #8500c799'
    },
    legendary: {
        label: 'Legendario',
        multiplier: 3.2,
        color: '#f7c948',
        glow: '0 0 14px #f7c94899'
    },
    mythic: {
        label: 'Mítico',
        multiplier: 4.4,
        color: '#6600ff',
        glow: '0 0 14px #6600ffa6'
    },
    unique: {
        label: 'Único',
        multiplier: 6,
        color: '#ff2d2d',
        glow: '0 0 16px #ff2d2dbf'
    },
};

export const RARITY_OPTIONS = Object.entries(ITEM_RARITIES).map(([id, data]) => ({ id, ...data }));
