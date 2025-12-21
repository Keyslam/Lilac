import { Event } from './event';
import { EventClass, EventListener } from './types';

export class EventBus {
    private listenersMap = new Map<
        EventClass,
        { listeners: EventListener<any>[]; indices: Map<EventListener<any>, number>; emitting: boolean }
    >();

    public emit<T extends Event>(event: T): void {
        const entry = this.listenersMap.get(event.constructor as EventClass<T>);
        if (!entry) {
            return;
        }

        entry.emitting = true;
        for (const listener of entry.listeners) {
            listener(event);
        }
        entry.emitting = false;
    }

    public on<T extends Event>(cls: EventClass<T>, listener: EventListener<T>): void {
        let entry = this.listenersMap.get(cls);
        if (!entry) {
            entry = { listeners: [], indices: new Map(), emitting: false };
            this.listenersMap.set(cls, entry);
        }

        if (entry.emitting) {
            throw new Error(`Cannot add listener for event '${cls.name}' while it is emitting.`);
        }

        if (entry.indices.has(listener)) {
            throw new Error(`Listener already registered for event '${cls.name}'.`);
        }

        entry.indices.set(listener, entry.listeners.length);
        entry.listeners.push(listener);
    }

    public off<T extends Event>(cls: EventClass<T>, listener: EventListener<T>): void {
        const entry = this.listenersMap.get(cls);
        if (!entry) {
            return;
        }

        if (entry.emitting) {
            throw new Error(`Cannot remove listener for event '${cls.name}' while it is emitting.`);
        }

        const index = entry.indices.get(listener);
        if (index === undefined) {
            return;
        }

        const lastIndex = entry.listeners.length - 1;
        const lastListener = entry.listeners[lastIndex]!;

        if (index !== lastIndex) {
            entry.listeners[index] = lastListener;
            entry.indices.set(lastListener, index);
        }

        entry.listeners.pop();
        entry.indices.delete(listener);

        if (entry.listeners.length === 0) {
            this.listenersMap.delete(cls);
        }
    }
}
