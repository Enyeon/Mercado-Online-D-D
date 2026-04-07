








import { calculateItemPrices } from './economy-system.js';

export const PLAYER_ACTIONS = ['buy', 'negotiate', 'ask_discount', 'flatter', 'intimidate', 'leave'];

export const VENDORS = {
    breeder: { name: 'Maese Corral', tone: 'cálido', patience: 8, greed: 4, stress: 20, friendliness: 7 },
    arcane: { name: 'Arcanista Veyra', tone: 'ceremonial', patience: 6, greed: 6, stress: 30, friendliness: 5 },
    smuggler: { name: 'Rata de Puerto', tone: 'susurrante', patience: 4, greed: 8, stress: 45, friendliness: 3 },
};

export const RESPONSES = {
    negotiate: {
        breeder: {
            calm: ['Por {item}, podríamos ajustar un poco si cuidas bien a la criatura.'],
            neutral: ['No me hagas perder tiempo con {item}, da una oferta decente.'],
            annoyed: ['Otra vez regateando por {item}... habla rápido.'],
            hostile: ['Ni una palabra más sobre {item}. Paga o vete.'],
        },
        arcane: {
            calm: ['La resonancia de {item} exige respeto, pero escucharé tu trato.'],
            neutral: ['{item} no se rebaja fácil. Convénceme.'],
            annoyed: ['Mis runas no esperan. ¿Oferta final por {item}?'],
            hostile: ['Tu insolencia te cierra el grimorio.'],
        },
        smuggler: {
            calm: ['Para {item} siempre hay margen, según qué tan listo seas.'],
            neutral: ['Habla bajo. {item} tiene ojos encima.'],
            annoyed: ['Cada palabra sube el riesgo, y el precio de {item}.'],
            hostile: ['Negocio cerrado. No toques {item}.'],
        },
    },
    ask_discount: {
        breeder: {
            calm: ['Te haré un gesto por {item}, pero pequeño.'],
            neutral: ['Un descuento menor, y solo por hoy.'],
            annoyed: ['No abuses. {item} ya está justo.'],
            hostile: ['No hay descuento.'],
        },
        arcane: {
            calm: ['Las estrellas conceden un ajuste ritual a {item}.'],
            neutral: ['Un  trato medido, nada más.'],
            annoyed: ['No profanes mi paciencia con más rebajas.'],
            hostile: ['Precio final. Sin discusión.'],
        },
        smuggler: {
            calm: ['Una rebaja pequeña por discreción.'],
            neutral: ['Descuento cuesta favores. Hoy no.'],
            annoyed: ['Cada regateo encarece el riesgo.'],
            hostile: ['Sigue presionando y duplico el precio.'],
        },
    },
    flatter: {
        breeder: {
            calm: ['Ja, sabes hablar. Cuidarás bien {item}.'],
            neutral: ['Mmm... quizá merezcas un mejor número.'],
            annoyed: ['Bah... al menos tienes modales.'],
            hostile: ['No me adules.'],
        },
        arcane: {
            calm: ['Reconoces mi arte; eso tiene valor.'],
            neutral: ['Tu elogio suaviza el trato, un poco.'],
            annoyed: ['No compres incienso con palabras.'],
            hostile: ['Silencio.'],
        },
        smuggler: {
            calm: ['He oído peores mentiras.'],
            neutral: ['No me halagues, negocia.'],
            annoyed: ['Bonitas palabras, cero efecto.'],
            hostile: ['Otro cumplido y te vas sin dedos.'],
        },
    },
    intimidate: {
        breeder: {
            calm: ['No amenazas en mi establo.'],
            neutral: ['Baja la voz o se acaba la venta.'],
            annoyed: ['Un paso más y llamo a la guardia.'],
            hostile: ['Fuera. Ya.'],
        },
        arcane: {
            calm: ['La magia responde peor a la violencia.'],
            neutral: ['Amenazar un mago es mala idea.'],
            annoyed: ['Mis sellos ya están activados.'],
            hostile: ['Trato cancelado.'],
        },
        smuggler: {
            calm: ['Esa actitud... me cae bien, a veces.'],
            neutral: ['Si presionas, podríamos entendernos.'],
            annoyed: ['No cruces la línea.'],
            hostile: ['Ni tú ni yo salimos ganando si sigues.'],
        },
    },
    buy: {
        breeder: {
            calm: ['Hecho. {item} es tuyo por {price}.'],
            neutral: ['Tómalo y cuídalo. {price}.'],
            annoyed: ['Paga {price} y termina.'],
            hostile: ['Última oferta: {price}.'],
        },
        arcane: {
            calm: ['El vínculo queda sellado. Son {price}.'],
            neutral: ['Intercambio aceptado: {price}.'],
            annoyed: ['Monedas primero: {price}.'],
            hostile: ['Pago inmediato: {price}.'],
        },
        smuggler: {
            calm: ['Rápido y limpio. {price}.'],
            neutral: ['Sin preguntas: {price}.'],
            annoyed: ['Toma o deja, {price}.'],
            hostile: ['Cuenta {price} o desaparece.'],
        },
    },
};

