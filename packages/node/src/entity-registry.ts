import { Entity } from './entity';
import { Scene } from './scene';

export class EntityRegistry {
    private readonly entities = <Entity[]>[];
    private readonly indices = new Map<Entity, number>();
    private readonly destructionQueue = <Entity[]>[];

    public register(scene: Scene, entity: Entity): Entity {
        const index = this.entities.length;

        this.entities.push(entity);
        this.indices.set(entity, index);

        return entity;
    }

    public enqueueEntityForDestruction(entity: Entity): void {
        if (!this.indices.has(entity)) {
            return;
        }

        this.destructionQueue.push(entity);
    }

    public queueAllEntitiesForDestruction(): void {
        for (const entity of this.entities) {
            this.enqueueEntityForDestruction(entity);
        }
    }

    public processDestroyedEntities(): void {
        while (this.destructionQueue.length > 0) {
            const entity = this.destructionQueue.pop()!;

            const index = this.indices.get(entity);
            if (index === undefined) {
                continue;
            }

            const lastIndex = this.entities.length - 1;

            if (index !== lastIndex) {
                const last = this.entities[lastIndex]!;

                this.entities[index] = last;
                this.indices.set(last, index);
            }

            this.entities.pop();
            this.indices.delete(entity);

            entity['handleDestroy']();
        }
    }

    public getAll(): readonly Entity[] {
        return this.entities;
    }
}
