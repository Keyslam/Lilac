import { RuntimeConfiguration } from './runtime-configuration';

function collectGarbage(config: RuntimeConfiguration['garbageCollection']): void {
    if (config.enabled) {
        const maxSteps = 1000;
        let steps = 0;
        const startTime = love.timer.getTime();

        while ((love.timer.getTime() - startTime) * 1000 < config.timeBudgetMs && steps < maxSteps) {
            if (collectgarbage('step', 1)) {
                break;
            }

            steps++;
        }

        if (collectgarbage('count') / 1024 > config.memoryCeilingKb) {
            collectgarbage('collect');
        }
    }
}

function pumpEvents(eventConfig: RuntimeConfiguration['events']): boolean {
    love.event.pump();
    for (const [name, a, b, c, d, e, f] of love.event.poll()) {
        if (name === 'quit') {
            if (eventConfig.onQuit()) {
                return true;
            }
        } else {
            eventConfig.onEvent(name, a, b, c, d, e, f);
        }
    }

    return false;
}

function render(eventConfig: RuntimeConfiguration['events'], interpolation: number): void {
    if (love.graphics.isActive()) {
        love.graphics.origin();
        love.graphics.clear(love.graphics.getBackgroundColor());

        eventConfig.onDraw(interpolation);

        love.graphics.present();
    }
}

export function createRuntime(config: RuntimeConfiguration): typeof love.run {
    if (config.garbageCollection.enabled) {
        collectgarbage('stop');
    }

    if (config.timestep.mode === 'variable') {
        return () => {
            love.timer.step();

            let dt = 0;

            return () => {
                if (pumpEvents(config.events)) {
                    return 0;
                }

                dt = love.timer.step();

                config.events.onUpdate(dt);

                render(config.events, 1);

                collectGarbage(config.garbageCollection);
                love.timer.sleep(config.timestep.sleepMs / 1000);
            };
        };
    }

    if (config.timestep.mode === 'fixed') {
        const rate = 1 / config.timestep.framerate;

        return () => {
            love.timer.step();

            let accumulator = 0;

            return () => {
                if (pumpEvents(config.events)) {
                    return 0;
                }

                accumulator += love.timer.step();
                while (accumulator >= rate) {
                    accumulator -= rate;

                    config.events.onUpdate(rate);
                }

                render(config.events, accumulator / rate);

                collectGarbage(config.garbageCollection);
                love.timer.sleep(config.timestep.sleepMs / 1000);
            };
        };
    }
}
