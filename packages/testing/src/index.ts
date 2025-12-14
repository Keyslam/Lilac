import { CompositeTest } from './composite-test';
import { LeafTest } from './leaf-test';
import { TestSuite } from './test-suite';

export { expect } from './expect';
export { TestRunner } from './test-runner';

const activeTestStack: CompositeTest[] = [TestSuite.getInstance()];

function getActiveTest(): CompositeTest {
    const current = activeTestStack[activeTestStack.length - 1];
    if (!current) {
        throw new Error('No active test on the stack. Test stack is corrupted.');
    }
    return current;
}

function pushTest(test: CompositeTest): void {
    getActiveTest().addChild(test);
    activeTestStack.push(test);
}

function popTest(): void {
    activeTestStack.pop();
}

function getCallerFilename(): string {
    const info = debug.getinfo(5, 'S');
    const source = info?.source;
    if (source) {
        return source.slice(0, -4);
    } else {
        return 'unknown-source';
    }
}

function isTestNameLegal(name: string): boolean {
    return !name.includes('::');
}

function checkTestNameLegal(name: string): void {
    if (!isTestNameLegal(name)) {
        throw new Error(`Test name "${name}" is illegal because it contains "::" sequence.`);
    }
}

function registerCompositeTest(name: string, body: () => void): void {
    checkTestNameLegal(name);

    const id = ((): string => {
        const active = getActiveTest();

        if (active === TestSuite.getInstance()) {
            const filename = getCallerFilename();
            return `Suite::${filename}::${name}`;
        } else {
            return `${active.getId()}::${name}`;
        }
    })();
    const suite = new CompositeTest(id, name);

    pushTest(suite);
    body();
    popTest();
}

function registerLeafTest(name: string, body: () => void, skipped = false): void {
    checkTestNameLegal(name);

    const active = getActiveTest();
    const id = `${active.getId()}::${name}`;
    const leaf = new LeafTest(id, name, body, skipped);

    active.addChild(leaf);
}

export function describe(name: string, body: () => void): void {
    registerCompositeTest(name, body);
}

export function it(name: string, body: () => void): void {
    registerLeafTest(name, body, false);
}

export function skip(name: string, body: () => void): void {
    registerLeafTest(name, body, true);
}
