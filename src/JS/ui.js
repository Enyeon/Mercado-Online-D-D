








export function setTradeFeedback(container, message, kind = 'info') {
    if (!container) return;
    container.textContent = message;
    container.dataset.kind = kind;
}