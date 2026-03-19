








import { ITEM_RARITIES } from '../../data/item-rarities.js';

export function createRarityDots(rarityId) {
    const rarity = ITEM_RARITIES[rarityId] ?? ITEM_RARITIES.common;
    const wrap = document.createElement('div');
    wrap.className = 'rarity-dots';
    wrap.title = rarity.label;

    const dots = Math.max(1, Math.min(5, Math.ceil(rarity.tier / 2)));
    for (let i = 0; i < dots; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'rarity-dot';
        dot.style.setProperty('--dot-color', rarity.color);
        dot.style.setProperty('--dot-glow', rarity.glow);
        wrap.appendChild(dot);
    }

    return wrap;
}
