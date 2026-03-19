








export function asPositiveInt(inputValue, fallback = 1) {
    const parsed = Number.parseInt(inputValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function asPositiveNumber(inputValue, fallback = 0) {
    const parsed = Number.parseFloat(inputValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
