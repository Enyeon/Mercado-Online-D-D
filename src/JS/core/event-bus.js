








export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, handler) {
        const handlers = this.listeners.get(eventName) ?? new Set();
        handlers.add(handler);
        this.listeners.set(eventName, handlers);

        return () => {
        handlers.delete(handler);
        if (!handlers.size) this.listeners.delete(eventName);
        };
    }

    emit(eventName, payload) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;

        handlers.forEach((handler) => handler(payload));
    }
}
