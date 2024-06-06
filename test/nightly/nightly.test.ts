import * as assert from 'assert';
import { longRunningTestsEnabled } from '../global.test';

suite('dummyTest', () => {
    suiteSetup(async function (this: Mocha.Context): Promise<void> {
        if (!longRunningTestsEnabled) {
            this.skip();
        }
    });

    test('should not see', () => {
        assert.ok('should not run');
    })
})
