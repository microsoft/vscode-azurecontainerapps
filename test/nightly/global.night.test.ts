import { longRunningTestsEnabled } from "../global.test";

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        this.skip();
    }
});
