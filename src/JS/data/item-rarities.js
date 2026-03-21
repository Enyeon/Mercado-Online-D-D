








export const RARITY_ORDER = [
    'common',
    'uncommon',
    'rare',
    'veryRare',
    'epic',
    'mythic',
    'legendary',
    'unique',
];

export const ITEM_RARITIES = {
    common: {
        label: 'Común',
        multiplier: 1,
        color: '#9aa0a6',
        glow: 'none'
    },
    uncommon: {
        label: 'Poco común',
        multiplier: 1.25,
        color: '#5fbf5f',
        glow: '0 0 6px #5fbf5f66'
    },
    rare: {
        label: 'Raro',
        multiplier: 1.6,
        color: '#4d8dff',
        glow: '0 0 10px #4d8dff88'
    },
    veryRare: {
        label: 'Muy raro',
        multiplier: 2.1,
        color: '#a66bff',
        glow: '0 0 12px #a66bff99'
    },
    epic: {
        label: 'Épico',
        multiplier: 2.5,
        color: '#d957ff',
        glow: '0 0 14px #d957ffaa'
    },
    mythic: {
        label: 'Mítico',
        multiplier: 4.4,
        color: '#ff3df0',
        glow: '0 0 18px #ff3df0cc'
    },
    legendary: {
        label: 'Legendario',
        multiplier: 3.2,
        color: '#f7c948',
        glow: '0 0 16px #f7c948cc'
    },
    unique: {
        label: 'Único',
        multiplier: 6,
        color: '#ff3b3b',
        glow: '0 0 20px #ff3b3bcc, 0 0 30px #ff000066'
    },
};

export const RARITY_OPTIONS = RARITY_ORDER.map((id) => ({ id, ...ITEM_RARITIES[id] }));
