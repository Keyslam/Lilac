import { Test } from './test';

type TestBody = () => void;

export class LeafTest implements Test {
    private readonly id: string;
    private readonly name: string;
    private readonly testBody: TestBody;
    private readonly skipped: boolean;

    constructor(id: string, name: string, testBody: TestBody, skipped: boolean = false) {
        this.id = id;
        this.name = name;
        this.testBody = testBody;
        this.skipped = skipped;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getBody(): TestBody {
        return this.testBody;
    }

    public isSkipped(): boolean {
        return this.skipped;
    }
}
