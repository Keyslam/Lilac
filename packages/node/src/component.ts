import { Entity } from './entity';
import { EntityEvent, SceneEvent } from './event';
import { Service } from './service';
import { ComponentClass, EntityEventClass, EventListener, SceneEventClass, ServiceClass } from './types';

export abstract class Component {
    private entity!: Entity;

    private handleCreate(entity: Entity): void {
        this.entity = entity;
        this.onStart();
    }

    private handleDestroy(): void {
        this.onDestroy();
    }

    protected destroy(): void {
        this.entity.destroy();
    }

    protected abstract onStart(): void;
    protected abstract onDestroy(): void;

    protected emit(event: EntityEvent | SceneEvent): void {
        this.entity.emit(event);
    }

    protected inject<T extends Component>(cls: ComponentClass<T>): T {
        return this.entity.getComponent(cls);
    }

    protected injectService<T extends Service>(cls: ServiceClass<T>): T {
        return this.entity.getScene().getService(cls);
    }

    protected onEntityEvent<T extends EntityEvent>(cls: EntityEventClass<T>, listener: EventListener<T>): void {
        this.entity.onEvent(cls, listener);
    }

    protected onSceneEvent<T extends SceneEvent>(cls: SceneEventClass<T>, listener: EventListener<T>): void {
        this.entity.getScene().onEvent(cls, listener);
    }
}
