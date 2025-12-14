import { CompositeTest } from './composite-test';
import { LeafTest } from './leaf-test';
import { CompositeTestResult, LeafTestResult, SuiteTestResult } from './test-result';
import { TestSuite } from './test-suite';

export interface TestReporter {
    onLeafTestStarted(leafTest: LeafTest): void;
    onLeafTestCompleted(leafTest: LeafTest, testResult: LeafTestResult): void;

    onCompositeTestStarted(compositeTest: CompositeTest): void;
    onCompositeTestCompleted(compositeTest: CompositeTest, testResult: CompositeTestResult): void;

    onSuiteStarted(testSuite: TestSuite): void;
    onSuiteCompleted(testSuite: TestSuite, suiteTestResult: SuiteTestResult): void;
}
