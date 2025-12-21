import { Component } from './component';
import { Entity } from './entity';

export class Prefab<TArgs extends any[]> {
    private readonly factory: (...args: TArgs) => Component[];

    constructor(factory: (...args: TArgs) => Component[]) {
        this.factory = factory;
    }

    public create(...args: TArgs): Entity {
        const components = this.factory(...args);
        const entity = new Entity(components);

        return entity;
    }
}
