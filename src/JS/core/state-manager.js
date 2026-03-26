








export class StateManager {
    constructor(initialState) {
        this.state = this.cloneState(initialState);
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
        const draft = this.cloneState(this.state);
        this.state = updater(draft) ?? draft;
        this.notify();
    }

    subscribe(handler) {
        this.subscribers.add(handler);
        return () => this.subscribers.delete(handler);
    }

    notify() {
        this.subscribers.forEach((handler) => handler(this.state));
    }

    cloneState(value) {
        try {
            return structuredClone(value);
        } catch (error) {
            console.warn('[StateManager] structuredClone fallback activated.', error);
            return JSON.parse(JSON.stringify(value, (_key, candidate) => (
                typeof candidate === 'function' ? undefined : candidate
            )));
        }
    }
}
