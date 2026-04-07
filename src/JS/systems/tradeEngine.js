function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

const RARITY_TOLERANCE = {
    common: 0.9,
    uncommon: 1,
    rare: 1.12,
    veryRare: 1.2,
    epic: 1.3,
    legendary: 1.38,
    unique: 1.45,
};

function interpolateProbability(priceRatio) {
    if (priceRatio <= 1) return 0.7;
    if (priceRatio <= 1.5) return 0.7 + ((0.4 - 0.7) * ((priceRatio - 1) / 0.5));
    if (priceRatio <= 2) return 0.4 + ((0.15 - 0.4) * ((priceRatio - 1.5) / 0.5));
    if (priceRatio <= 3) return 0.15 + ((0.05 - 0.15) * ((priceRatio - 2) / 1));
    return 0.05;
}

export class TradeEngine {
    getSellProbability({ unitPriceBaseUnits, marketPriceBaseUnits, rarity }) {
        const safeMarket = Math.max(1, Number(marketPriceBaseUnits ?? 1));
        const ratio = Math.max(0.1, Number(unitPriceBaseUnits ?? safeMarket) / safeMarket);
        const rarityTolerance = RARITY_TOLERANCE[rarity] ?? 1;
        const adjustedRatio = ratio / rarityTolerance;
        const probability = clamp(interpolateProbability(adjustedRatio), 0.03, 0.95);
        console.log('[TRADE_ENGINE] probabilidad', { ratio, adjustedRatio, rarity, probability });
        return probability;
    }

    createListing({ itemId, quantity, unitPriceBaseUnits, marketPriceBaseUnits, rarity, currentTick }) {
        return {
            id: `listing-${crypto.randomUUID().slice(0, 8)}`,
            itemId,
            quantity,
            unitPriceBaseUnits,
            marketPriceBaseUnits,
            rarity,
            probability: this.getSellProbability({ unitPriceBaseUnits, marketPriceBaseUnits, rarity }),
            createdAtTick: currentTick,
            resolveAtTick: currentTick + 2,
            status: 'active',
        };
    }

    evaluateListings(listings, currentTick) {
        const resolved = [];
        const nextListings = listings.map((listing) => {
            if (listing.status !== 'active' || listing.resolveAtTick > currentTick) return listing;
            const sold = Math.random() <= listing.probability;
            const status = sold ? 'sold' : 'returned';
            resolved.push({ ...listing, status, resolvedAtTick: currentTick });
            console.log('[TRADE_ENGINE] resolución venta', { listingId: listing.id, sold, probability: listing.probability });
            return { ...listing, status, resolvedAtTick: currentTick };
        });
        return { nextListings, resolved };
    }
}

export const tradeEngine = new TradeEngine();
