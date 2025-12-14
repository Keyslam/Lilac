import { CompositeTest } from './composite-test';
import { LeafTest } from './leaf-test';
import { Port } from './port';
import { TestReporter } from './test-reporter';
import { CompositeTestResult, LeafTestResult, SuiteTestResult } from './test-result';
import { TestSuite } from './test-suite';

export class PortTestReporter implements TestReporter {
    private readonly port: Port;

    constructor(port: Port) {
        this.port = port;
    }

    public onLeafTestStarted(leafTest: LeafTest): void {
        this.port.send({
            type: 'LeafTestStarted',
            testId: leafTest.getId(),
        });
    }

    public onLeafTestCompleted(leafTest: LeafTest, testResult: LeafTestResult): void {
        this.port.send({
            type: 'LeafTestCompleted',
            testId: leafTest.getId(),
            result: testResult.state,
            duration: testResult.duration,
        });
    }

    public onCompositeTestStarted(compositeTest: CompositeTest): void {
        this.port.send({
            type: 'CompositeTestStarted',
            testId: compositeTest.getId(),
        });
    }

    public onCompositeTestCompleted(compositeTest: CompositeTest, testResult: CompositeTestResult): void {
        this.port.send({
            type: 'CompositeTestCompleted',
            testId: compositeTest.getId(),
            duration: testResult.duration,
        });
    }

    public onSuiteStarted(testSuite: TestSuite): void {
        this.port.send({ type: 'SuiteStarted' });
    }

    public onSuiteCompleted(testSuite: TestSuite, suiteTestResult: SuiteTestResult): void {
        this.port.send({ type: 'SuiteCompleted' });
    }
}
