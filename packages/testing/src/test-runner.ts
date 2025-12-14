import { CompositeTest } from './composite-test';
import { ConsoleTestReporter } from './console-test-reporter';
import { LeafTest } from './leaf-test';
import { PipePort } from './pipe-port';
import { PortTestReporter } from './port-test-reporter';
import { Test } from './test';
import { TestReporter } from './test-reporter';
import { CompositeTestResult, LeafTestResult, SuiteTestResult, TestResult } from './test-result';
import { TestSuite } from './test-suite';

type TestMatcher = (test: Test) => boolean;

export class TestRunner {
    public run(testSuite: TestSuite, matcher: TestMatcher, testReporter: TestReporter): void {
        testReporter.onSuiteStarted(testSuite);
        const results = this.runCompositeTest(testSuite, matcher, testReporter) as SuiteTestResult;
        testReporter.onSuiteCompleted(testSuite, results);
    }

    public runCompositeTest(
        compositeTest: CompositeTest,
        matcher: TestMatcher,
        testReporter: TestReporter
    ): TestResult {
        testReporter.onCompositeTestStarted(compositeTest);

        const startTime = love.timer.getTime();

        const results: TestResult[] = compositeTest
            .getChildren()
            .filter((child) => this.matches(child, matcher))
            .map((child) => {
                if (child instanceof LeafTest) {
                    return this.runLeafTest(child, testReporter);
                }

                if (child instanceof CompositeTest) {
                    return this.runCompositeTest(child, matcher, testReporter);
                }

                throw new Error('Unknown test type');
            });

        const result: CompositeTestResult = {
            name: compositeTest.getName(),
            kind: 'composite',
            results,
            duration: love.timer.getTime() - startTime,
        };

        testReporter.onCompositeTestCompleted(compositeTest, result);
        return result;
    }

    public runLeafTest(leafTest: LeafTest, testReporter: TestReporter): TestResult {
        testReporter.onLeafTestStarted(leafTest);
        const startTime = love.timer.getTime();

        if (leafTest.isSkipped()) {
            const result: LeafTestResult = {
                name: leafTest.getName(),
                kind: 'leaf',
                state: 'skipped',
                duration: love.timer.getTime() - startTime,
            };

            testReporter.onLeafTestCompleted(leafTest, result);
            return result;
        }

        const result = ((): LeafTestResult => {
            try {
                leafTest.getBody()();

                return {
                    name: leafTest.getName(),
                    kind: 'leaf',
                    state: 'passed',
                    duration: love.timer.getTime() - startTime,
                };
            } catch (e) {
                const reason = e instanceof Error ? e.message : 'Unknown error';
                const stackTrace = e instanceof Error ? e.stack : undefined;

                return {
                    name: leafTest.getName(),
                    kind: 'leaf',
                    state: 'failed',
                    reason,
                    stackTrace,
                    duration: love.timer.getTime() - startTime,
                };
            }
        })();

        testReporter.onLeafTestCompleted(leafTest, result);
        return result;
    }

    private matches(test: Test, matcher: TestMatcher): boolean {
        print('checking for match for test: ' + test.getId(), matcher(test));

        return matcher(test);
    }
}

function createPrefixMatcher(targetIds: string[]): TestMatcher {
    return (test: Test) => {
        const id = test.getId();
        return targetIds.some((targetId) => id === targetId || id.startsWith(targetId + '::'));
    };
}

function createTestIdMatcher(targetIds: string[]): TestMatcher {
    // Collect all valid IDs (leaf + ancestors)
    const validIds = new Set<string>();

    for (const fullId of targetIds) {
        const parts = fullId.split('::');

        let prefix = '';
        for (let i = 0; i < parts.length; i++) {
            prefix = i === 0 ? parts[0]! : `${prefix}::${parts[i]}`;
            print('adding valid id prefix: ' + prefix);
            validIds.add(prefix);
        }
    }

    return (test: Test) => validIds.has(test.getId());
}

export function run(): void {
    // @ts-expect-error
    const ARGS = arg;

    const usePipe = ARGS[3] === 'interactive';

    if (usePipe) {
        const pipe = new PipePort('CommandPipe', 'ProgressPipe');

        const scheduledIds = [];

        while (true) {
            const command = pipe.read();

            if (command.type === 'ScheduleTest') {
                scheduledIds.push(command.id);
                continue;
            }

            if (command.type === 'StartSuite') {
                break;
            }
        }

        const matcher = createTestIdMatcher(scheduledIds);

        const testRunner = new TestRunner();
        testRunner.run(TestSuite.getInstance(), matcher, new PortTestReporter(pipe));

        pipe.close();
    } else {
        const matcher = createPrefixMatcher(['Suite']);

        const testRunner = new TestRunner();
        testRunner.run(TestSuite.getInstance(), matcher, new ConsoleTestReporter());
    }
}
