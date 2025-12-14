import { Test } from './test';

export class CompositeTest implements Test {
    private readonly id: string;
    private readonly name: string;
    private readonly children: Test[] = [];

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    public addChild(test: Test): void {
        this.children.push(test);
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getChildren(): Test[] {
        return this.children;
    }
}
