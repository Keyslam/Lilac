import { Entity } from './entity';
import { EntityRegistry } from './entity-registry';
import { SceneEvent } from './event';
import { EventBus } from './event-bus';
import { Prefab } from './prefab';
import { Service } from './service';
import { ServiceRegistry } from './service-registry';
import { EventClass, EventListener, ServiceClass } from './types';

type Configuration = {
    services: ServiceClass[];
};

export class Scene {
    private readonly entityRegistry: EntityRegistry;
    private readonly serviceRegistry: ServiceRegistry;
    private readonly eventBus: EventBus;

    constructor({ services }: Configuration) {
        this.entityRegistry = new EntityRegistry();
        this.serviceRegistry = new ServiceRegistry(this, services);
        this.eventBus = new EventBus();
    }

    public spawn<TArgs extends any[]>(prefab: Prefab<TArgs>, ...args: TArgs): Entity {
        const entity = prefab.create(...args);

        this.entityRegistry.register(this, entity);
        entity['handleCreate'](this);

        return entity;
    }

    public markEntityAsDestroyed(entity: Entity): void {
        this.entityRegistry.enqueueEntityForDestruction(entity);
    }

    public getService<T extends Service>(serviceCls: ServiceClass<T>): T {
        return this.serviceRegistry.getService(serviceCls);
    }

    public tryGetService<T extends Service>(serviceCls: ServiceClass<T>): T | undefined {
        return this.serviceRegistry.tryGetService(serviceCls);
    }

    public hasService(serviceCls: ServiceClass): boolean {
        return this.serviceRegistry.hasService(serviceCls);
    }

    public emit(event: SceneEvent): void {
        this.eventBus.emit(event);
    }

    public onEvent<T extends SceneEvent>(cls: EventClass<T>, listener: EventListener<T>): void {
        this.eventBus.on(cls, listener);
    }
}
