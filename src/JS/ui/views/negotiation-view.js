








import { PLAYER_ACTIONS } from '../../systems/negotiation-system.js';

function renderMessage(message) {
    const roleClass = message.speaker === 'vendor' ? 'vendor' : 'player';
    const speakerName = message.speaker === 'vendor' ? message.name : 'Comprador';
    return `
        <article class="negotiation-message ${roleClass}">
            <p class="speaker-name">${speakerName}</p>
            <p class="speaker-text">${message.text}</p>
        </article>
    `;
}

export function renderNegotiationView(item, vendorType, { container, state, onAction }) {
    container.innerHTML = `
        <section class="negotiation-shell">
            <header class="negotiation-header">
                <h2>Negociación: ${item.name}</h2>
                <p>Mercader: ${state.vendor.name} · Humor: ${state.mood} · Precio actual: ${state.currentPrice} monedas</p>
            </header>
            <div class="negotiation-chat">
                ${state.messages.map(renderMessage).join('')}
            </div>
            <div class="negotiation-actions">
                ${PLAYER_ACTIONS.map((action) => `<button class="btn btn-secondary negotiation-btn" data-action="${action}">${action}</button>`).join('')}
            </div>
        </section>
    `;

    container.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => onAction(button.dataset.action));
    });
}
