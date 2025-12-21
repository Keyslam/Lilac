import { Component } from './component';
import { EntityEvent, SceneEvent } from './event';
import { EventBus } from './event-bus';
import { Scene } from './scene';
import { ComponentClass, EventClass, EventListener } from './types';

export class Entity {
    private scene!: Scene;
    private components: Map<ComponentClass, Component>;
    private eventBus: EventBus = new EventBus();

    constructor(components: Component[]) {
        this.components = new Map();
        this.eventBus = new EventBus();

        for (const component of components) {
            const cls = component.constructor as ComponentClass;
            this.components.set(cls, component);
        }
    }

    private handleCreate(scene: Scene): void {
        this.scene = scene;

        this.components.forEach((component) => {
            component['handleCreate'](this);
        });
    }

    private handleDestroy(): void {
        for (const component of this.components.values()) {
            component['handleDestroy']();
        }
    }

    public getComponent<T extends Component>(cls: ComponentClass<T>): T {
        const component = this.components.get(cls);

        if (component === undefined) {
            throw new Error(`Component not found: '${cls.name}'`);
        }

        return component as T;
    }

    public tryGetComponent<T extends Component>(cls: ComponentClass<T>): T | undefined {
        const component = this.components.get(cls);
        return component as T | undefined;
    }

    public hasComponent(cls: ComponentClass<Component>): boolean {
        return this.components.has(cls);
    }

    public emit(event: EntityEvent | SceneEvent): void {
        if (event instanceof SceneEvent) {
            this.scene.emit(event);
        } else {
            this.eventBus.emit(event);
        }
    }

    public onEvent<T extends EntityEvent>(event: EventClass<T>, listener: EventListener<T>): void {
        this.eventBus.on(event, listener);
    }

    public destroy(): void {
        this.scene.markEntityAsDestroyed(this);
    }

    public getScene(): Scene {
        return this.scene;
    }
}
