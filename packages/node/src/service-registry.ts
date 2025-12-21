import { Scene } from './scene';
import { Service } from './service';
import { ServiceClass } from './types';

export class ServiceRegistry {
    private readonly services = new Map<ServiceClass, Service>();

    constructor(scene: Scene, services: ServiceClass[]) {
        for (const cls of services) {
            const service = new cls();
            this.services.set(cls, service);
        }

        for (const service of this.services.values()) {
            service['attach'](scene);
        }
    }

    public getService<T extends Service>(cls: ServiceClass<T>): T {
        const service = this.services.get(cls);

        if (service === undefined) {
            throw new Error(`Service not found: '${cls.name}'`);
        }

        return service as T;
    }

    public tryGetService<T extends Service>(cls: ServiceClass<T>): T | undefined {
        const service = this.services.get(cls);
        return service as T | undefined;
    }

    public hasService(cls: ServiceClass): boolean {
        return this.services.has(cls);
    }
}
