import { CompositeTest } from './composite-test';
import { LeafTest } from './leaf-test';
import { TestReporter } from './test-reporter';
import { CompositeTestResult, LeafTestResult, SuiteTestResult } from './test-result';
import { TestSuite } from './test-suite';

export class ConsoleTestReporter implements TestReporter {
    private depth = 0;

    private formatDuration(duration?: number): string {
        return duration !== undefined ? `(${(duration * 1000).toFixed(2)} ms)` : '';
    }

    public onLeafTestStarted(leafTest: LeafTest): void {}

    public onLeafTestCompleted(leafTest: LeafTest, testResult: LeafTestResult): void {
        const indent = this.getIndent();
        const state = this.formatState(testResult.state);
        const duration = this.formatDuration(testResult.duration);

        const name = leafTest.getName().padEnd(70);
        print(`${indent}${state} ${name} ${duration}`);
    }

    public onCompositeTestStarted(compositeTest: CompositeTest): void {
        const indent = this.getIndent();
        print(`${indent}${compositeTest.getName()}`);
        this.depth++;
    }

    public onCompositeTestCompleted(compositeTest: CompositeTest, testResult: CompositeTestResult): void {
        this.depth--;
    }

    public onSuiteStarted(testSuite: TestSuite): void {
        print('Starting test suite...\n');
    }

    public onSuiteCompleted(testSuite: TestSuite, suiteTestResult: SuiteTestResult): void {
        print('\nTest suite completed.');
    }

    private getIndent(): string {
        return '  '.repeat(this.depth);
    }

    private formatState(state: 'passed' | 'failed' | 'skipped'): string {
        switch (state) {
            case 'passed':
                return '✓';
            case 'failed':
                return '✗';
            case 'skipped':
                return '●';
        }
    }
}
