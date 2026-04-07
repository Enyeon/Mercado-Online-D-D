








const CURRENCY_SYSTEMS = {
    dnd: {
        id: 'dnd',
        label: 'D&D',
        icon: '🪙',
        baseCurrency: 'pc',
        currencies: [
            { code: 'pc', label: 'Cobre', short: 'pc', ratioToBase: 1 },
            { code: 'pp', label: 'Plata', short: 'pp', ratioToBase: 10 },
            { code: 'po', label: 'Oro', short: 'po', ratioToBase: 100 },
            { code: 'ppt', label: 'Platino', short: 'ppt', ratioToBase: 1000 },
        ],
    },
    worldElemental: {
        id: 'worldElemental',
        label: 'World Elemental',
        icon: '🔮',
        baseCurrency: 'cen',
        currencies: [
            { code: 'cen', label: 'Cen', short: 'Cen', ratioToBase: 1 },
            { code: 'census', label: 'Census', short: 'Census', ratioToBase: 1000 },
            { code: 'cenrrus', label: 'Cenrrus', short: 'Cenrrus', ratioToBase: 1000000 },
        ],
    },
    usd: {
        id: 'usd',
        label: 'USD',
        icon: '💵',
        baseCurrency: 'usd',
        currencies: [
            { code: 'usd', label: 'USD', short: 'USD', ratioToBase: 1, symbol: '$' },
        ],
    },
};

const LEGACY_GOLD_CODE = 'gp';

function getSystemConfig(systemId) {
    return CURRENCY_SYSTEMS[systemId] ?? CURRENCY_SYSTEMS.dnd;
}

function getCurrencyConfig(systemId, code) {
    return getSystemConfig(systemId).currencies.find((entry) => entry.code === code) ?? null;
}

