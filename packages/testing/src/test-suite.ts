import { CompositeTest } from './composite-test';

export class TestSuite extends CompositeTest {
    private static instance: TestSuite | undefined = undefined;

    public static getInstance(): TestSuite {
        TestSuite.instance ??= new TestSuite('Suite', 'Suite');
        return TestSuite.instance;
    }
}
