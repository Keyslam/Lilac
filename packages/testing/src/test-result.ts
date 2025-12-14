export type LeafTestResult = {
    name: string;
    duration: number;
    kind: 'leaf';
} & (
    | { state: 'passed' } //
    | { state: 'failed'; reason: string; stackTrace?: string }
    | { state: 'skipped' }
);

export type CompositeTestResult = {
    name: string;
    duration: number;
    results: TestResult[];
    kind: 'composite';
};

export type SuiteTestResult = CompositeTestResult;

export type TestResult = LeafTestResult | CompositeTestResult | SuiteTestResult;