function asInteger(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function readOptionalInteger(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export class CurrencySystem {
    constructor({ defaultSystemId = 'dnd' } = {}) {
        this.defaultSystemId = defaultSystemId;
        this.legacyPriceCurrencyCode = LEGACY_GOLD_CODE;
    }

    getAvailableSystems() {
        return Object.values(CURRENCY_SYSTEMS);
    }

    getSystem(systemId = this.defaultSystemId) {
        return getSystemConfig(systemId);
    }

    getNextSystemId(currentId = this.defaultSystemId) {
        const ids = this.getAvailableSystems().map((entry) => entry.id);
        const index = ids.indexOf(currentId);
        return ids[(index + 1) % ids.length] ?? this.defaultSystemId;
    }

    convertCurrency(value, fromCode, toCode, systemId = this.defaultSystemId) {
        const from = getCurrencyConfig(systemId, fromCode);
        const to = getCurrencyConfig(systemId, toCode);
        if (!from || !to) {
            console.error('[CURRENCY] Conversión inválida', { value, fromCode, toCode, systemId });
            return asInteger(value, 0);
        }

        const baseAmount = asInteger(value, 0) * from.ratioToBase;
        const converted = Math.trunc(baseAmount / to.ratioToBase);
        console.log('[CURRENCY] convertCurrency', { value, fromCode, toCode, systemId, baseAmount, converted });
        return converted;
    }

    formatCurrency(valueInBaseUnits, { systemId = this.defaultSystemId } = {}) {
        const system = getSystemConfig(systemId);
        const amount = Math.max(0, asInteger(valueInBaseUnits, 0));

        if (system.id === 'usd') {
            const usd = this.convertFromBaseUnits(amount, { systemId: 'usd', currencyCode: 'usd' });
            const formatted = `$${usd.toLocaleString('en-US')}`;
            console.debug('[CURRENCY] formatCurrency', { systemId: system.id, inputBaseUnits: amount, formatted });
            return formatted;
        }

        const normalized = this.normalizeBalances(amount, system.id);
        const parts = system.currencies
            .slice()
            .sort((a, b) => b.ratioToBase - a.ratioToBase)
            .map((currency) => ({ currency, amount: normalized[currency.code] ?? 0 }))
            .filter((entry) => entry.amount > 0)
            .map((entry) => `${entry.amount.toLocaleString('es-ES')} ${entry.currency.short}`);

        const formatted = parts.length ? parts.join(', ') : `0 ${system.currencies[0].short}`;
        console.debug('[CURRENCY] formatCurrency', {
            systemId: system.id,
            inputBaseUnits: amount,
            normalized,
            formatted,
        });
        return formatted;
    }

    convertToBaseUnits(amount, { systemId = this.defaultSystemId, currencyCode } = {}) {
        const system = getSystemConfig(systemId);
        const sourceCode = currencyCode ?? system.baseCurrency;
        const currency = getCurrencyConfig(system.id, sourceCode);
        if (!currency) {
            console.error('[CURRENCY] Moneda inválida para convertToBaseUnits', { amount, systemId: system.id, sourceCode });
            return 0;
        }
        return Math.max(0, asInteger(amount, 0) * currency.ratioToBase);
    }

    convertFromBaseUnits(baseUnits, { systemId = this.defaultSystemId, currencyCode } = {}) {
        const system = getSystemConfig(systemId);
        const targetCode = currencyCode ?? system.baseCurrency;
        const currency = getCurrencyConfig(system.id, targetCode);
        if (!currency) {
            console.error('[CURRENCY] Moneda inválida para convertFromBaseUnits', { baseUnits, systemId: system.id, targetCode });
            return 0;
        }
        return Math.trunc(Math.max(0, asInteger(baseUnits, 0)) / currency.ratioToBase);
    }

    normalizeBalances(baseUnits, systemId = this.defaultSystemId) {
        const system = getSystemConfig(systemId);
        let remainder = Math.max(0, asInteger(baseUnits, 0));
        const balances = {};

        const sorted = system.currencies.slice().sort((a, b) => b.ratioToBase - a.ratioToBase);
        sorted.forEach((currency, index) => {
            if (index === sorted.length - 1) {
                balances[currency.code] = remainder;
                return;
            }
            const quantity = Math.trunc(remainder / currency.ratioToBase);
            balances[currency.code] = quantity;
            remainder -= quantity * currency.ratioToBase;
        });

        return balances;
    }

    parseWallet(playerState, activeSystemId = this.defaultSystemId) {
        const wallet = playerState?.wallet;

        if (wallet?.version === 1 && Number.isFinite(wallet.baseUnits)) {
            console.debug('[CURRENCY] parseWallet usa wallet serializada', {
                activeSystemId: wallet.activeSystemId ?? activeSystemId,
                baseUnits: wallet.baseUnits,
            });
            return {
                version: 1,
                activeSystemId: wallet.activeSystemId ?? activeSystemId,
                baseUnits: Math.max(0, asInteger(wallet.baseUnits, 0)),
                balancesBySystem: wallet.balancesBySystem ?? {},
            };
        }

        const explicitBaseUnits = readOptionalInteger(playerState?.baseUnits ?? playerState?.money);
        const explicitLegacyGold = readOptionalInteger(playerState?.legacyGold ?? playerState?.gold);

        if (explicitBaseUnits !== null) {
            const normalizedBase = Math.max(0, explicitBaseUnits);
            console.info('[CURRENCY] parseWallet usa valor base explícito', {
                input: explicitBaseUnits,
                normalizedBase,
                activeSystemId,
            });
            return {
                version: 1,
                activeSystemId,
                baseUnits: normalizedBase,
                balancesBySystem: {},
            };
        }

        const legacyGold = Math.max(0, explicitLegacyGold ?? 0);
        const migratedBase = this.convertToBaseUnits(legacyGold, { systemId: 'dnd', currencyCode: LEGACY_GOLD_CODE });
        console.info('[CURRENCY] Migración automática legacyGold -> baseUnits', {
            legacyGold,
            migratedBase,
            activeSystemId,
        });

        return {
            version: 1,
            activeSystemId,
            baseUnits: migratedBase,
            balancesBySystem: {},
        };
    }

    serializeWallet(wallet) {
        const activeSystemId = wallet?.activeSystemId ?? this.defaultSystemId;
        const baseUnits = Math.max(0, asInteger(wallet?.baseUnits, 0));
        return {
            version: 1,
            activeSystemId,
            baseUnits,
            balancesBySystem: this.getAvailableSystems().reduce((acc, system) => {
                acc[system.id] = this.normalizeBalances(baseUnits, system.id);
                return acc;
            }, {}),
            legacyGold: this.convertFromBaseUnits(baseUnits, { systemId: 'dnd', currencyCode: LEGACY_GOLD_CODE }),
        };
    }

    ensurePlayerWallet(playerState, fallbackSystemId = this.defaultSystemId) {
        const wallet = this.parseWallet(playerState, fallbackSystemId);
        return this.serializeWallet(wallet);
    }

    getBalanceForDisplay(playerState, systemId) {
        const wallet = this.parseWallet(playerState, systemId ?? playerState?.wallet?.activeSystemId ?? this.defaultSystemId);
        return this.formatCurrency(wallet.baseUnits, { systemId: systemId ?? wallet.activeSystemId });
    }

    getItemPriceInBaseUnits(marketBasePrice) {
        const normalizedBaseUnits = Math.max(0, asInteger(marketBasePrice, 0));
        console.debug('[CURRENCY] getItemPriceInBaseUnits', {
            input: marketBasePrice,
            normalizedBaseUnits,
        });
        return normalizedBaseUnits;
    }

    toLegacyGold(baseUnits) {
        return this.convertFromBaseUnits(baseUnits, { systemId: 'dnd', currencyCode: LEGACY_GOLD_CODE });
    }
}

export const currencySystem = new CurrencySystem();
