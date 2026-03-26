








export class StateManager {
    constructor(initialState) {
        this.state = this.sanitizeSerializable(initialState);
        this.subscribers = new Set();
    }

    getState() {
        return this.state;
    }

    patch(partialState) {
        this.state = this.sanitizeSerializable({
            ...this.state,
            ...partialState,
        });
        this.notify();
    }

    update(updater) {
        const draft = this.sanitizeSerializable(this.state);
        const nextState = updater(draft) ?? draft;
        this.state = this.sanitizeSerializable(nextState);
        this.notify();
    }

    subscribe(handler) {
        this.subscribers.add(handler);
        return () => this.subscribers.delete(handler);
    }

    notify() {
        this.subscribers.forEach((handler) => handler(this.state));
    }

    sanitizeSerializable(value, seen = new WeakMap()) {
        if (value === null) return null;
        if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') return undefined;
        if (typeof value !== 'object') return value;

        if (value instanceof Date) return new Date(value.getTime());

        if (seen.has(value)) return seen.get(value);

        if (Array.isArray(value)) {
            const nextArray = [];
            seen.set(value, nextArray);
            value.forEach((entry) => {
                const nextEntry = this.sanitizeSerializable(entry, seen);
                if (typeof nextEntry !== 'undefined') nextArray.push(nextEntry);
            });
            return nextArray;
        }

        const nextObject = {};
        seen.set(value, nextObject);
        Object.entries(value).forEach(([key, candidate]) => {
            const nextValue = this.sanitizeSerializable(candidate, seen);
            if (typeof nextValue !== 'undefined') nextObject[key] = nextValue;
        });

        return nextObject;
    }
}
