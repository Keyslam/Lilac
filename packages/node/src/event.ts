export abstract class Event {}

export abstract class EntityEvent extends Event {
    private __entityEvent!: void;
}

export abstract class SceneEvent extends Event {
    private __sceneEvent!: void;
}
