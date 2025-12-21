import { Scene } from './scene';
import { ServiceClass } from './types';

export abstract class Service {
    private scene!: Scene;

    private attach(scene: Scene): void {
        this.scene = scene;
        this.onAttach();
    }

    protected abstract onAttach(): void;

    protected inject<T extends Service>(serviceCls: ServiceClass<T>): T {
        return this.scene.getService(serviceCls);
    }
}