const STRESS_MOOD = [
    { max: 25, mood: 'calm' },
    { max: 50, mood: 'neutral' },
    { max: 75, mood: 'annoyed' },
    { max: Infinity, mood: 'hostile' },
];

function getMood(stress) {
    return STRESS_MOOD.find((entry) => stress <= entry.max)?.mood ?? 'hostile';
}

function pickResponse(action, vendorType, mood, itemName, currentPriceText) {
    const bucket = RESPONSES[action]?.[vendorType]?.[mood]
        ?? RESPONSES[action]?.[vendorType]?.neutral
        ?? ['...'];
    return bucket[0]
        .replace('{item}', itemName)
        .replace('{price}', currentPriceText);
}

function clampPriceState(state, nextModifier, currencySystem) {
    const prices = calculateItemPrices(state.item, state.vendorType, state.reputation, {
        stock: state.item.stock,
        demand: state.item.economy?.demand ?? 0,
        supply: state.item.economy?.supply ?? 0,
        negotiationModifier: nextModifier,
    });
    return {
        prices,
        currentPriceBaseUnits: prices.buyPrice,
        modifier: Math.min(0.15, Math.max(-0.15, nextModifier)),
    };
}

export function createNegotiationState({ item, vendorType, reputation = 0, performPurchase, currencySystem, systemId }) {
    const vendor = VENDORS[vendorType] ?? VENDORS.smuggler;
    const { buyPrice } = calculateItemPrices(item, vendorType, reputation, { stock: item.stock });
    const buyPriceBaseUnits = buyPrice;
    return {
        item,
        vendorType,
        vendor,
        messages: [{
            speaker: 'vendor',
            name: vendor.name,
            text: `Bienvenido. Hablemos de ${item.name}. Precio inicial: ${currencySystem.formatCurrency(buyPriceBaseUnits, { systemId })}.`,
        }],
        stress: vendor.stress,
        mood: getMood(vendor.stress),
        reputation,
        currentPriceBaseUnits: buyPriceBaseUnits,
        negotiationModifier: 0,
        performPurchase,
        closed: false,
    };
}

export function handlePlayerAction(action, state, { currencySystem, systemId }) {
    if (!PLAYER_ACTIONS.includes(action) || state.closed) return state;
    const next = {
        ...state,
        messages: [...state.messages, { speaker: 'player', name: 'Comprador', text: action }],
    };
    let stressDelta = 2;
    let reputationDelta = 0;
    let modifierDelta = 0;

    if (action === 'negotiate') modifierDelta = -0.06;
    if (action === 'ask_discount') modifierDelta = -0.09;
    if (action === 'flatter') {
        stressDelta = state.vendorType === 'smuggler' ? 1 : -8;
        reputationDelta = 1;
        modifierDelta = -0.04;
    }
    if (action === 'intimidate') {
        stressDelta = state.vendorType === 'smuggler' ? -2 : 14;
        reputationDelta = state.vendorType === 'smuggler' ? 0 : -2;
        modifierDelta = state.vendorType === 'smuggler' ? -0.05 : 0.08;
    }
    if (action === 'leave') next.closed = true;

    next.stress = Math.min(100, Math.max(0, next.stress + stressDelta));
    next.reputation = Math.min(20, Math.max(-20, next.reputation + reputationDelta));
    next.mood = getMood(next.stress);

    const pricing = clampPriceState(next, next.negotiationModifier + modifierDelta, currencySystem);
    next.negotiationModifier = pricing.modifier;
    next.currentPriceBaseUnits = pricing.currentPriceBaseUnits;

    if (action === 'buy') {
        const result = next.performPurchase?.(next.currentPriceBaseUnits);
        if (result?.ok) {
            next.messages.push({
                speaker: 'vendor',
                name: next.vendor.name,
                text: pickResponse('buy', next.vendorType, next.mood, next.item.name, currencySystem.formatCurrency(next.currentPriceBaseUnits, { systemId })),
            });
            next.closed = true;
            return next;
        }
        next.messages.push({ speaker: 'vendor', name: next.vendor.name, text: result?.reason ?? 'No hay trato hoy.' });
        return next;
    }

    const response = pickResponse(action, next.vendorType, next.mood, next.item.name, currencySystem.formatCurrency(next.currentPriceBaseUnits, { systemId }));
    next.messages.push({ speaker: 'vendor', name: next.vendor.name, text: response });
    return next;
}
