export class ExpectError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExpectError';
    }
}

export function expect(actual: any): {
    toBe: (expected: any) => void;
} {
    return {
        toBe(expected: any): void {
            if (actual !== expected) {
                throw new ExpectError(`Expected ${expected}, but got ${actual}`);
            }
        },
    };
}
