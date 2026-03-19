








import { ITEM_RARITIES } from '../data/item-rarities.js';

export class EconomySystem {
    estimateMarketValue(item) {
        const rarity = ITEM_RARITIES[item.rarity] ?? ITEM_RARITIES.common;
        return Math.round(item.marketBasePrice * rarity.multiplier);
    }

    canAfford(playerMoney, totalPrice) {
        return playerMoney >= totalPrice;
    }
}
