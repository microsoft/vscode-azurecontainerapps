import { longRunningTestsEnabled } from "../global.test";

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        console.debug("Skipping long running tests...");
        return this.skip();
    }

    console.debug('Running nightly tests...');
});
