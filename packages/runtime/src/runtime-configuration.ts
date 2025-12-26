type FixedTimestep = {
    mode: 'fixed';
    framerate: number;
};

type VariableTimestep = {
    mode: 'variable';
};

type TimestepConfiguration = (FixedTimestep | VariableTimestep) & { sleepMs: number };

type EnabledGC = {
    enabled: true;
    timeBudgetMs: number;
    memoryCeilingKb: number;
};

type DisabledGC = {
    enabled: false;
};

type GarbageCollectionConfiguration = EnabledGC | DisabledGC;

type EventsConfiguration = {
    onUpdate: (dt: number) => void;
    onDraw: (interpolation: number) => void;
    onEvent: (event: string, ...args: any[]) => void;
    onQuit: () => boolean;
};

export type RuntimeConfiguration = {
    timestep: TimestepConfiguration;
    garbageCollection: GarbageCollectionConfiguration;
    events: EventsConfiguration;
};
