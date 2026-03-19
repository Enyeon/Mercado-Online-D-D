








export class StateManager {
    constructor(initialState) {
        this.state = structuredClone(initialState);
        this.subscribers = new Set();
    }

    getState() {
        return this.state;
    }

    patch(partialState) {
        this.state = {
        ...this.state,
        ...partialState,
        };
        this.notify();
    }

    update(updater) {
        this.state = updater(structuredClone(this.state));
        this.notify();
    }

    subscribe(handler) {
        this.subscribers.add(handler);
        return () => this.subscribers.delete(handler);
    }

    notify() {
        this.subscribers.forEach((handler) => handler(this.state));
    }
}
