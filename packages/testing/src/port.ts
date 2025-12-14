export type IncomingMessage =
    | { type: 'ScheduleTest'; id: string } //
    | { type: 'StartSuite' };

export type OutgoingMessage =
    | { type: 'LeafTestStarted'; testId: string }
    | { type: 'LeafTestCompleted'; testId: string; result: 'passed' | 'failed' | 'skipped'; duration: number }
    | { type: 'CompositeTestStarted'; testId: string }
    | { type: 'CompositeTestCompleted'; testId: string; duration: number }
    | { type: 'SuiteStarted' }
    | { type: 'SuiteCompleted' };

export interface Port {
    read(): IncomingMessage;
    send(message: OutgoingMessage): void;

    close(): void;
}
